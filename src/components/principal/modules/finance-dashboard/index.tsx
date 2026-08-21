'use client'

/**
 * FinanceDashboardModule — Principal's School Financial Control Center.
 *
 * Thin re-export of FinanceShell which orchestrates the 3-tab workspace:
 *   Overview · Statements · Reports
 *
 * All numbers derive from canonical Fee Management + Salary & Payroll + P&L
 * data via useFinanceData() — single source of truth.
 */

export { FinanceShell as FinanceDashboardModule } from './finance-shell'
