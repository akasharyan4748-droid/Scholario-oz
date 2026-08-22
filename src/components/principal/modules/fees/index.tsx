'use client'

/**
 * FeesModule — Principal Fee Management & Collections workspace.
 *
 * This file is a thin re-export of FeesShell. The shell orchestrates
 * the entire workspace with 9 tabs:
 *   Overview · Collections · Student Accounts · Fee Structures ·
 *   Pending Dues · Transactions · Approvals · Reports · Settings
 *
 * All numbers derive from the canonical students store via useFeeData().
 */

export { FeesShell as FeesModule } from './fees-shell'
