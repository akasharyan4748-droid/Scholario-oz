'use client'

/**
 * LibraryModule — Principal Library workspace orchestrator.
 *
 * Visual shell follows the Academics (Examinations + Attendance) canonical
 * pattern:
 *   <PageTransition className="space-y-4">
 *     <div className="flex items-center justify-between gap-3 flex-wrap">
 *       <SegmentedTabs ... />            ← left
 *       <Button>Issue Book</Button>      ← right (primary, solid emerald)
 *     </div>
 *     <AnimatePresence mode="wait">
 *       {tab === 'catalogue' && <motion.div key="catalogue" ...><BooksCatalogue /></motion.div>}
 *       ...
 *     </AnimatePresence>
 *   </PageTransition>
 *
 * NO sticky header, NO eyebrow, NO h1, NO summary pill line — the sidebar
 * already names the module, and the per-tab content (panel subtitles, tab
 * badges, FineStatCards) is the single home for each metric.
 *
 * Layout:
 *   - Tab row: Catalogue · Issued · Overdue · Fines · Reports (left)
 *              + Issue Book button (right)
 *   - Active tab panel:
 *       * catalogue: BooksCatalogue
 *       * issues:    active-loans banner + IssuedBooksTable (all issued)
 *       * overdue:   IssuedBooksTable (overdue filter)
 *       * fines:     FinesSummary
 *       * reports:   LibraryReports
 *   - Issue Book dialog (preselects book when triggered from catalogue)
 *
 * State from library-store + useLibraryData. Keyboard shortcuts 1-5.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, AlertTriangle, IndianRupee, Plus, BookMarked, CheckCircle2,
  FileBarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useLibraryStore, useLibraryData } from '@/lib/store/library-store'
import { toast } from 'sonner'
import type { Book } from '@/lib/store/library-store'
import { LIB_GLOBAL_STYLES, LibPill, type LibTab } from './library-shared'
import { BooksCatalogue, IssuedBooksTable } from './books-tables'
import { IssueBookDialog } from './issue-book-dialog'
import { FinesSummary, LibraryReports } from './fines-summary'

const TABS: Array<{ value: LibTab; label: string; icon: React.ReactNode; badge?: number }> = [
  { value: 'catalogue', label: 'Catalogue', icon: <BookMarked className="h-3.5 w-3.5" /> },
  { value: 'issues', label: 'Issued', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: 'overdue', label: 'Overdue', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: 'fines', label: 'Fines', icon: <IndianRupee className="h-3.5 w-3.5" /> },
  { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
]

export function LibraryModule() {
  const [tab, setTab] = useState<LibTab>('catalogue')
  const [issueOpen, setIssueOpen] = useState(false)
  const [preselectBook, setPreselectBook] = useState<Book | null>(null)

  const returnBook = useLibraryStore((s) => s.returnBook)
  const issues = useLibraryStore((s) => s.issues)
  const data = useLibraryData()
  const { analytics } = data

  // Tab badges (real counts). SegmentedTabs suppresses rendering when 0.
  const tabsWithBadges = TABS.map((t) => {
    const badgeMap: Partial<Record<LibTab, number>> = {
      issues: analytics.activeIssuesCount,
      overdue: analytics.overdueCount,
      fines: issues.filter((i) => i.fineStatus === 'Pending' && i.fine > 0).length,
    }
    return { ...t, badge: badgeMap[t.value] }
  })

  // Keyboard shortcuts: 1-5 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '5') {
        const idx = Number(e.key) - 1
        if (idx < TABS.length) {
          e.preventDefault()
          setTab(TABS[idx].value)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openIssueDialog = (book?: Book) => {
    setPreselectBook(book ?? null)
    setIssueOpen(true)
  }

  const handleReturn = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (!issue) return
    returnBook(issueId)
    toast.success('Book returned', {
      description: `${issue.bookTitle} returned by ${issue.borrowerName}${
        issue.status === 'Overdue' ? ` · Fine calculated based on days overdue` : ''
      }`,
    })
  }

  const handleSendReminder = (issue: { id: string; borrowerName: string; bookTitle: string; dueDate: string }) => {
    toast.success('Reminder sent', {
      description: `Overdue reminder sent to ${issue.borrowerName} for "${issue.bookTitle}"`,
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LIB_GLOBAL_STYLES }} />
      <PageTransition className="space-y-4 library-shell">
      {/* Tab row + Issue Book action on the right */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={tabsWithBadges}
          value={tab}
          onValueChange={(v) => setTab(v as LibTab)}
        />
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => openIssueDialog()}
        >
          <Plus className="h-3.5 w-3.5" /> Issue Book
        </Button>
      </div>

      {/* Active tab content with AnimatePresence transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {tab === 'catalogue' && (
            <BooksCatalogue onIssueBook={(b) => openIssueDialog(b)} />
          )}
          {tab === 'issues' && (
            <>
              {/* Active issued banner */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/[0.04] dark:bg-sky-500/[0.06] border border-sky-500/20">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{analytics.activeIssuesCount}</span> active loans ·{' '}
                  <span className="font-semibold text-rose-600">{analytics.overdueCount} overdue</span> ·{' '}
                  <span className="font-semibold text-emerald-600">{analytics.activeIssuesCount - analytics.overdueCount} on schedule</span>
                </p>
                <LibPill accent="bg-sky-500/10 text-sky-700 dark:text-sky-300" className="ml-auto">
                  14-day loan period
                </LibPill>
              </div>
              <IssuedBooksTable filter="all" onReturn={handleReturn} />
            </>
          )}
          {tab === 'overdue' && (
            <IssuedBooksTable filter="overdue" onReturn={handleReturn} onSendReminder={handleSendReminder} />
          )}
          {tab === 'fines' && <FinesSummary />}
          {tab === 'reports' && <LibraryReports />}
        </motion.div>
      </AnimatePresence>

      <IssueBookDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        preselectBook={preselectBook}
      />
      </PageTransition>
    </>
  )
}
