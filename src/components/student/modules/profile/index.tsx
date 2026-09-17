'use client'

/**
 * ProfileModule — the STUDENT's identity center ("Who am I at school?").
 *
 * Page-start discipline (same rule as the Timetable module): the topbar and
 * sidebar already identify this route, so the content begins DIRECTLY with
 * the identity card — never a redundant large "My Profile" heading.
 *
 * Structure (Principal-grade discipline, Student-friendly presentation):
 *   1. Identity card — avatar, name, Active status, class/section/roll,
 *      school email, View School ID action. Restrained wash, NO decorative
 *      banner.
 *   2. Academic snapshot — ONE compact row of real metrics (attendance /
 *      overall / class rank / fee status), same derivation as the modules
 *      that own those figures.
 *   3. Five focused tabs: Overview · Personal · Family · Academic · Records.
 *   4. A compact "My Responsibility" strip (only while a Captain/Monitor
 *      position is ACTIVE — permission-driven, never hardcoded).
 *
 * Every figure derives from the canonical stores — the same data the
 * Principal manages. No fake numbers, no mock imports. The QR/ID codes live
 * inside the dedicated School ID dialog, never the main flow.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Crown, GraduationCap, Activity, TrendingUp, IndianRupee, IdCard,
  ShieldCheck, ChevronRight, Mail,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import { useTeachersStore } from '@/lib/store/teachers-store'
import { useStudentAttendanceStore, computeStats, studentRecords } from '@/lib/store/student-attendance-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { useLibraryStore } from '@/lib/store/library-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useAuth } from '@/lib/store/auth-store'
import { POSITION_DEFS } from '@/lib/student-positions'
import { DEMO_STUDENT_ID } from '../applications/student'
import { formatDate } from '@/lib/format'
import { ACTIVE_SESSION_ID, normalizeSessionId, formatSessionLabel } from '@/lib/academic-session'
import { OverviewTab, PersonalTab, FamilyTab, AcademicTab, RecordsTab } from './profile-tabs'
import { SchoolIdDialog } from './school-id-dialog'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal' },
  { key: 'family', label: 'Family' },
  { key: 'academic', label: 'Academic' },
  { key: 'records', label: 'Records' },
] as const
type TabKey = (typeof TABS)[number]['key']

export function ProfileModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [idOpen, setIdOpen] = useState(false)

  // ── Canonical identity (one roster, every role — STU-58) ──────────────
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  const allPositions = useStudentsStore((st) => st.studentPositions)
  const classes = useStudentsStore((st) => st.classes)
  const teachers = useTeachersStore((st) => st.teachers)

  // School email — the student's own login identity.
  const schoolEmail = useAuth((s) => (s.user?.role === 'student' ? s.user.email : null))

  // ── Session — school settings decide, never a hardcoded year ──────────
  const rawSession = useSchoolSettingsStore((s) => s.academics?.currentSession)
  const sessionLabel = formatSessionLabel(normalizeSessionId(rawSession) ?? ACTIVE_SESSION_ID)

  // ── Class teacher — derived from the class/section records the
  //    Principal manages (section override → class default) ─────────────
  const classTeacherName = useMemo(() => {
    if (!student) return null
    const klass = classes.find((c) => c.id === student.classId)
    const section = klass?.sections.find((sec) => sec.name === student.section)
    const tid = section?.classTeacherId ?? klass?.classTeacherId
    return teachers.find((t) => t.id === tid)?.name ?? null
  }, [student, classes, teachers])

  // Live fee figures — the ONE fee ledger (Success transactions for this
  // student; same derivation as the Fees module).
  const allTxns = useFeeStore((s) => s.transactions)
  const feePaid = useMemo(
    () => allTxns.filter((t) => t.studentId === DEMO_STUDENT_ID && t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0),
    [allTxns],
  )

  // STU-ATT — attendance derives LIVE from the canonical attendance records
  // (the same rows Teacher/Principal write), so it can never disagree with
  // the Attendance module.
  const allAttendance = useStudentAttendanceStore((s) => s.records)
  const attendancePct = useMemo(
    () => computeStats(studentRecords(allAttendance, DEMO_STUDENT_ID)).percent,
    [allAttendance],
  )

  // Library + certificates — the same stores My Library / My Certificates
  // read (raw array + useMemo — zustand v5 selectors must return stable refs).
  const allIssues = useLibraryStore((s) => s.issues)
  const myIssues = useMemo(
    () => allIssues.filter((i) => i.borrowerId === DEMO_STUDENT_ID),
    [allIssues],
  )
  const allDocs = useCertificatesStore((s) => s.documents)
  const myDocs = useMemo(
    () => allDocs.filter((d) => d.studentId === DEMO_STUDENT_ID || d.admissionNo === 'DSO2024058'),
    [allDocs],
  )

  // Positions held by THIS student — only ACTIVE ones surface.
  const positions = useMemo(
    () => allPositions.filter((p) => p.active && p.studentId === DEMO_STUDENT_ID),
    [allPositions],
  )

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading profile" />
      </div>
    )
  }

  const s = student
  const feePending = Math.max(0, s.feeTotal - feePaid)
  const feeStatus = feePending === 0 ? 'Paid' : feePaid > 0 ? 'Partial' : 'Pending'
  const openIssues = myIssues.filter((i) => i.status === 'Issued' || i.status === 'Overdue')
  const overdueFine = myIssues
    .filter((i) => i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.fine ?? 0), 0)

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-5">
      {/* ── Identity card — one strong identity section, no banner ─────── */}
      <GlassCard className="overflow-hidden p-0">
        {/* Restrained wash — structure echoes the Principal's identity
            header; the violet accent keeps the Student visual identity. */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-violet-500/[0.04] to-transparent" />
          <div className="relative p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="relative shrink-0"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-xl font-extrabold text-white shadow-premium-lg sm:h-20 sm:w-20 sm:text-2xl">
                  {s.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                </div>
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">{s.name}</h2>
                  <StatusBadge status="Active" variant="success" dot />
                  {positions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      <Crown className="h-3 w-3" aria-hidden />
                      {POSITION_DEFS[p.key]?.short ?? 'Monitor'}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.className}-{s.section} · Roll #{s.rollNo}
                </p>
                {schoolEmail && (
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{schoolEmail}</span>
                  </p>
                )}
              </div>
              <div className="hidden shrink-0 sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIdOpen(true)}
                >
                  <IdCard className="h-4 w-4" aria-hidden /> View School ID
                </Button>
              </div>
            </div>
            {/* Mobile placement — keeps the action reachable without crowding */}
            <div className="mt-3 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setIdOpen(true)}
              >
                <IdCard className="h-4 w-4" aria-hidden /> View School ID
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Academic snapshot (ONE compact row, real data) ─────────────── */}
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-violet-500" aria-hidden /> Academic Snapshot
          </h3>
          <span className="text-[11px] text-muted-foreground">{sessionLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border">
          <SnapshotStat
            label="Attendance"
            value={`${attendancePct}%`}
            icon={<Activity className="h-4 w-4" />}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <SnapshotStat
            label="Overall"
            value={`${s.academics.overallPercent}% · ${s.academics.overallGrade}`}
            icon={<GraduationCap className="h-4 w-4" />}
            color="text-violet-600 dark:text-violet-400"
            bg="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <SnapshotStat
            label="Class Rank"
            value={`#${s.academics.rankInClass}`}
            icon={<TrendingUp className="h-4 w-4" />}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <SnapshotStat
            label="Fees"
            value={feeStatus}
            icon={<IndianRupee className="h-4 w-4" />}
            color={feeStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
            bg={feeStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}
          />
        </div>
      </GlassCard>

      {/* ── Tabs: Overview · Personal · Family · Academic · Records ────── */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label="Profile sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                activeTab === tab.key
                  ? 'bg-white text-foreground shadow-sm dark:bg-white/10'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <OverviewTab student={s} classTeacherName={classTeacherName} sessionLabel={sessionLabel} />
        )}
        {activeTab === 'personal' && <PersonalTab student={s} />}
        {activeTab === 'family' && <FamilyTab student={s} />}
        {activeTab === 'academic' && (
          <AcademicTab student={s} classTeacherName={classTeacherName} sessionLabel={sessionLabel} />
        )}
        {activeTab === 'records' && (
          <RecordsTab
            student={s}
            certCount={myDocs.length}
            openIssues={openIssues.length}
            overdueFine={overdueFine}
            onNavigate={onNavigate}
          />
        )}
      </motion.div>

      {/* ── My Responsibility (compact — only while position is ACTIVE) ── */}
      {positions.length > 0 && onNavigate && (
        <GlassCard className="border-primary/20 p-4">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Crown className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {POSITION_DEFS[positions[0].key]?.title ?? 'Class Monitor'} · {positions[0].className}-{positions[0].section}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Since {formatDate(positions[0].assignedOn)} · appointed by {positions[0].assignedByName}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => onNavigate('my-class')}
            >
              Open My Class <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ── School ID (intentional feature, out of the main flow) ─────── */}
      <SchoolIdDialog open={idOpen} onOpenChange={setIdOpen} student={s} />
    </div>
  )
}

/* ─── Snapshot metric — Principal's Metric language, Student accents ─── */

function SnapshotStat({ label, value, icon, color, bg }: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-2.5 sm:flex-col sm:items-center sm:gap-1 sm:px-2 sm:text-center">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', bg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm font-bold', color)}>{value}</p>
      </div>
    </div>
  )
}
