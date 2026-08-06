// Academic-domain search: classes, subjects, timetables, and examinations.

import { exams } from '@/lib/mock/academics'
import { subjects } from '@/lib/mock/school'
import type { SearchResultItem } from './types'

export function searchAcademic(q: string): SearchResultItem[] {
  const matches = (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }

  const results: SearchResultItem[] = []

  // 3. CLASSES & SECTIONS SEARCH
  const defaultClasses = [
    { name: 'Class 2-A', desc: 'Primary Wing · Room 102 · Class Teacher: Rohan Mehta' },
    { name: 'Class 2-B', desc: 'Primary Wing · Room 103 · Class Teacher: Priya Nair' },
    { name: 'Class 10-A', desc: 'Secondary Wing · Room 304 · Class Teacher: Pooja Bhatt' },
    { name: 'Class 12-Sci-A', desc: 'Senior Secondary · Room 402 · Class Teacher: Arjun Kapoor' },
    { name: 'Class 9-A', desc: 'Secondary Wing · Room 301 · Class Teacher: Rajesh Khanna' },
  ]
  defaultClasses.forEach((c) => {
    if (matches(c.name) || matches(c.desc)) {
      results.push({
        id: `cls-${c.name}`,
        title: c.name,
        subtitle: c.desc,
        category: 'Classes & Subjects',
        type: 'class',
        moduleKey: 'classes',
        iconName: 'School',
        badge: 'Section',
        badgeVariant: 'outline',
        keywords: `${c.name} class section classroom`,
      })
    }
  })

  // 3b. SUBJECTS
  subjects.forEach((subj) => {
    if (matches(subj.name) || matches(subj.code)) {
      results.push({
        id: `sbj-${subj.id}`,
        title: subj.name,
        subtitle: `Academic Subject · Code: ${subj.code}`,
        category: 'Classes & Subjects',
        type: 'subject',
        moduleKey: 'classes',
        iconName: 'BookOpen',
        badge: subj.code,
        badgeVariant: 'default',
        keywords: `${subj.name} ${subj.code} subject curriculum`,
      })
    }
  })

  // 3c. TIMETABLE & SCHEDULES SEARCH
  const defaultTimetableKeywords = ['timetable', 'schedule', 'routine', 'period', 'class schedule', 'slots', 'bell timing']
  if (defaultTimetableKeywords.some((k) => k.includes(q) || q.includes(k))) {
    results.push({
      id: 'tt-module',
      title: 'Class & Teacher Timetables',
      subtitle: 'Manage weekly timetables, period allocations, room assignments, and resolve conflicts',
      category: 'Classes & Subjects',
      type: 'feature',
      moduleKey: 'timetable',
      iconName: 'School',
      badge: 'Academic Schedule',
      badgeVariant: 'info',
      keywords: 'timetable schedule routine periods class timing room allocation conflicts',
    })
    results.push({
      id: 'tt-class-2a',
      title: 'Class 2-A Weekly Timetable',
      subtitle: 'Room 102 · Class Teacher: Rohan Mehta · 8 Periods Daily',
      category: 'Classes & Subjects',
      type: 'class',
      moduleKey: 'timetable',
      iconName: 'School',
      badge: 'Schedule',
      badgeVariant: 'success',
      keywords: 'class 2-a timetable schedule rohan mehta room 102',
    })
    results.push({
      id: 'tt-class-10a',
      title: 'Class 10-A Weekly Timetable',
      subtitle: 'Room 304 · Class Teacher: Pooja Bhatt · 8 Periods Daily',
      category: 'Classes & Subjects',
      type: 'class',
      moduleKey: 'timetable',
      iconName: 'School',
      badge: 'Schedule',
      badgeVariant: 'warning',
      keywords: 'class 10-a timetable schedule pooja bhatt room 304',
    })
  }

  // 5. EXAMINATIONS SEARCH
  exams.forEach((ex) => {
    const title = ex.name
    const subtitle = `${ex.type} · ${ex.classes.join(', ')} · Status: ${ex.status}`
    if (matches(title) || matches(subtitle) || matches(ex.type)) {
      results.push({
        id: `exm-${ex.id}`,
        title: ex.name,
        subtitle: `${ex.type} · ${ex.startDate} to ${ex.endDate}`,
        category: 'Examinations',
        type: 'exam',
        moduleKey: 'exams',
        iconName: 'FileText',
        badge: ex.status,
        badgeVariant: ex.status === 'Completed' || ex.status === 'Result Declared' ? 'success' : 'warning',
        keywords: `${ex.name} ${ex.type} exam examination test result marks`,
      })
    }
  })

  return results
}
