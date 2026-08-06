'use client'

import {
  GraduationCap, Users, UserPlus, FileCheck, FileSpreadsheet,
  ChevronLeft,
} from 'lucide-react'
import { GlassCard, SectionHeading, PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { departments, school } from '@/lib/mock/school'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { useTeachersState } from './use-teachers-state'
import { useTeachersActions } from './use-teachers-actions'
import { DirectoryTab } from './directory-tab'
import { AuditLogsTab } from './audit-logs-tab'
import { AppointmentLettersTab } from './appointment-letters-tab'
import { AppointmentLetterDocument } from './appointment-letter-document'
import { AddTeacherWizard } from './add-teacher-wizard'
import { TeacherProfileDrawer } from './profile-drawer'
import {
  LockAccountModal, CredentialsSlipModal,
  PayrollRevisionModal, TerminationModal,
} from './account-modals'
import {
  AssignPositionModal, EmergencyOverrideModal, CreateCustomPositionModal,
} from './position-modals'
import { WorkloadAllocationModal } from './workload-modal'

const TABS = [
  { id: 'directory', label: 'Faculty Directory', icon: Users } as const,
  { id: 'letters', label: 'Appointment Letters', icon: FileCheck } as const,
  { id: 'logs', label: 'Audit Logs', icon: FileSpreadsheet } as const,
]

export function TeachersModule() {
  const s = useTeachersState()
  const actions = useTeachersActions(s)

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="Teacher Management & Faculty Lifecycle"
        subtitle={`${s.totalTeachers} faculty members · ${departments.length} departments · Academic Year ${school.academicYear}`}
        icon={<GraduationCap className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => s.setActiveTab('add')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-500/20"
            >
              <UserPlus className="h-4 w-4" /> Add Teacher
            </Button>
          </div>
        }
      />

      {/* Primary Module Navigation Tabs */}
      <GlassCard className="p-2 sm:p-3">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isCurrent = s.activeTab === tab.id
            const badge = tab.id === 'directory' ? s.totalTeachers : tab.id === 'logs' ? s.auditLogs.length : undefined
            return (
              <button
                key={tab.id}
                onClick={() => s.setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {badge !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-1 text-[10px] px-1.5 py-0',
                      isCurrent ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </GlassCard>

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
          onOpenProfile={actions.openTeacherProfile}
        />
      )}

      {/* ADD TEACHER WIZARD */}
      {s.activeTab === 'add' && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => s.setActiveTab('directory')} className="gap-1 text-xs w-fit">
            <ChevronLeft className="h-4 w-4" /> Back to Directory
          </Button>

          <GlassCard className="p-4 sm:p-6">
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
          </GlassCard>
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

      {/* COMPREHENSIVE TEACHER PROFILE SHEET */}
      <Sheet open={s.sheetOpen} onOpenChange={s.setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Teacher Profile</SheetTitle>
            <SheetDescription>Teacher details and profile management</SheetDescription>
          </SheetHeader>
          {s.selectedTeacher && (
            <TeacherProfileDrawer
              teacher={s.selectedTeacher}
              positionsList={s.positionsList}
              onResetPassword={() => actions.handleResetPassword(s.selectedTeacher!)}
              onViewAppointment={() => actions.handleOpenAppointmentLetter(s.selectedTeacher!)}
              onToggleLock={() => actions.handleOpenLockModal(s.selectedTeacher!)}
              onOpenTermination={() => actions.handleOpenTerminationModal(s.selectedTeacher!)}
              onOpenPayrollModal={() => actions.handleOpenPayrollModal(s.selectedTeacher!)}
              onOpenEmergencyOverride={(posId) => {
                s.setSelectedPosForOverride(posId)
                s.setEmergencyOverrideModalOpen(true)
              }}
              onRemovePosition={(assignmentId) => {
                s.removePositionFromTeacher(s.selectedTeacher!.id, assignmentId)
                toast.success('Position removal initiated', { description: 'Notification sent to teacher.' })
              }}
              onOpenWorkload={() => {
                s.setSelectedSubjects(s.selectedTeacher!.subjects)
                s.setSelectedClasses(s.selectedTeacher!.classes)
                s.setWorkloadModalOpen(true)
              }}
            />
          )}
        </SheetContent>
      </Sheet>

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

      {/* PAYROLL REVISION PROPOSAL MODAL */}
      <PayrollRevisionModal
        open={s.payrollModalOpen}
        onClose={() => s.setPayrollModalOpen(false)}
        teacher={s.selectedTeacher}
        proposedSalaryInput={s.proposedSalaryInput}
        setProposedSalaryInput={s.setProposedSalaryInput}
        onConfirm={actions.handleSubmitPayrollRevision}
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
