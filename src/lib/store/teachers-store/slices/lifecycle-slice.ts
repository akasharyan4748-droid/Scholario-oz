import type { StateCreator } from 'zustand'
import type { TeachersStoreState } from '../types'

export const createLifecycleSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<TeachersStoreState, 'addTeacher' | 'updateTeacher' | 'terminateTeacher'>
> = (set, get) => ({
  addTeacher: (newTeacher) => {
    set((state) => ({ teachers: [newTeacher, ...state.teachers] }))
    get().logAudit({
      category: 'Teacher Created',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: newTeacher.id,
      targetTeacherName: newTeacher.name,
      details: `Registered ${newTeacher.name} as ${newTeacher.designation} (${newTeacher.department})`,
    })
  },

  updateTeacher: (id, updates) => {
    set((state) => ({
      teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  terminateTeacher: (teacherId, reason, lockLogin) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              status: 'Suspended' as const,
              isLocked: lockLogin,
              positions: [],
              subjects: [],
              classes: [],
              remarks: `Relieved / Terminated on ${new Date().toISOString().split('T')[0]}. Reason: ${reason}`,
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Position Action',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `RELIEVED & TERMINATED staff record for ${teacher.name}. Reason: ${reason}. Login Locked: ${lockLogin}`,
    })
  },
})
