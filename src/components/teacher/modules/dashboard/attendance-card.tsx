'use client'

/**
 * AttendanceCard (TWC-FE-4) — the class-teacher's daily attendance prompt,
 * from today's REAL baseline snapshot per class-teacher class:
 *
 *   • not marked yet → an amber-tinted prompt with a primary "Mark now"
 *     action into the Class Attendance module;
 *   • already marked → a calm emerald line with the actual counts and a
 *     quiet "View" link.
 *
 * Renders nothing at all when the teacher has no class-teacher classes —
 * no fake Class 2-A prompt for a teacher who doesn't have one.
 */

import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import type { AttendanceSnapshot } from './types'

interface AttendanceCardProps {
  attendance: AttendanceSnapshot[]
  onNavigate: (key: string) => void
}

export function AttendanceCard({ attendance, onNavigate }: AttendanceCardProps) {
  if (attendance.length === 0) return null

  return (
    <section aria-label="Today's attendance" className="space-y-2.5">
      {attendance.map((s, i) =>
        s.marked ? (
          <MarkedRow key={s.classId} s={s} i={i} onNavigate={onNavigate} />
        ) : (
          <UnmarkedRow key={s.classId} s={s} i={i} onNavigate={onNavigate} />
        ),
      )}
    </section>
  )
}

function UnmarkedRow({ s, i, onNavigate }: {
  s: AttendanceSnapshot
  i: number
  onNavigate: (key: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.2), ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard
        hover={false}
        className="border-amber-500/30 bg-amber-500/[0.05] p-3.5 sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {s.classLabel} attendance not marked yet
              </p>
              <p className="text-xs text-muted-foreground">
                {s.studentCount} student{s.studentCount === 1 ? '' : 's'} · today&rsquo;s baseline is still open
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigate('attendance')}
            className="h-8 shrink-0 gap-1.5"
          >
            Mark now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function MarkedRow({ s, i, onNavigate }: {
  s: AttendanceSnapshot
  i: number
  onNavigate: (key: string) => void
}) {
  const parts: string[] = [
    `${s.counts.present} present`,
    `${s.counts.absent} absent`,
  ]
  if (s.counts.late > 0) parts.push(`${s.counts.late} late`)
  if (s.counts.leave > 0) parts.push(`${s.counts.leave} on leave`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.2), ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard
        hover={false}
        className="border-emerald-500/25 bg-emerald-500/[0.04] p-3.5 sm:p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" aria-hidden />
            </span>
            <p className="min-w-0 truncate text-sm text-foreground/90">
              <span className="font-semibold">{s.classLabel}</span>
              <span className="text-muted-foreground"> · {parts.join(' · ')}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            View <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  )
}
