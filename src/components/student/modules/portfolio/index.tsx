'use client'

/**
 * PortfolioModule — the Portfolio tab of "My Progress".
 *
 * A showcase surface, deliberately distinct from Achievements: NO score
 * gauges, NO rank, NO share links — just the work. Featured (up to 2,
 * the store's rule) → My work (kind-filtered grid, filters derived from
 * the store) → Skills as evidence (skillsWithEvidence, no scores) →
 * Recent (last 3). Every action is real: add / edit / feature / visibility
 * / remove write to the canonical growth store; "Download" opens a real
 * print-window document (portfolio-html.ts + openPrintWindow).
 *
 * The old mock-backed module (fake score gauges, class-rank hero,
 * fake share-link toast, purple gradient wall) is gone — the legacy mock
 * portfolio file now has zero importers.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, LayoutGrid, Tags } from 'lucide-react'
import { StudentPageHeader } from '@/components/student/shell/page-header'
import { GlassCard } from '@/components/shared/ui'
import { toast } from 'sonner'
import { openPrintWindow } from '@/lib/download-file'
import {
  useStudentGrowthStore,
  skillsWithEvidence,
  GROWTH_DEMO_STUDENT,
  type PortfolioItem,
} from '@/lib/store/student-growth-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { FeaturedSection } from './featured-section'
import { WorkSection } from './work-section'
import { SkillsSection } from './skills-section'
import { RecentSection } from './recent-section'
import { ItemDetail } from './item-detail'
import { ItemFormDialog, type ItemFormState } from './item-form-dialog'
import { buildPortfolioHTML, portfolioFileName } from './portfolio-html'
import { BTN_OUTLINE, BTN_PRIMARY, PortfolioEmptyState } from './shared'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function PortfolioModule() {
  const items = useStudentGrowthStore((s) => s.portfolioItems)
  const achievements = useStudentGrowthStore((s) => s.achievements)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormState | null>(null)

  // The roster's canonical record for the demo student (fees-module
  // precedent) — the print document carries the real name / class once.
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))

  const skills = useMemo(() => skillsWithEvidence({ achievements, portfolioItems: items }), [achievements, items])
  const featured = useMemo(
    () =>
      items
        .filter((i) => i.featured)
        .sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0)),
    [items],
  )
  // Subjects for the add/edit form — derived from the store (items ∪
  // achievements), never a hardcoded list.
  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...items.map((i) => i.subject),
            ...achievements.map((a) => a.subject),
          ].filter((s): s is string => !!s),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items, achievements],
  )

  function openAdd() {
    setForm({ mode: 'add' })
  }

  function handleEdit(item: PortfolioItem) {
    setDetailId(null)
    setForm({ mode: 'edit', item })
  }

  function handleDownload() {
    const name = student?.name ?? GROWTH_DEMO_STUDENT
    const classSection = student ? `${student.className}-${student.section}` : 'Class 2-A'
    const html = buildPortfolioHTML({
      student: {
        name,
        classSection,
        admissionNo: student?.admissionNo,
        rollNo: student?.rollNo,
      },
      items,
      achievements,
      skills,
      asOn: todayISO(),
    })
    const w = openPrintWindow(html, portfolioFileName(name))
    if (w) {
      toast.success('Portfolio print view opened', {
        description: 'Use your browser’s print dialog to print it or save it as a PDF.',
      })
    } else {
      toast.error('Print window blocked', {
        description: 'Allow pop-ups for this page, then try again.',
      })
    }
  }

  const empty = items.length === 0

  return (
    <div className="space-y-5">
      <StudentPageHeader
        title="My Portfolio"
        subtitle="Work you're proud to show"
        chips={
          empty
            ? undefined
            : [
                { label: `${items.length} ${items.length === 1 ? 'item' : 'items'}`, icon: LayoutGrid },
                { label: `${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`, icon: Tags },
              ]
        }
      />

      {/* Toolbar — the module's two real actions */}
      {!empty && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={openAdd} className={BTN_OUTLINE}>
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download portfolio as PDF"
            title="Opens a print view — save it as PDF from the print dialog"
            className={BTN_PRIMARY}
          >
            <Download className="h-4 w-4" aria-hidden />
            Download
          </button>
        </div>
      )}

      {empty ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <GlassCard hover={false} className="on-card">
            <PortfolioEmptyState
              title="Your portfolio is waiting for your first project."
              note="Add work you're proud of — projects, artwork, activities — and feature your strongest pieces."
              action={
                <button type="button" onClick={openAdd} className={BTN_PRIMARY}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Add work
                </button>
              }
            />
          </GlassCard>
        </motion.div>
      ) : (
        <>
          <FeaturedSection items={featured} onOpen={setDetailId} />
          <WorkSection items={items} onOpen={setDetailId} />
          <SkillsSection achievements={achievements} portfolioItems={items} />
          <RecentSection items={items} onOpen={setDetailId} />
        </>
      )}

      {/* Dialogs */}
      <ItemDetail itemId={detailId} onClose={() => setDetailId(null)} onEdit={handleEdit} />
      <ItemFormDialog form={form} subjects={subjects} onClose={() => setForm(null)} />
    </div>
  )
}
