import {
  LayoutDashboard, CalendarCheck, BookMarked,
  FileText, Users, BarChart3, Megaphone, CalendarClock,
  Shield, MessageSquareHeart, ClipboardCheck, Wallet, ClipboardList, Settings,
} from 'lucide-react'
import type { NavGroup } from '@/components/shell/app-shell'
import type { TeacherRecord, PositionAssignment } from '@/lib/store/teachers-store'

export interface NavRegistryArgs {
  isRelieved: boolean
  activePermissions: string[]
  /** live server-derived unread parent messages — drives the Parent Connect badge */
  hubUnread?: number
}

export function buildTeacherNavGroups({ isRelieved, activePermissions, hubUnread = 0 }: NavRegistryArgs): NavGroup[] {
  if (isRelieved) {
    return [
      {
        label: 'Restricted Access (Relieved Staff)',
        items: [
          { key: 'profile', label: 'My Profile & Record', icon: <Users className="h-4.5 w-4.5" /> },
          { key: 'payroll', label: 'Payroll & Salary Slips', icon: <FileText className="h-4.5 w-4.5" /> },
          { key: 'fee-management', label: 'My Fee Collections', icon: <BarChart3 className="h-4.5 w-4.5" /> },
        ],
      },
    ]
  }

  const navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
        { key: 'payroll', label: 'My Salary & Payments', icon: <Wallet className="h-4.5 w-4.5" /> },
        { key: 'my-attendance', label: 'My Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
      ],
    },
    {
      label: 'Academics & Teaching',
      items: [
        { key: 'attendance', label: 'Class Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
        { key: 'lesson-planner', label: 'Lesson Planner', icon: <BookMarked className="h-4.5 w-4.5" /> },
        { key: 'marks', label: 'Marks Entry', icon: <FileText className="h-4.5 w-4.5" /> },
        { key: 'proctoring', label: 'Exam Proctoring', icon: <ClipboardCheck className="h-4.5 w-4.5" /> },
        { key: 'students', label: 'Student Directory', icon: <Users className="h-4.5 w-4.5" /> },
      ],
    },
    {
      // Applications & Forms assigned to this teacher (Application / Event In-charge)
      label: 'In-charge Duties',
      items: [
        { key: 'app-reviews', label: 'Application Reviews', icon: <ClipboardList className="h-4.5 w-4.5" /> },
      ],
    },
  ]

  // Add Class Teacher Special Module Group if permitted
  if (activePermissions.includes('view_full_class_profile') || activePermissions.includes('enter_class_attendance')) {
    navGroups.push({
      label: 'Class Teacher Hub',
      items: [
        { key: 'ptm', label: 'PTM Scheduler', icon: <CalendarClock className="h-4.5 w-4.5" /> },
        { key: 'behavior', label: 'Student Behavior', icon: <Shield className="h-4.5 w-4.5" /> },
        { key: 'parent-connect', label: 'Parent Connect', icon: <MessageSquareHeart className="h-4.5 w-4.5" />, badge: hubUnread > 0 ? hubUnread : undefined },
      ],
    })
  }

  // Add Insights
  navGroups.push({
    label: 'Insights & Reviews',
    items: [
      { key: 'analytics', label: 'Performance Analytics', icon: <BarChart3 className="h-4.5 w-4.5" /> },
      { key: 'communication', label: 'Communication Hub', icon: <Megaphone className="h-4.5 w-4.5" /> },
      { key: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ],
  })

  return navGroups
}

export function getPendingAssignments(teacher: TeacherRecord | undefined, isRelieved: boolean): PositionAssignment[] {
  if (!teacher || isRelieved) return []
  return teacher.positions.filter((p) => p.status === 'Pending Acceptance' || p.status === 'Pending Removal')
}
