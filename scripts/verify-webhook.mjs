// Webhook route end-to-end verification: signature verification + idempotency.
// 1. Computes a valid HMAC signature over a sample Razorpay payload.
// 2. POSTs with the valid signature → expects 200 received:true.
// 3. POSTs the SAME event again → expects 200 duplicate:true (idempotency).
// 4. POSTs with a tampered signature → expects 400 invalid signature.
// Run: RAZORPAY_WEBHOOK_SECRET=test_secret_123 node scripts/verify-webhook.mjs
// (the dev server must already be running WITH the same secret set)

import { createHmac } from 'node:crypto'

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret_123'
const URL = 'http://localhost:3000/api/webhooks/razorpay'
const EVENT_ID = 'evt_test_' + Date.now()

const payload = JSON.stringify({
  event: 'payment.captured',
  entity: 'event',
  meta: { event_id: EVENT_ID },
  payload: {
    payment: {
      entity: {
        id: 'pay_test_123',
        order_id: 'order_test_456',
        amount: 50000, // ₹500 in paise
        status: 'captured',
        method: 'upi',
        notes: { studentId: 'STU-1', feeHead: 'Tuition' },
      },
    },
  },
})

function sign(body) {
  return createHmac('sha256', SECRET).update(body).digest('hex')
}

let pass = 0, fail = 0
async function post(body, sig, eventIdHeader) {
  const headers = { 'Content-Type': 'application/json' }
  if (sig) headers['X-Razorpay-Signature'] = sig
  if (eventIdHeader) headers['X-Razorpay-Event-Id'] = eventIdHeader
  const res = await fetch(URL, { method: 'POST', headers, body })
  const json = await res.json()
  return { status: res.status, json }
}

// 1. GET health check
const getRes = await fetch(URL)
const getJson = await getRes.json()
console.log(`1. GET health: status=${getRes.status} secret_configured=${getJson.secret_configured}`)
if (getRes.status === 200 && getJson.secret_configured === true) { pass++ } else { fail++; console.log('  FAIL: secret not configured — restart dev with RAZORPAY_WEBHOOK_SECRET set') }

if (getJson.secret_configured) {
  // 2. POST with valid signature
  const validSig = sign(payload)
  const r2 = await post(payload, validSig, EVENT_ID)
  console.log(`2. POST valid sig: status=${r2.status} received=${r2.json.received} type=${r2.json.type} linked_student=${r2.json.linked_student_id}`)
  if (r2.status === 200 && r2.json.received === true && r2.json.linked_student_id === 'STU-1') { pass++ } else { fail++ }

  // 3. POST same event_id again (idempotency)
  const r3 = await post(payload, validSig, EVENT_ID)
  console.log(`3. POST duplicate event: status=${r3.status} duplicate=${r3.json.duplicate} event_id=${r3.json.event_id}`)
  if (r3.status === 200 && r3.json.duplicate === true) { pass++ } else { fail++ }

  // 4. POST with tampered signature (must be rejected)
  const tamperedSig = sign(payload).slice(0, -2) + 'ff'
  const r4 = await post(payload, tamperedSig, 'evt_other_' + Date.now())
  console.log(`4. POST bad signature: status=${r4.status} error=${r4.json.error}`)
  if (r4.status === 400 && /invalid signature/i.test(r4.json.error)) { pass++ } else { fail++ }

  // 5. POST with no signature header (must be rejected)
  const r5 = await post(payload, null, 'evt_nosig_' + Date.now())
  console.log(`5. POST no signature: status=${r5.status} error=${r5.json.error}`)
  if (r5.status === 400 && /missing/i.test(r5.json.error)) { pass++ } else { fail++ }
}

console.log(`\n${pass}/${pass + fail} webhook checks passed`)
process.exit(fail > 0 ? 1 : 0)
