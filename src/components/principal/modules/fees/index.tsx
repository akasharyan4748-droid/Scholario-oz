'use client'

/**
 * FeesModule — Principal Fee Management workspace.
 *
 * This file is a thin re-export of FeesShell. The shell orchestrates
 * the workspace with 5 top-level sections:
 *   Overview · Student Accounts · Fee Structures · Payments · Settings
 *
 * Payments is a unified workspace (Collect → Record → Verify → Track →
 * Receipt) with internal sub-views: Overview / Transactions / Pending
 * Verification + a primary Collect Fee action.
 *
 * All numbers derive from the canonical students store via useFeeData().
 */

export { FeesShell as FeesModule } from './fees-shell'
