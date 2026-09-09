'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { homeworks } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { useStudentHomeworkStore } from '@/lib/store/student-homework-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { StatsRow } from './stats-row'
import { ActiveHomeworkList } from './active-homework-list'
import { ClosedHomeworkList } from './closed-homework-list'
import { SubmissionDialog } from './submission-dialog'

export function HomeworkModule() {
  // STU-F — submission status lives in the PERSISTED store (survives
  // unmount / navigation / reload). The old local useState map reset on
  // every unmount. Only ACTIVE homework submissions are user state; the
  // closed/graded homework (with teacher feedback) stays in mock data.
  const submitted = useStudentHomeworkStore((s) => s.submitted)
  const markSubmitted = useStudentHomeworkStore((s) => s.markSubmitted)
  // Canonical class label (data-driven, same roster every role uses).
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  const classLabel = student ? `${student.className}-${student.section}` : ''
  const [openId, setOpenId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)

  const active = homeworks.filter((h) => h.status === 'Active')
  const closed = homeworks.filter((h) => h.status === 'Closed')
  const openHomework = homeworks.find((h) => h.id === openId)
  const submittedCount = active.filter((h) => submitted[h.id]).length

  const handleSubmit = () => {
    setSubmitting(true)
    setSuccess(false)
    setTimeout(() => {
      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => {
        // The final state writes to the persisted store — 'Submitted'
        // status + timestamp derive from it from here on.
        if (openId) markSubmitted(openId)
        setOpenId(null)
        setSuccess(false)
        setNotes('')
        setFileName(null)
        toast.success('Homework submitted! 🎉', {
          description: 'Your teacher will review and provide feedback soon.',
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
        title="My Homework"
        subtitle={`${classLabel} · Assigned by your teachers`}
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={`${active.length} active`} variant="warning" dot />
            <StatusBadge status={`${submittedCount} submitted`} variant="success" dot />
          </div>
        }
      />

      <StatsRow
        totalAssigned={homeworks.length}
        activeCount={active.length}
        submittedCount={submittedCount}
        closedCount={closed.length}
      />

      <ActiveHomeworkList items={active} submitted={submitted} onSubmit={setOpenId} />

      <ClosedHomeworkList items={closed} />

      <SubmissionDialog
        openId={openId}
        openHomework={openHomework}
        submitting={submitting}
        success={success}
        notes={notes}
        fileName={fileName}
        onNotesChange={setNotes}
        onFileChange={setFileName}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />
    </div>
  )
}
