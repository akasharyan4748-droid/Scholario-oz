'use client'

/**
 * ProfileModule — the STUDENT's own profile.
 *
 * Structure follows the Principal-side StudentProfilePage (hero card →
 * quick metrics → pill tabs → tab content) so both workspaces feel like
 * ONE Scholario product, while the information architecture stays
 * student-oriented (learning identity, own-class context, read-only
 * school-managed fields). Every figure derives from the canonical
 * students-store record + the connected fee / library / certificates
 * stores — no hardcoded demo numbers (spec §25).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Phone, Mail, MapPin, Calendar, Droplet, Heart, School,
  Bus, BookMarked, GraduationCap, FileText, ShieldCheck, Crown,
  Home, IdCard, Activity, TrendingUp, IndianRupee, Award, Library,
  CalendarClock, CheckCircle2, ClipboardList, Settings, Trophy, BookOpen,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { useLibraryStore } from '@/lib/store/library-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { POSITION_DEFS, type StudentCapability } from '@/lib/student-positions'
import { teachers } from '@/lib/mock/teachers'
import { DEMO_STUDENT_ID } from './applications/student'
import { formatDate, formatINR } from '@/lib/format'
import { ACTIVE_SESSION_ID, formatSessionLabel } from '@/lib/academic-session'
import { StudentIdentityCodes } from '@/components/principal/modules/students/profile/identity-codes'

const STUDENT_EMAIL = 'aarav.sharma@greenwood.edu.in'

const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'parents', label: 'Parents & Guardian' },
  { key: 'address', label: 'Address & Medical' },
  { key: 'academic', label: 'Academic' },
  { key: 'documents', label: 'Documents & Activity' },
] as const
type TabKey = (typeof TABS)[number]['key']

/** Short labels for the scoped capabilities a position grants (spec §13). */
const CAPABILITY_LABELS: Record<StudentCapability, string> = {
  'post-class-updates': 'Class updates',
  'report-issues': 'Report issues',
  'view-class-tasks': 'Responsibility tasks',
  'request-teacher': 'Teacher requests',
  'coordinate-activity': 'Class activity',
  'class-noticeboard': 'Class notice board',
}

export function ProfileModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('personal')

  // ── Canonical identity (one roster, every role — STU-B) ──────────────
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  const allPositions = useStudentsStore((st) => st.studentPositions)
  const houses = useStudentsStore((st) => st.houses)
  const classes = useStudentsStore((st) => st.classes)

  // Live fee figures — the ONE fee ledger (same derivation as the Fees
  // module: Success transactions for this student).
  const allTxns = useFeeStore((s) => s.transactions)
  const feeTxns = useMemo(
    () => allTxns.filter((t) => t.studentId === DEMO_STUDENT_ID),
    [allTxns],
  )
  const feePaid = feeTxns.filter((t) => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)

  // Library — the one library-store issues list for this student.
  const allIssues = useLibraryStore((s) => s.issues)
  const myIssues = useMemo(
    () => allIssues.filter((i) => i.borrowerId === DEMO_STUDENT_ID),
    [allIssues],
  )

  // Certificates — the canonical documents store (same filter as
  // My Certificates).
  const allDocs = useCertificatesStore((s) => s.documents)
  const myDocs = useMemo(
    () => allDocs.filter((d) => d.studentId === DEMO_STUDENT_ID || d.admissionNo === 'DSO2024058'),
    [allDocs],
  )

  // Positions held by THIS student (raw array + filter — zustand v5
  // selectors must return stable refs).
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
  const libraryId = `LIB-${1000 + Number(s.id.replace('STU-', ''))}`
  const feePending = Math.max(0, s.feeTotal - feePaid)
  const feeStatus = feePending === 0 ? 'Paid' : feePaid > 0 ? 'Partial' : 'Pending'
  const feePct = s.feeTotal > 0 ? Math.round((feePaid / s.feeTotal) * 100) : 0
  const sessionLabel = formatSessionLabel(ACTIVE_SESSION_ID)
  const house = houses.find((h) => h.id === s.houseId)
  const cls = classes.find((c) => c.id === s.classId)
  const section = cls?.sections.find((sec) => sec.name === s.section)
  const classTeacher = teachers.find(
    (t) => t.id === (section?.classTeacherId ?? cls?.classTeacherId),
  )
  const openIssues = myIssues.filter((i) => i.status === 'Issued' || i.status === 'Overdue')
  const overdueFine = myIssues
    .filter((i) => i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.fine ?? 0), 0)

  // ── Quick metrics (real data — spec §9) ──────────────────────────────
  const metrics = [
    { icon: <Activity className="h-4 w-4" />, label: 'Attendance', value: `${s.attendance}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { icon: <GraduationCap className="h-4 w-4" />, label: 'Overall', value: `${s.academics.overallPercent}% · ${s.academics.overallGrade}`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { icon: <TrendingUp className="h-4 w-4" />, label: 'Class Rank', value: `#${s.academics.rankInClass}`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { icon: <IndianRupee className="h-4 w-4" />, label: 'Fee Status', value: feeStatus, color: feeStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : feeStatus === 'Partial' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-primary/10 text-primary' },
  ]

  // ── Quick information (only real fields — spec §5) ───────────────────
  const infoCards = [
    { label: 'Admission No', value: s.admissionNo, icon: <FileText className="h-4 w-4" />, color: 'from-violet-400 to-purple-500' },
    { label: 'Roll Number', value: `#${s.rollNo}`, icon: <User className="h-4 w-4" />, color: 'from-amber-400 to-orange-500' },
    { label: 'Library ID', value: libraryId, icon: <BookMarked className="h-4 w-4" />, color: 'from-cyan-400 to-sky-500' },
    { label: 'Class & Section', value: `${s.className}-${s.section}`, icon: <School className="h-4 w-4" />, color: 'from-emerald-400 to-teal-500' },
    { label: 'House', value: s.houseName ?? '—', icon: <Home className="h-4 w-4" />, color: 'from-rose-400 to-pink-500' },
    { label: 'Transport Route', value: s.transportRoute ?? 'Not opted in', icon: <Bus className="h-4 w-4" />, color: 'from-lime-400 to-green-500' },
    { label: 'Academic Session', value: sessionLabel, icon: <CalendarClock className="h-4 w-4" />, color: 'from-fuchsia-400 to-purple-500' },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionHeading
        title="My Profile"
        subtitle="Your identity, academics and school records"
        icon={<User className="h-5 w-5" />}
      />

      {/* ── Profile hero (controlled student gradient — spec §4) ───────── */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative h-24 sm:h-28 bg-gradient-to-br from-violet-500/90 via-purple-500/80 to-fuchsia-500/60 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute left-1/4 -bottom-10 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl" />
        </div>
        <div className="px-4 sm:px-6 pb-5 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
              className="relative shrink-0"
            >
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl sm:text-3xl font-extrabold border-4 border-background shadow-premium-lg">
                {s.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-background">
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
                    {POSITION_DEFS[p.key]?.title ?? p.key} · {p.className}-{p.section}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {s.className}-{s.section}</span>
                <span className="text-border">·</span>
                <span>Roll #{s.rollNo}</span>
                <span className="text-border">·</span>
                <span>{s.houseName} House</span>
                <span className="text-border hidden sm:inline">·</span>
                <span className="hidden sm:flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {STUDENT_EMAIL}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] gap-1"><Home className="h-2.5 w-2.5" /> {s.houseName}</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Droplet className="h-2.5 w-2.5" /> {s.bloodGroup}</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><IdCard className="h-2.5 w-2.5" /> {s.category}</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><CalendarClock className="h-2.5 w-2.5" /> {sessionLabel}</Badge>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Quick metrics (Principal-style 4-up — real data) ───────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card/40 p-3 text-center"
          >
            <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg mb-1.5', m.bg)}>
              {m.icon}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
            <p className={cn('text-sm font-bold mt-0.5 truncate', m.color)}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick information cards (student gradient chips) ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {infoCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
          >
            <GlassCard className="p-3 sm:p-3.5" hover>
              <div className={`flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-white shadow-md mb-2`}>
                {c.icon}
              </div>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="font-display font-bold text-sm mt-0.5 truncate" title={c.value}>{c.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── Tab navigation (Principal pill pattern) ───────────────────── */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label="Profile sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-white dark:bg-white/10 shadow-sm text-foreground rounded-full'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-5xl"
      >
        {activeTab === 'personal' && <PersonalTab student={s} />}
        {activeTab === 'parents' && <ParentsTab student={s} />}
        {activeTab === 'address' && <AddressTab student={s} />}
        {activeTab === 'academic' && (
          <AcademicTab
            student={s}
            classTeacherName={classTeacher?.name}
            house={house}
            feePaid={feePaid}
            feePending={feePending}
            feePct={feePct}
            feeStatus={feeStatus}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            docs={myDocs}
            issues={myIssues}
            openIssues={openIssues.length}
            overdueFine={overdueFine}
            achievements={s.achievements}
            documents={s.documents}
            onNavigate={onNavigate}
          />
        )}
      </motion.div>

      {/* ── Class responsibility (permission-driven — spec §12) ───────── */}
      {positions.length > 0 && <ClassResponsibilitySection positions={positions} />}

      {/* ── Profile actions (student-appropriate only — spec §11) ─────── */}
      {onNavigate && (
        <GlassCard className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'My Certificates', icon: <Award className="h-3.5 w-3.5" />, key: 'my-certificates', desc: `${myDocs.length} issued` },
              { label: 'Academic Records', icon: <ClipboardList className="h-3.5 w-3.5" />, key: 'results', desc: 'Published results' },
              { label: 'My Library', icon: <Library className="h-3.5 w-3.5" />, key: 'my-library', desc: `${openIssues.length} books` },
              { label: 'Account Settings', icon: <Settings className="h-3.5 w-3.5" />, key: 'settings', desc: 'Password & prefs' },
            ].map((a) => (
              <Button
                key={a.key}
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-2.5 px-3 text-xs font-medium"
                onClick={() => onNavigate(a.key)}
              >
                <span className="flex items-center gap-1.5 text-primary">{a.icon}{a.label}</span>
                <span className="text-[10px] font-normal text-muted-foreground">{a.desc}</span>
              </Button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// Tab implementations
// ══════════════════════════════════════════════════════════════════════

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

function TabCard({ title, icon, children, className }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <GlassCard className={cn('p-4 sm:p-5', className)}>
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </GlassCard>
  )
}

function PersonalTab({ student: s }: { student: StudentRecord }) {
  const rows = [
    { label: 'Date of Birth', value: formatDate(s.dob), icon: <Calendar className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Gender', value: s.gender, icon: <User className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { label: 'Blood Group', value: s.bloodGroup, icon: <Droplet className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Admission Date', value: formatDate(s.admissionDate), icon: <Calendar className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Category', value: s.category, icon: <IdCard className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Previous School', value: s.previousSchool, icon: <School className="h-4 w-4" />, accent: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
  ]
  return (
    <div className="space-y-4">
      <TabCard title="Personal Information" icon={<User className="h-4 w-4 text-violet-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rows.map((r) => (
            <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} accent={r.accent} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
          These details are school-managed — request corrections through the school office.
        </p>
      </TabCard>
      <StudentIdentityCodes student={s} />
    </div>
  )
}

function ParentsTab({ student: s }: { student: StudentRecord }) {
  return (
    <div className="space-y-4">
      <TabCard title="Parents & Guardian" icon={<Heart className="h-4 w-4 text-rose-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
            <GradientAvatar name={s.fatherName} size="lg" gradient="from-violet-400 to-purple-500" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Father</p>
              <p className="text-sm font-semibold truncate">{s.fatherName}</p>
              <p className="text-[10px] text-muted-foreground">Primary guardian</p>
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
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
          Contact details are shared with you as permitted by the school.
        </p>
      </TabCard>
    </div>
  )
}

function AddressTab({ student: s }: { student: StudentRecord }) {
  return (
    <div className="space-y-4">
      <TabCard title="Address" icon={<MapPin className="h-4 w-4 text-emerald-500" />}>
        <div className="rounded-xl border border-border bg-card/40 p-3.5">
          <p className="text-sm font-medium leading-relaxed">{s.address}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {s.city}, {s.state}
          </p>
        </div>
      </TabCard>
      <TabCard title="Medical Information" icon={<Heart className="h-4 w-4 text-rose-500" />}>
        <div className="rounded-xl border border-border bg-card/40 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="h-3.5 w-3.5 text-rose-500" />
            <p className="text-[11px] text-muted-foreground">Blood Group</p>
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{s.bloodGroup}</span>
          </div>
          <p className="text-sm font-medium">{s.medical}</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
          Medical records are read-only — contact the school office for updates.
        </p>
      </TabCard>
    </div>
  )
}

function AcademicTab({ student: s, classTeacherName, house, feePaid, feePending, feePct, feeStatus }: {
  student: StudentRecord
  classTeacherName?: string
  house?: { name: string; color: string; motto: string; points: number; competitionWins: number }
  feePaid: number
  feePending: number
  feePct: number
  feeStatus: string
}) {
  return (
    <div className="space-y-4">
      {/* Class context — real class/section/teacher (spec §10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TabCard title="My Class" icon={<School className="h-4 w-4 text-primary" />}>
          <div className="space-y-2.5">
            <InfoRow icon={<School className="h-4 w-4" />} label="Class & Section" value={`${s.className} · Section ${s.section}`} accent="bg-primary/10 text-primary" />
            <InfoRow icon={<User className="h-4 w-4" />} label="Class Teacher" value={classTeacherName ?? '—'} accent="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
            <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Class Rank" value={`#${s.academics.rankInClass} in section`} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          </div>
        </TabCard>
        <TabCard title="My House" icon={<Home className="h-4 w-4 text-rose-500" />}>
          {house ? (
            <div className="rounded-xl border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: house.color }} aria-hidden />
                <p className="font-display text-base font-bold">{house.name} House</p>
              </div>
              <p className="text-xs italic text-muted-foreground mt-1.5">“{house.motto}”</p>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                  <p className="text-sm font-bold text-primary">{house.points.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Competition Wins</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{house.competitionWins}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyNote text="Not assigned to a house yet." />
          )}
        </TabCard>
      </div>

      {/* Fee snapshot — the ONE ledger (spec §9 real data) */}
      <TabCard title="Fee Snapshot" icon={<IndianRupee className="h-4 w-4 text-primary" />}>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] text-muted-foreground">Paid this session</p>
              <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(feePaid)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Pending</p>
              <p className="font-display text-xl font-bold text-rose-600 dark:text-rose-400">{formatINR(feePending)}</p>
            </div>
            <StatusBadge status={feeStatus} variant={feeStatus === 'Paid' ? 'success' : feeStatus === 'Partial' ? 'warning' : 'danger'} dot />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>of {formatINR(s.feeTotal)} total</span>
              <span>{feePct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={feePct} aria-valuemin={0} aria-valuemax={100} aria-label="Fee paid progress">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feePct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
              />
            </div>
          </div>
        </div>
      </TabCard>

      {/* Subject-wise performance — real academics (spec §9) */}
      <TabCard title="Subject Performance" icon={<BookOpen className="h-4 w-4 text-violet-500" />}>
        <div className="space-y-2.5">
          {s.academics.subjects.map((sub, i) => (
            <motion.div
              key={sub.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{sub.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">by {sub.teacher}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={sub.grade} variant={sub.percent >= 90 ? 'success' : 'primary'} />
                  <span className="text-sm font-bold">{sub.percent}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sub.percent}%` }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    sub.percent >= 90
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : sub.percent >= 80
                        ? 'bg-gradient-to-r from-violet-400 to-purple-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500',
                  )}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </TabCard>
    </div>
  )
}

function DocumentsTab({ docs, issues, openIssues, overdueFine, achievements, documents, onNavigate }: {
  docs: { id: string; docType: string; docNumber: string; generatedAt: string; status: string }[]
  issues: { id: string; bookTitle: string; status: string; dueDate: string; fine: number }[]
  openIssues: number
  overdueFine: number
  achievements: { title: string; date: string; level: string }[]
  documents: { id: string; title: string; type: string; uploadedDate: string; verified: boolean }[]
  onNavigate?: (key: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Certificates — the canonical documents store (spec §10) */}
      <TabCard title="My Certificates" icon={<Award className="h-4 w-4 text-amber-500" />}>
        {docs.length === 0 ? (
          <EmptyNote text="No certificates issued yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {docs.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{d.docType}</p>
                  <StatusBadge status={d.status} variant={d.status === 'Issued' || d.status === 'Downloaded' ? 'success' : 'primary'} />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mt-1">{d.docNumber} · {formatDate(d.generatedAt)}</p>
              </div>
            ))}
          </div>
        )}
        {onNavigate && (
          <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={() => onNavigate('my-certificates')}>
            <Award className="h-3.5 w-3.5" /> View & download certificates
          </Button>
        )}
      </TabCard>

      {/* Library — the one library-store (spec §10) */}
      <TabCard title="My Library" icon={<Library className="h-4 w-4 text-cyan-500" />}>
        {issues.length === 0 ? (
          <EmptyNote text="No library activity yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {issues.map((i) => (
              <div key={i.id} className="rounded-xl border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{i.bookTitle}</p>
                  <StatusBadge
                    status={i.status}
                    variant={i.status === 'Issued' ? 'info' : i.status === 'Overdue' ? 'danger' : 'success'}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {i.status === 'Returned' ? 'Returned' : `Due ${formatDate(i.dueDate)}`}
                  {i.status === 'Overdue' && i.fine > 0 && <span className="text-rose-600 dark:text-rose-400 font-medium">· Fine {formatINR(i.fine)}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
        {openIssues > 0 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            {openIssues} book{openIssues === 1 ? '' : 's'} currently issued{overdueFine > 0 ? ` · ${formatINR(overdueFine)} overdue fine` : ''}
          </p>
        )}
      </TabCard>

      {/* Achievements — the student's real records (spec §10) */}
      <TabCard title="My Achievements" icon={<Trophy className="h-4 w-4 text-amber-500" />}>
        {achievements.length === 0 ? (
          <EmptyNote text="No achievements recorded yet." />
        ) : (
          <div className="space-y-2">
            {achievements.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{a.level} · {formatDate(a.date)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </TabCard>

      {/* Verified school records (view-only — spec §6/§11) */}
      <TabCard title="School Records" icon={<FileText className="h-4 w-4 text-slate-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {documents.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', d.verified ? 'text-emerald-500' : 'text-muted-foreground')} />
                <p className="text-xs font-semibold truncate">{d.title}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{d.type} · {formatDate(d.uploadedDate)}</p>
            </div>
          ))}
        </div>
      </TabCard>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/20 p-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

/** Class responsibility card — only while the student holds an ACTIVE
 *  position (Class Captain / Monitor). Derived from the persisted
 *  assignment, never hardcoded (spec §12/§13). */
function ClassResponsibilitySection({ positions }: {
  positions: {
    id: string
    key: keyof typeof POSITION_DEFS
    className: string
    section: string
    assignedOn: string
    assignedByName: string
  }[]
}) {
  return (
    <GlassCard className="p-4 sm:p-5 border-primary/25">
      <h3 className="font-semibold text-sm mb-3.5 flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" /> Class Responsibility
      </h3>
      <div className="space-y-2.5">
        {positions.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5"
          >
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Crown className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {POSITION_DEFS[p.key]?.title ?? p.key} · {p.className}-{p.section}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Since {formatDate(p.assignedOn)} · appointed by {p.assignedByName}
                </p>
              </div>
              <StatusBadge status="Active" variant="success" dot />
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {(POSITION_DEFS[p.key]?.capabilities ?? []).map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {CAPABILITY_LABELS[cap]}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
