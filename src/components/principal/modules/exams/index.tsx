'use client'

/**
 * ExamsModule — Principal-facing Examinations workspace.
 *
 * Architecture: 4 top-level tabs + full-screen workspaces.
 *   • List view: Overview / Exams / Reports / Settings
 *   • Exam Workspace (full-screen, 7 grouped sections)
 *   • Create Examination (full-screen, single-page form)
 *
 * Schedule, Marks, Results are NOT top-level tabs — they live INSIDE the
 * Exam Workspace. This removes the previous duplication where the same data
 * appeared in two places (top-level tab + workspace sub-tab).
 *
 * Reads exclusively from /api/exams/* — no localStorage, no mock data.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useExamsList } from '@/lib/exams/use-exams'
import { ExamsOverviewTab } from './tabs/overview-tab'
import { ExamsListTab } from './tabs/exams-list-tab'
import { ReportsTab } from './tabs/reports-tab'
import { SettingsTab } from './tabs/settings-tab'
import { CreateExamFullScreen } from './create-exam-fullscreen'
import { ExamWorkspace } from './exam-workspace'

type SectionTab = 'overview' | 'exams' | 'reports' | 'settings'
type View = { kind: 'list' } | { kind: 'exam'; examId: string } | { kind: 'create' }

const SECTION_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'exams', label: 'Exams' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
]

export function ExamsModule() {
  const [section, setSection] = useState<SectionTab>('overview')
  const [view, setView] = useState<View>({ kind: 'list' })

  const { exams, classes, academicYear, loading, error, reload } = useExamsList()

  // Full-screen views take over the entire content area
  if (view.kind === 'exam') {
    return (
      <ExamWorkspace
        examId={view.examId}
        onBack={() => setView({ kind: 'list' })}
        onMutated={reload}
      />
    )
  }
  if (view.kind === 'create') {
    return (
      <CreateExamFullScreen
        classes={classes}
        academicYear={academicYear}
        onBack={() => setView({ kind: 'list' })}
        onCreated={(exam) => {
          reload()
          setView({ kind: 'exam', examId: exam.id })
        }}
      />
    )
  }

  // List view — the standard Examinations landing
  return (
    <PageTransition className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={SECTION_TABS}
          value={section}
          onValueChange={(v) => setSection(v as SectionTab)}
        />
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
              onSelectExam={(id) => setView({ kind: 'exam', examId: id })}
              onGoToExams={() => setSection('exams')}
              onNavigate={(s) => setSection(s as SectionTab)}
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
              onOpenExam={(id) => setView({ kind: 'exam', examId: id })}
              onReload={reload}
              onCreate={() => setView({ kind: 'create' })}
            />
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
    </PageTransition>
  )
}
