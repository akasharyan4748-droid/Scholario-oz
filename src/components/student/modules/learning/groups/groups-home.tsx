'use client'

/**
 * learning/groups/groups-home — Study Groups / Q&A / Shared (§36–§41/§70).
 *
 * Absorbs and upgrades the old peer-collab module onto the CANONICAL
 * learning store: real join/leave, real questions with helpful voting and
 * teacher answers, real shared resources (saving = a real bookmark), and a
 * moderation REPORT path (§40 — students flag, staff review; students can
 * never delete others' content). Group communication stays routed through
 * the school's central messaging system — this is NOT a chat (§42).
 *
 * Privacy (§37): every group is class- or school-scoped as configured; the
 * demo student only ever sees their own scope.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck, BookmarkPlus, CheckCircle2, ChevronDown, Flag, HelpCircle,
  Lock, MessageCircleQuestion, Plus, Share2, ThumbsUp, UserPlus, UserMinus, Users,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLearningStore } from '@/lib/store/learning-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { typeToken } from '../shared/tokens'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science']

type GroupTab = 'groups' | 'qa' | 'shared'

export function GroupsHome() {
  const groups = useLearningStore((s) => s.groups)
  const questions = useLearningStore((s) => s.questions)
  const shares = useLearningStore((s) => s.shares)
  const bookmarks = useLearningStore((s) => s.bookmarks)
  const resources = useLearningStore((s) => s.resources)
  const joinGroup = useLearningStore((s) => s.joinGroup)
  const leaveGroup = useLearningStore((s) => s.leaveGroup)
  const postQuestion = useLearningStore((s) => s.postQuestion)
  const postAnswer = useLearningStore((s) => s.postAnswer)
  const markHelpful = useLearningStore((s) => s.markHelpful)
  const saveSharedResource = useLearningStore((s) => s.saveSharedResource)
  const shareResourceToGroup = useLearningStore((s) => s.shareResourceToGroup)
  const reportContent = useLearningStore((s) => s.reportContent)

  const [tab, setTab] = useState<GroupTab>('groups')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [qaFilter, setQaFilter] = useState<string>('all')
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const [answerFor, setAnswerFor] = useState<string | null>(null)
  const [answerBody, setAnswerBody] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const [askForm, setAskForm] = useState<{ title: string; body: string; subject: string; topic: string }>({ title: '', body: '', subject: 'Mathematics', topic: '' })
  const [shareOpen, setShareOpen] = useState(false)
  const [shareForm, setShareForm] = useState<{ resourceId: string; groupId: string; note: string }>({ resourceId: '', groupId: '', note: '' })

  const myGroups = groups.filter((g) => g.joined)
  const discover = groups.filter((g) => !g.joined)
  const filteredQ = useMemo(
    () => questions.filter((q) => qaFilter === 'all' || q.subject === qaFilter),
    [questions, qaFilter],
  )
  const myBookmarkedResources = resources.filter((r) => bookmarks.includes(r.id))

  const TABS: { key: GroupTab; label: string }[] = [
    { key: 'groups', label: 'Groups' },
    { key: 'qa', label: 'Q&A' },
    { key: 'shared', label: 'Shared' },
  ]

  return (
    <div className="space-y-5">
      {/* Local chips (§52) */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-2" role="tablist" aria-label="Study groups sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === t.key ? 'bg-white shadow-sm text-foreground dark:bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {tab === 'qa' && (
            <Button size="sm" className="h-7 gap-1" onClick={() => setAskOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Ask
            </Button>
          )}
          {tab === 'shared' && (
            <Button size="sm" className="h-7 gap-1" disabled={myBookmarkedResources.length === 0} onClick={() => { setShareForm({ resourceId: myBookmarkedResources[0]?.id ?? '', groupId: myGroups[0]?.id ?? '', note: '' }); setShareOpen(true) }}>
              <Share2 className="h-3.5 w-3.5" aria-hidden /> Share
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>

          {/* ── GROUPS (§36/§70) ── */}
          {tab === 'groups' && (
            <div className="space-y-5">
              <section aria-label="Your groups">
                <SectionLabel hint={`${myGroups.length} joined`}>Your groups</SectionLabel>
                <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {myGroups.map((g) => {
                    const sc = subjectColor(g.subject)
                    return (
                      <GlassCard key={g.id} hover={false} className="on-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
                              {g.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{g.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{g.subject}{g.topic ? ` · ${g.topic}` : ''}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 text-muted-foreground hover:text-rose-500" onClick={() => { leaveGroup(g.id); toast.info(`Left ${g.name}`) }}>
                            <UserMinus className="h-3.5 w-3.5" aria-hidden /> Leave
                          </Button>
                        </div>
                        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{g.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" aria-hidden /> {g.members.length}</span>
                          {g.nextSessionAt && (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                              {new Date(g.nextSessionAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {g.nextSessionAt.slice(11, 16)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" aria-hidden />
                            {questions.filter((q) => q.groupId === g.id).length} questions
                          </span>
                        </div>
                      </GlassCard>
                    )
                  })}
                  {myGroups.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground min-[420px]:col-span-2">
                      No groups joined yet — discover your class groups below.
                    </p>
                  )}
                </div>
              </section>

              {discover.length > 0 && (
                <section aria-label="Discover groups">
                  <SectionLabel hint="from your school">Discover</SectionLabel>
                  <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    {discover.map((g) => {
                      const sc = subjectColor(g.subject)
                      return (
                        <div key={g.id} className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
                          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
                            {g.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{g.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{g.description}</p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Users className="h-3 w-3" aria-hidden /> {g.members.length}
                                <span className="ml-1 rounded-full bg-muted px-1.5 py-px uppercase tracking-wide">{g.visibility}</span>
                              </span>
                              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => { joinGroup(g.id); toast.success(`Joined ${g.name}`) }}>
                                <UserPlus className="h-3.5 w-3.5" aria-hidden /> Join
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Group rules — the safety contract is visible (§37) */}
              <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Groups follow your school&apos;s policy: class-scoped, teacher-supported, and moderated. Report anything unkind — reports go to staff, quietly.
                </p>
              </div>
            </div>
          )}

          {/* ── Q&A (§39/§40) ── */}
          {tab === 'qa' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {['all', ...SUBJECTS].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQaFilter(s)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      qaFilter === s ? 'border-primary/40 bg-primary/[0.07] text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                    aria-pressed={qaFilter === s}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
              <div className="space-y-2.5">
                {filteredQ.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                    No questions in this subject yet — be the first to ask.
                  </p>
                )}
                {filteredQ.map((q) => {
                  const sc = subjectColor(q.subject)
                  const expanded = expandedQ === q.id
                  return (
                    <div key={q.id} className={cn('rounded-xl border bg-card/50 transition-colors', q.reported && 'opacity-70')}>
                      <button
                        type="button"
                        onClick={() => setExpandedQ(expanded ? null : q.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-start gap-3 p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
                          <HelpCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate text-sm font-semibold text-foreground">{q.title}</span>
                            {q.locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />}
                            {q.answers.some((a) => a.accepted) && (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                <BadgeCheck className="h-2.5 w-2.5" aria-hidden /> Answered
                              </span>
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                            {q.subject}{q.topic ? ` · ${q.topic}` : ''}
                            <span>· {q.askedBy}</span>
                            <span className="tabular-nums">{new Date(q.askedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-center gap-0.5">
                          <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{q.helpful}</span>
                        </span>
                        <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform', expanded && 'rotate-180')} aria-hidden />
                      </button>

                      {expanded && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 border-t border-border/60 px-3.5 pb-3.5 pt-3">
                          <p className="text-xs leading-relaxed text-foreground/80">{q.body}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => { markHelpful('question', q.id); toast.info('Marked helpful') }}>
                              <ThumbsUp className="h-3 w-3" aria-hidden /> Helpful ({q.helpful})
                            </Button>
                            {!q.reported && !q.locked && (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-muted-foreground hover:text-amber-600" onClick={() => { reportContent('question', q.id, 'Flagged by student'); toast.info('Reported — staff will review it') }}>
                                <Flag className="h-3 w-3" aria-hidden /> Report
                              </Button>
                            )}
                            {q.reported && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600"><Flag className="h-3 w-3" aria-hidden /> Reported</span>}
                          </div>

                          {/* Answers */}
                          <div className="space-y-2.5">
                            {q.answers.map((a) => (
                              <div key={a.id} className={cn('rounded-xl border p-3', a.accepted ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-border/70 bg-muted/[0.12]')}>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className={cn('font-semibold', a.byRole === 'teacher' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground/85')}>
                                    {a.by}
                                    {a.byRole === 'teacher' && (
                                      <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                                        <BadgeCheck className="h-2.5 w-2.5" aria-hidden /> Teacher
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-muted-foreground/70 tabular-nums">{new Date(a.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                  {a.accepted && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Accepted</span>}
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">{a.body}</p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => markHelpful('answer', q.id, a.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <ThumbsUp className="h-3 w-3" aria-hidden /> Helpful ({a.helpful})
                                  </button>
                                  {!a.reported && (
                                    <button
                                      type="button"
                                      onClick={() => { reportContent('answer', a.id, 'Flagged by student'); toast.info('Reported — staff will review it') }}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 transition-colors hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      <Flag className="h-3 w-3" aria-hidden /> Report
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Answer box — unlocked questions only (§40) */}
                          {!q.locked ? (
                            answerFor === q.id ? (
                              <div className="rounded-xl border border-border bg-card p-3">
                                <Textarea
                                  value={answerBody}
                                  onChange={(e) => setAnswerBody(e.target.value)}
                                  placeholder="Explain it the way you understood it…"
                                  className="min-h-20 text-xs"
                                  aria-label="Your answer"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setAnswerFor(null)}>Cancel</Button>
                                  <Button size="sm" disabled={!answerBody.trim()} onClick={() => {
                                    postAnswer(q.id, answerBody)
                                    setAnswerFor(null); setAnswerBody('')
                                    toast.success('Answer posted')
                                  }}>Post answer</Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAnswerFor(q.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden /> Answer this
                              </button>
                            )
                          ) : (
                            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                              <Lock className="h-3 w-3" aria-hidden /> This question is locked — the teacher&apos;s answer is final.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SHARED (§41) ── */}
          {tab === 'shared' && (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
              {shares.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground min-[420px]:col-span-2 xl:col-span-3">
                  Nothing shared yet — share a saved resource with a group.
                </p>
              )}
              {shares.map((sh) => {
                const resource = resources.find((r) => r.id === sh.resourceId)
                const tt = resource ? typeToken(resource.type) : null
                const sc = subjectColor(resource?.subject ?? 'Mathematics')
                const group = groups.find((g) => g.id === sh.groupId)
                const saved = resource ? bookmarks.includes(resource.id) : false
                return (
                  <GlassCard key={sh.id} hover={false} className="on-card flex flex-col p-4">
                    <div className="flex items-start gap-3">
                      {tt ? (
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', tt.tile)} aria-hidden>
                          <tt.icon className="h-4.5 w-4.5" />
                        </span>
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40" aria-hidden>
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{sh.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          Shared by {sh.sharedBy}
                          {group ? ` · ${group.name}` : ''}
                        </p>
                      </div>
                    </div>
                    {sh.note && (
                      <p className="mt-2.5 rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">{sh.note}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" aria-hidden /> {sh.saves} saves
                      </span>
                      {resource && (
                        <Button size="sm" variant={saved ? 'outline' : 'default'} className="h-7 gap-1" disabled={saved} onClick={() => { saveSharedResource(sh.id); toast.success('Saved to your bookmarks') }}>
                          <BookmarkPlus className="h-3 w-3" aria-hidden /> {saved ? 'Saved' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Ask a question (§39) ── */}
      <Dialog open={askOpen} onOpenChange={(open) => !open && setAskOpen(false)}>
        <DialogContent className="on-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask the class</DialogTitle>
            <DialogDescription>Questions are visible to your class — teachers often answer too.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="qa-title">Question</Label>
              <Input id="qa-title" value={askForm.title} onChange={(e) => setAskForm({ ...askForm, title: e.target.value })} placeholder="e.g. Why is 1/3 smaller than 1/2?" className="text-sm" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qa-body">Details (optional)</Label>
              <Textarea id="qa-body" value={askForm.body} onChange={(e) => setAskForm({ ...askForm, body: e.target.value })} placeholder="What exactly confused you?" className="min-h-20 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Subject</Label>
                <Select value={askForm.subject} onValueChange={(v) => setAskForm({ ...askForm, subject: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qa-topic">Topic (optional)</Label>
                <Input id="qa-topic" value={askForm.topic} onChange={(e) => setAskForm({ ...askForm, topic: e.target.value })} placeholder="e.g. Fractions" className="text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAskOpen(false)}>Cancel</Button>
            <Button
              disabled={!askForm.title.trim()}
              onClick={() => {
                postQuestion({ ...askForm, topic: askForm.topic || undefined, body: askForm.body || askForm.title })
                toast.success('Question posted')
                setAskOpen(false)
                setAskForm({ title: '', body: '', subject: 'Mathematics', topic: '' })
                setTab('qa')
              }}
            >
              Post question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Share a bookmarked resource (§41) ── */}
      <Dialog open={shareOpen} onOpenChange={(open) => !open && setShareOpen(false)}>
        <DialogContent className="on-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share with a group</DialogTitle>
            <DialogDescription>Pick one of your saved resources — only group members see it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label>Resource</Label>
              <Select value={shareForm.resourceId} onValueChange={(v) => setShareForm({ ...shareForm, resourceId: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Choose a saved resource" /></SelectTrigger>
                <SelectContent>
                  {myBookmarkedResources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Group</Label>
              <Select value={shareForm.groupId} onValueChange={(v) => setShareForm({ ...shareForm, groupId: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Choose one of your groups" /></SelectTrigger>
                <SelectContent>
                  {myGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sh-note">Note (optional)</Label>
              <Input id="sh-note" value={shareForm.note} onChange={(e) => setShareForm({ ...shareForm, note: e.target.value })} placeholder="e.g. Read pages 4–6 before Thursday" className="text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
            <Button
              disabled={!shareForm.resourceId || !shareForm.groupId}
              onClick={() => {
                shareResourceToGroup({ resourceId: shareForm.resourceId, groupId: shareForm.groupId, note: shareForm.note })
                toast.success('Shared with the group')
                setShareOpen(false)
                setTab('shared')
              }}
            >
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
