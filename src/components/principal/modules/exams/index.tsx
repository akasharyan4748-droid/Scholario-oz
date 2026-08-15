'use client'

// Examinations module — composition root.
//
// Owns the three dialog open/close states and the "currently-selected exam"
// reference, then composes the KPI row, analytics row, schedule list,
// gradebook section, and the three dialogs.

import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import type { Exam } from '@/lib/mock/academics'
import { ExamsKpiRow } from './kpi-row'
import { ExamsAnalyticsRow } from './analytics-row'
import { ExamsSchedule, type ScheduleCallbacks } from './schedule'
import { ExamsGradebook } from './gradebook'
import { CreateExamDialog } from './create-exam-dialog'
import { ExamDetailsDialog } from './exam-details-dialog'
import { GenerateResultDialog } from './results-dialog'
import { emeraldGradientBtn } from './data'

export function ExamsModule() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [resultExamId, setResultExamId] = useState('EX02')

  const openResult = (examId: string) => {
    setResultExamId(examId)
    setResultOpen(true)
  }

  const scheduleCallbacks: ScheduleCallbacks = {
    onViewDetails: (e) => setSelectedExam(e),
    onOpenResult: openResult,
  }

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="Examinations"
        subtitle="Schedule exams, generate results & analyze performance"
        icon={<FileText className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className={`shadow-md ${emeraldGradientBtn}`}>
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        }
      />

      {/* KPI cards */}
      <ExamsKpiRow />

      {/* Exam analytics row */}
      <ExamsAnalyticsRow />

      {/* All exams list */}
      <ExamsSchedule callbacks={scheduleCallbacks} />

      {/* Class toppers + grade sheet preview */}
      <ExamsGradebook />

      {/* Dialogs */}
      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ExamDetailsDialog
        exam={selectedExam}
        onOpenChange={(o) => !o && setSelectedExam(null)}
        onOpenResult={openResult}
      />
      <GenerateResultDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        initialExamId={resultExamId}
      />
    </PageTransition>
  )
}

// Default export for safety / convenience alias.
export default ExamsModule
