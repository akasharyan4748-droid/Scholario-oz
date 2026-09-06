'use client'

/**
 * StudentSettingsModule — account settings in stacked cards (not tabs):
 *
 *   a. Profile & Account   — read-only identity (school-managed fields)
 *   b. Notification Prefs  — channel switches (shared notif-prefs store)
 *   c. Appearance          — light/dark theme (shared theme store)
 *   d. Privacy             — leaderboard achievements visibility
 *   e. Security            — change password (POST /api/auth/change-password)
 *   f. Session             — sign out
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Palette, Shield, LockKeyhole, LogOut, Sun, Moon, Check,
  ShieldCheck, Info,
} from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import { useStudentNotifPrefsStore, type StudentNotifPrefs } from '@/lib/store/student-notif-prefs-store'
import { useTheme, type ThemeMode } from '@/lib/store/theme-store'
import { useAuth } from '@/lib/store/auth-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { toast } from 'sonner'

export function StudentSettingsModule() {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Settings"
        subtitle="Your account, notifications, privacy & security"
        icon={<User className="h-5 w-5" />}
      />
      <ProfileSection />
      <NotificationPrefsSection />
      <AppearanceSection />
      <PrivacySection />
      <SecuritySection />
      <SessionSection />
    </div>
  )
}

// ─── a. Profile & Account (read-only) ───────────────────────────────

function ProfileSection() {
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const user = useAuth((s) => s.user)

  if (!student) {
    return (
      <SettingsCard icon={<User className="h-5 w-5" />} title="Profile & Account">
        <p className="text-xs text-muted-foreground">Student record unavailable.</p>
      </SettingsCard>
    )
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Full name', value: student.name },
    { label: 'Admission no', value: student.admissionNo },
    { label: 'Class & section', value: `${student.className} — ${student.section}` },
    { label: 'Roll number', value: student.rollNo },
    { label: 'House', value: student.houseName ?? '—' },
    { label: 'Account email', value: user?.email ?? student.guardianEmail },
  ]

  return (
    <SettingsCard icon={<User className="h-5 w-5" />} title="Profile & Account" subtitle="Your identity on Scholario">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-4">
        <GradientAvatar name={student.name} size="lg" />
        <div className="min-w-0">
          <p className="font-semibold text-sm">{student.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {student.className}-{student.section} · Roll {student.rollNo} · {student.houseName ?? '—'} House
          </p>
          <div className="mt-1.5">
            <StatusBadge status={student.status} variant="success" dot />
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-border bg-card/40 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{r.label}</dt>
            <dd className="text-xs font-medium mt-0.5 break-words">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
        These details are managed by your school office. Contact the office for corrections.
      </p>
    </SettingsCard>
  )
}

// ─── b. Notification Preferences ────────────────────────────────────

const PREF_ROWS: { key: keyof StudentNotifPrefs; label: string; caption: string }[] = [
  { key: 'homework', label: 'Homework reminders', caption: 'Due dates for active homework' },
  { key: 'exams', label: 'Exam alerts', caption: 'Exam schedules & announcements' },
  { key: 'fees', label: 'Fee reminders', caption: 'Pending fee status for the term' },
  { key: 'library', label: 'Library due', caption: 'Overdue books & fines' },
  { key: 'messages', label: 'Messages', caption: 'New messages from teachers' },
  { key: 'announcements', label: 'Announcements', caption: 'School notices & events' },
]

function NotificationPrefsSection() {
  const prefs = useStudentNotifPrefsStore((s) => s.prefs)
  const setPref = useStudentNotifPrefsStore((s) => s.setPref)

  return (
    <SettingsCard icon={<Bell className="h-5 w-5" />} title="Notification Preferences" subtitle="Choose what you get notified about">
      <div className="divide-y divide-border/60">
        {PREF_ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold">{row.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{row.caption}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              onCheckedChange={(v) => setPref(row.key, v)}
              aria-label={`${row.label} notifications`}
            />
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}

// ─── c. Appearance ──────────────────────────────────────────────────

function AppearanceSection() {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.set)
  const hydrated = useTheme((s) => s.hydrated)

  const options: { mode: ThemeMode; label: string; icon: typeof Sun; caption: string }[] = [
    { mode: 'light', label: 'Light', icon: Sun, caption: 'Bright & clean surfaces' },
    { mode: 'dark', label: 'Dark', icon: Moon, caption: 'Easy on the eyes at night' },
  ]

  return (
    <SettingsCard icon={<Palette className="h-5 w-5" />} title="Appearance" subtitle="How Scholario looks for you">
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const active = hydrated && theme === opt.mode
          return (
            <button
              key={opt.mode}
              onClick={() => setTheme(opt.mode)}
              aria-pressed={active}
              className={cn(
                'relative rounded-2xl border p-4 text-left transition-all',
                active ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/40 hover:border-primary/20',
              )}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
              <opt.icon className={cn('h-5 w-5 mb-2', active ? 'text-primary' : 'text-muted-foreground')} />
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.caption}</p>
            </button>
          )
        })}
      </div>
    </SettingsCard>
  )
}

// ─── d. Privacy ─────────────────────────────────────────────────────

function PrivacySection() {
  const showAchievements = useStudentNotifPrefsStore((s) => s.privacy.showAchievements)
  const setShowAchievements = useStudentNotifPrefsStore((s) => s.setShowAchievements)

  return (
    <SettingsCard icon={<Shield className="h-5 w-5" />} title="Privacy" subtitle="What classmates can see">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold">Show my achievements on the class leaderboard</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Controls what classmates see in Achievements
          </p>
        </div>
        <Switch
          checked={showAchievements}
          onCheckedChange={setShowAchievements}
          aria-label="Show my achievements on the class leaderboard"
        />
      </div>
    </SettingsCard>
  )
}

// ─── e. Security — change password ──────────────────────────────────

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill in all three password fields.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) {
        toast.success('Password updated', { description: 'Use your new password next time you sign in.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(j?.error || 'Could not change password — please try again.')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsCard icon={<LockKeyhole className="h-5 w-5" />} title="Security" subtitle="Update your account password">
      <div className="space-y-3 max-w-md">
        <PasswordField
          id="pw-current"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          id="pw-new"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="pw-confirm"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting && <motion.span
              className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin"
              aria-hidden
            />}
            Change password
          </Button>
          <span className="text-[11px] text-muted-foreground">Minimum 6 characters</span>
        </div>
      </div>
    </SettingsCard>
  )
}

function PasswordField({
  id, label, value, onChange, autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  )
}

// ─── f. Session ─────────────────────────────────────────────────────

function SessionSection() {
  const logout = useAuth((s) => s.logout)
  const user = useAuth((s) => s.user)

  return (
    <SettingsCard icon={<ShieldCheck className="h-5 w-5" />} title="Session" subtitle="Sign out of this device">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{user?.name ?? 'Signed in'}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {user?.email ?? '—'} · Student account
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={logout}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </SettingsCard>
  )
}

// ─── Shared card shell ──────────────────────────────────────────────

function SettingsCard({
  icon, title, subtitle, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{title}</h3>
              <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Account</Badge>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children}
      </GlassCard>
    </motion.div>
  )
}
