'use client'

/**
 * comm-shell — Communication Center orchestrator.
 *
 * 4-tab workspace:
 *   Announcements · Circulars · Compose · History
 *
 * The global header already says "Communication Center" so this shell
 * does NOT repeat the title. Content starts with contextual info.
 *
 * NO separate SMS/Email/Push tabs — channels live inside the Compose tab.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, FileText, Plus, History as HistoryIcon, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { school } from '@/lib/mock/school'
import { useCommunicationStore } from '@/lib/store/communication-store'
import type { CommTab } from './comm-shared'
import { COMM_GLOBAL_STYLES } from './comm-shared'
import { AnnouncementsSection } from './comm-announcements'
import { CircularsSection } from './comm-circulars'
import { ComposeSection } from './comm-compose'
import { HistorySection } from './comm-history'

const TABS: Array<{ value: CommTab; label: string; icon: React.ReactNode }> = [
  { value: 'announcements', label: 'Announcements', icon: <Megaphone className="h-3.5 w-3.5" /> },
  { value: 'circulars', label: 'Circulars', icon: <FileText className="h-3.5 w-3.5" /> },
  { value: 'compose', label: 'Compose', icon: <Plus className="h-3.5 w-3.5" /> },
  { value: 'history', label: 'History', icon: <HistoryIcon className="h-3.5 w-3.5" /> },
]

export function CommShell() {
  const [tab, setTab] = useState<CommTab>('announcements')
  const announcements = useCommunicationStore((s) => s.announcements)

  const scheduledCount = announcements.filter((a) => a.status === 'Scheduled').length
  const draftCount = announcements.filter((a) => a.status === 'Draft' && !a.archived).length
  const activeCount = announcements.filter((a) => !a.archived && a.status !== 'Draft').length

  const tabBadges: Partial<Record<CommTab, number>> = {
    announcements: scheduledCount + draftCount,
  }

  // Keyboard shortcuts: 1-4 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '4') {
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

  return (
    <div className="flex flex-col h-full comm-shell">
      <style dangerouslySetInnerHTML={{ __html: COMM_GLOBAL_STYLES }} />
      {/* Header — contextual content (NOT a duplicate "Communication Center" title) */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">Academic Year {school.academicYear}</p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Announcements, Circulars & Messaging</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => setTab('compose')}
              >
                <Plus className="h-3.5 w-3.5" /> New Announcement
              </Button>
            </div>
          </div>
          {/* Summary pill line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums">Active <span className="font-bold text-foreground">{activeCount}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">Scheduled <span className="font-bold text-amber-600">{scheduledCount}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">Drafts <span className="font-bold text-muted-foreground">{draftCount}</span></span>
            {(scheduledCount + draftCount) > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold tabular-nums">
                  <AlertCircle className="h-2.5 w-2.5" /> {scheduledCount + draftCount} pending
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-max">
            {TABS.map((t) => {
              const badge = tabBadges[t.value]
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  aria-current={tab === t.value ? 'page' : undefined}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
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
                      tab === t.value ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground',
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
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'announcements' && <AnnouncementsSection onNavigate={setTab} />}
            {tab === 'circulars' && <CircularsSection />}
            {tab === 'compose' && <ComposeSection />}
            {tab === 'history' && <HistorySection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
