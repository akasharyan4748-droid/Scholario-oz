'use client'

/**
 * results/remark — the class teacher's published remark (§18).
 *
 * Real remarks only: when the assessment carries one, it renders as an
 * attributed quote; when it doesn't, the card says so plainly — never a
 * fabricated encouragement line.
 */

import { MessageSquareQuote } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import type { ResultRemark } from '@/lib/store/student-results-store'

export function Remark({ remark }: { remark?: ResultRemark }) {
  return (
    <GlassCard hover={false} className="on-card flex h-full flex-col p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Class Teacher&apos;s Remark</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Published with this result</p>
      </div>

      {remark ? (
        <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
          <MessageSquareQuote className="mb-2 h-4 w-4 shrink-0 text-emerald-600/70 dark:text-emerald-400/70" aria-hidden />
          <blockquote className="text-sm leading-relaxed text-foreground/90">&ldquo;{remark.text}&rdquo;</blockquote>
          <div className="mt-auto flex items-center gap-2.5 pt-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white">
              {remark.by.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{remark.by}</p>
              <p className="truncate text-[11px] text-muted-foreground">{remark.role}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
            No teacher remark has been added for this assessment.
          </p>
        </div>
      )}
    </GlassCard>
  )
}
