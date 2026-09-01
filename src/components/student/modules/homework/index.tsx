'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { homeworks } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { initialSubmitted } from './data'
import { StatsRow } from './stats-row'
import { ActiveHomeworkList } from './active-homework-list'
import { ClosedHomeworkList } from './closed-homework-list'
import { SubmissionDialog } from './submission-dialog'

export function HomeworkModule() {
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(initialSubmitted)
  const [openId, setOpenId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)

  const active = homeworks.filter((h) => h.status === 'Active')
  const closed = homeworks.filter((h) => h.status === 'Closed')
  const openHomework = homeworks.find((h) => h.id === openId)
  const submittedCount = Object.values(submitted).filter(Boolean).length

  const handleSubmit = () => {
    setSubmitting(true)
    setSuccess(false)
    setTimeout(() => {
      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => {
        if (openId) {
          setSubmitted((p) => ({ ...p, [openId]: true }))
        }
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
        subtitle="Class 2-A · Assigned by your teachers"
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
