'use client'

/**
 * SalaryModule — Principal Salary & Payroll module.
 *
 * Thin re-export of SalaryShell which orchestrates the 8-tab workspace:
 *   Overview · Payroll · Employees · Salary Structures · Adjustments ·
 *   Payslips · History · Reports
 *
 * All payroll data derives from canonical Teacher records + additional
 * admin/support/transport staff via useSalaryData().
 */

export { SalaryShell as SalaryModule } from './salary-shell'
