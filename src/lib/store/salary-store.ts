/**
 * Salary & Payroll store — Principal's payroll management store.
 *
 * Connects to canonical Teacher records from src/lib/mock/teachers.ts and
 * adds administrative, support, and operational staff to form one canonical
 * employee database. All payroll numbers derive from these records.
 *
 * Lifecycle:
 *   Employee → Salary Structure → Attendance → Adjustments →
 *   Payroll Preparation → Review → Approval → Disbursement →
 *   Payslips → Reports → History
 *
 * Mutations:
 *   - preparePayroll (validate + calculate)
 *   - approvePayroll
 *   - disbursePayroll
 *   - lockPayroll
 *   - addAdjustment / approveAdjustment / rejectAdjustment
 *   - reviseSalary (with history)
 *   - addSalaryStructure / updateSalaryStructure
 *   - addSalaryComponent
 *
 * Audit log: every mutation creates an immutable record.
 */

import { create } from 'zustand'
import { useMemo } from 'react'
import { teachers, type Teacher } from '@/lib/mock/teachers'
import { school } from '@/lib/mock/school'

// ─── Types ───────────────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'On Leave' | 'Suspended' | 'Resigned' | 'Retired' | 'Inactive'
export type PayrollStatus = 'Draft' | 'Calculated' | 'Needs Review' | 'Approved' | 'Processing' | 'Paid' | 'On Hold' | 'Failed' | 'Cancelled' | 'Locked'
export type EmployeeType = 'Teaching' | 'Administration' | 'Support' | 'Transport' | 'Finance' | 'Other'
export type SalaryComponentType = 'Earning' | 'Deduction'
export type SalaryComponentBasis = 'Fixed' | 'Percentage'
export type AdjustmentType = 'Bonus' | 'Reimbursement' | 'Advance' | 'Arrears' | 'Incentive' | 'Deduction'
export type AdjustmentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid'
export type AuditAction =
  | 'payroll.prepared'
  | 'payroll.approved'
  | 'payroll.disbursed'
  | 'payroll.locked'
  | 'adjustment.added'
  | 'adjustment.approved'
  | 'adjustment.rejected'
  | 'salary.revised'
  | 'structure.created'
  | 'structure.updated'
  | 'payslip.generated'
  | 'payslip.downloaded'

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
  pan?: string
  /** Linked teacher record (if applicable). */
  teacherId?: string
}

export interface SalaryComponent {
  id: string
  name: string
  type: SalaryComponentType
  basis: SalaryComponentBasis
  value: number
  /** For percentage basis — percentage of Basic. */
  percentage?: number
  taxable: boolean
  active: boolean
}

export interface SalaryStructure {
  id: string
  name: string
  description: string
  applicableTo: EmployeeType | 'All'
  components: SalaryComponent[]
  effectiveFrom: string
  version: number
}

export interface SalaryRevision {
  id: string
  employeeId: string
  employeeName: string
  previousSalary: number
  newSalary: number
  effectiveFrom: string
  reason: string
  approvedBy: string
  approvedAt: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  designation: string
  department: string
  period: string
  gross: number
  earnings: number
  deductions: number
  adjustments: number
  netPay: number
  status: PayrollStatus
  workingDays: number
  presentDays: number
  leaveWithoutPay: number
  bankAccount?: string
  paidOn?: string
  preparedBy?: string
  approvedBy?: string
  disbursedBy?: string
}

export interface PayrollPeriod {
  period: string
  month: number
  year: number
  status: PayrollStatus
  employeeCount: number
  totalGross: number
  totalEarnings: number
  totalDeductions: number
  totalAdjustments: number
  totalNetPay: number
  preparedBy?: string
  preparedAt?: string
  approvedBy?: string
  approvedAt?: string
  disbursedBy?: string
  disbursedAt?: string
  lockedAt?: string
}

export interface Adjustment {
  id: string
  employeeId: string
  employeeName: string
  type: AdjustmentType
  amount: number
  reason: string
  effectivePeriod: string
  status: AdjustmentStatus
  submittedBy: string
  approvedBy?: string
  approvedAt?: string
  category?: string
  /** For advances/loans. */
  installments?: number
  recoveredInstallments?: number
}

export interface Payslip {
  id: string
  payrollId: string
  employeeId: string
  employeeName: string
  designation: string
  department: string
  period: string
  payDate: string
  earnings: Array<{ name: string; amount: number }>
  deductions: Array<{ name: string; amount: number }>
  grossEarnings: number
  totalDeductions: number
  netPay: number
  bankAccount?: string
  generatedAt: string
}

export interface PayrollAudit {
  id: string
  action: AuditAction
  actor: string
  timestamp: string
  entityId: string
  description: string
  before?: string
  after?: string
}

export interface PayrollException {
  employeeId: string
  employeeName: string
  type: 'missing_bank' | 'missing_structure' | 'attendance_pending' | 'unpaid_leave' | 'negative_net' | 'large_change' | 'inactive_included' | 'pending_approval'
  description: string
  severity: 'critical' | 'warning' | 'info'
}

// ─── Seed Data ────────────────────────────────────────────────────────

// Convert teachers → employees + add support/admin/transport staff.
function buildEmployees(): Employee[] {
  const teacherEmployees: Employee[] = teachers.map((t) => ({
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
    status: t.status === 'On Leave' ? 'On Leave' : 'Active',
    salary: t.salary,
    attendance: t.attendance,
    bloodGroup: t.bloodGroup,
    address: t.address,
    gender: t.gender,
    bankAccount: `****${(t.id.charCodeAt(2) * 137) % 9000 + 1000}`,
    bankIfsc: ['HDFC0000123', 'ICIC0000456', 'SBIN0000789'][t.id.charCodeAt(2) % 3],
    pan: `ABCDE${(t.id.charCodeAt(2) * 11) % 9000 + 1000}F`,
    teacherId: t.id,
  }))

  // Additional non-teaching staff.
  const adminStaff: Employee[] = [
    { id: 'STF-001', employeeId: 'EMP-101', name: 'Ramesh Kumar', avatar: 'RK', designation: 'Accountant', department: 'Finance', employeeType: 'Finance', email: 'ramesh.k@greenwood.edu.in', phone: '+91 98100 99001', joiningDate: '2010-04-01', status: 'Active', salary: 58000, attendance: 97, bloodGroup: 'O+', address: 'Sector 14, Gurugram', gender: 'Male', bankAccount: '****4521', bankIfsc: 'HDFC0000123', pan: 'BHJPK1234A' },
    { id: 'STF-002', employeeId: 'EMP-102', name: 'Sunita Devi', avatar: 'SD', designation: 'Office Manager', department: 'Administration', employeeType: 'Administration', email: 'sunita.d@greenwood.edu.in', phone: '+91 98200 99002', joiningDate: '2008-06-15', status: 'Active', salary: 52000, attendance: 99, bloodGroup: 'A+', address: 'Sector 22, Gurugram', gender: 'Female', bankAccount: '****8890', bankIfsc: 'ICIC0000456', pan: 'AKLPD5678B' },
    { id: 'STF-003', employeeId: 'EMP-103', name: 'Mohan Lal', avatar: 'ML', designation: 'Librarian', department: 'Administration', employeeType: 'Administration', email: 'mohan.l@greenwood.edu.in', phone: '+91 98300 99003', joiningDate: '2013-07-20', status: 'Active', salary: 46000, attendance: 96, bloodGroup: 'B+', address: 'Sector 31, Gurugram', gender: 'Male', bankAccount: '****2231', bankIfsc: 'SBIN0000789', pan: 'MLPLM9012C' },
    { id: 'STF-004', employeeId: 'EMP-104', name: 'Kamlesh Yadav', avatar: 'KY', designation: 'Bus Driver', department: 'Transport', employeeType: 'Transport', email: 'kamlesh.y@greenwood.edu.in', phone: '+91 98400 99004', joiningDate: '2015-08-10', status: 'Active', salary: 32000, attendance: 95, bloodGroup: 'O-', address: 'Sector 9, Gurugram', gender: 'Male', bankAccount: '****7765', bankIfsc: 'HDFC0000123', pan: 'KYPLM3456D' },
    { id: 'STF-005', employeeId: 'EMP-105', name: 'Geeta Sharma', avatar: 'GS', designation: 'Receptionist', department: 'Administration', employeeType: 'Administration', email: 'geeta.s@greenwood.edu.in', phone: '+91 98500 99005', joiningDate: '2017-04-05', status: 'Active', salary: 38000, attendance: 98, bloodGroup: 'AB+', address: 'Sector 17, Gurugram', gender: 'Female', bankAccount: '****5567', bankIfsc: 'ICIC0000456', pan: 'GSPSR7890E' },
    { id: 'STF-006', employeeId: 'EMP-106', name: 'Anil Gupta', avatar: 'AG', designation: 'Lab Assistant', department: 'Science', employeeType: 'Support', email: 'anil.g@greenwood.edu.in', phone: '+91 98600 99006', joiningDate: '2014-06-12', status: 'Active', salary: 42000, attendance: 94, bloodGroup: 'A-', address: 'Sector 28, Gurugram', gender: 'Male', bankAccount: '****9982', bankIfsc: 'SBIN0000789', pan: 'AGPLM1234F' },
    { id: 'STF-007', employeeId: 'EMP-107', name: 'Ramesh Singh', avatar: 'RS', designation: 'Security In-charge', department: 'Administration', employeeType: 'Support', email: 'ramesh.s@greenwood.edu.in', phone: '+91 98700 99007', joiningDate: '2012-03-15', status: 'Active', salary: 36000, attendance: 99, bloodGroup: 'B-', address: 'Sector 40, Gurugram', gender: 'Male', bankAccount: '****3344', bankIfsc: 'HDFC0000123', pan: 'RSSPR5678G' },
    { id: 'STF-008', employeeId: 'EMP-108', name: 'Lakshmi Iyer', avatar: 'LI', designation: 'Counselor', department: 'Administration', employeeType: 'Administration', email: 'lakshmi.i@greenwood.edu.in', phone: '+91 98800 99008', joiningDate: '2016-09-01', status: 'Active', salary: 48000, attendance: 97, bloodGroup: 'O+', address: 'Sector 56, Gurugram', gender: 'Female', bankAccount: '****1122', bankIfsc: 'ICIC0000456', pan: 'LIPSR9012H' },
  ]

  return [...teacherEmployees, ...adminStaff]
}

const SEED_EMPLOYEES = buildEmployees()

// ─── Default Salary Components ───────────────────────────────────────

export const DEFAULT_EARNING_COMPONENTS: SalaryComponent[] = [
  { id: 'EC01', name: 'Basic Salary', type: 'Earning', basis: 'Percentage', value: 0, percentage: 50, taxable: true, active: true },
  { id: 'EC02', name: 'HRA (House Rent Allowance)', type: 'Earning', basis: 'Percentage', value: 0, percentage: 20, taxable: false, active: true },
  { id: 'EC03', name: 'Dearness Allowance', type: 'Earning', basis: 'Percentage', value: 0, percentage: 10, taxable: true, active: true },
  { id: 'EC04', name: 'Special Allowance', type: 'Earning', basis: 'Percentage', value: 0, percentage: 20, taxable: true, active: true },
  { id: 'EC05', name: 'Transport Allowance', type: 'Earning', basis: 'Fixed', value: 2000, taxable: false, active: true },
]

export const DEFAULT_DEDUCTION_COMPONENTS: SalaryComponent[] = [
  { id: 'DC01', name: 'Provident Fund (PF)', type: 'Deduction', basis: 'Percentage', value: 0, percentage: 12, taxable: false, active: true },
  { id: 'DC02', name: 'Professional Tax', type: 'Deduction', basis: 'Fixed', value: 200, taxable: false, active: true },
  { id: 'DC03', name: 'TDS (Income Tax)', type: 'Deduction', basis: 'Percentage', value: 0, percentage: 5, taxable: false, active: true },
  { id: 'DC04', name: 'Insurance Premium', type: 'Deduction', basis: 'Fixed', value: 1500, taxable: false, active: true },
]

const SEED_STRUCTURES: SalaryStructure[] = [
  {
    id: 'SS01', name: 'Teaching Staff Structure', description: 'Standard salary structure for teachers',
    applicableTo: 'Teaching', effectiveFrom: '2025-04-01', version: 1,
    components: [...DEFAULT_EARNING_COMPONENTS, ...DEFAULT_DEDUCTION_COMPONENTS],
  },
  {
    id: 'SS02', name: 'Administration Structure', description: 'For office and administrative staff',
    applicableTo: 'Administration', effectiveFrom: '2025-04-01', version: 1,
    components: [...DEFAULT_EARNING_COMPONENTS, ...DEFAULT_DEDUCTION_COMPONENTS],
  },
  {
    id: 'SS03', name: 'Support Staff Structure', description: 'For lab assistants, security, support staff',
    applicableTo: 'Support', effectiveFrom: '2025-04-01', version: 1,
    components: [
      ...DEFAULT_EARNING_COMPONENTS.map((c) => c.id === 'EC05' ? { ...c, value: 1500 } : c),
      ...DEFAULT_DEDUCTION_COMPONENTS,
    ],
  },
  {
    id: 'SS04', name: 'Transport Staff Structure', description: 'For drivers and transport staff',
    applicableTo: 'Transport', effectiveFrom: '2025-04-01', version: 1,
    components: [
      ...DEFAULT_EARNING_COMPONENTS.map((c) => c.id === 'EC05' ? { ...c, value: 1000 } : c),
      ...DEFAULT_DEDUCTION_COMPONENTS,
    ],
  },
]

// ─── Seed Payroll History (frozen snapshots) ─────────────────────────

function currentPeriod(): string {
  const d = new Date()
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

function previousPeriods(): PayrollPeriod[] {
  const months = [
    { month: 'June', year: 2025, period: 'June 2025' },
    { month: 'July', year: 2025, period: 'July 2025' },
    { month: 'August', year: 2025, period: 'August 2025' },
    { month: 'September', year: 2025, period: 'September 2025' },
    { month: 'October', year: 2025, period: 'October 2025' },
    { month: 'November', year: 2025, period: 'November 2025' },
  ]
  return months.map((m, i) => {
    const baseNet = 8240000 + i * 60000
    const baseGross = baseNet + 1100000
    return {
      period: m.period,
      month: m.month === 'June' ? 5 : m.month === 'July' ? 6 : m.month === 'August' ? 7 : m.month === 'September' ? 8 : m.month === 'October' ? 9 : 10,
      year: m.year,
      status: 'Locked' as PayrollStatus,
      employeeCount: SEED_EMPLOYEES.length,
      totalGross: baseGross,
      totalEarnings: baseGross,
      totalDeductions: 1100000 + i * 5000,
      totalAdjustments: 420000,
      totalNetPay: baseNet,
      preparedBy: 'Accountant',
      preparedAt: `${m.year}-${String(m.month === 'June' ? 5 : m.month === 'July' ? 6 : m.month === 'August' ? 7 : m.month === 'September' ? 8 : m.month === 'October' ? 9 : 10).padStart(2, '0')}-25T10:00:00Z`,
      approvedBy: 'Principal',
      approvedAt: `${m.year}-${String(m.month === 'June' ? 5 : m.month === 'July' ? 6 : m.month === 'August' ? 7 : m.month === 'September' ? 8 : m.month === 'October' ? 9 : 10).padStart(2, '0')}-27T14:00:00Z`,
      disbursedBy: 'Principal',
      disbursedAt: `${m.year}-${String(m.month === 'June' ? 5 : m.month === 'July' ? 6 : m.month === 'August' ? 7 : m.month === 'September' ? 8 : m.month === 'October' ? 9 : 10).padStart(2, '0')}-30T11:00:00Z`,
      lockedAt: `${m.year}-${String(m.month === 'June' ? 5 : m.month === 'July' ? 6 : m.month === 'August' ? 7 : m.month === 'September' ? 8 : m.month === 'October' ? 9 : 10).padStart(2, '0')}-30T12:00:00Z`,
    }
  })
}

const SEED_PERIODS = previousPeriods()

// ─── Seed Adjustments ────────────────────────────────────────────────

const SEED_ADJUSTMENTS: Adjustment[] = [
  { id: 'ADJ-001', employeeId: 'T-001', employeeName: 'Dr. Ananya Iyer', type: 'Bonus', amount: 50000, reason: 'Annual Performance Bonus', effectivePeriod: 'December 2025', status: 'Approved', submittedBy: 'Principal', approvedBy: 'Principal', approvedAt: '2025-12-01T10:00:00Z' },
  { id: 'ADJ-002', employeeId: 'T-038', employeeName: 'Pooja Bhatt', type: 'Bonus', amount: 25000, reason: 'Diwali Festival Bonus', effectivePeriod: 'December 2025', status: 'Approved', submittedBy: 'Accountant', approvedBy: 'Principal', approvedAt: '2025-12-05T11:00:00Z' },
  { id: 'ADJ-003', employeeId: 'T-014', employeeName: 'Rohan Mehta', type: 'Reimbursement', amount: 8000, reason: 'Training workshop fee reimbursement', effectivePeriod: 'December 2025', status: 'Pending', submittedBy: 'Rohan Mehta' },
  { id: 'ADJ-004', employeeId: 'T-020', employeeName: 'Deepa Menon', type: 'Advance', amount: 30000, reason: 'Personal salary advance', effectivePeriod: 'December 2025', status: 'Approved', submittedBy: 'Deepa Menon', approvedBy: 'Principal', approvedAt: '2025-12-03T09:00:00Z', installments: 6, recoveredInstallments: 1 },
  { id: 'ADJ-005', employeeId: 'T-035', employeeName: 'Rajesh Khanna', type: 'Arrears', amount: 12000, reason: 'Salary revision arrears (Apr-Nov)', effectivePeriod: 'December 2025', status: 'Approved', submittedBy: 'Accountant', approvedBy: 'Principal', approvedAt: '2025-12-04T15:00:00Z' },
  { id: 'ADJ-006', employeeId: 'T-047', employeeName: 'Sanjay Reddy', type: 'Incentive', amount: 15000, reason: 'Sports event organization incentive', effectivePeriod: 'December 2025', status: 'Pending', submittedBy: 'Vice Principal' },
  { id: 'ADJ-007', employeeId: 'T-041', employeeName: 'Arjun Kapoor', type: 'Reimbursement', amount: 5500, reason: 'Conference travel reimbursement', effectivePeriod: 'December 2025', status: 'Pending', submittedBy: 'Arjun Kapoor' },
]

const SEED_REVISIONS: SalaryRevision[] = [
  { id: 'REV-001', employeeId: 'T-035', employeeName: 'Rajesh Khanna', previousSalary: 88000, newSalary: 92000, effectiveFrom: '2025-04-01', reason: 'Annual increment — excellent performance review', approvedBy: 'Principal', approvedAt: '2025-03-15T11:00:00Z' },
  { id: 'REV-002', employeeId: 'T-038', employeeName: 'Pooja Bhatt', previousSalary: 94000, newSalary: 98000, effectiveFrom: '2025-04-01', reason: 'Annual increment — completed Ph.D.', approvedBy: 'Principal', approvedAt: '2025-03-15T11:30:00Z' },
  { id: 'REV-003', employeeId: 'T-014', employeeName: 'Rohan Mehta', previousSalary: 60000, newSalary: 64000, effectiveFrom: '2025-04-01', reason: 'Annual increment', approvedBy: 'Principal', approvedAt: '2025-03-16T10:00:00Z' },
]

const SEED_AUDIT: PayrollAudit[] = [
  { id: 'PAUD-001', action: 'payroll.locked', actor: 'Principal', timestamp: '2025-11-30T12:00:00Z', entityId: 'November 2025', description: 'November 2025 payroll locked · ₹82.40 L disbursed to 25 employees' },
  { id: 'PAUD-002', action: 'salary.revised', actor: 'Principal', timestamp: '2025-03-15T11:00:00Z', entityId: 'T-035', description: 'Rajesh Khanna salary revised from ₹88,000 → ₹92,000 (effective April 2025)' },
  { id: 'PAUD-003', action: 'adjustment.approved', actor: 'Principal', timestamp: '2025-12-01T10:00:00Z', entityId: 'ADJ-001', description: 'Annual Performance Bonus ₹50,000 approved for Dr. Ananya Iyer' },
  { id: 'PAUD-004', action: 'payslip.generated', actor: 'Accountant', timestamp: '2025-11-30T12:05:00Z', entityId: 'November 2025', description: '25 payslips generated for November 2025 payroll' },
]

// ─── Payroll Calculation Engine ──────────────────────────────────────

export function calculatePayrollForEmployee(employee: Employee, structure: SalaryStructure, adjustments: Adjustment[], workingDays = 30, presentDays = 28, leaveWithoutPay = 0): {
  earnings: Array<{ name: string; amount: number }>
  deductions: Array<{ name: string; amount: number }>
  gross: number
  totalDeductions: number
  totalAdjustments: number
  netPay: number
} {
  const baseSalary = employee.salary

  // Compute earnings based on structure components.
  const earnings = structure.components
    .filter((c) => c.type === 'Earning' && c.active)
    .map((c) => {
      let amount: number
      if (c.basis === 'Percentage') {
        amount = Math.round((baseSalary * (c.percentage ?? 0)) / 100)
      } else {
        amount = c.value
      }
      // LOP deduction applied proportionally
      if (leaveWithoutPay > 0 && workingDays > 0) {
        amount = Math.round(amount * (1 - leaveWithoutPay / workingDays))
      }
      return { name: c.name, amount }
    })

  const gross = earnings.reduce((s, e) => s + e.amount, 0)

  // Compute deductions based on structure components.
  const deductions = structure.components
    .filter((c) => c.type === 'Deduction' && c.active)
    .map((c) => {
      let amount: number
      if (c.basis === 'Percentage') {
        // PF is on Basic, others on Gross
        const base = c.name.includes('PF') || c.name.includes('Provident') ? baseSalary * 0.5 : gross
        amount = Math.round((base * (c.percentage ?? 0)) / 100)
      } else {
        amount = c.value
      }
      return { name: c.name, amount }
    })

  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0)

  // Approved adjustments for this employee for the current period.
  const employeeAdjustments = adjustments.filter(
    (a) => a.employeeId === employee.id && a.status === 'Approved'
  )
  const totalAdjustments = employeeAdjustments.reduce((s, a) => {
    if (a.type === 'Advance' && a.installments) {
      // Recover in monthly installments
      const remaining = a.installments - (a.recoveredInstallments ?? 0)
      if (remaining > 0) return s + Math.round(a.amount / a.installments)
      return s
    }
    return s + a.amount
  }, 0)

  const netPay = Math.max(0, gross - totalDeductions + totalAdjustments)

  return { earnings, deductions, gross, totalDeductions, totalAdjustments, netPay }
}

function getStructureForEmployee(employee: Employee, structures: SalaryStructure[]): SalaryStructure {
  return structures.find((s) => s.applicableTo === employee.employeeType) ??
    structures.find((s) => s.applicableTo === 'All') ??
    structures[0]
}

// ─── Zustand Store ───────────────────────────────────────────────────

interface SalaryState {
  employees: Employee[]
  structures: SalaryStructure[]
  periods: PayrollPeriod[]
  records: PayrollRecord[]
  adjustments: Adjustment[]
  revisions: SalaryRevision[]
  payslips: Payslip[]
  audit: PayrollAudit[]
  currentPeriod: string

  // mutations
  preparePayroll: (period: string, actor: string) => void
  approvePayroll: (period: string, actor: string) => void
  disbursePayroll: (period: string, actor: string) => { success: boolean; paid: number; failed: number; pending: number }
  lockPayroll: (period: string, actor: string) => void
  generatePayslips: (period: string, actor: string) => void
  addAdjustment: (input: Omit<Adjustment, 'id' | 'status'>) => void
  approveAdjustment: (id: string, actor: string) => void
  rejectAdjustment: (id: string, actor: string) => void
  reviseSalary: (input: { employeeId: string; newSalary: number; effectiveFrom: string; reason: string; actor: string }) => void
  addSalaryStructure: (structure: Omit<SalaryStructure, 'id' | 'version'>) => void
  updateSalaryStructure: (id: string, patch: Partial<SalaryStructure>) => void
}

function pushAudit(state: SalaryState, record: Omit<PayrollAudit, 'id' | 'timestamp'>): PayrollAudit[] {
  const audit: PayrollAudit = {
    ...record,
    id: `PAUD-${(state.audit.length + 1).toString().padStart(3, '0')}-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
  }
  return [audit, ...state.audit]
}

export const useSalaryStore = create<SalaryState>((set, get) => ({
  employees: SEED_EMPLOYEES,
  structures: SEED_STRUCTURES,
  periods: SEED_PERIODS,
  records: [],
  adjustments: SEED_ADJUSTMENTS,
  revisions: SEED_REVISIONS,
  payslips: [],
  audit: SEED_AUDIT,
  currentPeriod: currentPeriod(),

  preparePayroll: (period, actor) => {
    const state = get()
    // Check if period already exists; if so, update status.
    const existing = state.periods.find((p) => p.period === period)
    if (existing && (existing.status === 'Locked' || existing.status === 'Paid')) {
      return // Cannot re-prepare locked/paid payroll
    }

    // Calculate payroll for each active employee.
    const newRecords: PayrollRecord[] = state.employees
      .filter((e) => e.status === 'Active' || e.status === 'On Leave')
      .map((e) => {
        const structure = getStructureForEmployee(e, state.structures)
        const calc = calculatePayrollForEmployee(e, structure, state.adjustments)
        const workingDays = 30
        const presentDays = Math.round((e.attendance / 100) * workingDays)
        const leaveWithoutPay = workingDays - presentDays
        return {
          id: `PR-${e.id}-${period}`,
          employeeId: e.id,
          employeeName: e.name,
          designation: e.designation,
          department: e.department,
          period,
          gross: calc.gross,
          earnings: calc.gross,
          deductions: calc.totalDeductions,
          adjustments: calc.totalAdjustments,
          netPay: calc.netPay,
          status: 'Calculated' as PayrollStatus,
          workingDays,
          presentDays,
          leaveWithoutPay,
          bankAccount: e.bankAccount,
          preparedBy: actor,
        }
      })

    const totalGross = newRecords.reduce((s, r) => s + r.gross, 0)
    const totalDeductions = newRecords.reduce((s, r) => s + r.deductions, 0)
    const totalAdjustments = newRecords.reduce((s, r) => s + r.adjustments, 0)
    const totalNetPay = newRecords.reduce((s, r) => s + r.netPay, 0)

    const newPeriod: PayrollPeriod = {
      period,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      status: 'Calculated',
      employeeCount: newRecords.length,
      totalGross,
      totalEarnings: totalGross,
      totalDeductions,
      totalAdjustments,
      totalNetPay,
      preparedBy: actor,
      preparedAt: new Date().toISOString(),
    }

    const periods = existing
      ? state.periods.map((p) => p.period === period ? newPeriod : p)
      : [newPeriod, ...state.periods]

    // Replace records for this period
    const otherRecords = state.records.filter((r) => r.period !== period)
    set({
      periods,
      records: [...newRecords, ...otherRecords],
      audit: pushAudit(state, {
        action: 'payroll.prepared',
        actor,
        entityId: period,
        description: `Payroll prepared for ${period} · ${newRecords.length} employees · ₹${totalNetPay.toLocaleString('en-IN')} net payable`,
      }),
    })
  },

  approvePayroll: (period, actor) => {
    const state = get()
    set({
      periods: state.periods.map((p) => p.period === period ? { ...p, status: 'Approved', approvedBy: actor, approvedAt: new Date().toISOString() } : p),
      records: state.records.map((r) => r.period === period ? { ...r, status: 'Approved', approvedBy: actor } : r),
      audit: pushAudit(state, {
        action: 'payroll.approved',
        actor,
        entityId: period,
        description: `Payroll approved for ${period} by ${actor}`,
      }),
    })
  },

  disbursePayroll: (period, actor) => {
    const state = get()
    const periodRecords = state.records.filter((r) => r.period === period)
    const paid = periodRecords.length
    const failed = 0 // simulate — all succeed for demo
    const pending = 0

    set({
      periods: state.periods.map((p) => p.period === period ? { ...p, status: 'Paid', disbursedBy: actor, disbursedAt: new Date().toISOString() } : p),
      records: state.records.map((r) => r.period === period ? { ...r, status: 'Paid', disbursedBy: actor, paidOn: new Date().toISOString().split('T')[0] } : r),
      audit: pushAudit(state, {
        action: 'payroll.disbursed',
        actor,
        entityId: period,
        description: `Payroll disbursed for ${period} · ${paid} paid, ${failed} failed, ${pending} pending`,
      }),
    })
    return { success: true, paid, failed, pending }
  },

  lockPayroll: (period, actor) => {
    const state = get()
    set({
      periods: state.periods.map((p) => p.period === period ? { ...p, status: 'Locked', lockedAt: new Date().toISOString() } : p),
      records: state.records.map((r) => r.period === period ? { ...r, status: 'Locked' } : r),
      audit: pushAudit(state, {
        action: 'payroll.locked',
        actor,
        entityId: period,
        description: `Payroll locked for ${period} — historical snapshot preserved`,
      }),
    })
  },

  generatePayslips: (period, actor) => {
    const state = get()
    const periodRecords = state.records.filter((r) => r.period === period)
    const newPayslips: Payslip[] = periodRecords.map((r) => {
      const employee = state.employees.find((e) => e.id === r.employeeId)!
      const structure = getStructureForEmployee(employee, state.structures)
      const calc = calculatePayrollForEmployee(employee, structure, state.adjustments)
      return {
        id: `PS-${r.employeeId}-${period.replace(/\s/g, '')}`,
        payrollId: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        designation: r.designation,
        department: r.department,
        period,
        payDate: r.paidOn ?? new Date().toISOString().split('T')[0],
        earnings: calc.earnings,
        deductions: calc.deductions,
        grossEarnings: calc.gross,
        totalDeductions: calc.totalDeductions,
        netPay: calc.netPay,
        bankAccount: r.bankAccount,
        generatedAt: new Date().toISOString(),
      }
    })

    const existingOther = state.payslips.filter((p) => p.period !== period)
    set({
      payslips: [...newPayslips, ...existingOther],
      audit: pushAudit(state, {
        action: 'payslip.generated',
        actor,
        entityId: period,
        description: `${newPayslips.length} payslips generated for ${period}`,
      }),
    })
  },

  addAdjustment: (input) => {
    const state = get()
    const id = `ADJ-${(state.adjustments.length + 1).toString().padStart(3, '0')}`
    const adjustment: Adjustment = { ...input, id, status: 'Pending' }
    set({
      adjustments: [adjustment, ...state.adjustments],
      audit: pushAudit(state, {
        action: 'adjustment.added',
        actor: input.submittedBy,
        entityId: id,
        description: `${input.type} of ₹${input.amount.toLocaleString('en-IN')} added for ${input.employeeName} — ${input.reason}`,
      }),
    })
  },

  approveAdjustment: (id, actor) => {
    const state = get()
    const adj = state.adjustments.find((a) => a.id === id)
    if (!adj) return
    set({
      adjustments: state.adjustments.map((a) => a.id === id ? { ...a, status: 'Approved', approvedBy: actor, approvedAt: new Date().toISOString() } : a),
      audit: pushAudit(state, {
        action: 'adjustment.approved',
        actor,
        entityId: id,
        description: `${adj.type} of ₹${adj.amount.toLocaleString('en-IN')} approved for ${adj.employeeName}`,
      }),
    })
  },

  rejectAdjustment: (id, actor) => {
    const state = get()
    const adj = state.adjustments.find((a) => a.id === id)
    if (!adj) return
    set({
      adjustments: state.adjustments.map((a) => a.id === id ? { ...a, status: 'Rejected', approvedBy: actor, approvedAt: new Date().toISOString() } : a),
      audit: pushAudit(state, {
        action: 'adjustment.rejected',
        actor,
        entityId: id,
        description: `${adj.type} of ₹${adj.amount.toLocaleString('en-IN')} rejected for ${adj.employeeName}`,
      }),
    })
  },

  reviseSalary: (input) => {
    const state = get()
    const employee = state.employees.find((e) => e.id === input.employeeId)
    if (!employee) return
    const revision: SalaryRevision = {
      id: `REV-${(state.revisions.length + 1).toString().padStart(3, '0')}`,
      employeeId: input.employeeId,
      employeeName: employee.name,
      previousSalary: employee.salary,
      newSalary: input.newSalary,
      effectiveFrom: input.effectiveFrom,
      reason: input.reason,
      approvedBy: input.actor,
      approvedAt: new Date().toISOString(),
    }
    set({
      revisions: [revision, ...state.revisions],
      employees: state.employees.map((e) => e.id === input.employeeId ? { ...e, salary: input.newSalary } : e),
      audit: pushAudit(state, {
        action: 'salary.revised',
        actor: input.actor,
        entityId: input.employeeId,
        description: `${employee.name} salary revised from ₹${employee.salary.toLocaleString('en-IN')} → ₹${input.newSalary.toLocaleString('en-IN')} (effective ${input.effectiveFrom})`,
        before: JSON.stringify({ salary: employee.salary }),
        after: JSON.stringify({ salary: input.newSalary }),
      }),
    })
  },

  addSalaryStructure: (structure) => {
    const state = get()
    const id = `SS-${(state.structures.length + 1).toString().padStart(2, '0')}`
    const newStructure: SalaryStructure = { ...structure, id, version: 1 }
    set({
      structures: [...state.structures, newStructure],
      audit: pushAudit(state, {
        action: 'structure.created',
        actor: 'Principal',
        entityId: id,
        description: `Salary structure "${structure.name}" created for ${structure.applicableTo}`,
      }),
    })
  },

  updateSalaryStructure: (id, patch) => {
    const state = get()
    const old = state.structures.find((s) => s.id === id)
    set({
      structures: state.structures.map((s) => s.id === id ? { ...s, ...patch, version: s.version + 1 } : s),
      audit: pushAudit(state, {
        action: 'structure.updated',
        actor: 'Principal',
        entityId: id,
        description: `Salary structure "${old?.name ?? id}" updated (v${(old?.version ?? 0) + 1})`,
        before: old ? JSON.stringify({ applicableTo: old.applicableTo, components: old.components.length }) : undefined,
        after: JSON.stringify(patch),
      }),
    })
  },
}))

// ─── Hook: Salary Analytics ──────────────────────────────────────────

export function useSalaryData() {
  const employees = useSalaryStore((s) => s.employees)
  const structures = useSalaryStore((s) => s.structures)
  const periods = useSalaryStore((s) => s.periods)
  const records = useSalaryStore((s) => s.records)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const revisions = useSalaryStore((s) => s.revisions)
  const payslips = useSalaryStore((s) => s.payslips)
  const audit = useSalaryStore((s) => s.audit)
  const currentPeriod = useSalaryStore((s) => s.currentPeriod)

  return useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'Active' || e.status === 'On Leave')

    // Compute current month payroll by calculating for each active employee.
    const calculatedRecords = activeEmployees.map((e) => {
      const structure = structures.find((s) => s.applicableTo === e.employeeType) ?? structures[0]
      const calc = calculatePayrollForEmployee(e, structure, adjustments)
      return { ...e, ...calc }
    })

    const monthlyPayroll = calculatedRecords.reduce((s, r) => s + r.gross, 0)
    const totalDeductions = calculatedRecords.reduce((s, r) => s + r.totalDeductions, 0)
    const totalAdjustments = calculatedRecords.reduce((s, r) => s + r.totalAdjustments, 0)
    const netPayable = calculatedRecords.reduce((s, r) => s + r.netPay, 0)
    const pendingAdjustments = adjustments.filter((a) => a.status === 'Pending').length
    const pendingApprovals = adjustments.filter((a) => a.status === 'Pending').length

    // Exceptions
    const exceptions: PayrollException[] = []
    activeEmployees.forEach((e) => {
      if (!e.bankAccount) exceptions.push({ employeeId: e.id, employeeName: e.name, type: 'missing_bank', description: 'Bank account details missing', severity: 'critical' })
      if (e.status === 'On Leave') exceptions.push({ employeeId: e.id, employeeName: e.name, type: 'inactive_included', description: 'Employee currently on leave — review inclusion', severity: 'warning' })
    })
    adjustments.filter((a) => a.status === 'Pending').forEach((a) => {
      exceptions.push({ employeeId: a.employeeId, employeeName: a.employeeName, type: 'pending_approval', description: `${a.type} of ₹${a.amount.toLocaleString('en-IN')} pending approval`, severity: 'warning' })
    })

    // Department-wise breakdown
    const deptMap = new Map<string, { count: number; payroll: number }>()
    activeEmployees.forEach((e) => {
      const key = e.department
      if (!deptMap.has(key)) deptMap.set(key, { count: 0, payroll: 0 })
      const row = deptMap.get(key)!
      row.count++
      const structure = structures.find((s) => s.applicableTo === e.employeeType) ?? structures[0]
      const calc = calculatePayrollForEmployee(e, structure, adjustments)
      row.payroll += calc.gross
    })
    const departmentWise = Array.from(deptMap.entries()).map(([dept, v]) => ({ department: dept, ...v })).sort((a, b) => b.payroll - a.payroll)

    // Employee type breakdown
    const typeMap = new Map<EmployeeType, { count: number; payroll: number }>()
    activeEmployees.forEach((e) => {
      const key = e.employeeType
      if (!typeMap.has(key)) typeMap.set(key, { count: 0, payroll: 0 })
      const row = typeMap.get(key)!
      row.count++
      const structure = structures.find((s) => s.applicableTo === e.employeeType) ?? structures[0]
      const calc = calculatePayrollForEmployee(e, structure, adjustments)
      row.payroll += calc.gross
    })
    const employeeTypeBreakdown = Array.from(typeMap.entries()).map(([type, v]) => ({ type, ...v }))

    // Monthly trend (from frozen periods + current calculated)
    const monthly = [
      ...periods.slice(0, 6).map((p) => ({ month: p.period.split(' ')[0].slice(0, 3), amount: p.totalNetPay })),
      { month: currentPeriod.split(' ')[0].slice(0, 3), amount: netPayable },
    ]

    // Earnings vs deductions
    const earningsVsDeductions = [
      { name: 'Net Pay', value: netPayable, color: 'oklch(0.55 0.14 162)' },
      { name: 'Deductions', value: totalDeductions, color: 'oklch(0.62 0.2 25)' },
    ]

    return {
      employees: activeEmployees,
      allEmployees: employees,
      structures,
      periods,
      records,
      adjustments,
      revisions,
      payslips,
      audit,
      currentPeriod,
      analytics: {
        monthlyPayroll,
        netPayable,
        totalDeductions,
        totalAdjustments,
        employeeCount: activeEmployees.length,
        pendingAdjustments,
        pendingApprovals,
        exceptions,
        departmentWise,
        employeeTypeBreakdown,
        monthly,
        earningsVsDeductions,
      },
    }
  }, [employees, structures, periods, records, adjustments, revisions, payslips, audit, currentPeriod])
}

// ─── Re-export formatting ────────────────────────────────────────────
export { formatINR, formatDate } from '@/lib/format'
