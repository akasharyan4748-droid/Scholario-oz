'use client'

/**
 * LibraryModule — Principal Library workspace orchestrator.
 *
 * The global sidebar already says "Library", so the header here uses a
 * contextual title ("Library Catalogue & Issues") — NO duplicate "Library
 * Management" title.
 *
 * Layout:
 *   - Header: contextual title + Issue Book button
 *   - Summary pill line: books · issued · available · overdue · fines
 *   - Tab navigation: Catalogue · Issued · Overdue · Fines · Reports
 *   - Active tab panel:
 *       * catalogue: BooksCatalogue
 *       * issues:    IssuedBooksTable (all issued)
 *       * overdue:   IssuedBooksTable (overdue filter)
 *       * fines:     FinesSummary
 *       * reports:   LibraryReports
 *   - Issue Book dialog (preselects book when triggered from catalogue)
 *
 * State from library-store + useLibraryData.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, BookCopy, AlertTriangle, IndianRupee, Library as LibraryIcon,
  Plus, BookMarked, CheckCircle2, FileBarChart2, IndianRupee as Rupee,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLibraryStore, useLibraryData } from '@/lib/store/library-store'
import { formatINR } from '@/lib/format'
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

  // Tab badges (real counts)
  const tabBadges: Partial<Record<LibTab, number>> = {
    issues: analytics.activeIssuesCount,
    overdue: analytics.overdueCount,
    fines: issues.filter((i) => i.fineStatus === 'Pending' && i.fine > 0).length,
  }

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
    <div className="flex flex-col h-full library-shell">
      <style dangerouslySetInnerHTML={{ __html: LIB_GLOBAL_STYLES }} />

      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                Central Library
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Library Catalogue & Issues</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => openIssueDialog()}
              >
                <Plus className="h-3.5 w-3.5" /> Issue Book
              </Button>
            </div>
          </div>

          {/* Summary pill line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums inline-flex items-center gap-1">
              <LibraryIcon className="h-2.5 w-2.5" /> Books <span className="font-bold text-foreground">{analytics.totalBooks}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" /> Issued <span className="font-bold text-amber-600">{analytics.totalIssued}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <BookCopy className="h-2.5 w-2.5" /> Available <span className="font-bold text-emerald-600">{analytics.totalAvailable}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" /> Overdue <span className="font-bold text-rose-600">{analytics.overdueCount}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Rupee className="h-2.5 w-2.5" /> Fines <span className="font-bold text-rose-600">{formatINR(analytics.totalFines, true)}</span>
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-fit">
            {TABS.map((t) => {
              const badge = tabBadges[t.value]
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  aria-current={tab === t.value ? 'page' : undefined}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                    tab === t.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      'inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold tabular-nums',
                      t.value === 'overdue' || t.value === 'fines'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : tab === t.value
                          ? 'bg-muted/80 text-muted-foreground'
                          : 'bg-muted/60 text-muted-foreground',
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Active tab panel */}
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
      </div>

      <IssueBookDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        preselectBook={preselectBook}
      />
    </div>
  )
}
