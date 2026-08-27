// People-domain search: students, teachers/faculty, and parents/guardians.

import { students } from '@/lib/mock/students'
import { teachers } from '@/lib/mock/teachers'
import { parentConversations } from '@/lib/mock/parent-connect'
import type { SearchResultItem } from './types'

type Role = 'principal' | 'teacher' | 'student' | 'superadmin' | 'parent'

export function searchPeople(q: string, role: Role): SearchResultItem[] {
  const matches = (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }

  const results: SearchResultItem[] = []

  // 1. STUDENTS SEARCH
  // Teacher role only sees assigned students or Class 2-A students, Principal sees all
  const allowedStudents = role === 'teacher'
    ? students.filter((s) => s.className === 'Class 2' || s.className === 'Class 2-A')
    : students

  allowedStudents.forEach((s) => {
    const title = s.name
    const subtitle = `${s.className}-${s.section} · Roll #${s.rollNo} · Adm: ${s.admissionNo}`
    const kw = `${s.fatherName} ${s.motherName} ${s.guardianPhone} ${s.email} ${s.status} ${s.feeStatus}`
    if (matches(title, kw) || matches(subtitle) || matches(s.admissionNo) || matches(s.rollNo)) {
      results.push({
        id: `stu-${s.id}`,
        title: s.name,
        subtitle: `${s.className}-${s.section} · Adm: ${s.admissionNo} · Roll: ${s.rollNo}`,
        category: 'Students',
        type: 'student',
        moduleKey: 'admission',
        iconName: 'User',
        badge: s.status === 'Active' ? `${s.className}-${s.section}` : s.status,
        badgeVariant: s.feeStatus === 'Paid' ? 'success' : s.feeStatus === 'Pending' ? 'destructive' : 'warning',
        keywords: `${s.name} ${s.admissionNo} ${s.rollNo} student ${s.fatherName} ${s.guardianPhone}`,
      })
    }
  })

  // 2. TEACHERS & FACULTY SEARCH
  if (role === 'principal' || role === 'superadmin' || role === 'teacher') {
    teachers.forEach((t) => {
      const title = t.name
      const subtitle = `${t.designation} · ${t.department} · ${t.subjects.join(', ')}`
      const kw = `${t.employeeId} ${t.email} ${t.phone} ${t.qualification}`
      if (matches(title, kw) || matches(subtitle) || matches(t.employeeId)) {
        results.push({
          id: `tch-${t.id}`,
          title: t.name,
          subtitle: `${t.designation} (${t.department}) · Emp: ${t.employeeId}`,
          category: 'Teachers & Faculty',
          type: 'teacher',
          moduleKey: 'teachers',
          iconName: 'GraduationCap',
          badge: t.subjects[0] || t.department,
          badgeVariant: t.status === 'Active' ? 'success' : 'warning',
          keywords: `${t.name} ${t.designation} ${t.department} teacher faculty ${t.email}`,
        })
      }
    })
  }

  // 4. PARENTS & GUARDIANS SEARCH
  parentConversations.forEach((pc) => {
    const title = pc.parentName
    const subtitle = `${pc.relationship} of ${pc.studentName} (Roll #${pc.rollNo}) · ${pc.phone}`
    if (matches(title) || matches(subtitle) || matches(pc.phone) || matches(pc.studentName)) {
      results.push({
        id: `prt-${pc.id}`,
        title: pc.parentName,
        subtitle: `${pc.relationship} of ${pc.studentName} · Phone: ${pc.phone}`,
        category: 'Parents & Guardians',
        type: 'parent',
        moduleKey: 'messaging',
        iconName: 'MessageSquare',
        badge: pc.relationship,
        badgeVariant: 'info',
        keywords: `${pc.parentName} parent guardian ${pc.studentName} ${pc.phone}`,
      })
    }
  })

  return results
}
