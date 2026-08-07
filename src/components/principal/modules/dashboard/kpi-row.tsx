'use client'

import {
  Users, GraduationCap, CalendarCheck, Wallet, IndianRupee, Clock,
  UserPlus, FileText, Cake, Bus, BookMarked, Package,
} from 'lucide-react'
import { studentStats } from '@/lib/mock/students'
import { attendanceOverview } from '@/lib/mock/attendance'
import { feeAnalytics, salaryAnalytics } from '@/lib/mock/finance'
import { exams } from '@/lib/mock/academics'
import { school } from '@/lib/mock/school'
import { libraryStats } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { MetaStrip, type MetaItem } from '../shared/meta-strip'

// Primary KPI strip — replaces 8 oversized KpiCards with one compact row.
export function KpiRow() {
  const items: MetaItem[] = [
    { label: 'Students', value: studentStats.total.toLocaleString(), hint: '+2.4% vs last term', tone: 'positive', icon: <Users className="h-3 w-3" /> },
    { label: 'Teachers', value: school.totalTeachers, hint: '+3 this month', tone: 'positive', icon: <GraduationCap className="h-3 w-3" /> },
    { label: 'Attendance', value: `${attendanceOverview.today.rate.toFixed(1)}%`, hint: `${attendanceOverview.today.present} present`, tone: 'positive', icon: <CalendarCheck className="h-3 w-3" /> },
    { label: 'Revenue (mo.)', value: formatINR(feeAnalytics.collectedThisMonth, true), hint: '+12.5% this month', tone: 'positive', icon: <Wallet className="h-3 w-3" /> },
    { label: 'Pending fees', value: formatINR(feeAnalytics.pendingDues, true), hint: `${feeAnalytics.pendingCount} students`, tone: 'negative', icon: <IndianRupee className="h-3 w-3" /> },
    { label: 'Salary due', value: formatINR(salaryAnalytics.totalMonthly, true), hint: `${school.totalStaff} staff`, icon: <Clock className="h-3 w-3" /> },
    { label: 'New admissions', value: studentStats.newThisMonth, hint: '+18.4% this month', tone: 'positive', icon: <UserPlus className="h-3 w-3" /> },
    { label: 'Upcoming exams', value: exams.filter((e) => e.status === 'Scheduled').length, hint: 'Pre-Board in 12d', tone: 'warning', icon: <FileText className="h-3 w-3" /> },
  ]
  return <MetaStrip items={items} columns={8} />
}

// Secondary operational strip — compact stats for birthdays, buses, library, inventory.
export function SecondaryKpiRow() {
  const items: MetaItem[] = [
    { label: "Today's birthdays", value: 8, hint: '3 in primary', tone: 'warning', icon: <Cake className="h-3 w-3" /> },
    { label: 'Buses running', value: '22/24', hint: '2 in maintenance', tone: 'positive', icon: <Bus className="h-3 w-3" /> },
    { label: 'Library issued', value: libraryStats.issued, hint: `${libraryStats.overdue} overdue`, tone: libraryStats.overdue > 0 ? 'negative' : 'default', icon: <BookMarked className="h-3 w-3" /> },
    { label: 'Inventory alerts', value: 14, hint: 'low stock', tone: 'negative', icon: <Package className="h-3 w-3" /> },
  ]
  return <MetaStrip items={items} columns={4} />
}
