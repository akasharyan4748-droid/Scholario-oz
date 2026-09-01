'use client'

import { useState } from 'react'
import {
  LayoutDashboard, User, CalendarDays, CalendarCheck, BookOpen,
  ClipboardList, Award, IndianRupee, Megaphone, Trophy, Library, Bus, BookHeart, Layers, FolderHeart, HeartPulse, CalendarClock, Users, Compass, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { AppShell, type NavGroup } from '@/components/shell/app-shell'
import { StudentDashboard } from './modules/dashboard'
import { ProfileModule } from './modules/profile'
import { AttendanceModule } from './modules/attendance'
import { HomeworkModule } from './modules/homework'
import { AssignmentsModule } from './modules/assignments'
import { ResultsModule } from './modules/results'
import { FeesModule } from './modules/fees'
import { StudentApplicationsModule } from './modules/applications'
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
import { StudentSubscriptionActivation } from './StudentSubscriptionActivation'
import { getStudentSubscription } from '@/lib/platform-subscription'
import { Button } from '@/components/ui/button'

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { key: 'profile', label: 'My Profile', icon: <User className="h-4.5 w-4.5" /> },
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
    label: 'Finance & Info',
    items: [
      { key: 'fees', label: 'Fees', icon: <IndianRupee className="h-4.5 w-4.5" />, badge: 1 },
      { key: 'applications', label: 'Applications', icon: <ClipboardList className="h-4.5 w-4.5" /> },
      { key: 'bus', label: 'My Bus', icon: <Bus className="h-4.5 w-4.5" />, badge: 14 },
      { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-4.5 w-4.5" /> },
      { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4.5 w-4.5" /> },
    ],
  },
]

const staticModules: Record<string, React.ReactNode> = {
  profile: <ProfileModule />,
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
  applications: <StudentApplicationsModule />,
  bus: <BusTrackingModule />,
  calendar: <CalendarModule />,
  announcements: <AnnouncementsModule />,
}

export function StudentPanel() {
  const [active, setActive] = useState('dashboard')
  const studentId = 'STU-2024-018'
  const studentName = 'Aarav Sharma'

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
      groups={navGroups}
      activeKey={active}
      onNavigate={setActive}
      role="student"
      roleLabel="Student · Class 2-A"
      quickAction={{
        label: 'My Homework',
        onClick: () => setActive('homework'),
      }}
    >
      {active === 'dashboard' ? <StudentDashboard onNavigate={setActive} /> : staticModules[active]}
    </AppShell>
  )
}
