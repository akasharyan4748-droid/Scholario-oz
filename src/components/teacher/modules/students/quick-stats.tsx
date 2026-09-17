'use client'

/**
 * students/quick-stats — the four summary cards of the Student Directory.
 *
 * Visual recipe copied from the Marks Entry StatStrip / "My Attendance"
 * benchmark (the documented strongest pages): rounded-xl border p-3 sm:p-4
 * · tinted 500/5 background · hover border 500/40 · tiny uppercase label ·
 * bare Lucide icon top-right · font-display tabular-nums value · one
 * honest context line. No icon chips, no shadows, no sparklines.
 *
 * Every value is calculated from the real roster payload — Students /
 * Avg Attendance / Girls · Boys are scoped to the SELECTED class (the
 * roster on screen), Classes counts ALL classes the teacher is
 * authorized to view. Derived tiles show an em-dash when the underlying
 * records do not exist yet.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, GraduationCap, Users, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DirectoryClass, DirectoryStudent } from './types'

type SummaryTone = 'slate' | 'emerald' | 'violet' | 'sky'

const TONES: Record<SummaryTone, { text: string; bg: string; border: string }> = {
  slate: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-muted/40',
    border: 'border-border hover:border-muted-foreground/30',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-border hover:border-emerald-500/40',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/5',
    border: 'border-border hover:border-violet-500/40',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/5',
    border: 'border-border hover:border-sky-500/40',
  },
}

interface SummaryTile {
  key: string
  label: string
  value: string
  context: string
  icon: typeof Users
  tone: SummaryTone
}

export function QuickStats({
  students,
  activeClass,
  classes,
}: {
  students: DirectoryStudent[]
  activeClass: DirectoryClass | null
  classes: DirectoryClass[]
}) {
  const reduce = useReducedMotion()

  // Avg attendance = mean of the per-student percentages, only over
  // students who actually have attendance records (others are excluded,
  // never counted as 0).
  const withRecords = students.filter((s) => s.attendance.records > 0 && s.attendance.pct != null)
  const avgAttendance =
    withRecords.length > 0
      ? Math.round(withRecords.reduce((sum, s) => sum + (s.attendance.pct ?? 0), 0) / withRecords.length)
      : null
  const girls = students.filter((s) => s.gender?.toUpperCase() === 'FEMALE').length
  const boys = students.filter((s) => s.gender?.toUpperCase() === 'MALE').length
  const unrecordedGender = students.length - girls - boys
  const classTeacherCount = classes.filter((c) => c.isClassTeacher).length

  const tiles: SummaryTile[] = [
    {
      key: 'students',
      label: 'Students',
      value: String(students.length),
      context: activeClass ? activeClass.label : '—',
      icon: Users,
      tone: 'slate',
    },
    {
      key: 'avg-attendance',
      label: 'Avg Attendance',
      value: avgAttendance != null ? `${avgAttendance}%` : '—',
      context:
        avgAttendance != null
          ? `${withRecords.length} with records`
          : 'No attendance recorded yet',
      icon: CalendarCheck,
      tone: 'emerald',
    },
    {
      key: 'girls-boys',
      label: 'Girls · Boys',
      value: `${girls} · ${boys}`,
      context:
        unrecordedGender > 0
          ? `${unrecordedGender} gender unrecorded`
          : `${students.length} in ${activeClass?.label ?? 'class'}`,
      icon: UsersRound,
      tone: 'violet',
    },
    {
      key: 'classes',
      label: 'Classes',
      value: String(classes.length),
      context:
        classTeacherCount > 0
          ? `class teacher of ${classTeacherCount}`
          : 'you are authorized to view',
      icon: GraduationCap,
      tone: 'sky',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile, i) => {
        const tone = TONES[tile.tone]
        const Icon = tile.icon
        const dashed = tile.value === '—'
        return (
          <motion.div
            key={tile.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn('rounded-xl border p-3 sm:p-4', tone.bg, tone.border)}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tile.label}
              </span>
              <Icon className={cn('h-3.5 w-3.5 shrink-0', tone.text)} aria-hidden="true" />
            </div>
            <p
              className={cn(
                'font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl',
                dashed ? 'text-muted-foreground' : tone.text,
              )}
            >
              {tile.value}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">{tile.context}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
