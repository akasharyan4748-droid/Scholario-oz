'use client'

import { create } from 'zustand'
import type { StudentsState, StudentStatus } from './types'
import { HOUSE_DEFS, SEED_SUBJECTS } from './constants'
import { SS, SC } from './seed-data'
import { idForCustomSubject, codeForName, type SubjectDef } from '@/lib/mock/academic'

/**
 * Helper — keep a ClassRecord's legacy `subjects: string[]` array in sync
 * with its canonical `subjectIds: string[]` + the academic subject registry.
 * Spec §28: id is the source of truth; name is a derived display field.
 */
function syncSubjectNames(
  cls: import('./types').ClassRecord,
  registry: SubjectDef[],
): import('./types').ClassRecord {
  const subjects = cls.subjectIds
    .map((id) => registry.find((s) => s.id === id)?.name)
    .filter((n): n is string => Boolean(n))
  return { ...cls, subjects }
}

export const useStudentsStore = create<StudentsState>()((set, get) => ({
  students: SS,
  classes: SC,
  houses: HOUSE_DEFS,
  promotions: [],
  transfers: [],
  // Canonical subject registry (Spec §28). Cloned from SEED_SUBJECTS so
  // principal mutations (rename / add custom) don't mutate the seed.
  academicSubjects: SEED_SUBJECTS.map((s) => ({ ...s })),
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
  addClassSubject: (classId, subjectId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId && !c.subjectIds.includes(subjectId)
          ? syncSubjectNames(
              { ...c, subjectIds: [...c.subjectIds, subjectId] },
              state.academicSubjects,
            )
          : c
      ),
    }))
  },
  archiveClassSubject: (classId, subjectId) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        if (!c.subjectIds.includes(subjectId)) return c
        // Snapshot the current display name at archive time (Spec §7).
        const subj = state.academicSubjects.find((s) => s.id === subjectId)
        const snapName = subj?.name ?? subjectId
        const already = c.archivedSubjects.some((a) => a.id === subjectId)
        return syncSubjectNames(
          {
            ...c,
            subjectIds: c.subjectIds.filter((id) => id !== subjectId),
            archivedSubjects: already
              ? c.archivedSubjects
              : [{ id: subjectId, name: snapName, archivedAt: new Date().toISOString() }, ...c.archivedSubjects],
          },
          state.academicSubjects,
        )
      }),
    }))
  },
  restoreClassSubject: (classId, subjectId) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        if (!c.archivedSubjects.some((a) => a.id === subjectId)) return c
        return syncSubjectNames(
          {
            ...c,
            subjectIds: c.subjectIds.includes(subjectId)
              ? c.subjectIds
              : [...c.subjectIds, subjectId],
            archivedSubjects: c.archivedSubjects.filter((a) => a.id !== subjectId),
          },
          state.academicSubjects,
        )
      }),
    }))
  },
  deleteArchivedSubject: (classId, subjectId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, archivedSubjects: c.archivedSubjects.filter((a) => a.id !== subjectId) }
          : c
      ),
    }))
  },
  updateSubjectTeacher: (classId, subjectId, teacherId) => {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        const next = { ...c.subjectTeachers }
        if (teacherId) {
          next[subjectId] = teacherId
        } else {
          delete next[subjectId]
        }
        return { ...c, subjectTeachers: next }
      }),
    }))
  },
  /** Spec §9 — rename a canonical subject. Updates only the registry; every
   *  class's `subjects` display array is re-derived via syncSubjectNames. */
  renameSubject: (subjectId, newName) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    set((state) => {
      // Compute the NEW registry first, THEN re-derive class subject names
      // from the new registry (not the old one — that was the bug).
      const nextRegistry = state.academicSubjects.map((s) =>
        s.id === subjectId ? { ...s, name: trimmed } : s
      )
      return {
        academicSubjects: nextRegistry,
        classes: state.classes.map((c) => syncSubjectNames(c, nextRegistry)),
      }
    })
  },
  /** Spec §8 — create a NEW custom subject (or reuse an existing same-name one)
   *  and add it to a class. Returns the subject id. */
  createCustomSubject: (classId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return ''
    const state = get()
    // Reuse existing subject with same name (case-insensitive) if present.
    const existing = state.academicSubjects.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
    )
    const subjectId = existing?.id ?? idForCustomSubject(trimmed)
    if (!existing) {
      const newSubject: SubjectDef = {
        id: subjectId,
        name: trimmed,
        code: codeForName(trimmed),
        category: 'Additional',
        status: 'Active',
      }
      set((s) => ({ academicSubjects: [...s.academicSubjects, newSubject] }))
    }
    // Add to class if not already present.
    if (!state.classes.find((c) => c.id === classId)?.subjectIds.includes(subjectId)) {
      get().addClassSubject(classId, subjectId)
    }
    return subjectId
  },
  getSubjectById: (subjectId) => get().academicSubjects.find((s) => s.id === subjectId && s.status === 'Active'),
  getStudentById: (id) => get().students.find((s) => s.id === id),
  getClassById: (id) => get().classes.find((c) => c.id === id),
  getClassStudents: (classId) => get().students.filter((s) => s.classId === classId && s.status === 'Active'),
}))
