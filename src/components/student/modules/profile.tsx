'use client'

/**
 * ProfileModule — the STUDENT's own profile, SIMPLIFIED.
 *
 * Product principle (final simplification pass): a student needs
 * "Who am I? · How am I doing? · Where are my important records?" —
 * NOT a mirrored copy of the Principal's administrative record.
 *
 * Structure:
 *   1. Identity hero (name, class, roll, house, captain badge) + View School ID
 *   2. ONE academic snapshot (attendance / overall / rank / fee status)
 *   3. Three tabs: Personal · Parents · Records
 *   4. A compact "My Responsibility" strip (only while a Captain/Monitor
 *      position is ACTIVE — permission-driven, never hardcoded)
 *
 * The QR/barcode/ID codes moved OUT of the main flow into the dedicated
 * School ID dialog (intentional feature, not profile clutter). Every
 * figure still derives from the canonical stores — no fake numbers.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Phone, Mail, Calendar, Droplet, Heart, Crown, GraduationCap,
  Activity, TrendingUp, IndianRupee, IdCard, Award, Library, Bus,
  ChevronRight, ClipboardList, ShieldCheck, X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useStudentAttendanceStore, computeStats, studentRecords } from '@/lib/store/student-attendance-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { useLibraryStore } from '@/lib/store/library-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { POSITION_DEFS } from '@/lib/student-positions'
import { examResults } from '@/lib/mock/academics'
import { DEMO_STUDENT_ID } from './applications/student'
import { formatDate, formatINR } from '@/lib/format'
import { ACTIVE_SESSION_ID, formatSessionLabel } from '@/lib/academic-session'

const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'parents', label: 'Parents' },
  { key: 'records', label: 'Records' },
] as const
type TabKey = (typeof TABS)[number]['key']

export function ProfileModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  const [idOpen, setIdOpen] = useState(false)

  // ── Canonical identity (one roster, every role — STU-B) ──────────────
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  const allPositions = useStudentsStore((st) => st.studentPositions)

  // Live fee figures — the ONE fee ledger (same derivation as the Fees
  // module: Success transactions for this student).
  const allTxns = useFeeStore((s) => s.transactions)
  const feePaid = useMemo(
    () => allTxns.filter((t) => t.studentId === DEMO_STUDENT_ID && t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0),
    [allTxns],
  )

  // STU-ATT — attendance derives LIVE from the canonical attendance records
  // (the same rows Teacher/Principal write), so a correction anywhere updates
  // the profile snapshot — it can never disagree with the Attendance module.
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
    <div className="space-y-5 sm:space-y-6 max-w-4xl">
      <SectionHeading
        title="My Profile"
        subtitle="Who you are at school"
        icon={<User className="h-5 w-5" />}
      />

      {/* ── Identity hero (compact — one strong identity section) ─────── */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative h-14 sm:h-16 bg-gradient-to-br from-violet-500/90 via-purple-500/80 to-fuchsia-500/60 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-15" />
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-3xl" />
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
              className="relative shrink-0"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl sm:text-2xl font-extrabold border-4 border-background shadow-premium-lg">
                {s.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-background">
                <ShieldCheck className="h-3 w-3" />
              </div>
            </motion.div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight truncate">{s.name}</h2>
                <StatusBadge status="Active" variant="success" dot />
                {positions.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    <Crown className="h-3 w-3" />
                    {POSITION_DEFS[p.key]?.short ?? 'Monitor'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {s.className}-{s.section} · Roll #{s.rollNo} · {s.houseName} House
              </p>
            </div>
            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIdOpen(true)}
              >
                <IdCard className="h-4 w-4" /> View School ID
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Academic snapshot (ONE compact card, real data) ───────────── */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-violet-500" /> Academic Snapshot
          </h3>
          <span className="text-[11px] text-muted-foreground">{formatSessionLabel(ACTIVE_SESSION_ID)}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x sm:divide-border">
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

      {/* ── Tabs: Personal · Parents · Records ─────────────────────────── */}
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
                activeTab === tab.key
                  ? 'bg-white dark:bg-white/10 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
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
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'personal' && <PersonalTab student={s} />}
        {activeTab === 'parents' && <ParentsTab student={s} />}
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
        <GlassCard className="p-4 border-primary/20">
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {POSITION_DEFS[positions[0].key]?.title ?? 'Class Monitor'} · {positions[0].className}-{positions[0].section}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Since {formatDate(positions[0].assignedOn)} · appointed by {positions[0].assignedByName}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => onNavigate('my-class')}
            >
              Open My Class <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ── School ID (intentional feature, out of the main flow) ─────── */}
      <SchoolIdDialog open={idOpen} onOpenChange={setIdOpen} student={s} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// Building blocks
// ══════════════════════════════════════════════════════════════════════

function SnapshotStat({ label, value, icon, color, bg }: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-2.5 sm:flex-col sm:items-center sm:text-center sm:gap-1 sm:px-2">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', bg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('text-sm font-bold truncate', color)}>{value}</p>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', accent)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate" title={value}>{value}</p>
      </div>
    </div>
  )
}

/** ── Personal: only the genuinely useful personal information ────────── */
function PersonalTab({ student: s }: { student: StudentRecord }) {
  const rows = [
    { label: 'Date of Birth', value: formatDate(s.dob), icon: <Calendar className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Gender', value: s.gender, icon: <User className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { label: 'Blood Group', value: s.bloodGroup, icon: <Droplet className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  ]
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {rows.map((r) => (
          <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} accent={r.accent} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3.5 flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
        These details are school-managed — ask the school office for corrections.
      </p>
    </GlassCard>
  )
}

/** ── Parents & Guardian: polished, privacy-respecting ────────────────── */
function ParentsTab({ student: s }: { student: StudentRecord }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={s.fatherName} size="lg" gradient="from-violet-400 to-purple-500" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Father</p>
            <p className="text-sm font-semibold truncate">{s.fatherName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={s.motherName} size="lg" gradient="from-rose-400 to-pink-500" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Mother</p>
            <p className="text-sm font-semibold truncate">{s.motherName}</p>
          </div>
        </div>
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Guardian Phone" value={s.guardianPhone} accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <InfoRow icon={<Mail className="h-4 w-4" />} label="Guardian Email" value={s.guardianEmail} accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-3.5 flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
        Contact details are shared with you as permitted by the school.
      </p>
    </GlassCard>
  )
}

/** ── Records: only rows whose data actually exists; each deep-links ──── */
function RecordsTab({ student: s, certCount, openIssues, overdueFine, onNavigate }: {
  student: StudentRecord
  certCount: number
  openIssues: number
  overdueFine: number
  onNavigate?: (key: string) => void
}) {
  const rows: {
    key: string
    icon: React.ReactNode
    iconClass: string
    title: string
    value: string
  }[] = []

  // Latest published result (real mock/academics record for this student)
  rows.push({
    key: 'results',
    icon: <ClipboardList className="h-4 w-4" />,
    iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    title: 'Academic Records',
    value: `${examResults.grade} · ${examResults.percentage}% · Rank #${examResults.rank}`,
  })

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
            transition={{ delay: i * 0.05 }}
            disabled={!onNavigate}
            onClick={() => onNavigate?.(r.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
              onNavigate && 'hover:bg-accent/50 cursor-pointer',
            )}
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', r.iconClass)}>
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.value}</p>
            </div>
            {onNavigate && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}

/** ── School ID dialog — the intentional home for QR/ID codes ────────── */
function SchoolIdDialog({ open, onOpenChange, student: s }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentRecord
}) {
  const sessionLabel = formatSessionLabel(ACTIVE_SESSION_ID)
  const school = useSchoolSettingsStore((st) => st.general)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">School ID Card</DialogTitle>
        <DialogDescription className="sr-only">
          Your {school.schoolName} student identity card.
        </DialogDescription>
        <div className="relative rounded-2xl border border-border bg-card shadow-premium-lg overflow-hidden">
          {/* Card header — school identity */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-extrabold backdrop-blur">
                  {school.logoText}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold truncate">{school.schoolName}</p>
                  <p className="text-[10px] text-violet-100 tracking-wider uppercase">Student Identity Card</p>
                </div>
              </div>
              <StatusBadge status="Active" variant="success" dot />
            </div>
          </div>

          {/* Student block */}
          <div className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl font-extrabold border-2 border-border/60">
                {s.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-bold truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.className}-{s.section} · Roll #{s.rollNo}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sessionLabel}</p>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Admission No', value: s.admissionNo },
                { label: 'House', value: `${s.houseName}` },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-border bg-card/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                  <p className="text-sm font-semibold font-mono truncate">{f.value}</p>
                </div>
              ))}
            </div>

            {/* QR — scan to verify in Scholario */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold">Scan to verify</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Presents this card in the Scholario system.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-white p-1.5 shrink-0">
                <QRCodeSVG value={`SCHOLARIO:STU:${s.id}`} size={56} level="M" marginSize={1} />
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-3.5 w-3.5" /> Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
