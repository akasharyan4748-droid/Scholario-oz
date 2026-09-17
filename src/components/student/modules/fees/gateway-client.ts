'use client'

/**
 * fees/gateway-client — the CLIENT half of the server-verified payment flow
 * (UX-3 §23–§34).
 *
 * SECURITY MODEL (§25): the browser never owns the financial state machine.
 * It may (1) ask the server to create an order and (2) ask the server to
 * settle that order — passing ONLY the orderId. Amount, student identity,
 * receipt number and the settlement outcome all come from the server's own
 * FeeTransaction row (see /api/fees/orders + /api/fees/payments/confirm —
 * the endpoint that plays the signed webhook's role in this demo build).
 * The client store's `recordPayment` is used strictly as a UI MIRROR of the
 * server's authoritative result, never as the source of truth.
 *
 * §31 reconciliation: when the settlement call fails at the NETWORK level
 * the outcome is genuinely uncertain — `lookupFeePayment` re-checks the
 * order server-side so the UI can re-sync from the server's answer instead
 * of guessing.
 */

/** The server's authoritative settlement snapshot (confirm + lookup shapes). */
export interface SettlementResult {
  status: string
  receiptNo: string | null
  gatewayPaymentId: string | null
  orderId: string
  amount: number
  method: string
  txnId: string
  note?: string | null
}

/** Order-creation payload — only what the server genuinely needs. */
export interface CreateOrderInput {
  studentId: string
  studentName: string
  className: string
  feeHeadName: string
  amount: number
  method: string
}

interface ApiEnvelope<T> {
  ok: boolean
  data?: T
  error?: string
}

async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !json?.ok || json.data === undefined) {
    throw new Error(json?.error || `The payment gateway did not accept the request (${res.status}).`)
  }
  return json.data
}

/** Step 1 — ask the server to mint a gateway order (PENDING FeeTransaction). */
export async function createFeeOrder(
  input: CreateOrderInput,
  signal?: AbortSignal,
): Promise<{ orderId: string; receiptNo: string; txnId: string; amount: number }> {
  return postJson('/api/fees/orders', input, signal)
}

/**
 * Step 2 — ask the server to settle the order. The client sends ONLY the
 * orderId: the server re-reads the amount, enforces the student/tenant
 * match, and decides the outcome (UPI/Card → SUCCESS, Net Banking → stays
 * PENDING awaiting bank settlement).
 */
export async function confirmFeePayment(
  orderId: string,
  signal?: AbortSignal,
): Promise<SettlementResult> {
  return postJson('/api/fees/payments/confirm', { orderId }, signal)
}

/**
 * Cancel path — the user abandoned checkout AFTER an order existed.
 * 'cancelled' is not a financial success claim, so the server honours it
 * as FAILED. Returns null when even this best-effort call fails (the order
 * then simply stays PENDING server-side and is never shown as paid).
 */
export async function cancelFeeOrder(orderId: string): Promise<SettlementResult | null> {
  try {
    return await postJson('/api/fees/payments/confirm', { orderId, outcome: 'cancelled' })
  } catch {
    return null
  }
}

/**
 * §31 — re-check an uncertain order after a network error. Null when the
 * status cannot be resolved; otherwise the server's own answer.
 */
export async function lookupFeePayment(orderId: string): Promise<SettlementResult | null> {
  try {
    const res = await fetch(`/api/fees/payments?orderId=${encodeURIComponent(orderId)}`)
    const json = (await res.json().catch(() => null)) as ApiEnvelope<SettlementResult> | null
    if (!res.ok || !json?.ok || !json.data) return null
    return json.data
  } catch {
    return null
  }
}

/** User-abort detection (the AbortController fired). */
export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}
