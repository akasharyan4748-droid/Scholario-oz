'use client'

/**
 * SalaryStructuresSection — configuration of salary components and structures.
 *
 * - Salary Structures cards (per employee type)
 * - Components breakdown (earnings + deductions)
 * - Salary Revisions log
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Layers, IndianRupee, ArrowDownRight, ArrowUpRight, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalaryData } from '@/lib/store/salary-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryEmptyState } from './salary-shared'

const TYPE_COLORS: Record<string, string> = {
  'Teaching': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Administration': 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'Support': 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'Transport': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Finance': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function SalaryStructuresSection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const { structures, revisions, employees } = data

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Structure grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {structures.map((s, i) => {
          const employeesCount = employees.filter((e) => e.employeeType === s.applicableTo).length
          const earnings = s.components.filter((c) => c.type === 'Earning' && c.active)
          const deductions = s.components.filter((c) => c.type === 'Deduction' && c.active)
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-3.5"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground">v{s.version} · effective {formatDate(s.effectiveFrom)}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold', TYPE_COLORS[s.applicableTo] ?? 'bg-muted text-muted-foreground')}>
                  {s.applicableTo}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{s.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                    <ArrowUpRight className="h-2.5 w-2.5" /> Earnings
                  </p>
                  <div className="space-y-0.5">
                    {earnings.map((c) => (
                      <div key={c.id} className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{c.basis === 'Percentage' ? `${c.percentage}%` : formatINR(c.value, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                    <ArrowDownRight className="h-2.5 w-2.5" /> Deductions
                  </p>
                  <div className="space-y-0.5">
                    {deductions.map((c) => (
                      <div key={c.id} className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{c.basis === 'Percentage' ? `${c.percentage}%` : formatINR(c.value, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40 text-[10px]">
                <span className="text-muted-foreground">{employeesCount} employees</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Salary Revisions */}
      <SalaryPanel title="Salary Revisions" subtitle={`${revisions.length} revisions logged`}>
        {revisions.length > 0 ? (
          <div className="space-y-1.5">
            {revisions.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <IndianRupee className="h-3 w-3" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">{r.employeeName}</p>
                  <p className="text-[9px] text-muted-foreground">{r.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] tabular-nums text-muted-foreground">{formatINR(r.previousSalary, true)} → <span className="font-bold text-emerald-600">{formatINR(r.newSalary, true)}</span></p>
                  <p className="text-[9px] text-muted-foreground">effective {formatDate(r.effectiveFrom)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SalaryEmptyState icon={<History className="h-5 w-5" />} title="No salary revisions" description="Revisions will appear here." />
        )}
      </SalaryPanel>
    </div>
  )
}
