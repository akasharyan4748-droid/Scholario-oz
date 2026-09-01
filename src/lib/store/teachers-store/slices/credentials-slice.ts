import type { StateCreator } from 'zustand'
import type { TeachersStoreState } from '../types'

export const createCredentialsSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<TeachersStoreState, 'resetTeacherPassword' | 'toggleLockTeacherAccount'>
> = (set, get) => ({
  resetTeacherPassword: (teacherId) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return { username: '', tempPassword: '' }

    const newPass = `GWS#Pass${Math.floor(1000 + Math.random() * 9000)}`
    const updatedCreds = {
      ...teacher.loginCredentials,
      tempPassword: newPass,
      passwordResetRequired: true,
    }

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId ? { ...t, loginCredentials: updatedCreds } : t
      ),
    }))

    get().logAudit({
      category: 'Credentials Reset',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Reset password for login ${teacher.loginCredentials.username}`,
    })

    return { username: teacher.loginCredentials.username, tempPassword: newPass }
  },

  toggleLockTeacherAccount: (teacherId, locked, reason = 'Administrative action') => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              isLocked: locked,
              status: locked ? ('Suspended' as const) : ('Active' as const),
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Credentials Reset',
      actorName: 'Dr. Ananya Iyer',
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `${locked ? 'LOCKED & SUSPENDED' : 'UNLOCKED & ACTIVATED'} portal account for ${teacher.name}. Reason: ${reason}`,
    })
  },
})
