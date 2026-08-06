'use client'

import { useState } from 'react'
import { AppShell } from '@/components/shell/app-shell'
import { useTeachersStore, getTeacherActivePermissions } from '@/lib/store/teachers-store'
import {
  buildTeacherNavGroups,
  getPendingAssignments,
} from './teacher-panel/nav-registry'
import { AccountLockedBanner } from './teacher-panel/banners/account-locked-banner'
import { PayrollRevisionBanner } from './teacher-panel/banners/payroll-revision-banner'
import { PendingAssignmentsBanner } from './teacher-panel/banners/pending-assignments-banner'
import { RelievedViews } from './teacher-panel/relieved-views'
import { ModuleRouter } from './teacher-panel/module-router'
import {
  DeclineDialog,
  ClarifyDialog,
} from './teacher-panel/dialogs/position-dialogs'
import { useTeacherHandlers } from './teacher-panel/use-teacher-handlers'

export function TeacherPanel() {
  const { teachers, positionsList, confirmPayrollRevision } = useTeachersStore()

  // Default to Rohan Mehta (EMP-014) for Teacher View preview or active teacher
  const currentTeacher = teachers.find((t) => t.id === 'T-014') || teachers[0]
  const isRelieved = (currentTeacher?.status as string) === 'Relieved' || currentTeacher?.status === 'Suspended' || (currentTeacher?.status as string) === 'Terminated'
  const [active, setActive] = useState(isRelieved ? 'profile' : 'dashboard')

  const activePermissions = currentTeacher && !isRelieved ? getTeacherActivePermissions(currentTeacher, positionsList) : []

  // Check pending position assignments for approval workflow
  const pendingAssignments = getPendingAssignments(currentTeacher, isRelieved)

  const navGroups = buildTeacherNavGroups({ isRelieved, activePermissions })

  const {
    dialogs,
    handleAcceptAssignment,
    handleOpenDecline,
    handleConfirmDecline,
    handleOpenClarification,
    handleConfirmClarification,
  } = useTeacherHandlers(currentTeacher)

  return (
    <AppShell
      groups={navGroups}
      activeKey={active}
      onNavigate={setActive}
      role="teacher"
      roleLabel={`Teacher · ${currentTeacher?.name || 'Faculty Member'}`}
      quickAction={{ label: 'Mark Attendance', onClick: () => setActive('attendance') }}
    >
      <AccountLockedBanner show={!!currentTeacher?.isLocked} />

      <PayrollRevisionBanner
        teacherId={currentTeacher?.id || ''}
        pendingPayrollUpdate={currentTeacher?.pendingPayrollUpdate}
        confirmPayrollRevision={confirmPayrollRevision}
      />

      <PendingAssignmentsBanner
        assignments={pendingAssignments}
        onAccept={handleAcceptAssignment}
        onDecline={handleOpenDecline}
        onClarify={handleOpenClarification}
      />

      {/* Relieved staff views (profile / payroll / fee-management) */}
      {currentTeacher && (active === 'profile' || active === 'payroll' || active === 'fee-management') && (
        <RelievedViews active={active} currentTeacher={currentTeacher} isRelieved={isRelieved} />
      )}

      {/* Module Content */}
      {active !== 'profile' && active !== 'payroll' && active !== 'fee-management' && (
        <ModuleRouter active={active} onNavigate={setActive} />
      )}

      <DeclineDialog
        open={dialogs.declineDialogOpen}
        onOpenChange={dialogs.setDeclineDialogOpen}
        reason={dialogs.declineReason}
        setReason={dialogs.setDeclineReason}
        onConfirm={handleConfirmDecline}
      />

      <ClarifyDialog
        open={dialogs.clarifyDialogOpen}
        onOpenChange={dialogs.setClarifyDialogOpen}
        query={dialogs.clarifyQuery}
        setQuery={dialogs.setClarifyQuery}
        onConfirm={handleConfirmClarification}
      />
    </AppShell>
  )
}
