'use client'

/**
 * Salary & Payroll store — Principal's payroll workspace + employee trust model.
 *
 * Employees come from the canonical teacher records + administrative staff.
 * Every rupee flows through one monthly pipeline:
 *
 *   Session Salary (locked net base)
 *     + monthly adjustments
 *     = Net Payable for the month
 *     → Principal records payment(s)
 *     → 🕐 Pending Receipt
 *     → employee confirms ✓ Received (receipt issued, counts as paid)
 *       or reports × Not Received (no receipt, principal notified)
 *
 * Salary changes are never applied directly: the Principal sends a change
 * request while the temporary editing window is open, and the employee
 * accepts or declines it. The editing window expiry is persisted and
 * enforced inside every mutation — an expired window always fails, even
 * if a stale screen is still open.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useMemo } from 'react'
import { teachers } from '@/lib/mock/teachers'

// ─── Types ───────────────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'On Leave' | 'Suspended' | 'Resigned' | 'Retired' | 'Inactive'
export type EmployeeType = 'Teaching' | 'Administration' | 'Support' | 'Transport' | 'Finance' | 'Other'
export type PaymentMethod = 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque'
export type PaymentStatus = 'Pending Receipt' | 'Confirmed' | 'Not Received' | 'Reversed'
export type ChangeRequestStatus = 'Pending' | 'Accepted' | 'Declined'
export type StructureStatus = 'Active' | 'Archived'

export interface Employee {
  id: string
  employeeId: string
  name: string
  avatar: string
  designation: string
  department: string
  employeeType: EmployeeType
  email: string
  phone: string
  joiningDate: string
  status: EmployeeStatus
  salary: number
  attendance: number
  bloodGroup: string
  address: string
  gender: 'Male' | 'Female'
  bankAccount?: string
  bankIfsc?: string
}

/** A component line inside a reusable structure template. */
export interface StructureComponent {
  id: string
  name: string
  type: 'Earning' | 'Deduction'
  basis: 'Fixed' | 'Percentage'
  /** ₹ when Fixed, % of base when Percentage. */
  value: number
}

export interface SalaryStructureTemplate {
  id: string
  name: string
  description: string
  applicableTo: EmployeeType | 'All'
  baseAmount: number
  components: StructureComponent[]
  status: StructureStatus
  createdAt: string
}

/** A component line with a resolved ₹ amount (employee's applied salary). */
export interface AppliedComponent {
  name: string
  type: 'Earning' | 'Deduction'
  amount: number
}

export interface SessionSalary {
  structureId: string
  structureName: string
  base: number
  netBase: number
  earnings: AppliedComponent[]
  deductions: AppliedComponent[]
  effectiveFrom: string
}

export interface SalaryHistoryEntry {
  id: string
  date: string
  fromNet?: number
  toNet: number
  note?: string
  by: string
}

export interface EmployeeSalaryState {
  employeeId: string
  session: string
  salary: SessionSalary
  history: SalaryHistoryEntry[]
}

export interface SalaryChangeRequest {
  id: string
  employeeId: string
  employeeName: string
  currentNet: number
  proposedNet: number
  structureId?: string
  structureName?: string
  effectiveFrom: string
  note?: string
  status: ChangeRequestStatus
  requestedBy: string
  requestedAt: string
  respondedAt?: string
  respondedBy?: string
  declineReason?: string
}

export interface MonthlyAdjustment {
  id: string
  employeeId: string
  employeeName: string
  periodKey: string // '2026-08'
  label: string
  /** Signed: positive adds to the month's payable, negative reduces it. */
  amount: number
  createdAt: string
  createdBy: string
}

export interface SalaryPayment {
  id: string
  employeeId: string
  employeeName: string
  periodKey: string
  monthLabel: string
  netPayable: number
  amount: number
  date: string // YYYY-MM-DD
  method: PaymentMethod
  reference?: string
  bankAccount?: string
  status: PaymentStatus
  recordedBy: string
  recordedAt: string
  confirmedAt?: string
  confirmedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  /** Only exists once the employee confirms receipt. */
  receiptNo?: string
  reversedAt?: string
  reversalReason?: string
  followedUpAt?: string
}

export interface PaymentReceipt {
  receiptNo: string
  paymentId: string
  employeeId: string
  employeeName: string
  monthLabel: string
  amount: number
  method: PaymentMethod
  date: string
  confirmedAt: string
  reference?: string
}

export type AuditAction =
  | 'payment.recorded'
  | 'payment.confirmed'
  | 'payment.not_received'
  | 'payment.reversed'
  | 'payment.followed_up'
  | 'salary.change_requested'
  | 'salary.change_accepted'
  | 'salary.change_declined'
  | 'adjustment.added'
  | 'structure.created'
  | 'structure.updated'
  | 'structure.archived'
  | 'structure.restored'
  | 'editing.enabled'
  | 'editing.expired'
  | 'settings.updated'

export interface AuditEntry {
  id: string
  action: AuditAction
  title: string
  detail: string
  actor: string
  timestamp: string // ISO
}

export interface EditPermission {
  enabled: boolean
  expiresAt: number | null
  enabledBy?: string
  enabledAt?: string
}

export interface PaymentSettings {
  defaultMethod: PaymentMethod
  referenceRequired: Record<PaymentMethod, boolean>
}

// ─── Constants ───────────────────────────────────────────────────────

export const PRINCIPAL = 'Dr. Ananya Iyer'
export const EDIT_WINDOW_MS = 3 * 60 * 60 * 1000 // 3 hours
export const CURRENT_SESSION = { id: '2026-27', label: 'Session 2026–27' }

const METHODS: PaymentMethod[] = ['Bank Transfer', 'UPI', 'Cash', 'Cheque']

// ─── Salary scales ───────────────────────────────────────────────────

const ded = (id: string, name: string, basis: 'Fixed' | 'Percentage', value: number): StructureComponent =>
  ({ id, name, type: 'Deduction', basis, value })
const earn = (id: string, name: string, basis: 'Fixed' | 'Percentage', value: number): StructureComponent =>
  ({ id, name, type: 'Earning', basis, value })

const SEED_STRUCTURES: SalaryStructureTemplate[] = [
  {
    id: 'STR-01', name: 'Primary Teaching', applicableTo: 'Teaching',
    description: 'Nursery to Class 5', baseAmount: 6000, status: 'Active', createdAt: '2026-04-01T09:00:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 10), earn('c2', 'Transport Allowance', 'Fixed', 400),
      ded('c3', 'Provident Fund', 'Percentage', 12), ded('c4', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-02', name: 'Middle School Teaching', applicableTo: 'Teaching',
    description: 'Class 6 to Class 9', baseAmount: 10000, status: 'Active', createdAt: '2026-04-01T09:05:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 15), earn('c2', 'Transport Allowance', 'Fixed', 600), earn('c3', 'Academic Allowance', 'Fixed', 500),
      ded('c4', 'Provident Fund', 'Percentage', 12), ded('c5', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-03', name: 'HOD & Senior Teaching', applicableTo: 'Teaching',
    description: 'HODs · Class 9–12', baseAmount: 24000, status: 'Active', createdAt: '2026-04-01T09:10:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 20), earn('c2', 'Responsibility Allowance', 'Fixed', 3000), earn('c3', 'Transport Allowance', 'Fixed', 800),
      ded('c4', 'Provident Fund', 'Percentage', 12), ded('c5', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-04', name: 'Senior Leadership', applicableTo: 'Administration',
    description: 'Principal and leadership', baseAmount: 30000, status: 'Active', createdAt: '2026-04-01T09:15:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 20), earn('c2', 'Responsibility Allowance', 'Fixed', 4000),
      ded('c3', 'Provident Fund', 'Percentage', 12), ded('c4', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-05', name: 'Office & Administration', applicableTo: 'Administration',
    description: 'Office and accounts staff', baseAmount: 9000, status: 'Active', createdAt: '2026-04-01T09:20:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 12), earn('c2', 'Transport Allowance', 'Fixed', 400),
      ded('c3', 'Provident Fund', 'Percentage', 12), ded('c4', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-06', name: 'Support Staff', applicableTo: 'Support',
    description: 'Lab and security staff', baseAmount: 7500, status: 'Active', createdAt: '2026-04-01T09:25:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 10),
      ded('c2', 'Provident Fund', 'Percentage', 12), ded('c3', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-07', name: 'Transport Staff', applicableTo: 'Transport',
    description: 'Drivers and conductors', baseAmount: 8500, status: 'Active', createdAt: '2026-04-01T09:30:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 10), earn('c2', 'Route Allowance', 'Fixed', 600),
      ded('c3', 'Provident Fund', 'Percentage', 12), ded('c4', 'Professional Tax', 'Fixed', 200),
    ],
  },
  {
    id: 'STR-08', name: 'Legacy 2019 Scale', applicableTo: 'All',
    description: 'Retired scale from an earlier session', baseAmount: 4500, status: 'Archived', createdAt: '2019-04-01T09:00:00.000Z',
    components: [
      earn('c1', 'HRA', 'Percentage', 10),
      ded('c2', 'Provident Fund', 'Percentage', 12), ded('c3', 'Professional Tax', 'Fixed', 200),
    ],
  },
]

// ─── Staff placements (scale + net salary) ───────────────────────────
// Salaries follow teaching level, subject and responsibility:
//   Primary (Nursery–Class 5)  ₹5,000 – ₹8,000
//   Middle school (Class 6–9)  ₹8,000 – ₹13,500
//   Senior / HOD (Class 9–12)  ₹16,800 – ₹28,400

interface Placement { structureId: string; net: number }

const PLACEMENTS: Record<string, Placement> = {
  // Leadership
  'T-001': { structureId: 'STR-04', net: 35000 }, // Dr. Ananya Iyer — Principal

  // Primary teaching (Nursery–Class 5)
  'T-002': { structureId: 'STR-01', net: 7500 }, // Priya Nair — Senior Teacher, English, Nursery (12y)
  'T-005': { structureId: 'STR-01', net: 6200 }, // Meera Krishnan — Teacher, Hindi, LKG (8y)
  'T-008': { structureId: 'STR-01', net: 6800 }, // Sunita Rao — Teacher, Mathematics, UKG (10y)
  'T-011': { structureId: 'STR-01', net: 7800 }, // Kavita Joshi — Senior Teacher, Science/EVS, Class 1 (15y)
  'T-014': { structureId: 'STR-01', net: 7900 }, // Rohan Mehta — Senior Teacher, Maths/Computer, Class 2 (9y)
  'T-017': { structureId: 'STR-01', net: 6500 }, // Amit Verma — Teacher, Physics/Maths, Class 3 (7y)
  'T-020': { structureId: 'STR-01', net: 7600 }, // Deepa Menon — Senior Teacher, English/SST, Class 4 (18y)
  'T-023': { structureId: 'STR-01', net: 6700 }, // Vikram Singh — Teacher, SST/History, Class 5 (11y)
  'T-050': { structureId: 'STR-01', net: 6400 }, // Lakshmi Venkat — Music Teacher, Classes 3–5 (10y)
  'T-053': { structureId: 'STR-01', net: 5900 }, // Faisal Ahmed — Art Teacher, Classes 1–3 (8y)

  // Middle school (Class 6–9)
  'T-026': { structureId: 'STR-02', net: 9200 },  // Neha Gupta — Teacher, Chemistry/Biology, Class 6 (6y)
  'T-029': { structureId: 'STR-02', net: 13500 }, // Suresh Pillai — Senior Teacher, Geography/Economics, Class 7 (14y)
  'T-032': { structureId: 'STR-02', net: 11800 }, // Anjali Desai — Teacher, Mathematics/Statistics, Class 8 (9y)
  'T-047': { structureId: 'STR-02', net: 13200 }, // Sanjay Reddy — Sports Director (13y)

  // HOD & senior secondary (Class 9–12)
  'T-035': { structureId: 'STR-03', net: 16800 }, // Rajesh Khanna — HOD Mathematics, Class 9 (21y)
  'T-038': { structureId: 'STR-03', net: 26500 }, // Pooja Bhatt — HOD Physics, Class 10 (19y)
  'T-041': { structureId: 'STR-03', net: 28400 }, // Arjun Kapoor — HOD Computer Science, Classes 11–12 (16y)
  'T-044': { structureId: 'STR-03', net: 25800 }, // Shalini Agarwal — HOD Commerce, Classes 11–12 (17y)

  // Office & administration
  'T-056': { structureId: 'STR-05', net: 9400 },   // Geeta Sharma — Librarian (12y)
  'STF-001': { structureId: 'STR-05', net: 17500 }, // Ramesh Kumar — Accountant (16y)
  'STF-002': { structureId: 'STR-05', net: 14800 }, // Sunita Devi — Office Manager (18y)
  'STF-003': { structureId: 'STR-05', net: 8900 },  // Mohan Lal — Store In-charge (13y)
  'STF-005': { structureId: 'STR-05', net: 8400 },  // Rekha Chauhan — Receptionist (9y)
  'STF-008': { structureId: 'STR-05', net: 12500 }, // Lakshmi Iyer — Counselor (10y)

  // Support & transport
  'STF-006': { structureId: 'STR-06', net: 8200 }, // Anil Gupta — Lab Assistant (12y)
  'STF-007': { structureId: 'STR-06', net: 8600 }, // Ramesh Singh — Security In-charge (14y)
  'STF-004': { structureId: 'STR-07', net: 9600 }, // Kamlesh Yadav — Bus Driver (11y)
}

// ─── Employees ───────────────────────────────────────────────────────

function buildEmployees(): Employee[] {
  const teacherEmployees: Employee[] = teachers.map((t) => {
    const p = PLACEMENTS[t.id]
    return {
      id: t.id,
      employeeId: t.employeeId,
      name: t.name,
      avatar: t.avatar,
      designation: t.designation,
      department: t.department,
      employeeType: 'Teaching' as EmployeeType,
      email: t.email,
      phone: t.phone,
      joiningDate: t.joiningDate,
      status: t.status === 'On Leave' ? ('On Leave' as EmployeeStatus) : ('Active' as EmployeeStatus),
      salary: p?.net ?? Math.min(t.salary, 8000),
      attendance: t.attendance,
      bloodGroup: t.bloodGroup,
      address: t.address,
      gender: t.gender,
      bankAccount: `****${(t.id.charCodeAt(2) * 137) % 9000 + 1000}`,
      bankIfsc: ['HDFC0000123', 'ICIC0000456', 'SBIN0000789'][t.id.charCodeAt(2) % 3],
    }
  })

  const adminStaff: Employee[] = [
    { id: 'STF-001', employeeId: 'EMP-101', name: 'Ramesh Kumar', avatar: 'RK', designation: 'Accountant', department: 'Finance', employeeType: 'Finance', email: 'ramesh.k@greenwood.edu.in', phone: '+91 98100 99001', joiningDate: '2010-04-01', status: 'Active', salary: 17500, attendance: 97, bloodGroup: 'O+', address: 'Sector 14, Gurugram', gender: 'Male', bankAccount: '****4521', bankIfsc: 'HDFC0000123' },
    { id: 'STF-002', employeeId: 'EMP-102', name: 'Sunita Devi', avatar: 'SD', designation: 'Office Manager', department: 'Administration', employeeType: 'Administration', email: 'sunita.d@greenwood.edu.in', phone: '+91 98200 99002', joiningDate: '2008-06-15', status: 'Active', salary: 14800, attendance: 99, bloodGroup: 'A+', address: 'Sector 22, Gurugram', gender: 'Female', bankAccount: '****8890', bankIfsc: 'ICIC0000456' },
    { id: 'STF-003', employeeId: 'EMP-103', name: 'Mohan Lal', avatar: 'ML', designation: 'Store In-charge', department: 'Administration', employeeType: 'Administration', email: 'mohan.l@greenwood.edu.in', phone: '+91 98300 99003', joiningDate: '2013-07-20', status: 'Active', salary: 8900, attendance: 96, bloodGroup: 'B+', address: 'Sector 31, Gurugram', gender: 'Male', bankAccount: '****2231', bankIfsc: 'SBIN0000789' },
    { id: 'STF-004', employeeId: 'EMP-104', name: 'Kamlesh Yadav', avatar: 'KY', designation: 'Bus Driver', department: 'Transport', employeeType: 'Transport', email: 'kamlesh.y@greenwood.edu.in', phone: '+91 98400 99004', joiningDate: '2015-08-10', status: 'Active', salary: 9600, attendance: 95, bloodGroup: 'O-', address: 'Sector 9, Gurugram', gender: 'Male', bankAccount: '****7765', bankIfsc: 'HDFC0000123' },
    { id: 'STF-005', employeeId: 'EMP-105', name: 'Rekha Chauhan', avatar: 'RC', designation: 'Receptionist', department: 'Administration', employeeType: 'Administration', email: 'rekha.c@greenwood.edu.in', phone: '+91 98500 99005', joiningDate: '2017-04-05', status: 'Active', salary: 8400, attendance: 98, bloodGroup: 'AB+', address: 'Sector 17, Gurugram', gender: 'Female', bankAccount: '****5567', bankIfsc: 'ICIC0000456' },
    { id: 'STF-006', employeeId: 'EMP-106', name: 'Anil Gupta', avatar: 'AG', designation: 'Lab Assistant', department: 'Science', employeeType: 'Support', email: 'anil.g@greenwood.edu.in', phone: '+91 98600 99006', joiningDate: '2014-06-12', status: 'Active', salary: 8200, attendance: 94, bloodGroup: 'A-', address: 'Sector 28, Gurugram', gender: 'Male', bankAccount: '****9982', bankIfsc: 'SBIN0000789' },
    { id: 'STF-007', employeeId: 'EMP-107', name: 'Ramesh Singh', avatar: 'RS', designation: 'Security In-charge', department: 'Administration', employeeType: 'Support', email: 'ramesh.s@greenwood.edu.in', phone: '+91 98700 99007', joiningDate: '2012-03-15', status: 'Active', salary: 8600, attendance: 99, bloodGroup: 'B-', address: 'Sector 40, Gurugram', gender: 'Male', bankAccount: '****3344', bankIfsc: 'HDFC0000123' },
    { id: 'STF-008', employeeId: 'EMP-108', name: 'Lakshmi Iyer', avatar: 'LI', designation: 'Counselor', department: 'Administration', employeeType: 'Administration', email: 'lakshmi.i@greenwood.edu.in', phone: '+91 98800 99008', joiningDate: '2016-09-01', status: 'Active', salary: 12500, attendance: 97, bloodGroup: 'O+', address: 'Sector 56, Gurugram', gender: 'Female', bankAccount: '****1122', bankIfsc: 'ICIC0000456' },
  ]

  return [...teacherEmployees, ...adminStaff]
}

export const SEED_EMPLOYEES = buildEmployees()

// ─── Apply a scale ───────────────────────────────────────────────────

function buildSession(template: SalaryStructureTemplate, base: number, effectiveFrom: string, exactNet?: number): SessionSalary {
  const earnings: AppliedComponent[] = [
    { name: 'Basic Pay', type: 'Earning', amount: base },
    ...template.components
      .filter((c) => c.type === 'Earning')
      .map((c) => ({ name: c.name, type: 'Earning' as const, amount: c.basis === 'Percentage' ? Math.round(base * c.value / 100) : c.value })),
  ]
  const deductions: AppliedComponent[] = template.components
    .filter((c) => c.type === 'Deduction')
    .map((c) => ({ name: c.name, type: 'Deduction' as const, amount: c.basis === 'Percentage' ? Math.round(base * c.value / 100) : c.value }))
  let netBase = earnings.reduce((s, c) => s + c.amount, 0) - deductions.reduce((s, c) => s + c.amount, 0)
  // Absorb rupee-level rounding into Basic Pay so the net lands exactly.
  if (exactNet !== undefined && netBase !== exactNet) {
    earnings[0] = { ...earnings[0], amount: earnings[0].amount + (exactNet - netBase) }
    netBase = exactNet
  }
  return { structureId: template.id, structureName: template.name, base, netBase, earnings, deductions, effectiveFrom }
}

/** Places an employee on a scale for a target GROSS earnings total. */
export function applyStructure(template: SalaryStructureTemplate, targetGross: number, effectiveFrom: string): SessionSalary {
  const pctEarnings = template.components.filter((c) => c.type === 'Earning' && c.basis === 'Percentage')
    .reduce((s, c) => s + c.value, 0) / 100
  const fixedEarnings = template.components.filter((c) => c.type === 'Earning' && c.basis === 'Fixed')
    .reduce((s, c) => s + c.value, 0)
  const base = Math.round((targetGross - fixedEarnings) / (1 + pctEarnings))
  return buildSession(template, base, effectiveFrom)
}

/** Places an employee on a scale for an exact target NET salary. */
export function applyStructureToNet(template: SalaryStructureTemplate, targetNet: number, effectiveFrom: string): SessionSalary {
  const pctEarnings = template.components.filter((c) => c.type === 'Earning' && c.basis === 'Percentage')
    .reduce((s, c) => s + c.value, 0) / 100
  const fixedEarnings = template.components.filter((c) => c.type === 'Earning' && c.basis === 'Fixed')
    .reduce((s, c) => s + c.value, 0)
  const pctDeductions = template.components.filter((c) => c.type === 'Deduction' && c.basis === 'Percentage')
    .reduce((s, c) => s + c.value, 0) / 100
  const fixedDeductions = template.components.filter((c) => c.type === 'Deduction' && c.basis === 'Fixed')
    .reduce((s, c) => s + c.value, 0)
  // net = base·(1 + pctE − pctD) + fixedE − fixedD
  const denom = 1 + pctEarnings - pctDeductions
  const base = Math.round((targetNet - fixedEarnings + fixedDeductions) / denom)
  return buildSession(template, base, effectiveFrom, targetNet)
}

function buildSalaries(): Record<string, EmployeeSalaryState> {
  const out: Record<string, EmployeeSalaryState> = {}
  for (const emp of SEED_EMPLOYEES) {
    if (emp.status !== 'Active' && emp.status !== 'On Leave') continue
    const placement = PLACEMENTS[emp.id] ?? { structureId: 'STR-01', net: 6000 }
    const template = SEED_STRUCTURES.find((s) => s.id === placement.structureId) ?? SEED_STRUCTURES[0]
    const history: SalaryHistoryEntry[] = [
      { id: `H-${emp.id}-1`, date: '2026-04-01', toNet: placement.net, note: 'Session salary set', by: PRINCIPAL },
    ]
    // Amit Verma accepted an increment during the session.
    if (emp.id === 'T-017') {
      history.unshift({ id: 'H-T-017-2', date: '2026-07-01', fromNet: 6200, toNet: 6500, note: 'Annual increment', by: emp.name })
    }
    out[emp.id] = {
      employeeId: emp.id,
      session: CURRENT_SESSION.id,
      salary: applyStructureToNet(template, placement.net, '2026-04-01'),
      history,
    }
  }
  return out
}

// ─── Time helpers ────────────────────────────────────────────────────

export function currentPeriodKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function periodLabel(periodKey: string): string {
  const [y, m] = periodKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function periodOptions(count = 6, now = new Date()): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(currentPeriodKey(d))
  }
  return out
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

// ─── Seed payments & audit ───────────────────────────────────────────

function buildSeedData() {
  const salaries = buildSalaries()
  const net = (id: string) => salaries[id]?.salary.netBase ?? 0

  const NOW = new Date()
  const CUR = currentPeriodKey(NOW)
  const PREV = currentPeriodKey(new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1))
  const NEXT = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1)
  const dISO = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 86400000).toISOString()
  const dDate = (daysAgo: number) => dISO(daysAgo).slice(0, 10)
  const hoursAfter = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3600000).toISOString()

  // Deepa Menon's payable is reduced by an advance recovery this session.
  const DEEPA_RECOVERY = 600
  const KAVITA_BONUS = 3000

  const adjustments: MonthlyAdjustment[] = [
    { id: 'ADJ-01', employeeId: 'T-020', employeeName: 'Deepa Menon', periodKey: CUR, label: 'Advance Recovery', amount: -DEEPA_RECOVERY, createdAt: dISO(6), createdBy: PRINCIPAL },
    { id: 'ADJ-02', employeeId: 'T-020', employeeName: 'Deepa Menon', periodKey: PREV, label: 'Advance Recovery', amount: -DEEPA_RECOVERY, createdAt: dISO(36), createdBy: PRINCIPAL },
    { id: 'ADJ-03', employeeId: 'T-011', employeeName: 'Kavita Joshi', periodKey: CUR, label: 'Festival Bonus', amount: KAVITA_BONUS, createdAt: dISO(5), createdBy: PRINCIPAL },
  ]

  const payableFor = (id: string, periodKey: string) =>
    net(id) + adjustments.filter((a) => a.employeeId === id && a.periodKey === periodKey).reduce((s, a) => s + a.amount, 0)

  const payments: SalaryPayment[] = []
  const receipts: PaymentReceipt[] = []
  const audit: AuditEntry[] = []
  let receiptSeq = 100
  const nextReceipt = () => {
    receiptSeq += 1
    return `RCP-${CUR.slice(2, 4)}${CUR.slice(5)}-${receiptSeq.toString().padStart(4, '0')}`
  }
  let auditSeq = 0
  const log = (action: AuditAction, title: string, detail: string, actor: string, timestamp: string) => {
    auditSeq += 1
    audit.push({ id: `AUD-${auditSeq.toString().padStart(4, '0')}`, action, title, detail, actor, timestamp })
  }

  interface SeedPay {
    employeeId: string; periodKey: string; amount: number; date: string; method: PaymentMethod
    reference?: string; status: PaymentStatus; recordedAt: string
    confirmedAt?: string; rejectedAt?: string; rejectionReason?: string
    reversedAt?: string; reversalReason?: string
  }

  const seeds: SeedPay[] = [
    // ── Current month: awaiting employee confirmation
    { employeeId: 'T-020', periodKey: CUR, amount: net('T-020') - DEEPA_RECOVERY, date: dDate(2), method: 'Bank Transfer', reference: 'NEFT-88341', status: 'Pending Receipt', recordedAt: dISO(2) },
    { employeeId: 'T-014', periodKey: CUR, amount: net('T-014'), date: dDate(1), method: 'UPI', reference: 'UPI-77213', status: 'Pending Receipt', recordedAt: dISO(1) },
    { employeeId: 'T-002', periodKey: CUR, amount: net('T-002'), date: dDate(1), method: 'Bank Transfer', reference: 'NEFT-88290', status: 'Pending Receipt', recordedAt: dISO(1) },
    // ── Current month: confirmed by the employee (receipts issued)
    { employeeId: 'T-038', periodKey: CUR, amount: net('T-038'), date: dDate(3), method: 'Bank Transfer', reference: 'NEFT-88120', status: 'Confirmed', recordedAt: dISO(3), confirmedAt: hoursAfter(dISO(3), 5) },
    { employeeId: 'T-011', periodKey: CUR, amount: net('T-011') + KAVITA_BONUS, date: dDate(3), method: 'Bank Transfer', reference: 'NEFT-88101', status: 'Confirmed', recordedAt: dISO(3), confirmedAt: hoursAfter(dISO(3), 6) },
    { employeeId: 'T-035', periodKey: CUR, amount: net('T-035'), date: dDate(4), method: 'Cheque', reference: 'CHQ-5521', status: 'Confirmed', recordedAt: dISO(4), confirmedAt: hoursAfter(dISO(4), 9) },
    { employeeId: 'STF-001', periodKey: CUR, amount: net('STF-001'), date: dDate(4), method: 'Bank Transfer', reference: 'NEFT-88054', status: 'Confirmed', recordedAt: dISO(4), confirmedAt: hoursAfter(dISO(4), 3) },
    { employeeId: 'STF-002', periodKey: CUR, amount: net('STF-002'), date: dDate(5), method: 'Bank Transfer', reference: 'NEFT-88088', status: 'Confirmed', recordedAt: dISO(5), confirmedAt: hoursAfter(dISO(5), 4) },
    // ── Current month: reversed duplicate entry
    { employeeId: 'STF-006', periodKey: CUR, amount: 800, date: dDate(5), method: 'Cash', status: 'Reversed', recordedAt: dISO(5), reversedAt: hoursAfter(dISO(5), 2), reversalReason: 'Duplicate entry' },
    // ── Previous month: confirmed history
    { employeeId: 'T-020', periodKey: PREV, amount: net('T-020') - DEEPA_RECOVERY, date: dDate(32), method: 'Bank Transfer', reference: 'NEFT-87012', status: 'Confirmed', recordedAt: dISO(32), confirmedAt: hoursAfter(dISO(32), 4) },
    { employeeId: 'T-014', periodKey: PREV, amount: net('T-014'), date: dDate(31), method: 'UPI', reference: 'UPI-71002', status: 'Confirmed', recordedAt: dISO(31), confirmedAt: hoursAfter(dISO(31), 7) },
    { employeeId: 'T-056', periodKey: PREV, amount: net('T-056'), date: dDate(30), method: 'Bank Transfer', reference: 'NEFT-87045', status: 'Confirmed', recordedAt: dISO(30), confirmedAt: hoursAfter(dISO(30), 5) },
    // ── Previous month: reported not received — awaiting follow-up
    { employeeId: 'STF-004', periodKey: PREV, amount: net('STF-004'), date: dDate(28), method: 'Cash', status: 'Not Received', recordedAt: dISO(28), rejectedAt: hoursAfter(dISO(28), 8), rejectionReason: 'Amount not credited to my account' },
  ]

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    const emp = SEED_EMPLOYEES.find((e) => e.id === s.employeeId)!
    const p: SalaryPayment = {
      id: `PAY-${(i + 1).toString().padStart(4, '0')}`,
      employeeId: s.employeeId,
      employeeName: emp.name,
      periodKey: s.periodKey,
      monthLabel: periodLabel(s.periodKey),
      netPayable: payableFor(s.employeeId, s.periodKey),
      amount: s.amount,
      date: s.date,
      method: s.method,
      reference: s.reference,
      bankAccount: s.method === 'Bank Transfer' ? emp.bankAccount : undefined,
      status: s.status,
      recordedBy: PRINCIPAL,
      recordedAt: s.recordedAt,
      confirmedAt: s.confirmedAt,
      confirmedBy: s.confirmedAt ? emp.name : undefined,
      rejectedAt: s.rejectedAt,
      rejectedBy: s.rejectedAt ? emp.name : undefined,
      rejectionReason: s.rejectionReason,
      reversedAt: s.reversedAt,
      reversalReason: s.reversalReason,
    }
    if (s.status === 'Confirmed') {
      const receiptNo = nextReceipt()
      p.receiptNo = receiptNo
      receipts.push({
        receiptNo, paymentId: p.id, employeeId: p.employeeId, employeeName: emp.name,
        monthLabel: p.monthLabel, amount: p.amount, method: p.method, date: p.date,
        confirmedAt: s.confirmedAt!, reference: p.reference,
      })
    }
    payments.push(p)

    log('payment.recorded', 'Payment recorded', `${emp.name} · ${inr(s.amount)} · ${p.monthLabel}`, PRINCIPAL, s.recordedAt)
    if (s.status === 'Confirmed') log('payment.confirmed', 'Payment confirmed', `${emp.name} · ${inr(s.amount)}`, emp.name, s.confirmedAt!)
    if (s.status === 'Not Received') log('payment.not_received', 'Payment not received', `${emp.name} · ${inr(s.amount)} — ${s.rejectionReason}`, emp.name, s.rejectedAt!)
    if (s.status === 'Reversed') log('payment.reversed', 'Payment reversed', `${emp.name} · ${inr(s.amount)} — ${s.reversalReason}`, PRINCIPAL, s.reversedAt!)
  }

  // Salary changes during the session.
  const amit = SEED_EMPLOYEES.find((e) => e.id === 'T-017')!
  const priya = SEED_EMPLOYEES.find((e) => e.id === 'T-002')!
  log('salary.change_requested', 'Salary change sent', `${amit.name} · ${inr(6200)} → ${inr(6500)}`, PRINCIPAL, dISO(60))
  log('salary.change_accepted', 'Salary change accepted', `${amit.name} · ${inr(6200)} → ${inr(6500)}`, amit.name, dISO(59))

  // Structure + editing activity.
  log('structure.created', 'Structure created', 'HOD & Senior Teaching · Teaching', PRINCIPAL, '2026-04-01T09:10:00.000Z')
  log('structure.archived', 'Structure archived', 'Legacy 2019 Scale', PRINCIPAL, '2026-04-02T10:00:00.000Z')
  log('editing.enabled', 'Editing enabled', '3-hour window', PRINCIPAL, dISO(9))

  audit.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // One pending change request awaiting the employee's decision.
  const changeRequests: SalaryChangeRequest[] = [
    {
      id: 'CR-001', employeeId: 'T-002', employeeName: priya.name,
      currentNet: net('T-002'), proposedNet: net('T-002') + 700,
      structureName: 'Primary Teaching', effectiveFrom: `${NEXT.getFullYear()}-${String(NEXT.getMonth() + 1).padStart(2, '0')}-01`,
      note: 'Annual increment', status: 'Pending',
      requestedBy: PRINCIPAL, requestedAt: dISO(1),
    },
    {
      id: 'CR-000', employeeId: 'T-017', employeeName: amit.name,
      currentNet: 6200, proposedNet: 6500,
      structureName: 'Primary Teaching', effectiveFrom: '2026-07-01',
      note: 'Annual increment', status: 'Accepted',
      requestedBy: PRINCIPAL, requestedAt: dISO(60), respondedAt: dISO(59), respondedBy: amit.name,
    },
  ]

  return { salaries, adjustments, payments, receipts, audit, changeRequests }
}

const SEED = buildSeedData()

// ─── Store ───────────────────────────────────────────────────────────

export interface RecordPaymentInput {
  employeeId: string
  periodKey: string
  amount: number
  date: string
  method: PaymentMethod
  reference?: string
  bankAccount?: string
}

export interface ChangeRequestInput {
  employeeId: string
  proposedNet: number
  structureId?: string
  effectiveFrom: string
  note?: string
}

export interface AdjustmentInput {
  employeeId: string
  periodKey: string
  label: string
  amount: number
}

interface SalaryState {
  employees: Employee[]
  structures: SalaryStructureTemplate[]
  salaries: Record<string, EmployeeSalaryState>
  changeRequests: SalaryChangeRequest[]
  adjustments: MonthlyAdjustment[]
  payments: SalaryPayment[]
  receipts: PaymentReceipt[]
  audit: AuditEntry[]
  editPermission: EditPermission
  settings: PaymentSettings
  receiptSeq: number

  recordPayment: (input: RecordPaymentInput) => SalaryPayment
  confirmReceipt: (paymentId: string, actor?: string) => void
  reportNotReceived: (paymentId: string, reason: string, actor?: string) => void
  reversePayment: (paymentId: string, reason: string) => void
  markFollowedUp: (paymentId: string) => void

  requestSalaryChange: (input: ChangeRequestInput) => void
  respondToChangeRequest: (requestId: string, accept: boolean, reason?: string) => void
  addAdjustment: (input: AdjustmentInput) => void

  createStructure: (input: Omit<SalaryStructureTemplate, 'id' | 'status' | 'createdAt'>) => void
  updateStructure: (id: string, patch: Partial<Omit<SalaryStructureTemplate, 'id' | 'createdAt'>>) => void
  duplicateStructure: (id: string) => void
  setStructureStatus: (id: string, status: StructureStatus) => void

  enableEditing: () => void
  normalizeEditPermission: () => void
  updateSettings: (patch: Partial<PaymentSettings>) => void
}

export const useSalaryStore = create<SalaryState>()(
  persist(
    (set, get) => {
      const log = (action: AuditAction, title: string, detail: string, actor: string) =>
        set((st) => ({ audit: [{ id: `AUD-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, action, title, detail, actor, timestamp: new Date().toISOString() }, ...st.audit] }))

      /** Guard: every salary mutation runs through this. Throws when locked. */
      const assertEditingAllowed = () => {
        const { editPermission } = get()
        const live = editPermission.enabled && editPermission.expiresAt !== null && Date.now() < editPermission.expiresAt
        if (live) return
        if (editPermission.enabled) {
          // Window just expired — normalise and record it once.
          set({ editPermission: { enabled: false, expiresAt: null } })
          log('editing.expired', 'Editing window ended', 'Salary editing', 'System')
        }
        throw new Error('Salary editing is locked. Enable editing in Settings first.')
      }

      return {
        employees: SEED_EMPLOYEES,
        structures: SEED_STRUCTURES,
        salaries: SEED.salaries,
        changeRequests: SEED.changeRequests,
        adjustments: SEED.adjustments,
        payments: SEED.payments,
        receipts: SEED.receipts,
        audit: SEED.audit,
        receiptSeq: 200,
        editPermission: { enabled: false, expiresAt: null },
        settings: {
          defaultMethod: 'Bank Transfer',
          referenceRequired: { 'Bank Transfer': true, UPI: false, Cash: false, Cheque: true },
        },

        // ── Payments ──
        recordPayment: (input) => {
          const emp = get().employees.find((e) => e.id === input.employeeId)
          if (!emp) throw new Error('Select an employee.')
          if (!input.amount || input.amount <= 0) throw new Error('Enter a valid amount.')
          if (!input.date) throw new Error('Select a payment date.')
          const { settings } = get()
          if (settings.referenceRequired[input.method] && !input.reference?.trim()) {
            throw new Error(`Reference number is required for ${input.method}.`)
          }
          const payable = netPayableFor(get(), input.employeeId, input.periodKey)
          const payment: SalaryPayment = {
            id: `PAY-${Date.now().toString(36)}`,
            employeeId: input.employeeId,
            employeeName: emp.name,
            periodKey: input.periodKey,
            monthLabel: periodLabel(input.periodKey),
            netPayable: payable,
            amount: input.amount,
            date: input.date,
            method: input.method,
            reference: input.reference?.trim() || undefined,
            bankAccount: input.method === 'Bank Transfer' ? (input.bankAccount || emp.bankAccount) : undefined,
            status: 'Pending Receipt',
            recordedBy: PRINCIPAL,
            recordedAt: new Date().toISOString(),
          }
          set((st) => ({ payments: [payment, ...st.payments] }))
          log('payment.recorded', 'Payment recorded', `${emp.name} · ${inr(input.amount)} · ${payment.monthLabel}`, PRINCIPAL)
          return payment
        },

        confirmReceipt: (paymentId, actor) => {
          const st = get()
          const p = st.payments.find((x) => x.id === paymentId)
          if (!p || p.status !== 'Pending Receipt') return
          const now = new Date()
          const receiptNo = `RCP-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${(st.receiptSeq + 1).toString().padStart(4, '0')}`
          const confirmedAt = now.toISOString()
          const receipt: PaymentReceipt = {
            receiptNo, paymentId: p.id, employeeId: p.employeeId, employeeName: p.employeeName,
            monthLabel: p.monthLabel, amount: p.amount, method: p.method, date: p.date,
            confirmedAt, reference: p.reference,
          }
          set({
            payments: st.payments.map((x) => x.id === paymentId
              ? { ...x, status: 'Confirmed' as PaymentStatus, confirmedAt, confirmedBy: actor ?? p.employeeName, receiptNo }
              : x),
            receipts: [receipt, ...st.receipts],
            receiptSeq: st.receiptSeq + 1,
          })
          log('payment.confirmed', 'Payment confirmed', `${p.employeeName} · ${inr(p.amount)}`, actor ?? p.employeeName)
        },

        reportNotReceived: (paymentId, reason, actor) => {
          const st = get()
          const p = st.payments.find((x) => x.id === paymentId)
          if (!p || p.status !== 'Pending Receipt') return
          if (!reason.trim()) throw new Error('Tell us what happened so the school can follow up.')
          const rejectedAt = new Date().toISOString()
          set({
            payments: st.payments.map((x) => x.id === paymentId
              ? { ...x, status: 'Not Received' as PaymentStatus, rejectedAt, rejectedBy: actor ?? p.employeeName, rejectionReason: reason.trim() }
              : x),
          })
          log('payment.not_received', 'Payment not received', `${p.employeeName} · ${inr(p.amount)} — ${reason.trim()}`, actor ?? p.employeeName)
        },

        reversePayment: (paymentId, reason) => {
          const st = get()
          const p = st.payments.find((x) => x.id === paymentId)
          if (!p || (p.status !== 'Confirmed' && p.status !== 'Pending Receipt')) return
          if (!reason.trim()) throw new Error('Enter a reason for reversing this payment.')
          set({
            payments: st.payments.map((x) => x.id === paymentId
              ? { ...x, status: 'Reversed' as PaymentStatus, reversedAt: new Date().toISOString(), reversalReason: reason.trim() }
              : x),
            receipts: st.receipts.filter((r) => r.paymentId !== paymentId),
          })
          log('payment.reversed', 'Payment reversed', `${p.employeeName} · ${inr(p.amount)} — ${reason.trim()}`, PRINCIPAL)
        },

        markFollowedUp: (paymentId) => {
          const st = get()
          const p = st.payments.find((x) => x.id === paymentId)
          if (!p || (p.status !== 'Not Received' && p.status !== 'Pending Receipt')) return
          set({ payments: st.payments.map((x) => x.id === paymentId ? { ...x, followedUpAt: new Date().toISOString() } : x) })
          log('payment.followed_up', 'Follow-up recorded', `${p.employeeName} · ${inr(p.amount)}`, PRINCIPAL)
        },

        // ── Salary changes (employee approval) ──
        requestSalaryChange: (input) => {
          assertEditingAllowed()
          const st = get()
          const emp = st.employees.find((e) => e.id === input.employeeId)
          const current = st.salaries[input.employeeId]
          if (!emp || !current) throw new Error('Select an employee.')
          if (!input.proposedNet || input.proposedNet <= 0) throw new Error('Enter a valid net salary.')
          if (input.proposedNet === current.salary.netBase) throw new Error('The new amount is the same as the current salary.')
          const structureName = input.structureId ? st.structures.find((s) => s.id === input.structureId)?.name : undefined
          const req: SalaryChangeRequest = {
            id: `CR-${Date.now().toString(36)}`,
            employeeId: input.employeeId,
            employeeName: emp.name,
            currentNet: current.salary.netBase,
            proposedNet: input.proposedNet,
            structureId: input.structureId,
            structureName,
            effectiveFrom: input.effectiveFrom,
            note: input.note?.trim() || undefined,
            status: 'Pending',
            requestedBy: PRINCIPAL,
            requestedAt: new Date().toISOString(),
          }
          set({ changeRequests: [req, ...st.changeRequests] })
          log('salary.change_requested', 'Salary change sent', `${emp.name} · ${inr(current.salary.netBase)} → ${inr(input.proposedNet)}`, PRINCIPAL)
        },

        respondToChangeRequest: (requestId, accept, reason) => {
          const st = get()
          const req = st.changeRequests.find((r) => r.id === requestId)
          const current = req ? st.salaries[req.employeeId] : undefined
          if (!req || !current || req.status !== 'Pending') return
          const respondedAt = new Date().toISOString()

          if (accept) {
            // The employee approved this exact net — the applied salary
            // must land on it, whichever scale is used.
            const targetStructure = st.structures.find((s) => s.id === req.structureId)
              ?? st.structures.find((s) => s.id === current.salary.structureId)
            const newSalary: SessionSalary = targetStructure
              ? applyStructureToNet(targetStructure, req.proposedNet, req.effectiveFrom)
              : (() => {
                  // No scale available — scale every line proportionally.
                  const factor = current.salary.netBase > 0 ? req.proposedNet / current.salary.netBase : 1
                  const scaleLine = (c: AppliedComponent): AppliedComponent => ({ ...c, amount: Math.round(c.amount * factor) })
                  const earnings = current.salary.earnings.map(scaleLine)
                  const deductions = current.salary.deductions.map(scaleLine)
                  const netBase = earnings.reduce((s, c) => s + c.amount, 0) - deductions.reduce((s, c) => s + c.amount, 0)
                  return {
                    ...current.salary,
                    base: Math.round(current.salary.base * factor),
                    netBase,
                    earnings,
                    deductions,
                    effectiveFrom: req.effectiveFrom,
                  }
                })()
            const historyEntry: SalaryHistoryEntry = {
              id: `H-${Date.now().toString(36)}`,
              date: req.effectiveFrom,
              fromNet: current.salary.netBase,
              toNet: req.proposedNet,
              note: req.note,
              by: req.employeeName,
            }
            set({
              changeRequests: st.changeRequests.map((r) => r.id === requestId ? { ...r, status: 'Accepted' as ChangeRequestStatus, respondedAt, respondedBy: req.employeeName } : r),
              salaries: {
                ...st.salaries,
                [req.employeeId]: { ...current, salary: newSalary, history: [historyEntry, ...current.history] },
              },
            })
            log('salary.change_accepted', 'Salary change accepted', `${req.employeeName} · ${inr(req.currentNet)} → ${inr(req.proposedNet)}`, req.employeeName)
          } else {
            set({
              changeRequests: st.changeRequests.map((r) => r.id === requestId
                ? { ...r, status: 'Declined' as ChangeRequestStatus, respondedAt, respondedBy: req.employeeName, declineReason: reason?.trim() || undefined }
                : r),
            })
            log('salary.change_declined', 'Salary change declined', `${req.employeeName} · ${inr(req.currentNet)} → ${inr(req.proposedNet)}`, req.employeeName)
          }
        },

        addAdjustment: (input) => {
          assertEditingAllowed()
          const st = get()
          const emp = st.employees.find((e) => e.id === input.employeeId)
          if (!emp) throw new Error('Select an employee.')
          if (!input.label.trim()) throw new Error('Enter what this adjustment is for.')
          if (!input.amount || input.amount === 0) throw new Error('Enter a valid amount.')
          const adj: MonthlyAdjustment = {
            id: `ADJ-${Date.now().toString(36)}`,
            employeeId: input.employeeId,
            employeeName: emp.name,
            periodKey: input.periodKey,
            label: input.label.trim(),
            amount: input.amount,
            createdAt: new Date().toISOString(),
            createdBy: PRINCIPAL,
          }
          set({ adjustments: [adj, ...st.adjustments] })
          const sign = input.amount > 0 ? '+' : '−'
          log('adjustment.added', 'Adjustment added', `${emp.name} · ${input.label.trim()} ${sign}${inr(Math.abs(input.amount))} · ${periodLabel(input.periodKey)}`, PRINCIPAL)
        },

        // ── Structure templates ──
        createStructure: (input) => {
          const st = get()
          const structure: SalaryStructureTemplate = {
            ...input,
            id: `STR-${Date.now().toString(36)}`,
            status: 'Active',
            createdAt: new Date().toISOString(),
          }
          set({ structures: [...st.structures, structure] })
          log('structure.created', 'Structure created', `${structure.name} · ${structure.applicableTo}`, PRINCIPAL)
        },

        updateStructure: (id, patch) => {
          const st = get()
          const old = st.structures.find((s) => s.id === id)
          set({ structures: st.structures.map((s) => s.id === id ? { ...s, ...patch } : s) })
          if (old) log('structure.updated', 'Structure updated', old.name, PRINCIPAL)
        },

        duplicateStructure: (id) => {
          const st = get()
          const src = st.structures.find((s) => s.id === id)
          if (!src) return
          const copy: SalaryStructureTemplate = {
            ...src,
            id: `STR-${Date.now().toString(36)}`,
            name: `${src.name} (Copy)`,
            status: 'Active',
            createdAt: new Date().toISOString(),
          }
          set({ structures: [...st.structures, copy] })
          log('structure.created', 'Structure duplicated', `${src.name} → ${copy.name}`, PRINCIPAL)
        },

        setStructureStatus: (id, status) => {
          const st = get()
          const src = st.structures.find((s) => s.id === id)
          set({ structures: st.structures.map((s) => s.id === id ? { ...s, status } : s) })
          if (src) log(status === 'Archived' ? 'structure.archived' : 'structure.restored', status === 'Archived' ? 'Structure archived' : 'Structure restored', src.name, PRINCIPAL)
        },

        // ── Editing window ──
        enableEditing: () => {
          const now = Date.now()
          set({
            editPermission: {
              enabled: true,
              expiresAt: now + EDIT_WINDOW_MS,
              enabledBy: PRINCIPAL,
              enabledAt: new Date().toISOString(),
            },
          })
          const hours = Math.floor(EDIT_WINDOW_MS / 3600000)
          log('editing.enabled', 'Editing enabled', `${hours}-hour window`, PRINCIPAL)
        },

        normalizeEditPermission: () => {
          const { editPermission } = get()
          if (editPermission.enabled && editPermission.expiresAt !== null && Date.now() >= editPermission.expiresAt) {
            set({ editPermission: { enabled: false, expiresAt: null } })
            log('editing.expired', 'Editing window ended', 'Salary editing', 'System')
          }
        },

        updateSettings: (patch) => {
          set((st) => ({ settings: { ...st.settings, ...patch } }))
          log('settings.updated', 'Preferences updated', 'Salary & Payroll', PRINCIPAL)
        },
      }
    },
    {
      name: 'scholario-salary-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (st) => ({
        structures: st.structures,
        salaries: st.salaries,
        changeRequests: st.changeRequests,
        adjustments: st.adjustments,
        payments: st.payments,
        receipts: st.receipts,
        audit: st.audit,
        editPermission: st.editPermission,
        settings: st.settings,
        receiptSeq: st.receiptSeq,
      }),
      onRehydrateStorage: () => (state) => {
        // Expiry survives refresh: an expired window rehydrates as OFF.
        if (state) state.normalizeEditPermission()
      },
    },
  ),
)

// ─── Derived helpers ─────────────────────────────────────────────────

interface PayableSource {
  salaries: Record<string, EmployeeSalaryState>
  adjustments: MonthlyAdjustment[]
}

export function netPayableFor(src: PayableSource, employeeId: string, periodKey: string): number {
  const base = src.salaries[employeeId]?.salary.netBase ?? 0
  const adj = src.adjustments
    .filter((a) => a.employeeId === employeeId && a.periodKey === periodKey)
    .reduce((s, a) => s + a.amount, 0)
  return base + adj
}

export function confirmedPaidFor(payments: SalaryPayment[], employeeId: string, periodKey: string): number {
  return payments
    .filter((p) => p.employeeId === employeeId && p.periodKey === periodKey && p.status === 'Confirmed')
    .reduce((s, p) => s + p.amount, 0)
}

/** Payslip state for an employee-month: Unpaid · Pending · Paid. */
export function monthPaymentState(payments: SalaryPayment[], employeeId: string, periodKey: string): 'Unpaid' | 'Pending' | 'Paid' {
  const forMonth = payments.filter((p) => p.employeeId === employeeId && p.periodKey === periodKey)
  if (forMonth.some((p) => p.status === 'Confirmed')) return 'Paid'
  if (forMonth.some((p) => p.status === 'Pending Receipt')) return 'Pending'
  return 'Unpaid'
}

export function editPermissionLive(editPermission: EditPermission): { allowed: boolean; msLeft: number } {
  const msLeft = editPermission.expiresAt ? editPermission.expiresAt - Date.now() : 0
  return { allowed: editPermission.enabled && msLeft > 0, msLeft: Math.max(0, msLeft) }
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

// ─── Hook: aggregated read model ─────────────────────────────────────

export function useSalaryData() {
  const employees = useSalaryStore((s) => s.employees)
  const structures = useSalaryStore((s) => s.structures)
  const salaries = useSalaryStore((s) => s.salaries)
  const changeRequests = useSalaryStore((s) => s.changeRequests)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const audit = useSalaryStore((s) => s.audit)

  return useMemo(() => {
    const periodKey = currentPeriodKey()
    const label = periodLabel(periodKey)
    const active = employees.filter((e) => e.status === 'Active' || e.status === 'On Leave')

    const rows = active.map((e) => {
      const payable = netPayableFor({ salaries, adjustments }, e.id, periodKey)
      const confirmed = confirmedPaidFor(payments, e.id, periodKey)
      const state = monthPaymentState(payments, e.id, periodKey)
      return { employee: e, payable, confirmed, balance: Math.max(0, payable - confirmed), state }
    })

    const payable = rows.reduce((s, r) => s + r.payable, 0)
    const confirmed = rows.reduce((s, r) => s + r.confirmed, 0)
    const monthPayments = payments.filter((p) => p.periodKey === periodKey)
    const pending = monthPayments.filter((p) => p.status === 'Pending Receipt')
    const notReceived = monthPayments.filter((p) => p.status === 'Not Received' && !p.followedUpAt)
    const pendingAmount = pending.reduce((s, p) => s + p.amount, 0)

    const methodSplit = METHODS.map((m) => ({
      method: m,
      count: monthPayments.filter((p) => p.method === m && p.status !== 'Reversed').length,
      amount: monthPayments.filter((p) => p.method === m && p.status === 'Confirmed').reduce((s, p) => s + p.amount, 0),
    })).filter((m) => m.count > 0)

    const deptMap = new Map<string, { staff: number; payable: number; confirmed: number }>()
    rows.forEach((r) => {
      const cur = deptMap.get(r.employee.department) ?? { staff: 0, payable: 0, confirmed: 0 }
      deptMap.set(r.employee.department, { staff: cur.staff + 1, payable: cur.payable + r.payable, confirmed: cur.confirmed + r.confirmed })
    })

    const structureUsage: Record<string, number> = {}
    Object.values(salaries).forEach((s) => {
      structureUsage[s.salary.structureId] = (structureUsage[s.salary.structureId] ?? 0) + 1
    })

    const pendingChangeRequests = changeRequests.filter((r) => r.status === 'Pending')

    return {
      employees, structures, salaries, changeRequests, adjustments, payments, receipts, audit,
      rows, periodKey, monthLabel: label,
      currentMonth: {
        payable, confirmed,
        pending: { count: pending.length, amount: pendingAmount },
        notReceived: { count: notReceived.length, amount: notReceived.reduce((s, p) => s + p.amount, 0) },
        paid: monthPayments.filter((p) => p.status === 'Confirmed').length,
      },
      pendingChangeRequests,
      methodSplit,
      departmentTotals: Array.from(deptMap.entries()).map(([dept, v]) => ({ dept, ...v })).sort((a, b) => b.payable - a.payable),
      structureUsage,
      analytics: {
        monthlyPayroll: payable,
        netPayable: payable,
        pendingAdjustments: pendingChangeRequests.length,
        employeeCount: active.length,
      },
    }
  }, [employees, structures, salaries, changeRequests, adjustments, payments, receipts, audit])
}

// ─── Re-export formatting (shared convention) ────────────────────────

export { formatINR, formatDate } from '@/lib/format'
