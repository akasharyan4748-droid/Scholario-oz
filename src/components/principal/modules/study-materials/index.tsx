'use client'

/**
 * PrincipalStudyMaterials — the principal / authorized-admin surface.
 *
 * Wraps the shared manager with the ADMIN capability set (spec §7):
 * school-wide targeting, plus archive/delete over ANY material in the
 * tenant. The server re-checks ownership/role on every mutation.
 */
import { StudyMaterialsManager } from '@/components/shared/study-materials/manager'

export function PrincipalStudyMaterialsModule() {
  return <StudyMaterialsManager canTargetSchool={true} canManageAll={true} actorName="Dr. Ananya Iyer" />
}
