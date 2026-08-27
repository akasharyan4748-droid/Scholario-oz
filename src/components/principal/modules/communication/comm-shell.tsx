'use client'

/**
 * comm-shell — Communication Center orchestrator.
 *
 * Converged to the Academics (Exams + Attendance) shell pattern:
 *   <PageTransition className="space-y-4 comm-shell">
 *     <div className="flex items-center justify-between gap-3 flex-wrap">
 *       <SegmentedTabs ... />   // Announcements · Circulars · Compose · History
 *     </div>
 *     <AnimatePresence mode="wait"> tab content </AnimatePresence>
 *   </PageTransition>
 *
 * NO sticky header, NO eyebrow, NO h1 (sidebar already says "Communication"),
 * NO summary pills (counts already live as tab badges on Announcements),
 * NO double-scroll. The AppShell already provides the scroll container +
 * padding.
 *
 * NO separate SMS/Email/Push tabs — channels live inside the Compose tab.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useCommunicationStore } from '@/lib/store/communication-store'
import type { CommTab } from './comm-shared'
import { COMM_GLOBAL_STYLES } from './comm-shared'
import { AnnouncementsSection } from './comm-announcements'
import { CircularsSection } from './comm-circulars'
import { ComposeSection } from './comm-compose'
import { HistorySection } from './comm-history'

const TABS = [
  { value: 'announcements', label: 'Announcements' },
  { value: 'circulars', label: 'Circulars' },
  { value: 'compose', label: 'Compose' },
  { value: 'history', label: 'History' },
]

export function CommShell() {
  const [tab, setTab] = useState<CommTab>('announcements')
  const announcements = useCommunicationStore((s) => s.announcements)

  const scheduledCount = announcements.filter((a) => a.status === 'Scheduled').length
  const draftCount = announcements.filter((a) => a.status === 'Draft' && !a.archived).length

  // The Announcements tab badge surfaces scheduled + draft counts — the
  // summary pills that used to live in the header are now collapsed into
  // this single tab badge (one home per metric, no duplicate display).
  const announcementsBadge = scheduledCount + draftCount

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
          setTab(TABS[idx].value as CommTab)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const tabs = TABS.map((t) => ({
    ...t,
    badge: t.value === 'announcements' && announcementsBadge > 0 ? announcementsBadge : undefined,
  }))

  return (
    <PageTransition className="space-y-4 comm-shell">
      <style dangerouslySetInnerHTML={{ __html: COMM_GLOBAL_STYLES }} />

      {/* Tab row — SegmentedTabs on the left, no right-side control. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={tabs}
          value={tab}
          onValueChange={(v) => setTab(v as CommTab)}
        />
      </div>

      {/* Active tab content. */}
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
    </PageTransition>
  )
}
