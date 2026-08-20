'use client'

/**
 * ExamWorkspace — full-screen examination workspace.
 *
 * Replaces the old modal ExamWorkspaceDialog. The Principal enters
 * this workspace when they click an exam. It takes over the entire
 * content area with a top header (back + title + status) and a
 * 10-section navigation bar.
 *
 * This file is the orchestrator only — all section components live
 * in their own files (overview-section, schedule-section, marks-section,
 * grade-section, audit-section) and shared primitives live in
 * workspace-shared.tsx.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineLoading } from './inline-loading'
import { useExamMock as useExam } from '@/lib/exams/use-exams-mock'
import { useInitMockMarks } from '@/lib/exams/use-marks-mock'
import { cn } from '@/lib/utils'
import {
  GraceSection,
  OutcomesSection,
} from './workspace-sections-extended'
import { SeatingSection } from './seating/seating-section'
import { ExamAttendanceSection } from './exam-attendance-section'
import { AdmitCardsSection } from './admit-cards-section'

// Shared primitives (status pills) + Tab type shared with section files.
import { StatusPill, ResultStatusPill, type Tab } from './workspace-shared'
import { OverviewSection } from './overview-section'
import { ScheduleSection } from './schedule-section'
import { MarksSection } from './marks-section'
import { GradeSection } from './grade-section'
import { AuditSection } from './audit-section'

interface Props {
  examId: string
  onBack: () => void
  onMutated: () => void
}

// Tabs grouped into 3 phases for easier scanning.
// Each group is rendered with a small separator dot before it.
// NOTE: The old "results" tab has been merged into "marks" to remove the
// duplication the spec called out. Marks now contains the full assessment
// experience (entry → submit → verify → lock → declare → publish → view).
// Admit Cards belong inside the examination (not in Reports) — they are
// examination-specific operational documents, not analytics.
const TAB_GROUPS: Array<{ label: string; items: Array<{ value: Tab; label: string }> }> = [
  {
    label: 'Setup',
    items: [
      { value: 'overview', label: 'Overview' },
      { value: 'schedule', label: 'Schedule' },
      { value: 'seating', label: 'Seating' },
      { value: 'admit-cards', label: 'Admit Cards' },
    ],
  },
  {
    label: 'Execution',
    items: [
      { value: 'marks', label: 'Marks' },
      { value: 'attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'Post-Exam',
    items: [
      { value: 'grade', label: 'Grade' },
      { value: 'outcomes', label: 'Outcomes' },
      { value: 'grace', label: 'Grace' },
      { value: 'audit', label: 'Audit' },
    ],
  },
]

// Flat list (kept for backward-compat callers like onNavigate callbacks)
const TABS = TAB_GROUPS.flatMap((g) => g.items)

export function ExamWorkspace({ examId, onBack, onMutated }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { exam, loading, error, reload } = useExam(examId)
  // Initialize mock marks when the exam loads.
  useInitMockMarks(exam)

  // Keyboard shortcuts: 1-9 switches tabs, Esc goes back.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/selects/textareas.
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1
        if (idx < TABS.length) {
          e.preventDefault()
          setTab(TABS[idx].value)
        }
      } else if (e.key === 'Escape') {
        // Only go back if not in a dialog/input.
        const inDialog = (e.target as HTMLElement)?.closest('[role="dialog"], [role="region"]')
        if (!inDialog) {
          e.preventDefault()
          onBack()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  const handleReload = () => {
    reload()
    onMutated()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top header — full width */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 shrink-0" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Examinations
              </Button>
              <div className="h-6 w-px bg-border shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate">{exam?.name ?? 'Loading…'}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {exam ? `${exam.type} · ${exam.session} · ${exam.classes.length} classes · ${exam.subjects.length} subjects` : ''}
                </p>
              </div>
            </div>
            {exam && (
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={exam.status} />
                <ResultStatusPill status={exam.resultStatus} />
              </div>
            )}
          </div>
        </div>
        {/* Section navigation — grouped by phase */}
        <div className="px-4 sm:px-6 pb-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {TAB_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-2">
                {gi > 0 && <span className="text-muted-foreground/40 text-xs select-none" aria-hidden>•</span>}
                <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
                  {group.items.map((t) => {
                    const tabIdx = TABS.indexOf(t)
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        title={`Switch to ${t.label} (Press ${tabIdx + 1})`}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                          tab === t.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t.label}
                        <kbd className={cn(
                          'hidden sm:inline-flex items-center justify-center h-3.5 px-0.5 rounded text-[8px] font-mono leading-none',
                          tab === t.value ? 'bg-muted/60 text-muted-foreground' : 'bg-muted/30 text-muted-foreground/50',
                        )}>{tabIdx + 1}</kbd>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content — full available width */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <InlineLoading label="Loading examination…" />
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        ) : !exam ? null : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'overview' && <OverviewSection exam={exam} onReload={handleReload} onNavigate={setTab} />}
              {tab === 'schedule' && <ScheduleSection exam={exam} onReload={handleReload} />}
              {tab === 'marks' && <MarksSection exam={exam} onReload={handleReload} />}
              {tab === 'outcomes' && <OutcomesSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'seating' && <SeatingSection exam={exam} />}
              {tab === 'admit-cards' && <AdmitCardsSection exam={exam} />}
              {tab === 'attendance' && <ExamAttendanceSection exam={exam} />}
              {tab === 'grade' && <GradeSection exam={exam} />}
              {tab === 'grace' && <GraceSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'audit' && <AuditSection examId={exam.id} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
