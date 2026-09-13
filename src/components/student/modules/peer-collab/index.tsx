'use client'

/**
 * PeerCollaborationModule — the "Study Groups" tab of the Learning
 * module (spec §36–§43): class-scoped study groups, a Q&A forum and
 * shared resources. This is a FORUM, not a messaging system (§42) —
 * threads and expandable rows only, with contextual links into the
 * module's own tabs.
 *
 * PRIVACY IS FIRST-CLASS (§37): the scope chip sits in the page
 * header ("Class 2-A only · teacher-moderated"), the policy line
 * closes the page, and every moderation affordance reports to the
 * class teacher — students never delete each other's content (§40).
 *
 * NO KPI WALL (§61/§66): the old hardcoded collaborationStats cards,
 * gradient hero and fabricated weekly chart are gone. One honest
 * "Class activity" strip derives its facts from the groups store.
 *
 * Local chips switch Groups · Q&A · Shared; the groups drill-down
 * deep-links into a Q&A thread via focusQuestionId.
 */

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { StudentPageHeader, type PageChip } from '@/components/student/shell/page-header'
import { cn } from '@/lib/utils'
import { PEER_TABS, type PeerTab } from './shared'
import { ClassActivity } from './class-activity'
import { GroupsTab } from './groups-tab'
import { QaTab } from './qa-tab'
import { SharesTab } from './shares-tab'

interface PeerCollaborationModuleProps {
  /** Cross-tab navigation inside the Learning module (wired by learning.tsx). */
  goToTab?: (tab: string) => void
}

const PRIVACY_CHIPS: PageChip[] = [
  {
    label: 'Class 2-A only · teacher-moderated',
    icon: ShieldCheck,
    title: 'Study groups never go school-wide — your class teacher reviews this space.',
  },
]

export function PeerCollaborationModule({ goToTab }: PeerCollaborationModuleProps) {
  const [tab, setTab] = useState<PeerTab>('groups')
  const [focusQuestionId, setFocusQuestionId] = useState<string | null>(null)

  // Contextual link (§42): group drill-down → that question's thread.
  const openQuestion = useCallback((questionId: string) => {
    setFocusQuestionId(questionId)
    setTab('qa')
  }, [])

  const consumeFocus = useCallback(() => setFocusQuestionId(null), [])

  return (
    <div className="space-y-6 sm:space-y-7">
      <StudentPageHeader title="Study Groups" subtitle="Learn together, safely" chips={PRIVACY_CHIPS} />

      {/* One honest activity strip — every fact derives from the store */}
      <ClassActivity />

      {/* Local section chips */}
      <div role="tablist" aria-label="Study groups sections" className="flex flex-wrap gap-1.5">
        {PEER_TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                active
                  ? 'border-primary/25 bg-primary/[0.08] text-primary'
                  : 'border-border/80 bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          )
        })}
      </div>

      <div>
        {tab === 'groups' && <GroupsTab onOpenQuestion={openQuestion} />}
        {tab === 'qa' && <QaTab focusQuestionId={focusQuestionId} onFocusConsumed={consumeFocus} />}
        {tab === 'shares' && <SharesTab goToTab={goToTab} />}
      </div>

      {/* Policy line (§37/§38) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-center justify-center gap-1.5 border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground"
      >
        <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        Groups are visible to your class only · your teacher moderates this space
      </motion.p>
    </div>
  )
}
