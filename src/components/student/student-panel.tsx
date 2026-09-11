'use client'

import { useMemo, useState } from 'react'
import {
  LayoutDashboard, User, CalendarDays, CalendarCheck, BookOpen, Award,
  IndianRupee, Megaphone, Trophy, Library, Bus, GraduationCap, HeartPulse,
  ClipboardList, ShieldCheck, Crown, MessageCircle, Settings, ScrollText,
} from 'lucide-react'
import { AppShell, type NavGroup } from '@/components/shell/app-shell'
import { StudentDashboard } from './modules/dashboard'
import { ProfileModule } from './modules/profile'
import { AttendanceModule } from './modules/attendance'
import { ClassworkModule } from './modules/classwork'
import { LearningModule } from './modules/learning'
import { NoticesModule } from './modules/notices'
import { ProgressModule } from './modules/progress'
import { WellbeingModule } from './modules/wellbeing'
import { ResultsModule } from './modules/results'
import { FeesModule } from './modules/fees'
import { StudentApplicationsModule } from './modules/applications'
import { MyLibraryModule } from './modules/my-library'
import { MyCertificatesModule } from './modules/my-certificates'
import { TimetableModule } from './modules/timetable'
import { BusTrackingModule } from './modules/bus-tracking'
import { MyClassModule } from './modules/my-class'
import { StudentMessagesModule } from './modules/messages'
import { useUnreadStudentNotificationCount } from './modules/notifications'
import { StudentSettingsModule } from './modules/settings'
import { StudentSubscriptionActivation } from './StudentSubscriptionActivation'
import { getStudentSubscription } from '@/lib/platform-subscription'
import { useStudentsStore } from '@/lib/store/students-store'
import { useStudentMessagingStore, countUnreadConversations } from '@/lib/store/student-messaging-store'
import { POSITION_DEFS } from '@/lib/student-positions'
import { homeworks, assignments } from '@/lib/mock/academics'

/**
 * STUDENT WORKSPACE NAVIGATION (final Student-experience IA).
 *
 * Structure mirrors how a student thinks about their school life:
 *   HOME → who am I, what's happening today
 *   SCHOOL → the official record: timetable, attendance, classwork, results
 *   LEARNING → my growth: learning hub, progress, wellbeing
 *   COMMUNITY → people & announcements: messages, notices
 *   RECORDS → the paperwork: fees, library, certificates, transport,
 *             applications
 *   ACCOUNT → settings
 *
 * Every module is real (no placeholder/dead entries). The Class
 * Leadership group appears ONLY while the student holds an ACTIVE
 * position (permission-derived, never hardcoded).
 *
 * BADGES — real derived counts only, never decorative numbers:
 *   · Classwork — active homework + pending assignments (canonical data)
 *   · Messages  — unread conversations (messaging store)
 *   · Notices   — unread notifications (notification store)
 * No other module has a real "unread/pending count" concept → no badge.
 */
const navGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { key: 'profile', label: 'My Profile', icon: <User className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'School',
    items: [
      { key: 'timetable', label: 'Timetable', icon: <CalendarDays className="h-4.5 w-4.5" /> },
      { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
      { key: 'classwork', label: 'Classwork', icon: <BookOpen className="h-4.5 w-4.5" /> },
      { key: 'results', label: 'Results', icon: <Award className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Learning',
    items: [
      { key: 'learning', label: 'Learning', icon: <GraduationCap className="h-4.5 w-4.5" /> },
      { key: 'progress', label: 'My Progress', icon: <Trophy className="h-4.5 w-4.5" /> },
      { key: 'wellbeing', label: 'My Wellbeing', icon: <HeartPulse className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Community',
    items: [
      { key: 'messages', label: 'Messages', icon: <MessageCircle className="h-4.5 w-4.5" /> },
      { key: 'notices', label: 'Notices', icon: <Megaphone className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Records',
    items: [
      { key: 'fees', label: 'Fees', icon: <IndianRupee className="h-4.5 w-4.5" /> },
      { key: 'my-library', label: 'Library', icon: <Library className="h-4.5 w-4.5" /> },
      { key: 'my-certificates', label: 'Certificates', icon: <ScrollText className="h-4.5 w-4.5" /> },
      { key: 'bus', label: 'Transport', icon: <Bus className="h-4.5 w-4.5" /> },
      { key: 'applications', label: 'Applications', icon: <ClipboardList className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { key: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ],
  },
]

/**
 * Legacy key remap — deep links across the app (dashboard cards, the
 * notification feed, the topbar bell, quick actions) still reference the
 * OLD module keys. One central map keeps every one of them working with
 * the consolidated navigation, and remembers which tab to open.
 */
const LEGACY_MODULE: Record<string, string> = {
  homework: 'classwork',
  assignments: 'classwork',
  resources: 'learning',
  flashcards: 'learning',
  planner: 'learning',
  peer: 'learning',
  achievements: 'progress',
  portfolio: 'progress',
  career: 'progress',
  diary: 'wellbeing',
  wellness: 'wellbeing',
  notifications: 'notices',
  announcements: 'notices',
  calendar: 'notices',
}

/** Deep-link sub-tabs (e.g. dashboard "flashcards" → Learning · Flashcards). */
const LEGACY_TAB: Record<string, string> = {
  homework: 'homework',
  assignments: 'assignments',
  flashcards: 'flashcards',
  announcements: 'announcements',
  calendar: 'calendar',
  resources: 'resources',
  planner: 'planner',
  peer: 'peer',
  achievements: 'achievements',
  portfolio: 'portfolio',
  career: 'career',
  diary: 'diary',
  wellness: 'wellbeing',
  notifications: 'notifications',
}

/** Live badge overrides — derived unread/pending counts (never hardcoded). */
function withLiveBadges(
  items: NavGroup['items'],
  unreadNotifs: number,
  unreadMsgs: number,
  classworkPending: number,
) {
  return items.map((item) => {
    if (item.key === 'notices') return { ...item, badge: unreadNotifs > 0 ? unreadNotifs : undefined }
    if (item.key === 'messages') return { ...item, badge: unreadMsgs > 0 ? unreadMsgs : undefined }
    if (item.key === 'classwork') return { ...item, badge: classworkPending > 0 ? classworkPending : undefined }
    return item
  })
}

export function StudentPanel() {
  const [active, setActive] = useState('dashboard')
  // Deep-link tab target for the consolidated modules (see LEGACY_TAB).
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  // Canonical demo student — one roster backs every role (see students-store v2).
  const studentId = 'STU-58'
  const studentName = 'Aarav Sharma'

  // Live nav badges — ALL derived from real stores/data, zero constants.
  const unreadNotifs = useUnreadStudentNotificationCount()
  const unreadMsgs = useStudentMessagingStore((s) => countUnreadConversations(s.conversations, s.seenAt))
  // Classwork = active homework + pending assignments from the canonical
  // academics dataset (the same source the Classwork module reads).
  const classworkPending = useMemo(
    () =>
      homeworks.filter((h) => h.status === 'Active').length +
      assignments.filter((a) => a.status === 'Pending').length,
    [],
  )

  // Class Captain / Monitor: the nav entry appears ONLY while the student
  // holds an ACTIVE position — derived from the persisted assignment,
  // never hardcoded. Ending the assignment removes it instantly.
  // (Raw array + useMemo — zustand v5 selectors must return stable refs.)
  const student = useStudentsStore((s) => s.students.find((x) => x.id === studentId))
  const allPositions = useStudentsStore((s) => s.studentPositions)
  const activePositions = useMemo(
    () => allPositions.filter((p) => p.active && p.studentId === studentId),
    [allPositions, studentId],
  )
  const myClassGroup: NavGroup[] =
    activePositions.length > 0
      ? [
          {
            label: 'My Class',
            items: [
              {
                key: 'my-class',
                label: POSITION_DEFS[activePositions[0].key]?.short === 'Captain' ? 'Class Leadership' : 'My Responsibility',
                icon: <Crown className="h-4.5 w-4.5" />,
              },
            ],
          },
        ]
      : []
  const groups: NavGroup[] = [
    // Home first, then the (conditional) Class Leadership responsibility —
    // it earns prominence while active and vanishes the moment it ends.
    {
      ...navGroups[0],
      items: withLiveBadges(navGroups[0].items, unreadNotifs, unreadMsgs, classworkPending),
    },
    ...myClassGroup,
    ...navGroups.slice(1).map((g) => ({
      ...g,
      items: withLiveBadges(g.items, unreadNotifs, unreadMsgs, classworkPending),
    })),
  ]

  // Central navigation: resolves legacy keys → consolidated modules and
  // remembers the deep-linked tab. Sidebar clicks pass a plain (new) key
  // and reset the tab target to the module default / last-used tab.
  const navigate = (rawKey: string) => {
    setPendingTab(LEGACY_TAB[rawKey] ?? null)
    setActive(LEGACY_MODULE[rawKey] ?? rawKey)
  }

  const [subRecord, setSubRecord] = useState(() => getStudentSubscription(studentId))
  const [forceFirstLoginFlow, setForceFirstLoginFlow] = useState(false)

  const isSubActive = subRecord.isActive && !forceFirstLoginFlow

  if (!isSubActive) {
    return (
      <StudentSubscriptionActivation
        studentId={studentId}
        studentName={studentName}
        onActivated={() => {
          setSubRecord(getStudentSubscription(studentId))
          setForceFirstLoginFlow(false)
        }}
      />
    )
  }

  return (
    <AppShell
      groups={groups}
      activeKey={active}
      onNavigate={navigate}
      role="student"
      roleLabel={student ? `Student · ${student.className}-${student.section}` : 'Student · Class 2-A'}
    >
      {active === 'dashboard' ? (
        <StudentDashboard onNavigate={navigate} />
      ) : active === 'profile' ? (
        <ProfileModule onNavigate={navigate} />
      ) : active === 'classwork' ? (
        <ClassworkModule initialTab={pendingTab ?? undefined} onTabChange={setPendingTab} />
      ) : active === 'learning' ? (
        <LearningModule initialTab={pendingTab ?? undefined} onTabChange={setPendingTab} />
      ) : active === 'notices' ? (
        <NoticesModule initialTab={pendingTab ?? undefined} onTabChange={setPendingTab} onNavigate={navigate} />
      ) : active === 'progress' ? (
        <ProgressModule initialTab={pendingTab ?? undefined} onTabChange={setPendingTab} />
      ) : active === 'wellbeing' ? (
        <WellbeingModule initialTab={pendingTab ?? undefined} onTabChange={setPendingTab} />
      ) : active === 'my-class' ? (
        <MyClassModule />
      ) : (
        renderStaticModule(active)
      )}
    </AppShell>
  )
}

/** Flat registry for the single-component modules (no props needed). */
const staticModules: Record<string, React.ReactNode> = {
  timetable: <TimetableModule />,
  attendance: <AttendanceModule />,
  results: <ResultsModule />,
  messages: <StudentMessagesModule />,
  settings: <StudentSettingsModule />,
  fees: <FeesModule />,
  'my-library': <MyLibraryModule />,
  'my-certificates': <MyCertificatesModule />,
  applications: <StudentApplicationsModule />,
  bus: <BusTrackingModule />,
}

function renderStaticModule(key: string) {
  const mod = staticModules[key]
  if (mod) return mod
  // Unknown key guard (should not happen — keeps the shell from blanking).
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">This section is not available.</p>
    </div>
  )
}
