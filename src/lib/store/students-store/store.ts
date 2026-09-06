'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudentPosition, StudentPositionKey, StudentsState, StudentStatus } from './types'
import { POSITION_DEFS } from '@/lib/student-positions'
import { HOUSE_DEFS, SEED_SUBJECTS } from './constants'
import { SS, SC } from './seed-data'
import { SUBJECTS_BY_LEVEL } from './constants'
import { idForCustomSubject, codeForName, type SubjectDef } from '@/lib/mock/academic'
import {
  migrateLegacyScopedStore, createTenantScopedStorage,
} from '@/lib/tenant/tenant-storage'
import { DEFAULT_TENANT_ID } from '@/lib/tenant/schools'

migrateLegacyScopedStore('scholario-students-v1', DEFAULT_TENANT_ID)

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

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set, get) => ({
  students: SS,
  classes: SC,
  houses: HOUSE_DEFS,
  promotions: [],
  transfers: [],
  // Class Captain / Monitor positions — seeded with ONE example in another
  // class so the principal Leadership tab shows an occupied state out of the
  // box; the demo student starts WITHOUT a position (assign via Leadership
  // tab to see the student-side capabilities appear, then end it to watch
  // them disappear — spec §38 E2E).
  studentPositions: [
    {
      id: 'POS-SEED-1',
      studentId: 'STU-27',
      studentName: 'Diya Verma',
      classId: 'C10',
      className: 'Class 9',
      section: 'A',
      key: 'class-monitor',
      assignedById: 'PRINCIPAL',
      assignedByName: 'Dr. Ananya Iyer',
      assignedOn: '2026-08-15T09:00:00.000Z',
      active: true,
      notes: 'Appointed at the Investiture Ceremony.',
    },
  ],
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
  // ─── Student positions (Class Captain / Monitor — spec §21–§25) ─────
  assignStudentPosition: (input) => {
    const st = get()
    const student = st.students.find((s) => s.id === input.studentId)
    if (!student) return { ok: false as const, error: 'Student not found.' }
    if (student.status !== 'Active') return { ok: false as const, error: 'Only active students can hold a class responsibility.' }
    // One active holder per (class · section · position) — replacing an
    // existing holder ends their position first (history preserved).
    const displaced = st.studentPositions.filter(
      (p) => p.active && p.classId === student.classId && p.section === student.section && p.key === input.key,
    )
    const now = new Date().toISOString()
    const record: import('./types').StudentPosition = {
      id: `POS-${Date.now().toString(36)}`,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className: student.className,
      section: student.section,
      key: input.key,
      assignedById: input.assignedById,
      assignedByName: input.assignedByName,
      assignedOn: now,
      active: true,
      notes: input.notes,
    }
    set((state) => ({
      studentPositions: [
        record,
        ...state.studentPositions.map((p) =>
          displaced.some((d) => d.id === p.id)
            ? { ...p, active: false, endedOn: now, endedByName: input.assignedByName }
            : p,
        ),
      ],
      students: state.students.map((s) =>
        s.id === student.id
          ? {
              ...s,
              timeline: [
                {
                  id: `tl-${Date.now()}`,
                  type: 'position' as const,
                  title: `Appointed ${POSITION_DEFS[input.key]?.title ?? input.key}`,
                  description: `${POSITION_DEFS[input.key]?.title ?? input.key} of ${student.className}-${student.section} · by ${input.assignedByName}`,
                  date: now,
                  by: input.assignedByName,
                },
                ...s.timeline,
              ],
            }
          : s,
      ),
    }))
    return { ok: true as const, record }
  },
  endStudentPosition: (positionId, byName) => {
    const st = get()
    const pos = st.studentPositions.find((p) => p.id === positionId)
    if (!pos) return { ok: false as const, error: 'Position not found.' }
    if (!pos.active) return { ok: false as const, error: 'This position is already inactive.' }
    const now = new Date().toISOString()
    set((state) => ({
      studentPositions: state.studentPositions.map((p) =>
        p.id === positionId ? { ...p, active: false, endedOn: now, endedByName: byName } : p,
      ),
      students: state.students.map((s) =>
        s.id === pos.studentId
          ? {
              ...s,
              timeline: [
                {
                  id: `tl-${Date.now()}`,
                  type: 'position' as const,
                  title: `${POSITION_DEFS[pos.key]?.title ?? pos.key} responsibility ended`,
                  description: `${POSITION_DEFS[pos.key]?.title ?? pos.key} of ${pos.className}-${pos.section} · concluded by ${byName}`,
                  date: now,
                  by: byName,
                },
                ...s.timeline,
              ],
            }
          : s,
      ),
    }))
    return { ok: true as const }
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

  // ─── Class creation (Add Class page — real, persisted) ────────────
  createClass: (input) => {
    const state = get()
    const name = input.name.trim()
    // Derive a stable, unique id from the class name.
    let id = 'C-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    while (state.classes.some((c) => c.id === id)) id += '-x'
    // Grade + level from the class name (e.g. "Class 6" → grade 6).
    const gradeMatch = name.match(/(\d+)/)
    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 1
    const level: import('./types').ClassRecord['level'] =
      grade <= 2 ? 'Pre-Primary' : grade <= 5 ? 'Primary' : grade <= 8 ? 'Middle' : grade <= 10 ? 'Secondary' : 'Senior Secondary'
    // Default subjects for the level (canonical ids from the registry).
    const subjectIds = (SUBJECTS_BY_LEVEL[level] || [])
      .map((n) => state.academicSubjects.find((s) => s.name === n)?.id)
      .filter((sid): sid is string => Boolean(sid))
    const subjects = subjectIds
      .map((sid) => state.academicSubjects.find((s) => s.id === sid)?.name)
      .filter((n): n is string => Boolean(n))
    const capacity = input.sections.reduce((s, x) => s + (x.capacity || 0), 0) || input.capacity
    const record: import('./types').ClassRecord = {
      id, name, grade, level,
      sections: input.sections.map((s) => ({
        id: `${id}-${s.name.trim() || 'A'}`,
        name: s.name.trim() || 'A',
        classId: id,
        capacity: s.capacity || input.capacity,
        classTeacherId: input.classTeacherId,
        assistantTeacherId: input.assistantTeacherId,
        room: s.room || input.room,
      })),
      capacity: capacity || 40,
      classTeacherId: input.classTeacherId ?? '',
      assistantTeacherId: input.assistantTeacherId,
      subjectIds,
      subjects,
      archivedSubjects: [],
      subjectTeachers: {},
      stream: null,
      room: input.room,
      status: 'Active' as const,
    }
    set((s) => ({ classes: [...s.classes, record] }))
    return record
  },

  // ─── Student enrolment (Admissions → Complete & Enrol) ───────────
  addStudent: (input) => {
    const state = get()
    const cls = state.classes.find((c) => c.id === input.classId)
    const section = input.section ?? cls?.sections[0]?.name ?? 'A'
    // Next admission number continues the roster sequence (DSO2024001…).
    const maxAdm = state.students.reduce((m, s) => {
      const n = parseInt(s.admissionNo.replace(/\D/g, ''), 10)
      return Number.isNaN(n) ? m : Math.max(m, n)
    }, 2024000)
    const admissionNo = `DSO${maxAdm + 1}`
    // Next roster id + roll number within the class/section.
    const maxId = state.students.reduce((m, s) => {
      const n = parseInt(s.id.replace(/\D/g, ''), 10)
      return Number.isNaN(n) ? m : Math.max(m, n)
    }, 0)
    const id = `STU-${maxId + 1}`
    const sectionMates = state.students.filter(
      (s) => s.classId === input.classId && s.section === section,
    )
    const rollNo = String(sectionMates.length + 1).padStart(2, '0')
    const house = HOUSE_DEFS[maxId % HOUSE_DEFS.length]
    const now = new Date().toISOString()
    const initials = input.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    const subjectIds = cls?.subjectIds ?? []
    const academics = {
      overallGrade: '—',
      overallPercent: 0,
      rankInClass: sectionMates.length + 1,
      subjects: subjectIds.map((sid) => ({
        name: state.academicSubjects.find((s) => s.id === sid)?.name ?? sid,
        grade: '—',
        percent: 0,
        teacher: '—',
      })),
    }
    const record: import('./types').StudentRecord = {
      id,
      admissionNo,
      rollNo,
      name: input.name.trim(),
      avatar: initials,
      gender: input.gender,
      classId: input.classId,
      className: cls?.name ?? '—',
      section,
      dob: input.dob,
      bloodGroup: input.bloodGroup ?? '—',
      category: input.category ?? 'General',
      fatherName: input.fatherName,
      motherName: input.motherName,
      guardianName: input.fatherName,
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail ?? '',
      address: input.address ?? '',
      city: 'Gurugram',
      state: 'Haryana',
      admissionDate: input.admissionDate ?? now.slice(0, 10),
      previousSchool: input.previousSchool ?? '',
      status: 'Active' as const,
      attendance: 0,
      feeStatus: 'Pending' as const,
      feePaid: 0,
      feeTotal: 0,
      transport: false,
      hostel: false,
      scholarship: 0,
      houseId: house.id,
      houseName: house.name,
      medical: 'No known allergies',
      academics,
      attendanceTrend: [],
      disciplinePoints: 0,
      disciplineRecords: [],
      documents: [],
      achievements: [],
      timeline: [{
        id: `tl-${Date.now()}`,
        type: 'admission' as const,
        title: 'Admission Confirmed',
        description: `Admitted to ${cls?.name ?? input.classId} - Sec ${section}`,
        date: now.slice(0, 10),
        by: 'Admissions Office',
      }],
    }
    set((s) => ({ students: [record, ...s.students] }))
    return record
  },
    }),
    {
      // TENANT-SCOPED persistence — the roster, classes, houses and subject
      // registry survive reloads (Create Class / admissions enrolment /
      // archive / transfers persist), isolated per school namespace.
      name: 'scholario-students-v1',
      storage: createTenantScopedStorage('scholario-students-v1'),
      // v2 — roster extended with the 16 Class 2-A students (STU-43..58):
      // one canonical store now backs principal + teacher + student roles.
      // Version bump discards stale persisted state so the new roster seeds.
      version: 2,
      partialize: (s) => ({
        students: s.students,
        classes: s.classes,
        houses: s.houses,
        promotions: s.promotions,
        transfers: s.transfers,
        studentPositions: s.studentPositions,
        academicSubjects: s.academicSubjects,
      }),
    },
  ),
)
