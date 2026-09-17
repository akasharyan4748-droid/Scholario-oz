'use client'

/**
 * WelcomeBanner (TWC-FE-4) — the dashboard's personal context line, rebuilt
 * on the server aggregate. The former oversized orange gradient banner (with
 * its hardcoded "Period 3 ongoing" and fake 2-A student count) is gone:
 * a calm GlassCard with a whisper of the house emerald, the teacher's REAL
 * identity + class-teacher line, today's date from the server, two genuinely
 * LIVE facts and a chip per real teaching assignment.
 */

import { motion } from 'framer-motion'
import { CalendarCheck, MessageSquareHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/ui'
import { greeting } from './hooks/use-teacher-dashboard'
import type { TeacherDashboardData } from './types'

interface WelcomeBannerProps {
  data: TeacherDashboardData
}

export function WelcomeBanner({ data }: WelcomeBannerProps) {
  const firstName = (data.teacher.name || '').split(' ').slice(0, 1).join(' ') || 'Teacher'
  const initials = (data.teacher.name || 'T')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const classTeacherLine = data.classTeacherOf
    .map((c) => c.classLabel)
    .join(' · ')
  const dateLabel = new Date(`${data.today.date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Welcome"
    >
      <GlassCard hover={false} className="relative overflow-hidden rounded-2xl">
        {/* Subtle institutional tint — one whisper of emerald, nothing louder */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-500/[0.05] blur-3xl" />

        <div className="relative flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div
                aria-hidden
                className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 font-display text-sm font-bold text-emerald-700 dark:text-emerald-400"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {greeting()} · {dateLabel}
                </p>
                <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">
                  {firstName}
                </h1>
                {classTeacherLine && (
                  <p className="truncate text-xs text-muted-foreground">
                    Class Teacher · {classTeacherLine}
                  </p>
                )}
              </div>
            </div>

            {/* Two live facts — no more (never a wall of statistics) */}
            <div className="flex shrink-0 gap-2.5">
              <Fact
                icon={<CalendarCheck className="h-3.5 w-3.5" aria-hidden />}
                label="Periods today"
                value={String(data.today.periods.length)}
                tone="ok"
              />
              <Fact
                icon={<MessageSquareHeart className="h-3.5 w-3.5" aria-hidden />}
                label="Unread messages"
                value={String(data.hub.unreadMessages)}
                tone={data.hub.unreadMessages > 0 ? 'warn' : 'ok'}
              />
            </div>
          </div>

          {/* Real teaching assignments — one quiet chip each */}
          {data.assignments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.assignments.map((a) => (
                <span
                  key={`${a.classId}-${a.subjectId}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" aria-hidden />
                  <span className="truncate">{a.classLabel} · {a.subjectName}</span>
                  <span className="tabular-nums text-muted-foreground/70">{a.periodsPerWeek}/wk</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
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
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          tone === 'warn'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        )}
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-base font-bold leading-tight tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
