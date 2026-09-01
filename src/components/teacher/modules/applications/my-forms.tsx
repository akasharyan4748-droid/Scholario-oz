'use client'

/**
 * MyFormsView — TEACHER form creation + management (PART 4/15).
 *
 * A teacher assigned as in-charge can CREATE the official form for their
 * event, SUBMIT it for Principal approval, act on the Principal's decision
 * (edit & resubmit after "Changes Requested"), PUBLISH an Approved form,
 * and download the blank official PDF for offline distribution.
 *
 * PERMISSION BOUNDARY (PART 4 — enforced at the store level, mirrored here):
 *   • the teacher is always the in-charge of forms they create
 *   • publishing is impossible until the Principal approves (store gate)
 *   • financial configuration cannot be changed after creation (store gate)
 *   • money operations NEVER appear in this UI
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bus, CalendarDays, CheckCircle2, ClipboardList, Download, FileText,
  FlaskConical, Landmark, Layers, PencilLine, Plus, Send, ShieldAlert, Sparkles, Tag,
  Tent, Trophy, Award, HandHeart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useApplicationsStore, effectiveAppStatus,
  type SchoolApplication, type ApplicationCategory,
} from '@/lib/store/applications-store'
import { useAuth } from '@/lib/store/auth-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { TourSessionConfig } from '@/components/principal/modules/applications/tour-session-config'
import { applicationDocFileName, downloadApplicationDocument } from '@/components/principal/modules/applications/application-print'
import { AppStatusBadge, ApplicationReviewDetail } from './review-detail'

const CATEGORY_ICON: Record<ApplicationCategory, LucideIcon> = {
  Tour: Bus,
  Trip: Bus,
  Workshop: FlaskConical,
  Competition: Trophy,
  Camp: Tent,
  Event: CalendarDays,
  'Exam Application': ClipboardList,
  'Board Form': Landmark,
  Transport: Sparkles,
  Activity: CalendarDays,
  Certificate: Award,
  Donation: HandHeart,
  Custom: Tag,
}

type View =
  | { name: 'list' }
  | { name: 'builder'; editingId?: string }
  | { name: 'detail'; appId: string }

export function MyFormsView() {
  const { user } = useAuth()
  const applications = useApplicationsStore((s) => s.applications)
  const classes = useStudentsStore((s) => s.classes)
  const submitForApproval = useApplicationsStore((s) => s.submitForApproval)
  const publishApplication = useApplicationsStore((s) => s.publishApplication)

  const [view, setView] = useState<View>({ name: 'list' })
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [submitNote, setSubmitNote] = useState('')

  const meId = user?.teacherId ?? ''
  const meName = user?.name ?? ''

  // MY forms — assigned to me (covers Principal-assigned forms) plus forms
  // I created myself (createdByRole 'Teacher' + my name).
  const mine = useMemo(() => {
    if (!meId && !meName) return []
    return applications.filter(
      (a) => (meId && a.inChargeTeacherId === meId)
        || (!!meName && a.inChargeName === meName)
        || (!!meName && a.createdByRole === 'Teacher' && a.createdBy === meName),
    )
  }, [applications, meId, meName])

  const classNameOf = useMemo(() => {
    const m = new Map(classes.map((c) => [c.id, c.name]))
    return (classId: string) => m.get(classId) ?? classId
  }, [classes])

  const editing = view.name === 'builder' && view.editingId
    ? applications.find((a) => a.id === view.editingId)
    : undefined

  const detailApp = view.name === 'detail' ? applications.find((a) => a.id === view.appId) : undefined

  const doSubmitForApproval = (app: SchoolApplication) => {
    const res = submitForApproval(app.id, meName, 'Teacher', submitNote, { teacherId: meId })
    if (!res.success) {
      toast.error('Cannot submit for approval', { description: res.error })
      return
    }
    toast.success('Submitted for approval', {
      description: 'The Principal reviews it next — you will see the decision on this form.',
    })
    setNoteFor(null)
    setSubmitNote('')
  }

  const doPublish = (app: SchoolApplication) => {
    const res = publishApplication(app.id, meName, { actorRole: 'Teacher', teacherId: meId })
    if (!res.success) {
      toast.error('Publish blocked', { description: res.error })
      return
    }
    toast.success('Published', {
      description: 'Eligible students can now apply from their Applications page.',
    })
  }

  // ── Detail (operational management of a published/assigned form) ──
  if (view.name === 'detail' && detailApp) {
    return (
      <div className="space-y-4">
        <ApplicationReviewDetail app={detailApp} onBack={() => setView({ name: 'list' })} />
      </div>
    )
  }

  // ── Session setup (create / edit my tour draft) — the fixed template,
  //    never a builder. Publishing still flows through the Principal
  //    approval workflow (store-enforced). ──
  if (view.name === 'builder') {
    return (
      <TourSessionConfig
        key={editing?.id ?? 'teacher-new-session'}
        editingId={editing?.id}
        actorRole="Teacher"
        teacherId={meId}
        onClose={() => setView({ name: 'list' })}
        onSaved={() => setView({ name: 'list' })}
      />
    )
  }

  // ── List ──
  const drafts = mine.filter((a) => a.status !== 'Published' && effectiveAppStatus(a) !== 'Archived')
  const live = mine.filter((a) => a.status === 'Published')

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground min-w-0 truncate">
          Create the official form for your event → Principal approval → publish &amp; operate
        </p>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 shrink-0" onClick={() => setView({ name: 'builder' })}>
          <Layers className="h-3 w-3" /> Use Tour Template
        </Button>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40" />
          <p className="mt-2.5 text-sm font-semibold">No forms yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Create the application form for an event you are in-charge of. It goes to the
            Principal for approval before students can see it.
          </p>
          <Button variant="outline" size="sm" className="h-7 mt-3 text-[11px] gap-1" onClick={() => setView({ name: 'builder' })}>
            <Plus className="h-3 w-3" /> Create your first form
          </Button>
        </div>
      ) : (
        <>
          {/* Drafts & approval pipeline */}
          {drafts.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border/60 bg-muted/30">
                <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Drafts &amp; approval pipeline</p>
              </div>
              <div className="divide-y divide-border">
                {drafts.map((a, i) => {
                  const st = effectiveAppStatus(a)
                  const latestNote = a.approvalNotes[a.approvalNotes.length - 1]
                  const Icon = CATEGORY_ICON[a.category]
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.15) }}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/25 transition-colors flex-wrap">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <p className="text-xs font-semibold truncate">{a.title}</p>
                            <AppStatusBadge status={st} />
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">{a.source}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {a.targetStudentIds?.length
                              ? `${a.targetStudentIds.length} selected students`
                              : a.targetClassIds.map(classNameOf).join(', ') || '—'}
                            {' · deadline '}{a.deadline ? formatDate(a.deadline) : 'not set'}
                            {a.createdByRole === 'Teacher' ? ' · created by you' : ''}
                          </p>
                          {/* Principal's / teacher's latest workflow note */}
                          {latestNote && (
                            <p className="text-[10px] mt-1 flex items-start gap-1 text-muted-foreground">
                              {latestNote.kind === 'changes' || latestNote.kind === 'rejection' ? (
                                <ShieldAlert className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                              ) : latestNote.kind === 'approval' ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                              ) : (
                                <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                              )}
                              <span className="line-clamp-2">
                                <span className="font-medium">{latestNote.by}:</span> {latestNote.note}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {(st === 'Draft' || st === 'Changes Requested' || st === 'Rejected') && a.createdByRole === 'Teacher' && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setView({ name: 'builder', editingId: a.id })}>
                              <PencilLine className="h-3 w-3" /> Edit
                            </Button>
                          )}
                          {(st === 'Draft' || st === 'Changes Requested' || st === 'Rejected') && a.createdByRole === 'Teacher' && (
                            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setNoteFor(a.id); setSubmitNote('') }}>
                              <Send className="h-3 w-3" /> Submit for approval
                            </Button>
                          )}
                          {st === 'Pending Approval' && (
                            <span className="text-[10px] text-muted-foreground italic">waiting for the Principal…</span>
                          )}
                          {st === 'Approved' && (
                            <>
                              <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => doPublish(a)}>
                                <Send className="h-3 w-3" /> Publish
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setView({ name: 'detail', appId: a.id })}>
                                Prepare
                              </Button>
                            </>
                          )}
                          {st === 'Approved' && <BlankPdfButton appId={a.id} />}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live forms — operational management */}
          {live.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border/60 bg-muted/30">
                <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Published — you are the operational in-charge</p>
              </div>
              <div className="divide-y divide-border">
                {live.map((a, i) => {
                  const Icon = CATEGORY_ICON[a.category]
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.15) }}
                      onClick={() => setView({ name: 'detail', appId: a.id })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/25 transition-colors text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {a.targetClassIds.map(classNameOf).join(', ') || '—'} · deadline {formatDate(a.deadline)}
                        </p>
                      </div>
                      <AppStatusBadge status={effectiveAppStatus(a)} />
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit-for-approval note dialog */}
      {noteFor && (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-[65] bg-black/30" onClick={() => setNoteFor(null)} tabIndex={-1} />
          <div className="fixed inset-x-0 top-1/2 z-[66] mx-auto w-[min(420px,calc(100vw-2rem))] -translate-y-1/2 rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm font-semibold">Submit for Principal approval</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              The Principal reviews the form, payment configuration and questions. You cannot publish without approval.
            </p>
            <textarea
              className="mt-2.5 w-full min-h-[64px] rounded-md border border-border bg-transparent px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Optional note to the Principal — e.g. logistics confirmed, poster attached…"
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setNoteFor(null)}>Cancel</Button>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={() => {
                const app = mine.find((a) => a.id === noteFor)
                if (app) doSubmitForApproval(app)
              }}>
                <Send className="h-3 w-3" /> Submit
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Blank official PDF — print / download for offline distribution (PART 11). */
function BlankPdfButton({ appId }: { appId: string }) {
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === appId))
  if (!app) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-[11px] gap-1 text-muted-foreground"
      onClick={() => {
        downloadApplicationDocument(applicationDocFileName({ app }))
        toast.success('Blank form downloaded', { description: 'Print and distribute; record received paper forms in Reviews.' })
      }}
    >
      <Download className="h-3 w-3" /> Blank form
    </Button>
  )
}
