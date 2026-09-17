'use client'

/**
 * Student Profile — tab contents.
 *
 * Five focused tabs (kept deliberately small — the profile is an identity
 * center, NOT a database dump):
 *   Overview  — the most useful identity facts at a glance
 *   Personal  — school-managed personal particulars (read-only)
 *   Family    — parents/guardian, privacy-respecting
 *   Academic  — class context + enrolled subjects + standing
 *   Records   — deep links into the modules that own each record
 *
 * Every value comes from the canonical StudentRecord (the same roster the
 * Principal manages) — no mock imports, no fabricated numbers.
 */

import { motion } from 'framer-motion'
import {
  User, Phone, Mail, Calendar, Droplet, Award, Library, Bus,
  ClipboardList, ShieldCheck, ChevronRight, GraduationCap,
  IdCard, Users, TrendingUp,
} from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { formatDate, formatINR } from '@/lib/format'
import { usePreviousSchool } from '@/lib/previous-school'
import { subjectColor } from '../timetable/subject-colors'

/* ─── Shared primitives ──────────────────────────────────────────────── */

function InfoRow({ icon, label, value, accent, mono }: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', accent ?? 'bg-primary/10 text-primary')}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm font-semibold', mono && 'font-mono')} title={value}>{value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  )
}

function SchoolManagedNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <ShieldCheck className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      {children}
    </p>
  )
}

/* ─── Overview — the most useful facts at a glance ────────────────────── */

export function OverviewTab({ student: s, classTeacherName, sessionLabel }: {
  student: StudentRecord
  classTeacherName: string | null
  sessionLabel: string
}) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5">
        <SectionTitle>At a Glance</SectionTitle>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Class · Section"
            value={`${s.className} · ${s.section}`}
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Roll Number"
            value={`#${s.rollNo}`}
            accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
          <InfoRow
            icon={<Users className="h-4 w-4" />}
            label="Class Teacher"
            value={classTeacherName ?? '—'}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Academic Session"
            value={sessionLabel}
            accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          />
          <InfoRow
            icon={<IdCard className="h-4 w-4" />}
            label="Admission No"
            value={s.admissionNo}
            mono
            accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
        </div>
        <SchoolManagedNote>
          Your identity at school is managed by the school office — ask them for corrections.
        </SchoolManagedNote>
      </GlassCard>

      {s.achievements.length > 0 && (
        <GlassCard className="p-4 sm:p-5">
          <SectionTitle>Achievements</SectionTitle>
          <div className="space-y-2">
            {s.achievements.map((ach, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Award className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{ach.title}</p>
                  <p className="text-[11px] text-muted-foreground">{ach.level} · {formatDate(ach.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

/* ─── Personal — school-managed particulars (read-only) ───────────────── */

export function PersonalTab({ student: s }: { student: StudentRecord }) {
  // Previous School — canonical derivation (see lib/previous-school):
  // external school → the stored name; same-school progression → the
  // school's actual name; no information → the row is omitted entirely
  // (never a fabricated placeholder).
  const previousSchool = usePreviousSchool(s)
  const rows = [
    { label: 'Date of Birth', value: formatDate(s.dob), icon: <Calendar className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Gender', value: s.gender, icon: <User className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { label: 'Blood Group', value: s.bloodGroup, icon: <Droplet className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Admission Date', value: formatDate(s.admissionDate), icon: <Calendar className="h-4 w-4" />, accent: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
    { label: 'Category', value: s.category, icon: <IdCard className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    ...(previousSchool
      ? [{ label: 'Previous School', value: previousSchool, icon: <GraduationCap className="h-4 w-4" />, accent: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' }]
      : []),
  ]
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} accent={r.accent} />
        ))}
      </div>
      <SchoolManagedNote>
        These details are school-managed — ask the school office for corrections.
      </SchoolManagedNote>
    </GlassCard>
  )
}

/* ─── Family — parents & guardian, privacy-respecting ─────────────────── */

export function FamilyTab({ student: s }: { student: StudentRecord }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={s.fatherName} size="lg" gradient="from-violet-400 to-purple-500" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Father</p>
            <p className="truncate text-sm font-semibold">{s.fatherName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={s.motherName} size="lg" gradient="from-rose-400 to-pink-500" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Mother</p>
            <p className="truncate text-sm font-semibold">{s.motherName}</p>
          </div>
        </div>
        <InfoRow
          icon={<User className="h-4 w-4" />}
          label="Primary Guardian"
          value={s.guardianName}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          label="Guardian Phone"
          value={s.guardianPhone}
          accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <div className="sm:col-span-2">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Guardian Email"
            value={s.guardianEmail}
            accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
          />
        </div>
      </div>
      <SchoolManagedNote>
        Contact details are shared with you as permitted by the school.
      </SchoolManagedNote>
    </GlassCard>
  )
}

/* ─── Academic — class context + enrolled subjects + standing ─────────── */

export function AcademicTab({ student: s, classTeacherName, sessionLabel }: {
  student: StudentRecord
  classTeacherName: string | null
  sessionLabel: string
}) {
  return (
    <div className="space-y-4">
      {/* Standing — three quiet stat tiles */}
      <GlassCard className="p-4 sm:p-5">
        <SectionTitle>Academic Standing</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile label="Overall" value={`${s.academics.overallPercent}%`} sub={sessionLabel} accent="text-violet-600 dark:text-violet-400" />
          <StatTile label="Grade" value={s.academics.overallGrade} sub="Current session" accent="text-emerald-600 dark:text-emerald-400" />
          <StatTile label="Class Rank" value={`#${s.academics.rankInClass}`} sub={`${s.className}-${s.section}`} accent="text-amber-600 dark:text-amber-400" />
        </div>
      </GlassCard>

      {/* Class context */}
      <GlassCard className="p-4 sm:p-5">
        <SectionTitle>Class & Session</SectionTitle>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Current Class"
            value={`${s.className} · Section ${s.section}`}
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <InfoRow
            icon={<Users className="h-4 w-4" />}
            label="Class Teacher"
            value={classTeacherName ?? '—'}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Academic Session"
            value={sessionLabel}
            accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          />
        </div>
      </GlassCard>

      {/* Enrolled subjects — identity view of subjects, not the Results page */}
      <GlassCard className="p-4 sm:p-5">
        <SectionTitle>Enrolled Subjects</SectionTitle>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {s.academics.subjects.map((subj) => {
            const sc = subjectColor(subj.name)
            return (
              <div
                key={subj.name}
                className={cn('flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 ring-1', sc.ring)}
                aria-label={`${subj.name}, teacher ${subj.teacher}, grade ${subj.grade}`}
              >
                <span className={cn('h-8 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{subj.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{subj.teacher}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('text-xs font-bold', sc.text)}>{subj.grade}</p>
                  <p className="text-[10px] tabular-nums text-muted-foreground">{subj.percent}%</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TrendingUp className="h-3 w-3 shrink-0 text-primary" aria-hidden />
          Subject-wise performance lives in Results — this is your enrolment summary.
        </p>
      </GlassCard>
    </div>
  )
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('font-display text-lg font-bold', accent)}>{value}</p>
      {sub && <p className="truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ─── Records — only rows whose data actually exists; each deep-links ─── */

export function RecordsTab({ student: s, certCount, openIssues, overdueFine, onNavigate }: {
  student: StudentRecord
  certCount: number
  openIssues: number
  overdueFine: number
  onNavigate?: (key: string) => void
}) {
  // Academic standing summary — derived from the canonical record (the
  // Results module owns the detailed view; this row just deep-links).
  const rows: {
    key: string
    icon: React.ReactNode
    iconClass: string
    title: string
    value: string
  }[] = [
    {
      key: 'results',
      icon: <ClipboardList className="h-4 w-4" />,
      iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      title: 'Academic Records',
      value: `${s.academics.overallGrade} · ${s.academics.overallPercent}% · Rank #${s.academics.rankInClass}`,
    },
  ]

  // Certificates — only if issued
  if (certCount > 0) {
    rows.push({
      key: 'my-certificates',
      icon: <Award className="h-4 w-4" />,
      iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      title: 'Certificates',
      value: `${certCount} issued`,
    })
  }

  // Library — only with real activity
  if (openIssues > 0) {
    rows.push({
      key: 'my-library',
      icon: <Library className="h-4 w-4" />,
      iconClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      title: 'Library',
      value: `${openIssues} book${openIssues === 1 ? '' : 's'} issued${overdueFine > 0 ? ` · ${formatINR(overdueFine)} fine` : ''}`,
    })
  }

  // Transport — only if the student actually opted in
  if (s.transportRoute) {
    rows.push({
      key: 'bus',
      icon: <Bus className="h-4 w-4" />,
      iconClass: 'bg-lime-500/10 text-lime-700 dark:text-lime-400',
      title: 'Transport',
      value: s.transportRoute,
    })
  }

  return (
    <GlassCard className="p-2 sm:p-3">
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <motion.button
            key={r.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            disabled={!onNavigate}
            onClick={() => onNavigate?.(r.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
              'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              onNavigate && 'cursor-pointer hover:bg-accent/50',
            )}
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', r.iconClass)}>
              {r.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">{r.value}</p>
            </div>
            {onNavigate && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}
