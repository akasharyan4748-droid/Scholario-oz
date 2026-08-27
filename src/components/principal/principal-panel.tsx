'use client'

import { useState, useMemo } from 'react'
import {
  LayoutDashboard, UserPlus, GraduationCap, School, CalendarCheck, IndianRupee,
  Wallet, FileText, Megaphone, CalendarDays,
  BookMarked, Bus, Package, Award, Settings, MessageSquare,
  PieChart, Truck, Download, LayoutGrid, Users, Layers, Clock
} from 'lucide-react'
import { AppShell, type NavGroup } from '@/components/shell/app-shell'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { useAdmissionStore } from '@/lib/store/admission-store'


import { PrincipalDashboard } from './modules/dashboard'
import { AdmissionModule } from './modules/admission'
import { TeachersModule } from './modules/teachers'
import { StudentsClassesModule, type UnifiedTab } from './modules/students-classes'
import { TimetableModule } from './modules/timetable'
import { AttendanceModule } from './modules/attendance'
import { FeesModule } from './modules/fees'
import { SalaryModule } from './modules/salary'
import { ExamsModule } from './modules/exams'
// Wave 1 scope: Homework & Assignments are intentionally deferred from the
// Principal role. They will be rebuilt as a connected Teacher → Student →
// Parent → Principal ecosystem in a future phase. Code preserved for reuse.
// import { HomeworkModule } from './modules/homework'
// import { AssignmentsModule } from './modules/assignments'
import { CommunicationModule } from './modules/communication'
import { CalendarModule } from './modules/calendar'
import { LibraryModule } from './modules/library'
import { TransportModule } from './modules/transport'
import { InventoryModule } from './modules/inventory'
import { CertificatesModule } from './modules/certificates'
import { SchoolSettingsModule } from './modules/school-settings'
import { MessagingModule } from './modules/messaging'
import { FinanceDashboardModule } from './modules/finance-dashboard'
import { ProcurementModule } from './modules/procurement'
import { DownloadsModule } from './modules/downloads'

const moduleRegistry: Record<string, React.ComponentType<any>> = {
  dashboard: PrincipalDashboard,
  admission: AdmissionModule,
  teachers: TeachersModule,
  students: StudentsClassesModule,
  'students:overview': StudentsClassesModule,
  'students:directory': StudentsClassesModule,
  'students:classes': StudentsClassesModule,
  classes: StudentsClassesModule,
  timetable: TimetableModule,
  attendance: AttendanceModule,
  fees: FeesModule,
  salary: SalaryModule,
  finance: FinanceDashboardModule,
  exams: ExamsModule,
  // homework: HomeworkModule,        // Wave 1: deferred
  // assignments: AssignmentsModule,  // Wave 1: deferred
  communication: CommunicationModule,
  messaging: MessagingModule,
  calendar: CalendarModule,
  library: LibraryModule,
  transport: TransportModule,
  inventory: InventoryModule,
  procurement: ProcurementModule,
  certificates: CertificatesModule,
  downloads: DownloadsModule,
  settings: SchoolSettingsModule,
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Academics',
    items: [
      { key: 'admission', label: 'Admissions', icon: <UserPlus className="h-4.5 w-4.5" /> },
      { key: 'teachers', label: 'Teachers', icon: <GraduationCap className="h-4.5 w-4.5" /> },
      { key: 'students', label: 'Students & Classes', icon: <School className="h-4.5 w-4.5" /> },
      { key: 'timetable', label: 'Timetable', icon: <Clock className="h-4.5 w-4.5" /> },
      { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
      { key: 'exams', label: 'Examinations', icon: <FileText className="h-4.5 w-4.5" /> },
      // { key: 'homework', label: 'Homework', icon: <BookOpen className="h-4.5 w-4.5" /> },        // Wave 1: deferred
      // { key: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4.5 w-4.5" /> }, // Wave 1: deferred
    ],
  },
  {
    label: 'Finance',
    items: [
      { key: 'fees', label: 'Fee Management', icon: <IndianRupee className="h-4.5 w-4.5" /> },
      { key: 'salary', label: 'Salary & Payroll', icon: <Wallet className="h-4.5 w-4.5" /> },
      { key: 'finance', label: 'Finance Dashboard', icon: <PieChart className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'communication', label: 'Communication', icon: <Megaphone className="h-4.5 w-4.5" /> },
      { key: 'messaging', label: 'Messages', icon: <MessageSquare className="h-4.5 w-4.5" /> },
      { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-4.5 w-4.5" /> },
      { key: 'library', label: 'Library', icon: <BookMarked className="h-4.5 w-4.5" /> },
      { key: 'transport', label: 'Transport', icon: <Bus className="h-4.5 w-4.5" /> },
      { key: 'inventory', label: 'Inventory', icon: <Package className="h-4.5 w-4.5" /> },
      // { key: 'procurement', label: 'Procurement', icon: <Truck className="h-4.5 w-4.5" /> }, (Hidden from sidebar per specs)
      { key: 'certificates', label: 'Certificates', icon: <Award className="h-4.5 w-4.5" /> },
      { key: 'downloads', label: 'Downloads', icon: <Download className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ],
  },
]

export function PrincipalPanel() {
  const [active, setActive] = useState('dashboard')
  const alertCount = useLiveAlerts((s) => s.alerts.length)
  const pendingAdmissions = useAdmissionStore((s) =>
    s.applications.filter((a) =>
      a.status === 'Submitted' || a.status === 'Under Review' || a.status === 'Need Correction'
    ).length
  )

  const groups: NavGroup[] = useMemo(() => navGroups.map((g) => {
    if (g.label === 'Overview') {
      return { ...g, items: g.items.map((item) => item.key === 'dashboard' ? { ...item, badge: alertCount > 0 ? alertCount : undefined } : item) }
    }
    if (g.label === 'Academics') {
      return { ...g, items: g.items.map((item) => item.key === 'admission' ? { ...item, badge: pendingAdmissions > 0 ? pendingAdmissions : undefined } : item) }
    }
    return g
  }), [alertCount, pendingAdmissions])

  const ActiveModule = moduleRegistry[active] ?? PrincipalDashboard

  let initialTab: UnifiedTab = 'overview'
  if (active === 'students:directory') initialTab = 'directory'
  else if (active === 'students:classes' || active === 'classes') initialTab = 'classes'
  else if (active === 'students:archived') initialTab = 'archived'

  const isStudentModule = active === 'students' || active.startsWith('students:') || active === 'classes'

  return (
    <AppShell
      groups={groups}
      activeKey={isStudentModule ? 'students' : active}
      onNavigate={setActive}
      role="principal"
      roleLabel="Principal · Admin"
    >
      {isStudentModule ? (
        <StudentsClassesModule initialTab={initialTab} />
      ) : active === 'dashboard' ? (
        <PrincipalDashboard onNavigate={setActive} />
      ) : active === 'fees' ? (
        // Fees receives cross-module navigation so the Fee Structure editor
        // can deep-link to the Examination module ("Go to Examinations" —
        // the source of truth for exam definitions).
        <FeesModule onNavigate={setActive} />
      ) : (
        <ActiveModule />
      )}
    </AppShell>
  )
}
