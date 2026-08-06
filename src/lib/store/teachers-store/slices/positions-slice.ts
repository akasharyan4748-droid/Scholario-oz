import type { StateCreator } from 'zustand'
import type {
  PositionAssignment,
  PositionDefinition,
  TeachersStoreState,
} from '../types'

export const createPositionsSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<
    TeachersStoreState,
    | 'addCustomPosition'
    | 'assignPositionToTeacher'
    | 'emergencyOverridePosition'
    | 'removePositionFromTeacher'
    | 'acceptPosition'
    | 'rejectPosition'
    | 'requestPositionClarification'
  >
> = (set, get) => ({
  addCustomPosition: (posData) => {
    const id = `pos-custom-${Date.now()}`
    const newPos: PositionDefinition = {
      ...posData,
      id,
      isCustom: true,
    }
    set((state) => ({ positionsList: [...state.positionsList, newPos] }))
  },

  assignPositionToTeacher: (teacherId, positionId, assignedBy = 'Dr. Ananya Iyer', classAssigned?: string) => {
    const state = get()
    const targetPos = state.positionsList.find((p) => p.id === positionId)
    if (!targetPos) return

    const assignment: PositionAssignment = {
      id: `pa-${Date.now()}`,
      positionId: targetPos.id,
      positionTitle: targetPos.title,
      classAssigned,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy,
      status: 'Pending Acceptance',
      effectiveDate: new Date().toISOString().split('T')[0],
    }

    const teacher = state.teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? { ...t, positions: [...t.positions, assignment] }
          : t
      ),
    }))

    get().logAudit({
      category: 'Position Assigned',
      actorName: assignedBy,
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Assigned position "${targetPos.title}"${classAssigned ? ` for ${classAssigned}` : ''} (Pending Acceptance)`,
    })
  },

  emergencyOverridePosition: (teacherId, positionId, reason, authCode, actorName = 'Dr. Ananya Iyer') => {
    const state = get()
    const targetPos = state.positionsList.find((p) => p.id === positionId)
    if (!targetPos) return

    const teacher = state.teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    // Check if existing assignment exists
    const existingIdx = teacher.positions.findIndex((p) => p.positionId === positionId)

    let updatedPositions = [...teacher.positions]
    if (existingIdx >= 0) {
      updatedPositions[existingIdx] = {
        ...updatedPositions[existingIdx],
        status: 'Active',
        isEmergencyOverride: true,
        overrideReason: reason,
      }
    } else {
      updatedPositions.push({
        id: `pa-emg-${Date.now()}`,
        positionId: targetPos.id,
        positionTitle: targetPos.title,
        assignedDate: new Date().toISOString().split('T')[0],
        assignedBy: actorName,
        status: 'Active',
        effectiveDate: new Date().toISOString().split('T')[0],
        isEmergencyOverride: true,
        overrideReason: reason,
      })
    }

    set((s) => ({
      teachers: s.teachers.map((t) => (t.id === teacherId ? { ...t, positions: updatedPositions } : t)),
    }))

    get().logAudit({
      category: 'Emergency Override',
      actorName,
      actorRole: 'Principal',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `EMERGENCY OVERRIDE: Activated position "${targetPos.title}" with AuthCode ${authCode}. Reason: ${reason}`,
      isEmergencyOverride: true,
    })
  },

  removePositionFromTeacher: (teacherId, assignmentId, reason = 'Administrative Reassignment', emergency = false, authCode) => {
    const state = get()
    const teacher = state.teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    const assignment = teacher.positions.find((p) => p.id === assignmentId)
    if (!assignment) return

    let updatedPositions = teacher.positions
    if (emergency) {
      // Instant removal
      updatedPositions = teacher.positions.filter((p) => p.id !== assignmentId)
      get().logAudit({
        category: 'Emergency Override',
        actorName: 'Dr. Ananya Iyer',
        actorRole: 'Principal',
        targetTeacherId: teacher.id,
        targetTeacherName: teacher.name,
        details: `EMERGENCY OVERRIDE: Removed position "${assignment.positionTitle}" instantly with AuthCode ${authCode}. Reason: ${reason}`,
        isEmergencyOverride: true,
      })
    } else {
      // Flag as Pending Removal
      updatedPositions = teacher.positions.map((p) =>
        p.id === assignmentId ? { ...p, status: 'Pending Removal' as const } : p
      )
      get().logAudit({
        category: 'Position Action',
        actorName: 'Dr. Ananya Iyer',
        actorRole: 'Principal',
        targetTeacherId: teacher.id,
        targetTeacherName: teacher.name,
        details: `Initiated position removal for "${assignment.positionTitle}" (Pending Acknowledgement)`,
      })
    }

    set((s) => ({
      teachers: s.teachers.map((t) => (t.id === teacherId ? { ...t, positions: updatedPositions } : t)),
    }))
  },

  acceptPosition: (teacherId, assignmentId) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    const pos = teacher.positions.find((p) => p.id === assignmentId)
    if (!pos) return

    const updatedClasses = pos.classAssigned && !teacher.classes.includes(pos.classAssigned)
      ? [...teacher.classes, pos.classAssigned]
      : teacher.classes

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              classes: updatedClasses,
              positions: t.positions.map((p) =>
                p.id === assignmentId ? { ...p, status: 'Active' as const } : p
              ),
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Position Action',
      actorName: teacher.name,
      actorRole: 'Teacher',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Accepted position assignment: "${pos.positionTitle}"${pos.classAssigned ? ` for ${pos.classAssigned}` : ''}. Permissions activated.`,
    })
  },

  rejectPosition: (teacherId, assignmentId, reason) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    const pos = teacher.positions.find((p) => p.id === assignmentId)
    if (!pos) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              positions: t.positions.map((p) =>
                p.id === assignmentId
                  ? { ...p, status: 'Rejected' as const, rejectionReason: reason }
                  : p
              ),
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Position Action',
      actorName: teacher.name,
      actorRole: 'Teacher',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Declined position "${pos.positionTitle}". Reason: ${reason}`,
    })
  },

  requestPositionClarification: (teacherId, assignmentId, query) => {
    const teacher = get().teachers.find((t) => t.id === teacherId)
    if (!teacher) return

    set((s) => ({
      teachers: s.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              positions: t.positions.map((p) =>
                p.id === assignmentId ? { ...p, clarificationRequest: query } : p
              ),
            }
          : t
      ),
    }))

    get().logAudit({
      category: 'Position Action',
      actorName: teacher.name,
      actorRole: 'Teacher',
      targetTeacherId: teacher.id,
      targetTeacherName: teacher.name,
      details: `Requested clarification for position assignment: "${query}"`,
    })
  },
})
