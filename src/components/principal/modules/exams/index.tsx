'use client'

/**
 * ExamsModule — Principal-facing Examinations workspace.
 *
 * Reads exclusively from /api/exams/* — no localStorage, no mock data.
 * Tab structure (per user spec):
 *   Overview | Exams | Schedule | Marks | Results | Reports | Settings
 *
 * "All Exams / Scheduled / Ongoing / Completed / Results" are FILTERS
 * inside the Exams tab, NOT top-level navigation.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useExamsList } from '@/lib/exams/use-exams'
import { ExamsOverviewTab } from './tabs/overview-tab'
import { ExamsListTab } from './tabs/exams-list-tab'
import { ScheduleTab } from './tabs/schedule-tab'
import { MarksTab } from './tabs/marks-tab'
import { ResultsTab } from './tabs/results-tab'
import { ReportsTab } from './tabs/reports-tab'
import { SettingsTab } from './tabs/settings-tab'
import { CreateExamDialog } from './create-exam-dialog'
import { ExamWorkspaceDialog } from './exam-workspace-dialog'
import { type ExamDTO } from '@/lib/exams/types'

type SectionTab = 'overview' | 'exams' | 'schedule' | 'marks' | 'results' | 'reports' | 'settings'

const SECTION_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'exams', label: 'Exams' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'marks', label: 'Marks' },
  { value: 'results', label: 'Results' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
]

export function ExamsModule() {
  const [section, setSection] = useState<SectionTab>('overview')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)

  const { exams, classes, loading, error, reload } = useExamsList()

  return (
    <PageTransition className="space-y-4">
      {/* Top-level section navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={SECTION_TABS}
          value={section}
          onValueChange={(v) => setSection(v as SectionTab)}
        />
        {section === 'exams' && (
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create Examination
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {section === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ExamsOverviewTab
              exams={exams}
              classes={classes}
              loading={loading}
              error={error}
              onSelectExam={(id) => setSelectedExamId(id)}
              onGoToExams={() => setSection('exams')}
            />
          </motion.div>
        )}

        {section === 'exams' && (
          <motion.div
            key="exams"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ExamsListTab
              exams={exams}
              loading={loading}
              error={error}
              onOpenExam={(id) => setSelectedExamId(id)}
              onReload={reload}
            />
          </motion.div>
        )}

        {section === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ScheduleTab exams={exams} onOpenExam={(id) => setSelectedExamId(id)} />
          </motion.div>
        )}

        {section === 'marks' && (
          <motion.div
            key="marks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <MarksTab exams={exams} />
          </motion.div>
        )}

        {section === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ResultsTab exams={exams} onOpenExam={(id) => setSelectedExamId(id)} />
          </motion.div>
        )}

        {section === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ReportsTab exams={exams} />
          </motion.div>
        )}

        {section === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <CreateExamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classes={classes}
        onCreated={(exam) => {
          reload()
          setSelectedExamId(exam.id)
        }}
      />
      {selectedExamId && (
        <ExamWorkspaceDialog
          examId={selectedExamId}
          onOpenChange={(o) => !o && setSelectedExamId(null)}
          onMutated={reload}
        />
      )}
    </PageTransition>
  )
}
