'use client'

/**
 * SalaryConfirmationsBanner — employee-side notification shown on the
 * teacher dashboard: payments awaiting receipt confirmation and salary
 * change requests awaiting a decision.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'

import { useSalaryStore } from '@/lib/store/salary-store'
import { fmtDay, moneyMy } from '@/components/principal/modules/salary/salary-shared'

export function SalaryConfirmationsBanner({
  employeeId, onReview,
}: { employeeId: string; onReview: () => void }) {
  const payments = useSalaryStore((s) => s.payments)
  const changeRequests = useSalaryStore((s) => s.changeRequests)
  const pendingPayments = useMemo(
    () => payments.filter((p) => p.employeeId === employeeId && p.status === 'Pending Receipt'),
    [payments, employeeId],
  )
  const pendingRequests = useMemo(
    () => changeRequests.filter((r) => r.employeeId === employeeId && r.status === 'Pending'),
    [changeRequests, employeeId],
  )

  if (pendingPayments.length === 0 && pendingRequests.length === 0) return null

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onReview}
      className="w-full mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-left hover:bg-amber-500/[0.12] transition-colors"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Clock className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        {pendingPayments.length > 0 && (
          <>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              {pendingPayments.length} payment{pendingPayments.length === 1 ? '' : 's'} awaiting your confirmation
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5 truncate">
              {pendingPayments.map((p) => `${moneyMy(p.amount)} · ${p.monthLabel} · ${fmtDay(p.date)}`).join(' · ')}
            </p>
          </>
        )}
        {pendingPayments.length === 0 && pendingRequests.length > 0 && (
          <>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Salary change request awaiting your decision
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5 truncate">
              {pendingRequests.map((r) => `${moneyMy(r.currentNet)} → ${moneyMy(r.proposedNet)}`).join(' · ')}
            </p>
          </>
        )}
      </div>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
        Review <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </motion.button>
  )
}
