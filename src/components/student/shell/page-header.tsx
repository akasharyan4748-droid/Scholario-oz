'use client'

/**
 * StudentPageHeader + SectionLabel — the shared page/section furniture of
 * the second-generation Student experience (brief §32/§48).
 *
 * PAGE HEADER PHILOSOPHY (§5/§32 — non-negotiable):
 *   My Results                          [AY 2026–27] [Class 2-A]
 *   Your academic performance
 *
 * The workspace already knows who the student is — the sidebar carries
 * identity, the header establishes scope ONCE through quiet contextual
 * chips, and the content below never repeats class/section/session text.
 * Class/roll context is exactly one chip, one place, one render.
 *
 * TYPOGRAPHY (§48 — the Timetable scale):
 *   · page title  → strong, bold, tracking-tight
 *   · subtitle    → muted, personal ("Your …"), one line
 *   · section     → SectionLabel: small uppercase tracking + optional hint
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface PageChip {
  label: string
  icon?: LucideIcon
  /** Quiet explanation for hover/tooltip — never rendered inline. */
  title?: string
  /** `primary` tint for the one scope-defining chip (session). */
  tone?: 'default' | 'primary'
}

interface StudentPageHeaderProps {
  title: string
  subtitle: string
  chips?: PageChip[]
}

export function StudentPageHeader({ title, subtitle, chips }: StudentPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.4rem]">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {chips.map((chip) => {
            const Icon = chip.icon
            return (
              <span
                key={chip.label}
                title={chip.title}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                  chip.tone === 'primary'
                    ? 'border-primary/25 bg-primary/[0.07] text-primary'
                    : 'border-border/80 bg-muted/40 text-muted-foreground',
                )}
              >
                {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
                {chip.label}
              </span>
            )
          })}
        </div>
      )}
    </header>
  )
}

interface SectionLabelProps {
  children: React.ReactNode
  /** Right-aligned quiet hint (a count, a scope word) — never a sentence. */
  hint?: React.ReactNode
  className?: string
}

/**
 * SectionLabel — "SUBJECT PERFORMANCE · 6 subjects". Small uppercase
 * contextual label per §48; the hint is factual, never explanatory prose
 * (§33: over-texting audit — "ALL ASSESSMENTS" beats "Across all tests
 * this year").
 */
export function SectionLabel({ children, hint, className }: SectionLabelProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5', className)}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75">{children}</h2>
      {hint != null && <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{hint}</span>}
    </div>
  )
}
