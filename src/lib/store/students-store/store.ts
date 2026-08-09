'use client'

import { create } from 'zustand'
import type { StudentsState, StudentStatus } from './types'
import { HOUSE_DEFS } from './constants'
import { SS, SC } from './seed-data'

export const useStudentsStore = create<StudentsState>()((set, get) => ({
  students: SS,
  classes: SC,
  houses: HOUSE_DEFS,
  promotions: [],
  transfers: [],
  archiveStudent: (id, reason, by) => {
    const s = get().students.find((x) => x.id === id)
    if (!s) return
    set((state) => ({
      students: state.students.map((x) => x.id === id ? { ...x, status: 'Archived' as StudentStatus, archiveReason: reason, archiveDate: new Date().toISOString(), timeline: [{ id: `tl-${Date.now()}`, type: 'archive' as const, title: 'Student Archived', description: reason, date: new Date().toISOString(), by }, ...x.timeline] } : x),
    }))
  },
  restoreStudent: (id, by) => {
    set((state) => ({
      students: state.students.map((x) => x.id === id ? { ...x, status: 'Active' as StudentStatus, archiveReason: undefined, archiveDate: undefined, timeline: [{ id: `tl-${Date.now()}`, type: 'restore' as const, title: 'Student Restored', description: 'Restored to active status', date: new Date().toISOString(), by }, ...x.timeline] } : x),
    }))
  },
  transferStudent: (id, type, toClass, reason, by) => {
    const s = get().students.find((x) => x.id === id)
    if (!s) return
    const nc = get().classes.find((c) => c.name === toClass)
    const fc = `${s.className}-${s.section}`
    const tc = nc ? nc.name : toClass
    set((state) => ({
      students: state.students.map((x) => x.id === id && nc ? { ...x, classId: nc.id, className: nc.name, section: nc.sections[0]?.name ?? x.section, rollNo: '01', timeline: [{ id: `tl-${Date.now()}`, type: 'transfer' as const, title: type, description: `${fc} → ${tc}`, date: new Date().toISOString(), by }, ...x.timeline] } : x),
      transfers: [{ id: `tr-${Date.now()}`, studentId: id, studentName: s.name, type, fromClass: fc, toClass: tc, reason, status: 'Completed' as const, date: new Date().toISOString() }, ...state.transfers],
    }))
  },
  assignHouse: (id, houseId, by) => {
    const h = get().houses.find((x) => x.id === houseId)
    if (!h) return
    set((state) => ({ students: state.students.map((x) => x.id === id ? { ...x, houseId, houseName: h.name } : x) }))
  },
  updateRollNumber: (id, roll, by) => {
    set((state) => ({ students: state.students.map((x) => x.id === id ? { ...x, rollNo: roll } : x) }))
  },
  createPromotion: (ids, from, to, year, by) => {
    set((state) => ({
      promotions: [...ids.map((sid) => { const st = state.students.find((x) => x.id === sid); return { id: `pr-${Date.now()}-${sid}`, studentId: sid, studentName: st?.name ?? '', fromClass: from, toClass: to, academicYear: year, feeCleared: st?.feeStatus === 'Paid', resultCleared: true, attendanceCleared: (st?.attendance ?? 0) >= 75, status: 'Pending' as const, date: new Date().toISOString(), requestedBy: by } }), ...state.promotions],
    }))
  },
  approvePromotion: (id, by) => {
    set((state) => ({ promotions: state.promotions.map((p) => p.id === id ? { ...p, status: 'Approved' as const } : p) }))
  },
  executePromotion: (id, by) => {
    const p = get().promotions.find((x) => x.id === id)
    if (!p) return
    const nc = get().classes.find((c) => c.name === p.toClass)
    set((state) => ({
      students: state.students.map((x) => x.id === p.studentId && nc ? { ...x, classId: nc.id, className: nc.name, section: nc.sections[0]?.name ?? x.section, rollNo: '01', timeline: [{ id: `tl-${Date.now()}`, type: 'promotion' as const, title: `Promoted to ${p.toClass}`, description: `Academic Year ${p.academicYear}`, date: new Date().toISOString(), by }, ...x.timeline] } : x),
      promotions: state.promotions.map((pp) => pp.id === id ? { ...pp, status: 'Completed' as const } : pp),
    }))
  },
  addHousePoints: (id, pts) => {
    set((state) => ({ houses: state.houses.map((h) => h.id === id ? { ...h, points: h.points + pts } : h) }))
  },
  assignHouseCaptain: (id, sid, role) => {
    set((state) => ({ houses: state.houses.map((h) => h.id === id ? (role === 'captain' ? { ...h, captainId: sid } : { ...h, viceCaptainId: sid }) : h) }))
  },
  updateClassTeacher: (classId, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, classTeacherId: teacherId ?? '' } : c
      ),
    }))
  },
  updateClassAssistantTeacher: (classId, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, assistantTeacherId: teacherId ?? undefined }
          : c
      ),
    }))
  },
  updateSectionTeacher: (classId, sectionId, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, sections: c.sections.map((s) => s.id === sectionId ? { ...s, classTeacherId: teacherId ?? undefined } : s) }
          : c
      ),
    }))
  },
  updateSectionAssistantTeacher: (classId, sectionId, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, sections: c.sections.map((s) => s.id === sectionId ? { ...s, assistantTeacherId: teacherId ?? undefined } : s) }
          : c
      ),
    }))
  },
  addClassSubject: (classId, subject) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId && !c.subjects.includes(subject)
          ? { ...c, subjects: [...c.subjects, subject] }
          : c
      ),
    }))
  },
  archiveClassSubject: (classId, subject) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        if (!c.subjects.includes(subject)) return c
        // Move to archivedSubjects (preserve timestamp). Avoid duplicate entries.
        const already = c.archivedSubjects.some((a) => a.name === subject)
        return {
          ...c,
          subjects: c.subjects.filter((s) => s !== subject),
          archivedSubjects: already
            ? c.archivedSubjects
            : [{ name: subject, archivedAt: new Date().toISOString() }, ...c.archivedSubjects],
        }
      }),
    }))
  },
  restoreClassSubject: (classId, subject) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        if (!c.archivedSubjects.some((a) => a.name === subject)) return c
        return {
          ...c,
          subjects: c.subjects.includes(subject) ? c.subjects : [...c.subjects, subject],
          archivedSubjects: c.archivedSubjects.filter((a) => a.name !== subject),
        }
      }),
    }))
  },
  deleteArchivedSubject: (classId, subject) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, archivedSubjects: c.archivedSubjects.filter((a) => a.name !== subject) }
          : c
      ),
    }))
  },
  updateSubjectTeacher: (classId, subject, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        const next = { ...c.subjectTeachers }
        if (teacherId) {
          next[subject] = teacherId
        } else {
          delete next[subject]
        }
        return { ...c, subjectTeachers: next }
      }),
    }))
  },
  getStudentById: (id) => get().students.find((s) => s.id === id),
  getClassById: (id) => get().classes.find((c) => c.id === id),
  getClassStudents: (classId) => get().students.filter((s) => s.classId === classId && s.status === 'Active'),
}))
