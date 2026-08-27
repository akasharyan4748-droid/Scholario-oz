'use client'

import { useState } from 'react'
import {
  UserPlus, FileCheck, FileSpreadsheet,
  ChevronLeft, SlidersHorizontal, Users,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { departments, school } from '@/lib/mock/school'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { ModuleHeader } from '../shared/module-header'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useTeachersState } from './use-teachers-state'
import { useTeachersActions } from './use-teachers-actions'
import { DirectoryTab } from './directory-tab'
import { AuditLogsTab } from './audit-logs-tab'
import { AppointmentLettersTab } from './appointment-letters-tab'
import { AppointmentLetterDocument } from './appointment-letter-document'
import { AddTeacherWizard } from './add-teacher-wizard'
import { TeacherProfilePage } from './teacher-profile-page'
import { TeacherSettingsPage } from './teacher-settings-page'
import {
  LockAccountModal, CredentialsSlipModal,
  TerminationModal,
} from './account-modals'
import {
  AssignPositionModal, EmergencyOverrideModal, CreateCustomPositionModal,
} from './position-modals'
import { WorkloadAllocationModal } from './workload-modal'

const TABS = [
  { id: 'directory', label: 'Directory', icon: Users } as const,
  { id: 'letters', label: 'Appointment Letters', icon: FileCheck } as const,
  { id: 'logs', label: 'Audit Logs', icon: FileSpreadsheet } as const,
]

export function TeachersModule() {
  const s = useTeachersState()
  const actions = useTeachersActions(s)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Settings full-page sub-route — takes over the entire module area
  if (isSettingsOpen) {
    return (
      <PageTransition>
        <TeacherSettingsPage onBack={() => setIsSettingsOpen(false)} />
      </PageTransition>
    )
  }

  // Teacher Profile full-page sub-route — replaces the right-side drawer
  // with a proper Admissions-style workspace when a teacher is selected.
  if (s.sheetOpen && s.selectedTeacher) {
    return (
      <PageTransition>
        <TeacherProfilePage
          teacher={s.selectedTeacher}
          positionsList={s.positionsList}
          onBack={() => { s.setSheetOpen(false); s.setSelectedTeacher(null) }}
          onResetPassword={() => actions.handleResetPassword(s.selectedTeacher!)}
          onViewAppointment={() => actions.handleOpenAppointmentLetter(s.selectedTeacher!)}
          onToggleLock={() => actions.handleOpenLockModal(s.selectedTeacher!)}
          onOpenTermination={() => actions.handleOpenTerminationModal(s.selectedTeacher!)}
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`${s.totalTeachers} faculty`, `${departments.length} depts`, `AY ${school.academicYear}`]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="text-xs gap-1.5 h-8">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Settings
            </Button>
            <Button size="sm" onClick={() => s.setActiveTab('add')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8">
              <UserPlus className="h-3.5 w-3.5" /> Add Teacher
            </Button>
          </>
        }
      />

      {/* Segmented tabs — shared component */}
      <SegmentedTabs
        tabs={TABS.map((tab) => {
          const Icon = tab.icon
          return {
            value: tab.id,
            label: tab.label,
            icon: <Icon className="h-3.5 w-3.5" />,
            badge: tab.id === 'directory' ? s.totalTeachers : tab.id === 'logs' ? s.auditLogs.length : undefined,
          }
        })}
        value={s.activeTab}
        onValueChange={(v) => s.setActiveTab(v as typeof s.activeTab)}
      />

      {/* TAB 1: FACULTY DIRECTORY */}
      {s.activeTab === 'directory' && (
        <DirectoryTab
          teachers={s.teachers}
          filteredTeachers={s.filteredTeachers}
          search={s.search} setSearch={s.setSearch}
          dept={s.dept} setDept={s.setDept}
          statusFilter={s.statusFilter} setStatusFilter={s.setStatusFilter}
          totalTeachers={s.totalTeachers}
          activeTeachersCount={s.activeTeachersCount}
          onLeaveCount={s.onLeaveCount}
          avgAttendance={s.avgAttendance}
          totalSalary={s.totalSalary}
          relievedCount={s.relievedCount}
          onOpenProfile={actions.openTeacherProfile}
        />
      )}

      {/* ADD TEACHER WIZARD — clean single container, no GlassCard wrapper */}
      {s.activeTab === 'add' && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => s.setActiveTab('directory')} className="gap-1 text-xs w-fit h-8">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Directory
          </Button>

          <AddTeacherWizard
            onSuccess={(newTeacher) => {
              s.addTeacher(newTeacher)
              s.setActiveTab('directory')
              toast.success(`Teacher ${newTeacher.name} Registered!`, {
                description: `Employee ID: ${newTeacher.employeeId} · Credentials & Appointment Letter ready.`,
              })
            }}
            onCancel={() => s.setActiveTab('directory')}
          />
        </div>
      )}

      {/* TAB 2: APPOINTMENT LETTERS REPOSITORY */}
      {s.activeTab === 'letters' && (
        <AppointmentLettersTab
          teachers={s.teachers}
          onViewLetter={actions.handleOpenAppointmentLetter}
          onRegenerate={(id) => {
            s.regenerateAppointmentLetter(id)
            toast.success('Appointment letter regenerated with current school terms')
          }}
        />
      )}

      {/* TAB 3: ACTIVITY AUDIT LOGS */}
      {s.activeTab === 'logs' && <AuditLogsTab auditLogs={s.auditLogs} />}

      {/* (Teacher Profile is now a full-page sub-route — see early return above) */}

      {/* APPOINTMENT LETTER PREVIEW & PRINT MODAL */}
      <Dialog open={s.appointmentModalOpen} onOpenChange={s.setAppointmentModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Appointment Letter Preview</DialogTitle>
            <DialogDescription>Preview and print appointment letter for teacher</DialogDescription>
          </DialogHeader>
          {s.selectedTeacher && s.selectedTeacher.appointmentLetter && (
            <AppointmentLetterDocument
              letter={s.selectedTeacher.appointmentLetter}
              teacher={s.selectedTeacher}
              onClose={() => s.setAppointmentModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* LOCK / UNLOCK ACCOUNT MODAL */}
      <LockAccountModal
        open={s.lockModalOpen}
        onClose={() => s.setLockModalOpen(false)}
        teacher={s.selectedTeacher}
        lockConfirmText={s.lockConfirmText}
        setLockConfirmText={s.setLockConfirmText}
        onConfirm={actions.handleConfirmLockToggle}
      />

      {/* CREDENTIALS SLIP MODAL */}
      <CredentialsSlipModal
        open={s.credentialsModalOpen}
        onClose={() => s.setCredentialsModalOpen(false)}
        credentials={s.currentCredentials}
      />

      {/* ASSIGN POSITION MODAL */}
      <AssignPositionModal
        open={s.assignPosModalOpen}
        onClose={() => s.setAssignPosModalOpen(false)}
        teachers={s.teachers}
        positionsList={s.positionsList}
        targetTeacherIdForPos={s.targetTeacherIdForPos}
        setTargetTeacherIdForPos={s.setTargetTeacherIdForPos}
        selectedPosIdToAssign={s.selectedPosIdToAssign}
        setSelectedPosIdToAssign={s.setSelectedPosIdToAssign}
        onConfirm={actions.handleConfirmAssignPosition}
      />

      {/* CREATE CUSTOM POSITION MODAL */}
      <CreateCustomPositionModal
        open={s.customPosModalOpen}
        onClose={() => s.setCustomPosModalOpen(false)}
        onCreate={(pos) => {
          s.addCustomPosition(pos)
          s.setCustomPosModalOpen(false)
          toast.success(`Custom Position "${pos.title}" Created`, { description: 'Available for immediate assignment.' })
        }}
      />

      {/* EMERGENCY OVERRIDE MODAL */}
      <EmergencyOverrideModal
        open={s.emergencyOverrideModalOpen}
        onClose={() => s.setEmergencyOverrideModalOpen(false)}
        overrideAuthCode={s.overrideAuthCode}
        setOverrideAuthCode={s.setOverrideAuthCode}
        overrideReason={s.overrideReason}
        setOverrideReason={s.setOverrideReason}
        onConfirm={actions.handleConfirmEmergencyOverride}
      />

      {/* SUBJECT & CLASS ALLOCATION MODAL */}
      <WorkloadAllocationModal
        open={s.workloadModalOpen}
        onClose={() => s.setWorkloadModalOpen(false)}
        selectedTeacher={s.selectedTeacher}
        teachers={s.teachers}
        selectedClasses={s.selectedClasses}
        setSelectedClasses={s.setSelectedClasses}
        selectedSubjects={s.selectedSubjects}
        setSelectedSubjects={s.setSelectedSubjects}
        onReplaceConflictTeacher={(conflictTeacherId, newSubjects, newClasses) => {
          s.assignSubjectsAndClasses(conflictTeacherId, newSubjects, newClasses)
        }}
        onSave={actions.handleSaveWorkload}
      />

      {/* STAFF RELIEVE / TERMINATION MODAL */}
      <TerminationModal
        open={s.terminationModalOpen}
        onClose={() => s.setTerminationModalOpen(false)}
        teacher={s.selectedTeacher}
        terminationReason={s.terminationReason}
        setTerminationReason={s.setTerminationReason}
        confirmTerminateText={s.confirmTerminateText}
        setConfirmTerminateText={s.setConfirmTerminateText}
        lockLoginOnTerminate={s.lockLoginOnTerminate}
        setLockLoginOnTerminate={s.setLockLoginOnTerminate}
        onConfirm={actions.handleConfirmTermination}
      />
    </PageTransition>
  )
}

export default TeachersModule
