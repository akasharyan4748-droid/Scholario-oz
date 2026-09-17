'use client'

/**
 * TeacherStudyMaterials — the teacher's Study Materials surface.
 *
 * Wraps the shared manager with the TEACHER capability set (spec §5–§7):
 * teachers upload and manage their own materials and target classes or
 * selected students — school-wide publication is a principal/admin
 * capability. The SERVER re-checks every one of these rules; these props
 * only shape the UI honestly.
 */
import { StudyMaterialsManager } from '@/components/shared/study-materials/manager'

export function TeacherStudyMaterialsModule() {
  return <StudyMaterialsManager canTargetSchool={false} canManageAll={false} actorName="Rohan Mehta" />
}
