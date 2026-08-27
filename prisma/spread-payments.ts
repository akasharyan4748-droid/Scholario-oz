/**
 * One-off: spread existing Payment.createdAt values across the last 6 months
 * so the superadmin "Monthly Collections by Channel" trend chart shows a
 * realistic growth series instead of all rows lumped in one month.
 *
 * Usage: bun prisma/spread-payments.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Deterministic day offsets (0–27) per month bucket, oldest month first
const DAY_SLOTS = [3, 9, 14, 19, 24, 27]

async function main() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: 'asc' } })
  if (payments.length === 0) {
    console.log('No payments found — nothing to spread.')
    return
  }

  const now = new Date()
  const updates: Array<{ id: string; createdAt: Date }> = []

  payments.forEach((p, i) => {
    // months back: 5 → 0 (oldest payment lands 5 months ago)
    const monthsBack = 5 - Math.floor((i / Math.max(1, payments.length - 1)) * 5)
    const day = DAY_SLOTS[i % DAY_SLOTS.length] + (i % 3)
    const hour = 9 + (i % 8)
    const d = new Date(now)
    d.setMonth(d.getMonth() - monthsBack)
    d.setDate(Math.min(28, Math.max(1, day)))
    d.setHours(hour, (i * 7) % 60, 0, 0)
    updates.push({ id: p.id, createdAt: d })
  })

  for (const u of updates) {
    await db.payment.update({ where: { id: u.id }, data: { createdAt: u.createdAt } })
  }

  console.log(`Spread ${updates.length} payments across the last 6 months:`)
  const byMonth = new Map<string, number>()
  for (const u of updates) {
    const k = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`
    byMonth.set(k, (byMonth.get(k) || 0) + 1)
  }
  for (const [k, v] of Array.from(byMonth.entries()).sort()) console.log(`  ${k}: ${v} payments`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
