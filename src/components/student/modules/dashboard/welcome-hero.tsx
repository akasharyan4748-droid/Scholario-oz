'use client'

/**
 * WelcomeHero (SD-3 · PHASE 4) — the dashboard's personal context line.
 *
 * Deliberately REFINED (not the old oversized marketing banner):
 * greeting + name + class/section/roll + the date, with two genuinely
 * useful LIVE facts (attendance %, latest score %) resolved from the
 * server aggregate. Subtle background treatment — a whisper of the
 * institutional green, never a giant decorative gradient.
 */

import { motion } from 'framer-motion'
import { CalendarCheck, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { greeting } from './data'
import type { DashboardData } from './types'

interface HeroProps {
  data: DashboardData
}

export function WelcomeHero({ data }: HeroProps) {
  const s = data.student
  const firstName = (s?.name ?? '').split(' ').slice(0, 1).join(' ') || 'there'
  const att = data.attendance
  const latest = data.academics?.latest

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Welcome"
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs"
    >
      {/* Subtle institutional tint — one whisper of green, nothing louder */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 select-none items-center justify-center overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/10 font-display text-sm font-bold text-emerald-700 dark:text-emerald-400"
          >
            {s?.avatarUrl ? (
              <img src={s.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              firstName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {greeting()} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">
              Hi {firstName}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {s?.classLabel ?? '—'}
              {s?.rollNo ? ` · Roll ${s.rollNo}` : ''}
            </p>
          </div>
        </div>

        {/* Two live facts — no more (PHASE 4: never a wall of statistics) */}
        <div className="flex shrink-0 gap-2.5">
          <Fact
            icon={<CalendarCheck className="h-3.5 w-3.5" aria-hidden />}
            label="Attendance"
            value={att.pct != null ? `${att.pct}%` : '—'}
            tone={att.pct != null && att.pct < 85 ? 'warn' : 'ok'}
          />
          <Fact
            icon={<Award className="h-3.5 w-3.5" aria-hidden />}
            label="Last score"
            value={latest?.pct != null ? `${latest.pct}%` : '—'}
            tone="ok"
          />
        </div>
      </div>
    </motion.section>
  )
}

function Fact({ icon, label, value, tone }: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'ok' | 'warn'
}) {
  return (
    <div
      className={cn(
        'flex min-w-[104px] items-center gap-2.5 rounded-xl border px-3 py-2',
        tone === 'warn'
          ? 'border-amber-500/25 bg-amber-500/[0.06]'
          : 'border-border/80 bg-background/60',
      )}
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tone === 'warn' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
        {icon}
      </span>
      <div>
        <p className="font-display text-base font-bold leading-tight tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
