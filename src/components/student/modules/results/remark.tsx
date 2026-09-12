'use client'

/**
 * results/remark — TEACHER'S FEEDBACK (§6 narrative position, gen 2).
 *
 * The class teacher's published remark as an elegant attributed quote
 * sitting directly on the page: a hairline emerald accent, the words in
 * the foreground, the author beneath. No shell card (§34), no fabricated
 * encouragement — when the assessment carries no remark the section says
 * so quietly.
 */

import { MessageSquareQuote } from 'lucide-react'
import { SectionLabel } from '../../shell/page-header'
import type { ResultRemark } from '@/lib/store/student-results-store'

export function Remark({ remark }: { remark?: ResultRemark }) {
  return (
    <section aria-label="Teacher's feedback" className="flex h-full flex-col">
      <SectionLabel>Teacher&apos;s Feedback</SectionLabel>

      {remark ? (
        <figure className="mt-2.5 flex h-full flex-col rounded-r-lg border-l-2 border-emerald-500/60 bg-emerald-500/[0.045] dark:bg-emerald-500/[0.07] py-3.5 pl-4 pr-3.5">
          <blockquote className="text-sm leading-relaxed text-foreground/90">&ldquo;{remark.text}&rdquo;</blockquote>
          <figcaption className="mt-auto flex items-center gap-2.5 pt-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white" aria-hidden>
              {remark.by.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-foreground">{remark.by}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{remark.role}</span>
            </span>
          </figcaption>
        </figure>
      ) : (
        <div className="mt-2.5 flex flex-1 items-center gap-2.5 rounded-r-lg border-l-2 border-border/70 bg-muted/25 px-4 py-5">
          <MessageSquareQuote className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
          <p className="text-xs text-muted-foreground">No teacher remark was published with this result.</p>
        </div>
      )}
    </section>
  )
}
