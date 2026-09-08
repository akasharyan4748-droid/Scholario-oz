'use client'

import { useMemo, useState } from 'react'
import {
  LayoutDashboard, User, CalendarDays, CalendarCheck, BookOpen,
  ClipboardList, Award, IndianRupee, Megaphone, Trophy, Library, Bus, BookHeart, Layers, FolderHeart, HeartPulse, CalendarClock, Users, Compass, ShieldCheck, RefreshCw, Crown,
  Bell, MessageCircle, Settings,
} from 'lucide-react'
import { AppShell, type NavGroup, type NavItem } from '@/components/shell/app-shell'
import { StudentDashboard } from './modules/dashboard'
import { ProfileModule } from './modules/profile'
import { AttendanceModule } from './modules/attendance'
import { HomeworkModule } from './modules/homework'
import { AssignmentsModule } from './modules/assignments'
import { ResultsModule } from './modules/results'
import { FeesModule } from './modules/fees'
import { StudentApplicationsModule } from './modules/applications'
import { MyLibraryModule } from './modules/my-library'
import { MyCertificatesModule } from './modules/my-certificates'
import { TimetableModule } from './modules/timetable'
import { CalendarModule } from './modules/calendar'
import { AnnouncementsModule } from './modules/announcements'
import { AchievementsModule } from './modules/achievements'
import { LearningResourcesModule } from './modules/resources'
import { BusTrackingModule } from './modules/bus-tracking'
import { DigitalDiaryModule } from './modules/digital-diary'
import { FlashcardsModule } from './modules/flashcards'
import { PortfolioModule } from './modules/portfolio'
import { WellnessModule } from './modules/wellness'
import { StudyPlannerModule } from './modules/study-planner'
import { PeerCollaborationModule } from './modules/peer-collab'
import { CareerExplorerModule } from './modules/career-explorer'
import { MyClassModule } from './modules/my-class'
import { StudentMessagesModule } from './modules/messages'
import { StudentNotificationsModule, useUnreadStudentNotificationCount } from './modules/notifications'
import { StudentSettingsModule } from './modules/settings'
import { StudentSubscriptionActivation } from './StudentSubscriptionActivation'
import { getStudentSubscription } from '@/lib/platform-subscription'
import { Button } from '@/components/ui/button'
import { useStudentsStore } from '@/lib/store/students-store'
import { useStudentMessagingStore, countUnreadConversations } from '@/lib/store/student-messaging-store'
import { POSITION_DEFS } from '@/lib/student-positions'

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { key: 'profile', label: 'My Profile', icon: <User className="h-4.5 w-4.5" /> },
      { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4.5 w-4.5" /> },
      { key: 'timetable', label: 'Timetable', icon: <CalendarDays className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Learning',
    items: [
      { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
      { key: 'homework', label: 'Homework', icon: <BookOpen className="h-4.5 w-4.5" />, badge: 3 },
      { key: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4.5 w-4.5" />, badge: 2 },
      { key: 'resources', label: 'Learning Hub', icon: <Library className="h-4.5 w-4.5" />, badge: 14 },
      { key: 'flashcards', label: 'Flashcards', icon: <Layers className="h-4.5 w-4.5" />, badge: 12 },
      { key: 'planner', label: 'Study Planner', icon: <CalendarClock className="h-4.5 w-4.5" /> },
      { key: 'peer', label: 'Peer Collaboration', icon: <Users className="h-4.5 w-4.5" />, badge: 4 },
      { key: 'results', label: 'Results', icon: <Award className="h-4.5 w-4.5" /> },
      { key: 'achievements', label: 'Achievements', icon: <Trophy className="h-4.5 w-4.5" />, badge: 6 },
      { key: 'portfolio', label: 'My Portfolio', icon: <FolderHeart className="h-4.5 w-4.5" /> },
      { key: 'career', label: 'Career Explorer', icon: <Compass className="h-4.5 w-4.5" /> },
      { key: 'diary', label: 'My Diary', icon: <BookHeart className="h-4.5 w-4.5" /> },
      { key: 'wellness', label: 'My Wellness', icon: <HeartPulse className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'messages', label: 'Messages', icon: <MessageCircle className="h-4.5 w-4.5" /> },
      { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4.5 w-4.5" /> },
      { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Finance & Info',
    items: [
      { key: 'fees', label: 'Fees', icon: <IndianRupee className="h-4.5 w-4.5" />, badge: 1 },
      { key: 'my-library', label: 'My Library', icon: <Library className="h-4.5 w-4.5" />, badge: 2 },
      { key: 'my-certificates', label: 'My Certificates', icon: <Award className="h-4.5 w-4.5" /> },
      { key: 'applications', label: 'Applications', icon: <ClipboardList className="h-4.5 w-4.5" /> },
      { key: 'bus', label: 'My Bus', icon: <Bus className="h-4.5 w-4.5" />, badge: 14 },
    ],
  },
  {
    label: 'Account',
    items: [
      { key: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ],
  },
]

const staticModules: Record<string, React.ReactNode> = {
  // profile moved to the onNavigate branch — its Quick Actions need the
  // panel's setActive (same pattern as notifications).
  messages: <StudentMessagesModule />,
  settings: <StudentSettingsModule />,
  timetable: <TimetableModule />,
  attendance: <AttendanceModule />,
  homework: <HomeworkModule />,
  assignments: <AssignmentsModule />,
  resources: <LearningResourcesModule />,
  flashcards: <FlashcardsModule />,
  planner: <StudyPlannerModule />,
  peer: <PeerCollaborationModule />,
  results: <ResultsModule />,
  achievements: <AchievementsModule />,
  portfolio: <PortfolioModule />,
  career: <CareerExplorerModule />,
  diary: <DigitalDiaryModule />,
  wellness: <WellnessModule />,
  fees: <FeesModule />,
  'my-library': <MyLibraryModule />,
  'my-certificates': <MyCertificatesModule />,
  applications: <StudentApplicationsModule />,
  bus: <BusTrackingModule />,
  calendar: <CalendarModule />,
  announcements: <AnnouncementsModule />,
}

/** Live badge overrides — derived unread counts for the new modules. */
function withLiveBadges(items: NavItem[], unreadNotifs: number, unreadMsgs: number): NavItem[] {
  return items.map((item) => {
    if (item.key === 'notifications') return { ...item, badge: unreadNotifs > 0 ? unreadNotifs : undefined }
    if (item.key === 'messages') return { ...item, badge: unreadMsgs > 0 ? unreadMsgs : undefined }
    return item
  })
}

export function StudentPanel() {
  const [active, setActive] = useState('dashboard')
  // Canonical demo student — one roster backs every role (see students-store v2).
  const studentId = 'STU-58'
  const studentName = 'Aarav Sharma'

  // Live nav badges — derived (never hardcoded): unread derived
  // notifications + unread teacher conversations.
  const unreadNotifs = useUnreadStudentNotificationCount()
  const unreadMsgs = useStudentMessagingStore((s) => countUnreadConversations(s.conversations, s.seenAt))

  // Class Captain / Monitor (spec §21–§25): the nav entry appears ONLY while
  // the student holds an ACTIVE position — derived from the persisted
  // assignment, never hardcoded. Ending the assignment removes it instantly.
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
    { ...navGroups[0], items: withLiveBadges(navGroups[0].items, unreadNotifs, unreadMsgs) },
    ...myClassGroup,
    ...navGroups.slice(1).map((g) => ({ ...g, items: withLiveBadges(g.items, unreadNotifs, unreadMsgs) })),
  ]

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
      onNavigate={setActive}
      role="student"
      roleLabel={student ? `Student · ${student.className}-${student.section}` : 'Student · Class 2-A'}
      quickAction={{
        label: 'My Homework',
        onClick: () => setActive('homework'),
      }}
    >
      {active === 'dashboard' ? (
        <StudentDashboard onNavigate={setActive} />
      ) : active === 'profile' ? (
        <ProfileModule onNavigate={setActive} />
      ) : active === 'notifications' ? (
        // Needs the panel's setActive for its "View" deep-links (same pattern
        // as the dashboard branch above).
        <StudentNotificationsModule onNavigate={setActive} />
      ) : active === 'my-class' ? (
        <MyClassModule />
      ) : (
        staticModules[active]
      )}
    </AppShell>
  )
}
