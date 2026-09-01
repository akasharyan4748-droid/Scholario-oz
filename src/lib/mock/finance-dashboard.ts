// Finance dashboard — P&L, balance sheet, cashflow

export interface PnLItem {
  id: string
  category: string
  account: string
  amount: number
  type: 'income' | 'expense'
  yoyChange: number
}

export const pnlData: PnLItem[] = [
  // Income
  { id: 'P01', category: 'Tuition Fees', account: 'Annual Tuition Collection', amount: 98600000, type: 'income', yoyChange: 12.4 },
  { id: 'P02', category: 'Transport Fees', account: 'Bus Service Revenue', amount: 28400000, type: 'income', yoyChange: 8.2 },
  { id: 'P03', category: 'Other Fees', account: 'Library, Exam, Activity', amount: 15800000, type: 'income', yoyChange: 5.6 },
  { id: 'P04', category: 'Admissions', account: 'New Admission Fees', amount: 8600000, type: 'income', yoyChange: 18.4 },
  { id: 'P05', category: 'Donations', account: 'Alumni & Parent Contributions', amount: 2840000, type: 'income', yoyChange: 34.2 },
  { id: 'P06', category: 'Miscellaneous', account: 'Events, Canteen, Uniforms', amount: 4200000, type: 'income', yoyChange: -2.1 },
  // Expenses
  { id: 'P07', category: 'Salaries', account: 'Teaching & Admin Staff', amount: 62400000, type: 'expense', yoyChange: 6.8 },
  { id: 'P08', category: 'Infrastructure', account: 'Maintenance, Utilities, Rent', amount: 14200000, type: 'expense', yoyChange: 4.2 },
  { id: 'P09', category: 'Transport Operations', account: 'Fuel, Vehicle Maintenance', amount: 6800000, type: 'expense', yoyChange: 9.1 },
  { id: 'P10', category: 'Academic', account: 'Books, Lab, Stationery', amount: 4800000, type: 'expense', yoyChange: 3.4 },
  { id: 'P11', category: 'Events & Activities', account: 'Annual Day, Sports, Trips', amount: 2400000, type: 'expense', yoyChange: 14.2 },
  { id: 'P12', category: 'Technology', account: 'Software, Hardware, Internet', amount: 3200000, type: 'expense', yoyChange: 22.8 },
  { id: 'P13', category: 'Miscellaneous', account: 'Insurance, Legal, Audit', amount: 1800000, type: 'expense', yoyChange: 1.2 },
]

export interface BalanceSheetItem {
  id: string
  category: string
  account: string
  amount: number
  type: 'asset' | 'liability' | 'equity'
}

export const balanceSheet: BalanceSheetItem[] = [
  // Assets (Current)
  { id: 'B01', category: 'Current Assets', account: 'Cash & Bank Balance', amount: 28400000, type: 'asset' },
  { id: 'B02', category: 'Current Assets', account: 'Fees Receivable', amount: 18400000, type: 'asset' },
  { id: 'B03', category: 'Current Assets', account: 'Prepaid Expenses', amount: 3200000, type: 'asset' },
  // Assets (Fixed)
  { id: 'B04', category: 'Fixed Assets', account: 'Land & Buildings', amount: 142000000, type: 'asset' },
  { id: 'B05', category: 'Fixed Assets', account: 'Furniture & Equipment', amount: 18400000, type: 'asset' },
  { id: 'B06', category: 'Fixed Assets', account: 'Lab & Sports Equipment', amount: 8400000, type: 'asset' },
  { id: 'B07', category: 'Fixed Assets', account: 'Library Books', amount: 4200000, type: 'asset' },
  // Liabilities
  { id: 'B08', category: 'Current Liabilities', account: 'Salary Payable', amount: 8640000, type: 'liability' },
  { id: 'B09', category: 'Current Liabilities', account: 'Vendor Payables', amount: 4800000, type: 'liability' },
  { id: 'B10', category: 'Current Liabilities', account: 'Advance Fees', amount: 12400000, type: 'liability' },
  { id: 'B11', category: 'Long-term Liabilities', account: 'Infrastructure Loan', amount: 32000000, type: 'liability' },
  // Equity
  { id: 'B12', category: 'Equity', account: 'Corpus Fund', amount: 120000000, type: 'equity' },
  { id: 'B13', category: 'Equity', account: 'Accumulated Surplus', amount: 64200000, type: 'equity' },
]

export interface CashflowItem {
  id: string
  activity: 'operating' | 'investing' | 'financing'
  description: string
  inflow: number
  outflow: number
}

export const cashflow: CashflowItem[] = [
  { id: 'C01', activity: 'operating', description: 'Fees Collected', inflow: 142800000, outflow: 0 },
  { id: 'C02', activity: 'operating', description: 'Donations Received', inflow: 2840000, outflow: 0 },
  { id: 'C03', activity: 'operating', description: 'Staff Salaries', inflow: 0, outflow: 62400000 },
  { id: 'C04', activity: 'operating', description: 'Operating Expenses', inflow: 0, outflow: 33200000 },
  { id: 'C05', activity: 'investing', description: 'Lab Equipment Purchase', inflow: 0, outflow: 4200000 },
  { id: 'C06', activity: 'investing', description: 'Smart Classroom Setup', inflow: 0, outflow: 6800000 },
  { id: 'C07', activity: 'financing', description: 'Loan Repayment', inflow: 0, outflow: 4800000 },
  { id: 'C08', activity: 'financing', description: 'Infrastructure Loan Disbursed', inflow: 12000000, outflow: 0 },
]

export const financeStats = {
  totalRevenue: 158420000,
  totalExpenses: 96000000,
  netSurplus: 62420000,
  netSurplusMargin: 39.4,
  totalAssets: 224600000,
  totalLiabilities: 57840000,
  netWorth: 166760000,
  cashOnHand: 28400000,
  monthlyRevenue: [
    { month: 'Jan', revenue: 12800000, expense: 7800000 },
    { month: 'Feb', revenue: 11200000, expense: 8200000 },
    { month: 'Mar', revenue: 18400000, expense: 8400000 },
    { month: 'Apr', revenue: 28400000, expense: 8600000 },
    { month: 'May', revenue: 12600000, expense: 8400000 },
    { month: 'Jun', revenue: 19800000, expense: 8500000 },
    { month: 'Jul', revenue: 24200000, expense: 8600000 },
    { month: 'Aug', revenue: 11600000, expense: 8550000 },
    { month: 'Sep', revenue: 18400000, expense: 8640000 },
    { month: 'Oct', revenue: 22800000, expense: 8680000 },
    { month: 'Nov', revenue: 16400000, expense: 8700000 },
    { month: 'Dec', revenue: 12600000, expense: 8720000 },
  ],
  expenseBreakdown: [
    { name: 'Salaries', value: 62400000, color: 'oklch(0.55 0.14 162)' },
    { name: 'Infrastructure', value: 14200000, color: 'oklch(0.65 0.16 75)' },
    { name: 'Transport', value: 6800000, color: 'oklch(0.6 0.18 300)' },
    { name: 'Academic', value: 4800000, color: 'oklch(0.7 0.15 200)' },
    { name: 'Technology', value: 3200000, color: 'oklch(0.6 0.15 250)' },
    { name: 'Events', value: 2400000, color: 'oklch(0.62 0.2 25)' },
    { name: 'Other', value: 2200000, color: 'oklch(0.5 0.01 160)' },
  ],
  quarterlySurplus: [
    { quarter: 'Q1', surplus: 18200000 },
    { quarter: 'Q2', surplus: 38400000 },
    { quarter: 'Q3', surplus: 24800000 },
    { quarter: 'Q4 (proj)', surplus: 18600000 },
  ],
  // Quarterly revenue vs expense (for grouped bar comparison)
  quarterlyRevExp: [
    { quarter: 'Q1', revenue: 32400000, expense: 14200000 },
    { quarter: 'Q2', revenue: 56800000, expense: 18400000 },
    { quarter: 'Q3', revenue: 43200000, expense: 18400000 },
    { quarter: 'Q4', revenue: 38600000, expense: 18600000 },
  ],
  // Budget vs Actual by category (practical finance tracking)
  budgetVsActual: [
    { category: 'Salaries', budget: 64000000, actual: 62400000 },
    { category: 'Infra', budget: 16000000, actual: 14200000 },
    { category: 'Transport', budget: 7200000, actual: 6800000 },
    { category: 'Academic', budget: 5200000, actual: 4800000 },
    { category: 'Tech', budget: 2800000, actual: 3200000 },
    { category: 'Events', budget: 2000000, actual: 2400000 },
  ],
  // Financial ratios (computed, practical KPIs)
  ratios: {
    currentRatio: 2.84,        // Current Assets / Current Liabilities
    debtToEquity: 0.31,        // Total Liabilities / Total Equity
    surplusMargin: 39.4,       // Net Surplus / Revenue
    operatingEfficiency: 60.6, // Expenses / Revenue
    collectionRate: 88.6,      // Fees collected / total billed
    reserveCoverage: 4.2,      // months of expenses covered by cash on hand
  },
}
