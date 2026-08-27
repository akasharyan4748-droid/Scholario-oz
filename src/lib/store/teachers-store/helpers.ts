import type { PositionDefinition, TeacherRecord } from './types'

/**
 * Helper utility to extract all active granted permission keys for a given teacher
 */
export function getTeacherActivePermissions(teacher: TeacherRecord, positionsList: PositionDefinition[]): string[] {
  const activeAssignments = teacher.positions.filter((p) => p.status === 'Active')
  const permissionsSet = new Set<string>()

  activeAssignments.forEach((assignment) => {
    const def = positionsList.find((p) => p.id === assignment.positionId)
    if (def) {
      def.permissions.forEach((perm) => permissionsSet.add(perm))
    }
  })

  return Array.from(permissionsSet)
}
