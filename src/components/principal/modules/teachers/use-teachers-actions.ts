'use client'

import { toast } from 'sonner'
import { useAuth } from '@/lib/store/auth-store'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import type { TeachersState } from './use-teachers-state'

/**
 * Action handlers for the Teachers module. Takes the populated state
 * object from `useTeachersState` and returns the handler functions
 * used by tabs, sheets, and modals. Keeps handler logic out of the
 * state hook so each file stays under the 300-line budget.
 */
export function useTeachersActions(s: TeachersState) {
  const { switchTo } = useAuth()

  const openTeacherProfile = (t: TeacherRecord) => {
    s.setSelectedTeacher(t)
    s.setSheetOpen(true)
  }

  const handleLoginAsTeacher = (t?: TeacherRecord) => {
    const targetName = t ? t.name : 'Rohan Mehta'
    toast.success('Switching to Teacher Portal', {
      description: `Logging in as ${targetName} — live permission view.`,
    })
    setTimeout(() => switchTo('teacher'), 600)
  }

  const handleOpenAppointmentLetter = (t: TeacherRecord) => {
    s.setSelectedTeacher(t)
    if (!t.appointmentLetter) {
      s.regenerateAppointmentLetter(t.id)
    }
    s.setAppointmentModalOpen(true)
  }

  const handleResetPassword = (t: TeacherRecord) => {
    const creds = s.resetTeacherPassword(t.id)
    s.setCurrentCredentials({
      name: t.name,
      empId: t.employeeId,
      username: creds.username,
      tempPassword: creds.tempPassword,
    })
    s.setCredentialsModalOpen(true)
  }

  const handleOpenPayrollModal = (t: TeacherRecord) => {
    s.setSelectedTeacher(t)
    s.setProposedSalaryInput(t.salary)
    s.setPayrollModalOpen(true)
  }

  const handleSubmitPayrollRevision = () => {
    if (!s.selectedTeacher || s.proposedSalaryInput <= 0) {
      toast.error('Invalid Proposed Salary Amount')
      return
    }
    const { code } = s.requestPayrollRevision(s.selectedTeacher.id, s.proposedSalaryInput)
    s.setPayrollModalOpen(false)
    toast.success(`Payroll Revision Requested (Code: ${code})`, {
      description: `Confirmation code sent to ${s.selectedTeacher.name}'s panel. Change will apply upon teacher code entry.`,
    })
  }

  const handleOpenTerminationModal = (t: TeacherRecord) => {
    s.setSelectedTeacher(t)
    s.setConfirmTerminateText('')
    s.setTerminationReason('Resignation / End of Tenure')
    s.setLockLoginOnTerminate(true)
    s.setTerminationModalOpen(true)
  }

  const handleConfirmTermination = () => {
    if (!s.selectedTeacher) return
    if (s.confirmTerminateText.trim().toUpperCase() !== 'TERMINATE') {
      toast.error('Type "TERMINATE" to confirm action', {
        description: 'Safety check: Enter the exact confirmation string.',
      })
      return
    }
    s.terminateTeacher(s.selectedTeacher.id, s.terminationReason, s.lockLoginOnTerminate)
    s.setTerminationModalOpen(false)
    s.setSheetOpen(false)
    toast.success(`Staff Relieved: ${s.selectedTeacher.name}`, {
      description: `Teacher record status updated to Suspended/Terminated. Login locked: ${s.lockLoginOnTerminate}`,
    })
  }

  const handleConfirmAssignPosition = () => {
    if (!s.targetTeacherIdForPos || !s.selectedPosIdToAssign) {
      toast.error('Please select both a teacher and a position')
      return
    }
    s.assignPositionToTeacher(s.targetTeacherIdForPos, s.selectedPosIdToAssign)
    s.setAssignPosModalOpen(false)
    toast.success('Position Assigned', {
      description: 'Notification sent to teacher for approval acceptance.',
    })
  }

  const handleConfirmEmergencyOverride = () => {
    if (s.overrideAuthCode !== 'OVERRIDE-2025' && s.overrideAuthCode !== '123456') {
      toast.error('Invalid Authorization Code', { description: 'Emergency override code incorrect. Use OVERRIDE-2025.' })
      return
    }
    if (!s.overrideReason.trim()) {
      toast.error('Reason Required', { description: 'Specify reason for emergency override.' })
      return
    }
    if (!s.selectedTeacher || !s.selectedPosForOverride) return

    s.emergencyOverridePosition(s.selectedTeacher.id, s.selectedPosForOverride, s.overrideReason, s.overrideAuthCode)
    s.setEmergencyOverrideModalOpen(false)
    s.setOverrideAuthCode('')
    s.setOverrideReason('')
    toast.success('EMERGENCY OVERRIDE ACTIVATED', {
      description: `Permissions for position activated instantly for ${s.selectedTeacher.name}. Logged in Audit Trail.`,
    })
  }

  const handleOpenLockModal = (t: TeacherRecord) => {
    s.setSelectedTeacher(t)
    s.setLockConfirmText('')
    s.setLockModalOpen(true)
  }

  const handleConfirmLockToggle = () => {
    if (!s.selectedTeacher) return
    const requiredStr = s.selectedTeacher.isLocked ? 'UNLOCK' : 'LOCK'
    if (s.lockConfirmText.trim().toUpperCase() !== requiredStr) {
      toast.error(`Type "${requiredStr}" to confirm action`)
      return
    }
    s.toggleLockTeacherAccount(s.selectedTeacher.id, !s.selectedTeacher.isLocked)
    s.setLockModalOpen(false)
    toast.success(`Portal Account ${!s.selectedTeacher.isLocked ? 'Locked' : 'Unlocked'} for ${s.selectedTeacher.name}`)
  }

  const handleSaveWorkload = () => {
    if (!s.selectedTeacher) return
    s.assignSubjectsAndClasses(s.selectedTeacher.id, s.selectedSubjects, s.selectedClasses)
    s.setWorkloadModalOpen(false)
    toast.success('Allocations Updated & Synced', {
      description: `Updated for ${s.selectedTeacher.name}. Subjects [${s.selectedSubjects.join(', ')}], Classes [${s.selectedClasses.join(', ')}]`,
    })
  }

  return {
    openTeacherProfile,
    handleLoginAsTeacher,
    handleOpenAppointmentLetter,
    handleResetPassword,
    handleOpenPayrollModal,
    handleSubmitPayrollRevision,
    handleOpenTerminationModal,
    handleConfirmTermination,
    handleConfirmAssignPosition,
    handleConfirmEmergencyOverride,
    handleOpenLockModal,
    handleConfirmLockToggle,
    handleSaveWorkload,
  }
}

export type TeachersActions = ReturnType<typeof useTeachersActions>
