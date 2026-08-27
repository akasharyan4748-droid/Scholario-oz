'use client'

// Student Assignments module — composition root.
//
// Owns the open-dialog id, the submitting/success animation state, the
// submitted-set (assignments the student has just submitted in this session),
// and the form fields (notes + attached file name). Composes the section
// heading, KPI row, tabs, and the submission dialog.

import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { assignments } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { AssignmentsKpiRow } from './kpi-row'
import { AssignmentsTabs } from './assignments-tabs'
import { SubmitAssignmentDialog } from './submit-dialog'

export function AssignmentsModule() {
  const [submittedSet, setSubmittedSet] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)

  const pending = assignments.filter((a) => a.status === 'Pending' && !submittedSet.has(a.id))
  const submitted = assignments.filter((a) => a.status === 'Submitted' || submittedSet.has(a.id))
  const graded = assignments.filter((a) => a.status === 'Graded')
  const openAssignment = assignments.find((a) => a.id === openId)

  const handleSubmit = () => {
    setSubmitting(true)
    setSuccess(false)
    setTimeout(() => {
      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => {
        if (openId) setSubmittedSet((s) => new Set(s).add(openId))
        setOpenId(null)
        setSuccess(false)
        setNotes('')
        setFileName(null)
        toast.success('Assignment submitted! 🎉', {
          description: 'Your teacher will review and grade it within 5 working days.',
        })
      }, 1600)
    }, 1500)
  }

  const handleCloseDialog = () => {
    if (!submitting) {
      setOpenId(null)
      setSuccess(false)
      setNotes('')
      setFileName(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Assignments"
        subtitle="Class 2-A · Submit and track your work"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={`${pending.length} pending`} variant="warning" dot />
            <StatusBadge status={`${graded.length} graded`} variant="success" dot />
          </div>
        }
      />

      <AssignmentsKpiRow
        total={assignments.length}
        pending={pending.length}
        submitted={submitted.length}
        graded={graded.length}
      />

      <AssignmentsTabs
        pending={pending}
        submitted={submitted}
        graded={graded}
        onSubmit={setOpenId}
      />

      <SubmitAssignmentDialog
        openId={openId}
        openAssignment={openAssignment}
        submitting={submitting}
        success={success}
        notes={notes}
        fileName={fileName}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        setNotes={setNotes}
        setFileName={setFileName}
      />
    </div>
  )
}

export default AssignmentsModule
