'use client'

/**
 * SharesTab — shared resources (spec §41).
 *
 * Each row RESOLVES the real learning-store resource by id (title,
 * type chip, subject — live, never copied), shows who shared it and
 * their note, and carries working [Save]/[Saved] (toggleSaveShare —
 * "save to collection") and [Report] (reportItem → persisted teacher
 * review flag) affordances. Sharing is permission-controlled: the
 * picker only offers the student's own bookmarked / recently studied
 * resources — no private notes, no unseen documents.
 *
 * Honest empty state (§57): "Nothing shared yet."
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, ChevronRight, Flag, Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { TypeChip, sizeLabelOf } from '../resources/type-meta'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore } from '@/lib/store/student-learning-store'
import { displayOf, useStudentGroupsStore } from '@/lib/store/student-groups-store'
import { BTN_GHOST, BTN_OUTLINE, InitialCircle, ReportedChip } from './shared'
import { SharePickerModal } from './share-picker-modal'

interface SharesTabProps {
  /** Cross-tab link (§42): opens the Learning Hub — rendered only when wired. */
  goToTab?: (tab: string) => void
}

export function SharesTab({ goToTab }: SharesTabProps) {
  const shares = useStudentGroupsStore((s) => s.shares)
  const toggleSaveShare = useStudentGroupsStore((s) => s.toggleSaveShare)
  const reportItem = useStudentGroupsStore((s) => s.reportItem)
  const resources = useStudentLearningStore((s) => s.resources)

  const [pickerOpen, setPickerOpen] = useState(false)

  const savedCount = useMemo(() => shares.filter((sh) => sh.savedByMe).length, [shares])

  const save = (shareId: string, title: string) => {
    const willSave = !shares.find((sh) => sh.id === shareId)?.savedByMe
    toggleSaveShare(shareId)
    if (willSave) toast.success('Saved to your collection', { description: title })
    else toast('Removed from saved', { description: title })
  }

  const report = (shareId: string) => {
    reportItem('share', { shareId })
    toast.warning('Reported — your class teacher will review', {
      description: "Students can't delete each other's content. Reports go to your class teacher only.",
    })
  }

  return (
    <motion.div
      key="sh"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel hint={shares.length > 0 ? `${shares.length} shared · ${savedCount} saved by you` : undefined}>
          Shared resources
        </SectionLabel>
        <button type="button" onClick={() => setPickerOpen(true)} className={BTN_OUTLINE}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Share a resource
        </button>
      </div>

      {shares.length === 0 ? (
        <GlassCard hover={false} className="on-card px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Nothing shared yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Share something from your library that your class found helpful.</p>
          <button type="button" onClick={() => setPickerOpen(true)} className={cn(BTN_OUTLINE, 'mt-4')}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Share a resource
          </button>
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
          {shares.map((sh, i) => {
            const resource = resources.find((r) => r.id === sh.resourceId)
            const sc = resource ? subjectColor(resource.subject) : null
            return (
              <motion.div
                key={sh.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
                className="flex flex-col gap-2.5 p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {resource ? (
                      <>
                        <TypeChip type={resource.type} />
                        {sc && (
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', sc.bg, sc.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                            {resource.subject}
                          </span>
                        )}
                        {sizeLabelOf(resource) && (
                          <span className="text-[10px] text-muted-foreground">{sizeLabelOf(resource)}</span>
                        )}
                      </>
                    ) : (
                      <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Resource no longer available
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold leading-snug">{resource?.title ?? sh.resourceId}</p>
                  {sh.note && (
                    <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">“{sh.note}”</p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <InitialCircle name={sh.sharedByName} className="h-5 w-5 text-[8px]" />
                    {displayOf(sh.sharedByName)} · {formatRelativeTime(sh.sharedOn)}
                  </p>
                  {sh.reportedByMe && (
                    <div className="mt-1.5">
                      <ReportedChip />
                    </div>
                  )}
                </div>

                {/* Row actions */}
                <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => save(sh.id, resource?.title ?? sh.resourceId)}
                    aria-pressed={sh.savedByMe}
                    aria-label={sh.savedByMe ? `Remove ${resource?.title ?? 'resource'} from saved` : `Save ${resource?.title ?? 'resource'} to your collection`}
                    className={cn(
                      'inline-flex h-11 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9',
                      sh.savedByMe
                        ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )}
                  >
                    {sh.savedByMe ? <BookmarkCheck className="h-3.5 w-3.5" aria-hidden /> : <Bookmark className="h-3.5 w-3.5" aria-hidden />}
                    {sh.savedByMe ? 'Saved' : 'Save'}
                  </button>
                  {!sh.reportedByMe && (
                    <button
                      type="button"
                      onClick={() => report(sh.id)}
                      className={BTN_GHOST}
                      aria-label={`Report ${resource?.title ?? 'shared resource'}`}
                    >
                      <Flag className="h-3 w-3" aria-hidden />
                      Report
                    </button>
                  )}
                  {goToTab && resource && (
                    <button
                      type="button"
                      onClick={() => goToTab('resources')}
                      className={BTN_GHOST}
                      aria-label={`Open ${resource.title} in the Learning Hub`}
                    >
                      Open
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </GlassCard>
      )}

      <SharePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </motion.div>
  )
}
