'use client'

/**
 * learning/flashcards/flashcards-home — the flashcards command centre (§16/§69).
 *
 *   DUE TODAY [n] → Start Review            (the whole point)
 *   NEW · LEARNING · MASTERED                 (real SM-2 buckets)
 *   YOUR DECKS → deck review                  (per-deck due counts)
 *   RECENTLY REVIEWED                         (the real review log)
 *   [+ New Card]                              (real creation — no stub)
 *
 * Notes live with Flashcards (§20 — they are a study companion), powered by
 * the same store: create, pin, search, link to resources/decks.
 */

import { useMemo, useState } from 'react'
import {
  CheckCircle2, Clock, Layers, Pin, PinOff, Plus, Search, Sparkles, Trash2,
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
import { useLearningStore, deckStats } from '@/lib/store/learning-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { ReviewSession } from './review-session'
import { CreateCardDialog } from './create-card-dialog'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science']

/** Session descriptor the home view controls. */
type Session = { deckId: string | null; cardIds?: string[] | null } | null

export function FlashcardsHome() {
  const decks = useLearningStore((s) => s.decks)
  const cards = useLearningStore((s) => s.cards)
  const reviewLogs = useLearningStore((s) => s.reviewLogs)
  const notes = useLearningStore((s) => s.notes)
  const upsertNote = useLearningStore((s) => s.upsertNote)
  const deleteNote = useLearningStore((s) => s.deleteNote)
  const toggleNotePin = useLearningStore((s) => s.toggleNotePin)

  const [session, setSession] = useState<Session>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [noteSearch, setNoteSearch] = useState('')
  const [noteDialog, setNoteDialog] = useState<{ id?: string; title: string; body: string; subject: string } | null>(null)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const stats = useMemo(() => deckStats(cards, null, today), [cards, today])
  const visibleNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase()
    return notes
      .filter((n) => !n.archived && (!q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [notes, noteSearch])

  /* ── The session takes over the whole section (§18 distraction-free) ── */
  if (session) {
    return (
      <ReviewSession
        key={session.cardIds ? session.cardIds.join(',') : session.deckId ?? 'all'}
        deckId={session.deckId}
        cardIds={session.cardIds ?? null}
        onExit={() => setSession(null)}
        onReviewAgain={(ids) => setSession({ deckId: null, cardIds: ids })}
      />
    )
  }

  const saveNote = () => {
    if (!noteDialog || !noteDialog.title.trim()) return
    upsertNote({ ...noteDialog, id: noteDialog.id })
    toast.success(noteDialog.id ? 'Note updated' : 'Note created')
    setNoteDialog(null)
  }

  return (
    <div className="space-y-6">
      {/* ── Due strip — the day's job in one line (§16) ── */}
      <GlassCard hover={false} className="on-card overflow-hidden p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(230px,0.85fr)_1.35fr]">
          <div className="flex flex-col justify-center gap-3 border-b border-border/60 bg-violet-500/[0.05] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/[0.09] text-violet-600 dark:text-violet-400" aria-hidden>
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Due today</p>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{stats.due}<span className="ml-1 text-sm font-semibold text-muted-foreground">cards</span></p>
              </div>
            </div>
            <Button className="w-fit gap-1.5" disabled={stats.due === 0} onClick={() => setSession({ deckId: null })}>
              <Sparkles className="h-4 w-4" aria-hidden /> {stats.due === 0 ? 'All caught up' : 'Start review'}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2.5 p-5">
            {[
              { label: 'New', value: stats.new, tone: 'text-sky-600 dark:text-sky-400', icon: Clock },
              { label: 'Learning', value: stats.learning, tone: 'text-amber-600 dark:text-amber-400', icon: Layers },
              { label: 'Mastered', value: stats.mastered, tone: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-muted/[0.15] px-2 py-3">
                <s.icon className={cn('h-4 w-4', s.tone)} aria-hidden />
                <p className={cn('mt-1.5 text-xl font-bold tabular-nums tracking-tight', s.tone)}>{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ── Your decks (§16) ── */}
      <section aria-label="Your decks">
        <SectionLabel hint={`${decks.length} decks`}>Your decks</SectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => {
            const s = deckStats(cards, deck.id, today)
            const sc = subjectColor(deck.subject)
            return (
              <button
                key={deck.id}
                type="button"
                disabled={s.total === 0}
                onClick={() => setSession({ deckId: deck.id })}
                className={cn(
                  'group flex flex-col rounded-xl border bg-card/60 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  s.total === 0 ? 'cursor-default opacity-60' : 'cursor-pointer hover:border-primary/30 hover:shadow-premium',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
                    {deck.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{deck.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{deck.subject}{deck.topic ? ` · ${deck.topic}` : ''}</p>
                  </div>
                  {s.due > 0 && (
                    <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-violet-700 dark:text-violet-400">
                      {s.due} due
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-[10px] font-medium tabular-nums text-muted-foreground">
                  <span>{s.total} cards</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{s.mastered} mastered</span>
                  <span className="text-amber-600 dark:text-amber-400">{s.learning} learning</span>
                  {deck.source === 'student' && <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[9px] uppercase tracking-wide">yours</span>}
                </div>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold">New card</span>
            <span className="text-[10px]">creates or joins a deck</span>
          </button>
        </div>
      </section>

      {/* ── Notes + recently reviewed (§20) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section aria-label="My notes">
          <SectionLabel
            hint={
              <button
                type="button"
                onClick={() => setNoteDialog({ title: '', body: '', subject: 'Mathematics' })}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-3 w-3" aria-hidden /> New
              </button>
            }
          >
            My notes
          </SectionLabel>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
            <Input
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              placeholder="Search notes…"
              className="h-9 pl-9 text-xs"
              aria-label="Search notes"
            />
          </div>
          <div className="mt-2.5 max-h-80 space-y-2 overflow-y-auto pr-1">
            {visibleNotes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                {notes.length === 0 ? 'Create your first note.' : 'No notes match that search.'}
              </p>
            ) : (
              visibleNotes.map((n) => (
                <div key={n.id} className={cn('group rounded-xl border p-3.5 transition-colors', n.pinned ? 'border-amber-500/30 bg-amber-500/[0.04]' : 'border-border bg-card/50')}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setNoteDialog({ id: n.id, title: n.title, body: n.body, subject: n.subject })}
                    >
                      <p className="truncate text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{n.body}</p>
                      <p className="mt-1.5 truncate text-[10px] text-muted-foreground/70">{n.subject}{n.topic ? ` · ${n.topic}` : ''}</p>
                    </button>
                    <div className="flex shrink-0 gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60 hover:text-amber-500" onClick={() => toggleNotePin(n.id)} aria-label={n.pinned ? 'Unpin note' : 'Pin note'}>
                        {n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60 hover:text-rose-500" onClick={() => { deleteNote(n.id); toast.info('Note deleted') }} aria-label="Delete note">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section aria-label="Recently reviewed">
          <SectionLabel hint="last few days">Recently reviewed</SectionLabel>
          <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
            {reviewLogs.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No reviews yet — your first session will show here.</p>
            ) : (
              reviewLogs.slice(0, 6).map((log) => {
                const card = cards.find((c) => c.id === log.cardId)
                const deck = decks.find((d) => d.id === log.deckId)
                if (!card) return null
                return (
                  <div key={log.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', subjectColor(deck?.subject ?? 'Mathematics').dot)} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/85">{card.front}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase',
                        log.grade === 'again' ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                          : log.grade === 'hard' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                            : log.grade === 'easy' ? 'border-sky-500/30 bg-sky-500/10 text-sky-600'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                      )}
                    >
                      {log.grade}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
                      {new Date(log.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* ── Dialogs ── */}
      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <Dialog open={!!noteDialog} onOpenChange={(open) => !open && setNoteDialog(null)}>
        <DialogContent className="on-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{noteDialog?.id ? 'Edit note' : 'New note'}</DialogTitle>
            <DialogDescription>Notes stay private to you (§77).</DialogDescription>
          </DialogHeader>
          {noteDialog && (
            <div className="grid gap-4 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteDialog.title}
                  onChange={(e) => setNoteDialog({ ...noteDialog, title: e.target.value })}
                  placeholder="e.g. Fractions — keep in mind"
                  className="text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="note-body">Note</Label>
                <Textarea
                  id="note-body"
                  value={noteDialog.body}
                  onChange={(e) => setNoteDialog({ ...noteDialog, body: e.target.value })}
                  placeholder="Write it your way — a clean, simple editor."
                  className="min-h-28 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Subject</Label>
                  <Select value={noteDialog.subject} onValueChange={(v) => setNoteDialog({ ...noteDialog, subject: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Cancel</Button>
            <Button onClick={saveNote} disabled={!noteDialog?.title.trim()}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
