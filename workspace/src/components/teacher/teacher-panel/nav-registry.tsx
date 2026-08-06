import {
  LayoutDashboard, CalendarDays, CalendarCheck, BookOpen, ClipboardList,
  FileText, Users, BarChart3, Megaphone, BookMarked, CalendarClock, Award,
  FolderOpen, Shield, MessageSquareHeart, Heart, ClipboardCheck, Monitor,
  Sparkles,
} from 'lucide-react'
import type { NavGroup } from '@/components/shell/app-shell'
import type { TeacherRecord, PositionAssignment } from '@/lib/store/teachers-store'

export interface NavRegistryArgs {
  isRelieved: boolean
  activePermissions: string[]
}

export function buildTeacherNavGroups({ isRelieved, activePermissions }: NavRegistryArgs): NavGroup[] {
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
        { key: 'timetable', label: 'My Timetable', icon: <CalendarDays className="h-4.5 w-4.5" /> },
        { key: 'classroom', label: 'Classroom Resources', icon: <Monitor className="h-4.5 w-4.5" /> },
      ],
    },
    {
      label: 'Academics & Teaching',
      items: [
        { key: 'attendance', label: 'Class Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" />, badge: 1 },
        { key: 'lesson-planner', label: 'Lesson Planner', icon: <BookMarked className="h-4.5 w-4.5" />, badge: 2 },
        { key: 'homework', label: 'Homework', icon: <BookOpen className="h-4.5 w-4.5" />, badge: 14 },
        { key: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4.5 w-4.5" />, badge: 9 },
        { key: 'marks', label: 'Marks Entry', icon: <FileText className="h-4.5 w-4.5" /> },
        { key: 'proctoring', label: 'Exam Proctoring', icon: <ClipboardCheck className="h-4.5 w-4.5" />, badge: 3 },
        { key: 'students', label: 'Student Directory', icon: <Users className="h-4.5 w-4.5" /> },
        { key: 'resources', label: 'Resource Library', icon: <FolderOpen className="h-4.5 w-4.5" /> },
      ],
    },
  ]

  // Add Class Teacher Special Module Group if permitted
  if (activePermissions.includes('view_full_class_profile') || activePermissions.includes('enter_class_attendance')) {
    navGroups.push({
      label: 'Class Teacher Hub',
      items: [
        { key: 'ptm', label: 'PTM Scheduler', icon: <CalendarClock className="h-4.5 w-4.5" />, badge: 13 },
        { key: 'behavior', label: 'Student Behavior', icon: <Shield className="h-4.5 w-4.5" /> },
        { key: 'parent-connect', label: 'Parent Connect', icon: <MessageSquareHeart className="h-4.5 w-4.5" />, badge: 4 },
        { key: 'mentoring', label: 'Student Mentoring', icon: <Heart className="h-4.5 w-4.5" /> },
      ],
    })
  }

  // Add Administrative / Special Positions Group
  const adminItems: { key: string; label: string; icon: React.ReactNode }[] = []
  if (activePermissions.includes('manage_timetable')) {
    adminItems.push({ key: 'timetable', label: 'Master Timetable Coordinator', icon: <Sparkles className="h-4.5 w-4.5" /> })
  }
  if (activePermissions.includes('manage_school_exams')) {
    adminItems.push({ key: 'proctoring', label: 'Exam Control Center', icon: <ClipboardCheck className="h-4.5 w-4.5" /> })
  }
  if (adminItems.length > 0) {
    navGroups.push({
      label: 'Assigned Special Responsibilities',
      items: adminItems,
    })
  }

  // Add Insights
  navGroups.push({
    label: 'Insights & Reviews',
    items: [
      { key: 'analytics', label: 'Performance Analytics', icon: <BarChart3 className="h-4.5 w-4.5" /> },
      { key: 'communication', label: 'Communication Hub', icon: <Megaphone className="h-4.5 w-4.5" /> },
      { key: 'reviews', label: 'Performance Reviews', icon: <Award className="h-4.5 w-4.5" /> },
    ],
  })

  return navGroups
}

export function getPendingAssignments(teacher: TeacherRecord | undefined, isRelieved: boolean): PositionAssignment[] {
  if (!teacher || isRelieved) return []
  return teacher.positions.filter((p) => p.status === 'Pending Acceptance' || p.status === 'Pending Removal')
}
