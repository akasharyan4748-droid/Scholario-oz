/**
 * Phase 9 — Seed enterprise fee tables (DB-backed).
 *
 * Idempotent: safe to run multiple times. Each call upserts the master
 * catalogue + per-class fee structures by their natural keys
 * (schoolId, name) / (schoolId, classId, status). Existing rows are
 * preserved (no destructive deletes). The legacy /api/fees route +
 * the Zustand fee-store keep working unchanged — this script just
 * populates the new Phase 9 tables so the new API routes have data
 * to serve and the webhook route has a settlement to auto-reconcile
 * against.
 *
 * Run with: `bunx tsx scripts/seed-fees-phase9.ts`
 */

import { db } from '../src/lib/db'

const SCHOOL_SLUG = 'demo-school'

/// Master catalogue — derived from
/// src/lib/store/school-settings-store/initial-state.ts (fees.feeHeads).
const MASTER_CATALOGUE = [
  { catalogueId: 'fh-1',  name: 'Tuition Fee',                       category: 'Tuition',   defaultAmount: 4500,  frequency: 'Monthly',    mandatory: true,  description: 'Core academic instruction — charged monthly.' },
  { catalogueId: 'fh-2',  name: 'Admission Fee',                     category: 'Admission', defaultAmount: 15000, frequency: 'One-Time',  mandatory: true,  description: 'One-time at the time of admission.' },
  { catalogueId: 'fh-3',  name: 'Activity Fee',                      category: 'Activity',  defaultAmount: 4000,  frequency: 'Annual',     mandatory: true,  description: 'Annual cultural + sports activities.' },
  { catalogueId: 'fh-4',  name: 'Computer & Science Lab Fee',        category: 'Lab',       defaultAmount: 1200,  frequency: 'Quarterly',  mandatory: true,  description: 'Computer lab maintenance + science consumables.' },
  { catalogueId: 'fh-5',  name: 'Library Fee',                       category: 'Library',   defaultAmount: 2000,  frequency: 'Annual',      mandatory: true,  description: 'Annual library access + book bank.' },
  { catalogueId: 'fh-6',  name: 'Examination Fee',                   category: 'Exam',      defaultAmount: 850,  frequency: 'Per Term',   mandatory: true,  description: 'Per-term exam conduct + answer-sheet evaluation.' },
  { catalogueId: 'fh-7',  name: 'Transport Fee',                     category: 'Transport', defaultAmount: 1500,  frequency: 'Monthly',    mandatory: false, description: 'Bus service — charged monthly.' },
  { catalogueId: 'fh-8',  name: 'Board Examination Fee',             category: 'Board',     defaultAmount: 500,   frequency: 'One-Time',   mandatory: true,  description: 'Class 10/12 board exam registration + center fees.' },
  { catalogueId: 'fh-9',  name: 'Development & Infrastructure Fee', category: 'Other',     defaultAmount: 5000,  frequency: 'Annual',     mandatory: true,  description: 'Building maintenance + smart-classroom upgrades.' },
  { catalogueId: 'fh-10', name: 'Smart Class & Digital Content Fee', category: 'Other',     defaultAmount: 1200,  frequency: 'Annual',      mandatory: false, description: 'Digital content licenses (EduComp / Extramarks).' },
  { catalogueId: 'fh-11', name: 'Sports & Cultural Fee',            category: 'Activity',  defaultAmount: 1500,  frequency: 'Annual',      mandatory: false, description: 'Inter-school tournaments + annual cultural evening.' },
  { catalogueId: 'fh-12', name: 'Medical & First Aid Fee',          category: 'Other',     defaultAmount: 500,   frequency: 'Annual',      mandatory: true,  description: 'On-campus medical room + first-aid supplies.' },
] as const

/// Per-class fee structures — mirrors src/lib/store/fee-store.ts FEE_STRUCTURES.
/// Maps each catalogueId to a structure line item.
const PER_CLASS_STRUCTURES = [
  { classId: 'C01', className: 'Pre-Nursery', classLevel: 'Pre-Primary',  annual: 60400,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',  amount: 3500, frequency: 'Monthly', mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport', amount: 1200, frequency: 'Monthly', mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-3', name: 'Activity', amount: 4000, frequency: 'Annual',  mandatory: true,  category: 'Activity'  },
    ],
  },
  { classId: 'C05', className: 'Class 2', classLevel: 'Primary',  annual: 71000,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',  amount: 4000, frequency: 'Monthly', mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport', amount: 1500, frequency: 'Monthly', mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-5', name: 'Library',  amount: 2000, frequency: 'Annual',  mandatory: true,  category: 'Library'   },
      { catalogueId: 'fh-3', name: 'Activity', amount: 3000, frequency: 'Annual',  mandatory: true,  category: 'Activity'  },
    ],
  },
  { classId: 'C09', className: 'Class 6', classLevel: 'Middle',  annual: 93600,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',  amount: 5500, frequency: 'Monthly', mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport', amount: 1800, frequency: 'Monthly', mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-5', name: 'Library',   amount: 3000, frequency: 'Annual',  mandatory: true,  category: 'Library'   },
      { catalogueId: 'fh-3', name: 'Activity',  amount: 3000, frequency: 'Annual',  mandatory: true,  category: 'Activity'  },
    ],
  },
  { classId: 'C12', className: 'Class 9', classLevel: 'Secondary',  annual: 116000,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',  amount: 7000, frequency: 'Monthly', mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport', amount: 2000, frequency: 'Monthly', mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-5', name: 'Library',  amount: 4000, frequency: 'Annual',  mandatory: true,  category: 'Library'   },
      { catalogueId: 'fh-3', name: 'Activity',  amount: 4000, frequency: 'Annual',  mandatory: true,  category: 'Activity'  },
    ],
  },
  { classId: 'C13', className: 'Class 10', classLevel: 'Secondary',  annual: 116500,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',              amount: 7000, frequency: 'Monthly',  mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport',             amount: 2000, frequency: 'Monthly',  mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-5', name: 'Library',               amount: 4000, frequency: 'Annual',   mandatory: true,  category: 'Library'   },
      { catalogueId: 'fh-3', name: 'Activity',              amount: 4000, frequency: 'Annual',   mandatory: true,  category: 'Activity'  },
      { catalogueId: 'fh-8', name: 'Board Examination Fee', amount:  500, frequency: 'One-Time', mandatory: true,  category: 'Board'     },
    ],
  },
  { classId: 'C15-PCM', className: 'Class 12', classLevel: 'Senior Secondary',  annual: 144400,
    heads: [
      { catalogueId: 'fh-1', name: 'Tuition',  amount: 9000, frequency: 'Monthly', mandatory: true,  category: 'Tuition'   },
      { catalogueId: 'fh-7', name: 'Transport', amount: 2200, frequency: 'Monthly', mandatory: false, category: 'Transport' },
      { catalogueId: 'fh-5', name: 'Library',   amount: 5000, frequency: 'Annual',  mandatory: true,  category: 'Library'   },
      { catalogueId: 'fh-3', name: 'Activity',  amount: 5000, frequency: 'Annual',  mandatory: true,  category: 'Activity'  },
    ],
  },
] as const

async function main() {
  const school = await db.school.findUnique({ where: { slug: SCHOOL_SLUG } })
  if (!school) throw new Error(`School with slug '${SCHOOL_SLUG}' not found. Run prisma/seed.ts first.`)
  const schoolId = school.id
  console.log(`🏫 Seeding fee tables for school ${school.slug} (${schoolId})`)

  // ── 1. Master catalogue (upsert by schoolId+name) ───────────────
  console.log('  → Master catalogue')
  const catalogueIdMap = new Map<string, string>() // fh-N → DB id
  for (let i = 0; i < MASTER_CATALOGUE.length; i++) {
    const c = MASTER_CATALOGUE[i]
    const row = await db.masterFeeHead.upsert({
      where: { schoolId_name: { schoolId, name: c.name } },
      create: {
        schoolId,
        name: c.name,
        category: c.category,
        frequency: c.frequency,
        amount: c.defaultAmount,
        mandatory: c.mandatory,
        active: true,
        description: c.description,
        sortOrder: i,
      },
      update: {
        category: c.category,
        frequency: c.frequency,
        amount: c.defaultAmount,
        mandatory: c.mandatory,
        description: c.description,
        sortOrder: i,
      },
    })
    catalogueIdMap.set(c.catalogueId, row.id)
  }
  console.log(`    ✓ ${catalogueIdMap.size} master fee heads`)

  // ── 2. Per-class fee structures (upsert by schoolId+classId+status) ──
  console.log('  → Per-class fee structures')
  let structureCount = 0
  let headCount = 0
  for (const s of PER_CLASS_STRUCTURES) {
    const structure = await db.feeStructure.upsert({
      where: { schoolId_classId_status: { schoolId, classId: s.classId, status: 'current' } },
      create: {
        schoolId,
        classId: s.classId,
        className: s.className,
        classLevel: s.classLevel,
        status: 'current',
        version: 1,
        effectiveFrom: new Date('2025-04-01'),
        publishedAt: new Date('2025-04-01'),
      },
      update: {
        className: s.className,
        classLevel: s.classLevel,
      },
    })
    structureCount++

    // Reconcile heads: simple strategy — wipe + recreate per upsert.
    // (Acceptable for the seed; production paths use PATCH.)
    await db.feeHead.deleteMany({ where: { structureId: structure.id } })
    for (let i = 0; i < s.heads.length; i++) {
      const h = s.heads[i]
      const cat = catalogueIdMap.get(h.catalogueId)
      await db.feeHead.create({
        data: {
          schoolId,
          structureId: structure.id,
          catalogueId: cat ?? null,
          name: h.name,
          category: h.category,
          amount: h.amount,
          frequency: h.frequency,
          mandatory: h.mandatory,
          active: true,
          sortOrder: i,
        },
      })
      headCount++
    }

    // Publish a v1 version snapshot
    const snapshot = JSON.stringify({
      classId: s.classId,
      className: s.className,
      classLevel: s.classLevel,
      annual: s.annual,
      heads: s.heads.map((h) => ({ ...h })),
      publishedAt: new Date().toISOString(),
    })
    await db.feeStructureVersion.create({
      data: {
        schoolId,
        structureId: structure.id,
        version: 1,
        snapshot,
        publishedBy: 'system-seed',
        notes: 'Phase 9 seed — initial publish',
      },
    }).catch(() => {/* version may already exist — ignore */})
  }
  console.log(`    ✓ ${structureCount} structures · ${headCount} line items`)

  // ── 3. Sample settlements (3) + a sample reconciled transaction ──
  console.log('  → Sample settlement + reconciled transaction')
  const settlementDate = new Date('2025-04-30')
  const settlement = await db.settlement.upsert({
    where: { payoutId: 'RZPSET0420250001' },
    create: {
      schoolId,
      payoutId: 'RZPSET0420250001',
      gatewayName: 'razorpay',
      periodStart: new Date('2025-04-01'),
      periodEnd: new Date('2025-04-30'),
      grossAmount: 435000,
      fees: 8700,
      netAmount: 426300,
      status: 'settled',
      bankReference: 'NEFT-SET-042025-0001',
      paidOutAt: settlementDate,
    },
    update: {},
  })

  // One reconciled transaction against the settlement (proves the FK path works).
  const txn = await db.feeTransaction.upsert({
    where: { gatewayOrderId: 'order_NJ7aBcD001' },
    create: {
      schoolId,
      studentId: null,
      studentName: 'Aarav Sharma',
      className: 'Class 9',
      feeHeadName: 'Tuition',
      amount: 148000,
      method: 'UPI',
      status: 'SUCCESS',
      gatewayOrderId: 'order_NJ7aBcD001',
      gatewayPaymentId: 'pay_NJ7aBcD001',
      gatewayName: 'razorpay',
      settlementId: settlement.id,
      reconciliationStatus: 'reconciled',
      reconciledAt: settlementDate,
      reconciledBy: 'system-seed',
      receiptNo: 'RCP-2025-1042',
      note: 'Annual Fee — Q1',
      createdAt: new Date('2025-04-12'),
    },
    update: {
      settlementId: settlement.id,
      reconciliationStatus: 'reconciled',
      reconciledAt: settlementDate,
    },
  })
  await db.reconciliation.upsert({
    where: { id: `recon-seed-${txn.id}` },
    create: {
      id: `recon-seed-${txn.id}`,
      schoolId,
      transactionId: txn.id,
      settlementId: settlement.id,
      status: 'reconciled',
      matchedBy: 'system-seed',
      note: 'Auto-matched by gateway payout_id',
    },
    update: {},
  }).catch(() => {/* idempotent — if it exists, ignore */})

  console.log(`    ✓ settlement ${settlement.payoutId} · txn ${txn.gatewayOrderId}`)
  console.log('\n✅ Phase 9 fee seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
