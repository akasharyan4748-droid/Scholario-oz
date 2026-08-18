'use client'

/**
 * ExamsModule — Principal-facing Examinations workspace.
 *
 * Architecture: 4 top-level tabs + full-screen workspaces.
 *   • List view: Overview / Exams / Reports / Settings
 *     - Overview/Exams/Reports show a compact session picker (right side)
 *     - Settings shows an Archive button (right side) — Archive is the
 *       historical records entry, conceptually distinct from the active
 *       session switcher on Overview
 *   • Exam Workspace (full-screen, 7 grouped sections)
 *   • Create Examination (full-screen, single-page form)
 *   • Archive (full-screen historical records viewer)
 *
 * Schedule, Marks, Results are NOT top-level tabs — they live INSIDE the
 * Exam Workspace. This removes the previous duplication where the same data
 * appeared in two places (top-level tab + workspace sub-tab).
 *
 * The active session picker drives the Session Top Performers section in
 * Overview and represents the CURRENT academic context.
 *
 * Archive is for HISTORICAL sessions — past academic years, published
 * results, student historical performance.
 *
 * Reads exclusively from /api/exams/* — no localStorage, no mock data.
 * Archive uses mock historical records (src/lib/exams/archive-data.ts).
 */

import { useState, useMemo } from 'react'
import { ChevronDown, Archive as ArchiveIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useExamsList } from '@/lib/exams/use-exams'
import { AVAILABLE_SESSIONS } from '@/lib/exams/session-toppers-data'
import { useAcademicClasses } from '@/lib/mock/academic/use-academic-classes'
import type { ExamLevelClass } from '@/lib/mock/academic'
import { ExamsOverviewTab } from './tabs/overview-tab'
import { ExamsListTab } from './tabs/exams-list-tab'
import { ReportsTab } from './tabs/reports-tab'
import { SettingsTab } from './tabs/settings-tab'
import { ArchiveView } from './tabs/archive-view'
import { CreateExamFullScreen, type ClassDTO } from './create-exam-fullscreen'
import { ExamWorkspace } from './exam-workspace'

type SectionTab = 'overview' | 'exams' | 'reports' | 'settings'
type View = { kind: 'list' } | { kind: 'exam'; examId: string } | { kind: 'create' } | { kind: 'archive' }

const SECTION_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'exams', label: 'Exams' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
]

/**
 * Convert mock-resolved ExamLevelClass[] to the ClassDTO[] shape that
 * CreateExamFullScreen expects (Spec §1 / §15 / §28).
 *
 * Each ExamLevelClass is already an exam-level entry (sections collapsed
 * inside the ClassRecord), so we emit ONE ClassDTO per entry. `section` is
 * set to null — Examination must NOT show sections (Spec §3 / §15).
 *
 * Mock subjects are hydrated with default fullMarks=100 / passMarks=33
 * (matching the Examination service defaults). The Examination Settings
 * tab can override these per subject later.
 */
function toClassDTOs(examClasses: ExamLevelClass[]): ClassDTO[] {
  return examClasses.map((c) => ({
    id: c.id,
    name: c.name,
    gradeLevel: String(c.gradeLevel),
    section: null,
    stream: c.stream,
    studentCount: 0,
    subjects: c.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      fullMarks: 100,
      passMarks: 33,
      isCore: s.category === 'Core',
      examinable: true,
      displayOrder: 0,
    })),
  }))
}

export function ExamsModule() {
  const [section, setSection] = useState<SectionTab>('overview')
  const [view, setView] = useState<View>({ kind: 'list' })
  // Active session picker drives the Session Top Performers section in Overview.
  // Default to the current academic year from the API.
  const { exams, academicYear, loading, error, reload } = useExamsList()
  const [session, setSession] = useState<string>(academicYear || '2025-2026')

  // Spec §1 / §15 / §28: classes + subjects for Create Exam come from the
  // shared mock academic source (Students & Classes Zustand store), NOT
  // from the DB-backed /api/exams route. Mutations in Students & Classes
  // (add / archive / restore / rename subject) propagate here instantly.
  const examLevelClasses = useAcademicClasses()
  const classes = useMemo(() => toClassDTOs(examLevelClasses), [examLevelClasses])

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
  if (view.kind === 'archive') {
    return <ArchiveView onBack={() => setView({ kind: 'list' })} />
  }

  // List view — the standard Examinations landing
  // Session picker is shown ONLY on Overview (it drives the session context
  // for the Overview dashboard). Settings shows the Archive button instead.
  // Exams and Reports inherit the session context without showing a picker.
  const showSessionPicker = section === 'overview'
  const showArchiveButton = section === 'settings'

  return (
    <PageTransition className="space-y-4">
      {/* Tab row + right-side control (session picker on Overview, archive button on Settings) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={SECTION_TABS}
          value={section}
          onValueChange={(v) => setSection(v as SectionTab)}
        />
        {showSessionPicker && <SessionPicker value={session} onChange={setSession} />}
        {showArchiveButton && <ArchiveButton onClick={() => setView({ kind: 'archive' })} />}
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
              session={session}
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
            <SettingsTab onOpenArchive={() => setView({ kind: 'archive' })} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

// ─── Compact Session Picker ──────────────────────────────────────────
//
// Sits on the same row as the Overview/Exams/Reports/Settings tabs,
// on the right side. Small, subtle, professional — feels like a small
// control rather than a form field.
// NOT shown on Settings — Settings has the Archive button instead.

function SessionPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Academic session"
        className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-full bg-muted/60 hover:bg-muted text-foreground border border-transparent hover:border-border/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {AVAILABLE_SESSIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
}

// ─── Archive Button (shown on Settings tab right side) ───────────────
//
// Archive is the historical records entry — past academic sessions,
// published examination results, student historical performance.
// Conceptually distinct from the active session picker.

function ArchiveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-full bg-muted/60 hover:bg-muted text-foreground border border-transparent hover:border-border/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <ArchiveIcon className="h-3.5 w-3.5" />
      <span>Archive</span>
    </button>
  )
}


