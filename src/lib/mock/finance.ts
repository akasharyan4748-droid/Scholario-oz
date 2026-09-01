// Finance: fees, salary, transactions
export interface FeeStructure {
  id: string
  category: string
  className: string
  annual: number
  components: { name: string; amount: number }[]
}

export const feeStructures: FeeStructure[] = [
  { id: 'FS01', category: 'Primary', className: 'Class 1–5', annual: 86000, components: [{ name: 'Tuition', amount: 60000 }, { name: 'Transport', amount: 18000 }, { name: 'Library', amount: 2000 }, { name: 'Exam', amount: 3000 }, { name: 'Activity', amount: 3000 }] },
  { id: 'FS02', category: 'Middle', className: 'Class 6–8', annual: 112000, components: [{ name: 'Tuition', amount: 80000 }, { name: 'Transport', amount: 22000 }, { name: 'Library', amount: 3000 }, { name: 'Exam', amount: 4000 }, { name: 'Activity', amount: 3000 }] },
  { id: 'FS03', category: 'Secondary', className: 'Class 9–10', annual: 148000, components: [{ name: 'Tuition', amount: 108000 }, { name: 'Transport', amount: 26000 }, { name: 'Library', amount: 4000 }, { name: 'Exam', amount: 6000 }, { name: 'Activity', amount: 4000 }] },
  { id: 'FS04', category: 'Senior', className: 'Class 11–12', annual: 184000, components: [{ name: 'Tuition', amount: 136000 }, { name: 'Transport', amount: 28000 }, { name: 'Library', amount: 5000 }, { name: 'Exam', amount: 8000 }, { name: 'Activity', amount: 7000 }] },
  { id: 'FS05', category: 'Pre-Primary', className: 'Nursery–UKG', annual: 68000, components: [{ name: 'Tuition', amount: 48000 }, { name: 'Transport', amount: 16000 }, { name: 'Activity', amount: 4000 }] },
]

export interface FeeTransaction {
  id: string
  receiptNo: string
  studentName: string
  admissionNo: string
  className: string
  amount: number
  mode: 'UPI' | 'Card' | 'Net Banking' | 'Cash' | 'Cheque'
  status: 'Success' | 'Pending' | 'Failed'
  date: string
  purpose: string
}

export const feeTransactions: FeeTransaction[] = [
  { id: 'TXN001', receiptNo: 'RCP-2024-1042', studentName: 'Aarav Sharma', admissionNo: 'GWS2024001', className: 'Class 2-A', amount: 86000, mode: 'UPI', status: 'Success', date: '2024-04-12', purpose: 'Annual Fee — Q1' },
  { id: 'TXN002', receiptNo: 'RCP-2024-1043', studentName: 'Diya Patel', admissionNo: 'GWS2024002', className: 'Class 2-A', amount: 81000, mode: 'Card', status: 'Success', date: '2024-04-12', purpose: 'Annual Fee — Q1 (Scholarship applied)' },
  { id: 'TXN003', receiptNo: 'RCP-2024-1044', studentName: 'Vivaan Reddy', admissionNo: 'GWS2024003', className: 'Class 2-A', amount: 52000, mode: 'Net Banking', status: 'Success', date: '2024-04-15', purpose: 'Partial Payment' },
  { id: 'TXN004', receiptNo: 'RCP-2024-1045', studentName: 'Ananya Singh', admissionNo: 'GWS2024004', className: 'Class 2-A', amount: 86000, mode: 'UPI', status: 'Success', date: '2024-04-10', purpose: 'Annual Fee — Q1' },
  { id: 'TXN005', receiptNo: 'RCP-2024-1046', studentName: 'Reyansh Kumar', admissionNo: 'GWS2024005', className: 'Class 2-A', amount: 20000, mode: 'Cash', status: 'Success', date: '2024-04-18', purpose: 'Partial Payment' },
  { id: 'TXN006', receiptNo: 'RCP-2024-1047', studentName: 'Ishaani Verma', admissionNo: 'GWS2024006', className: 'Class 2-A', amount: 83000, mode: 'Cheque', status: 'Success', date: '2024-04-11', purpose: 'Annual Fee — Q1 (Scholarship applied)' },
  { id: 'TXN007', receiptNo: 'RCP-2024-1048', studentName: 'Kiara Rao', admissionNo: 'GWS2024012', className: 'Class 2-A', amount: 86000, mode: 'UPI', status: 'Success', date: '2024-07-08', purpose: 'Annual Fee — Q2' },
  { id: 'TXN008', receiptNo: 'RCP-2024-1049', studentName: 'Vihaan Agarwal', admissionNo: 'GWS2024013', className: 'Class 2-A', amount: 86000, mode: 'Card', status: 'Success', date: '2024-07-09', purpose: 'Annual Fee — Q2' },
  { id: 'TXN009', receiptNo: 'RCP-2024-1050', studentName: 'Dhruv Joshi', admissionNo: 'GWS2024015', className: 'Class 2-A', amount: 60000, mode: 'Net Banking', status: 'Pending', date: '2024-10-15', purpose: 'Partial Payment — Q3' },
  { id: 'TXN010', receiptNo: 'RCP-2024-1051', studentName: 'Aadhya Menon', admissionNo: 'GWS2024016', className: 'Class 2-A', amount: 86000, mode: 'UPI', status: 'Success', date: '2024-10-12', purpose: 'Annual Fee — Q3' },
]

export const feeAnalytics = {
  totalCollected: 142800000,
  pendingDues: 18400000,
  collectedThisMonth: 18400000,
  pendingCount: 142,
  collectionRate: 88.6,
  monthly: [
    { month: 'Apr', collected: 28400000, pending: 3200000 },
    { month: 'May', collected: 12600000, pending: 4100000 },
    { month: 'Jun', collected: 19800000, pending: 2800000 },
    { month: 'Jul', collected: 24200000, pending: 3600000 },
    { month: 'Aug', collected: 11600000, pending: 4500000 },
    { month: 'Sep', collected: 18400000, pending: 3100000 },
    { month: 'Oct', collected: 22800000, pending: 4200000 },
    { month: 'Nov', collected: 16400000, pending: 3800000 },
    { month: 'Dec', collected: 12600000, pending: 5200000 },
  ],
  byCategory: [
    { name: 'Tuition', value: 98600000, color: 'oklch(0.55 0.14 162)' },
    { name: 'Transport', value: 28400000, color: 'oklch(0.65 0.16 75)' },
    { name: 'Library', value: 4200000, color: 'oklch(0.6 0.18 300)' },
    { name: 'Exam', value: 6800000, color: 'oklch(0.7 0.15 200)' },
    { name: 'Activity', value: 4800000, color: 'oklch(0.62 0.2 25)' },
  ],
}

// Salary
export interface SalaryRecord {
  id: string
  employeeId: string
  name: string
  designation: string
  gross: number
  deductions: number
  net: number
  month: string
  status: 'Paid' | 'Processing' | 'Pending'
  paidOn: string
}

export const salaryRecords: SalaryRecord[] = [
  { id: 'SAL001', employeeId: 'EMP-001', name: 'Dr. Ananya Iyer', designation: 'Principal', gross: 185000, deductions: 24800, net: 160200, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL002', employeeId: 'EMP-014', name: 'Rohan Mehta', designation: 'Senior Teacher', gross: 64000, deductions: 8600, net: 55400, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL003', employeeId: 'EMP-038', name: 'Pooja Bhatt', designation: 'HoD Science', gross: 98000, deductions: 13200, net: 84800, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL004', employeeId: 'EMP-035', name: 'Rajesh Khanna', designation: 'HoD Maths', gross: 92000, deductions: 12400, net: 79600, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL005', employeeId: 'EMP-041', name: 'Arjun Kapoor', designation: 'HoD CS', gross: 88000, deductions: 11800, net: 76200, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL006', employeeId: 'EMP-002', name: 'Priya Nair', designation: 'Senior Teacher', gross: 62000, deductions: 8300, net: 53700, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL007', employeeId: 'EMP-020', name: 'Deepa Menon', designation: 'Senior Teacher', gross: 72000, deductions: 9700, net: 62300, month: 'November 2024', status: 'Paid', paidOn: '2024-11-30' },
  { id: 'SAL008', employeeId: 'EMP-047', name: 'Sanjay Reddy', designation: 'Sports Director', gross: 70000, deductions: 9400, net: 60600, month: 'November 2024', status: 'Processing', paidOn: '—' },
]

export const salaryAnalytics = {
  totalMonthly: 8640000,
  totalAnnual: 103680000,
  bonusGiven: 420000,
  deductionsTotal: 1158000,
  pendingCount: 4,
  monthly: [
    { month: 'Jun', amount: 8240000 },
    { month: 'Jul', amount: 8360000 },
    { month: 'Aug', amount: 8480000 },
    { month: 'Sep', amount: 8560000 },
    { month: 'Oct', amount: 8600000 },
    { month: 'Nov', amount: 8640000 },
  ],
}

export const revenueAnalytics = {
  totalRevenue: 168400000,
  expenses: 96400000,
  netSurplus: 72000000,
  monthly: [
    { month: 'Apr', revenue: 28400000, expense: 8200000 },
    { month: 'May', revenue: 12600000, expense: 8400000 },
    { month: 'Jun', revenue: 19800000, expense: 8300000 },
    { month: 'Jul', revenue: 24200000, expense: 8500000 },
    { month: 'Aug', revenue: 11600000, expense: 8600000 },
    { month: 'Sep', revenue: 18400000, expense: 8550000 },
    { month: 'Oct', revenue: 22800000, expense: 8640000 },
    { month: 'Nov', revenue: 16400000, expense: 8680000 },
  ],
}
