'use client'

/**
 * NotesTab — the personal NOTES system (spec §20).
 *
 * Notes are NOT a resource type — they are the student's own lightweight
 * notes backed by the canonical store (`notes` + addNote / updateNote /
 * deleteNote / toggleNotePin). Pinned-first list; each row shows title,
 * subject chip, content preview, tags, relative updated time and the
 * linked-resource chip (title resolved from the store's resources).
 * Actions: pin toggle, edit (dialog), delete (inline confirm), and
 * "make flashcard" which prefills the New Card dialog (§19 create-from-
 * note). Search is a compact filter; the editor is a plain textarea —
 * no word processor (§20). Empty state: "Create your first note."
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Link2, Pencil, Pin, PinOff, Plus, Search, StickyNote, Trash2, X } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore, type LearningResource, type StudentNote } from '@/lib/store/student-learning-store'
import type { NewCardPrefill } from './new-card-modal'

// ─── The note dialog (create + edit share one clean form) ──────────

interface NoteDraft {
  title: string
  content: string
  subject: string
  topic: string
  tagsText: string
  linkedResourceId: string
}

function draftOf(note?: StudentNote): NoteDraft {
  return {
    title: note?.title ?? '',
    content: note?.content ?? '',
    subject: note?.subject ?? '',
    topic: note?.topic ?? '',
    tagsText: note?.tags.join(', ') ?? '',
    linkedResourceId: note?.linkedResourceId ?? '',
  }
}

const FIELD_CLASSES =
  'w-full rounded-xl border border-border bg-card/50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

interface NoteDialogProps {
  /** undefined → create mode. */
  note?: StudentNote
  subjects: string[]
  linkOptions: LearningResource[]
  onClose: () => void
  onSubmit: (draft: NoteDraft) => void
}

function NoteDialog({ note, subjects, linkOptions, onClose, onSubmit }: NoteDialogProps) {
  const [draft, setDraft] = useState<NoteDraft>(() => draftOf(note))
  const set = (patch: Partial<NoteDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const valid = draft.title.trim() !== '' && draft.content.trim() !== '' && draft.subject !== ''
  const editing = note != null
  useDismissOnEscape(onClose)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Edit note' : 'Create a new note'}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug">{editing ? 'Edit note' : 'New note'}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Plain and quick — title, content, a few tags.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close note dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div>
            <label htmlFor="nt-title" className="mb-1.5 block text-xs font-medium text-foreground">
              Title<span className="ml-0.5 text-rose-500" aria-hidden>*</span>
            </label>
            <input
              id="nt-title"
              type="text"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Carrying in addition"
              autoFocus
              className={FIELD_CLASSES}
            />
          </div>

          <div>
            <label htmlFor="nt-content" className="mb-1.5 block text-xs font-medium text-foreground">
              Content<span className="ml-0.5 text-rose-500" aria-hidden>*</span>
            </label>
            <textarea
              id="nt-content"
              value={draft.content}
              onChange={(e) => set({ content: e.target.value })}
              rows={6}
              placeholder="Write it your way — short lines you'll actually reread."
              className={cn(FIELD_CLASSES, 'resize-none')}
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-foreground">
              Subject<span className="ml-0.5 text-rose-500" aria-hidden>*</span>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const active = draft.subject === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ subject: active ? '' : s })}
                    aria-pressed={active}
                    aria-label={`Subject ${s}`}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                      active ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                    {s}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nt-topic" className="mb-1.5 block text-xs font-medium text-foreground">
                Topic
              </label>
              <input
                id="nt-topic"
                type="text"
                value={draft.topic}
                onChange={(e) => set({ topic: e.target.value })}
                placeholder="e.g. Addition"
                className={FIELD_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="nt-tags" className="mb-1.5 block text-xs font-medium text-foreground">
                Tags
              </label>
              <input
                id="nt-tags"
                type="text"
                value={draft.tagsText}
                onChange={(e) => set({ tagsText: e.target.value })}
                placeholder="comma separated"
                className={FIELD_CLASSES}
              />
            </div>
          </div>

          <div>
            <label htmlFor="nt-link" className="mb-1.5 block text-xs font-medium text-foreground">
              Link to resource
            </label>
            <select
              id="nt-link"
              value={draft.linkedResourceId}
              onChange={(e) => set({ linkedResourceId: e.target.value })}
              className={cn(FIELD_CLASSES, 'min-h-11 sm:min-h-10')}
            >
              <option value="">No link</option>
              {linkOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-muted-foreground">Your saved and recently studied resources.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => valid && onSubmit(draft)}
            disabled={!valid}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
          >
            {editing ? 'Save note' : 'Create note'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── The tab ──────────────────────────────────────────────────────

interface NotesTabProps {
  /** Opens the New Card dialog prefilled from a note (§19 create-from-note). */
  onMakeCard: (prefill: NewCardPrefill) => void
}

function IconButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void
  label: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9',
        active && 'text-violet-600 dark:text-violet-400',
      )}
    >
      {children}
    </button>
  )
}

export function NotesTab({ onMakeCard }: NotesTabProps) {
  const notes = useStudentLearningStore((s) => s.notes)
  const resources = useStudentLearningStore((s) => s.resources)
  const progress = useStudentLearningStore((s) => s.progress)
  const bookmarks = useStudentLearningStore((s) => s.bookmarks)
  const addNote = useStudentLearningStore((s) => s.addNote)
  const updateNote = useStudentLearningStore((s) => s.updateNote)
  const deleteNote = useStudentLearningStore((s) => s.deleteNote)
  const toggleNotePin = useStudentLearningStore((s) => s.toggleNotePin)

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; id: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const subjects = useMemo(() => Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean), [resources])

  /** Bookmarked + recently studied resources — the linkable set (§20). */
  const linkOptions = useMemo(() => {
    const recentIds = Object.entries(progress)
      .filter(([, p]) => p.lastStudiedAt !== null)
      .sort((a, b) => (a[1].lastStudiedAt! < b[1].lastStudiedAt! ? 1 : -1))
      .map(([id]) => id)
    const ids = Array.from(new Set([...bookmarks, ...recentIds]))
    return ids.map((id) => resources.find((r) => r.id === id)).filter((r): r is LearningResource => !!r)
  }, [bookmarks, progress, resources])

  const resourceTitle = (id?: string) => (id ? resources.find((r) => r.id === id)?.title : undefined)

  /** Pinned first, then most recently updated. */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.updatedAt < b.updatedAt ? 1 : -1
    })
    if (!q) return sorted
    return sorted.filter((n) => `${n.title} ${n.content} ${n.subject} ${n.topic ?? ''} ${n.tags.join(' ')}`.toLowerCase().includes(q))
  }, [notes, search])

  const submitDialog = (draft: NoteDraft) => {
    const input = {
      title: draft.title.trim(),
      content: draft.content.trim(),
      subject: draft.subject,
      topic: draft.topic.trim() || undefined,
      tags: parseTags(draft.tagsText),
      linkedResourceId: draft.linkedResourceId || undefined,
    }
    if (dialog?.mode === 'edit') {
      updateNote(dialog.id, input)
      toast.success('Note updated', { description: input.title })
    } else {
      addNote(input)
      toast.success('Note created', { description: input.title })
    }
    setDialog(null)
  }

  const editingNote = dialog?.mode === 'edit' ? notes.find((n) => n.id === dialog.id) : undefined

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel hint={notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : undefined}>Your notes</SectionLabel>
        <button
          type="button"
          onClick={() => setDialog({ mode: 'create' })}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-9"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New note
        </button>
      </div>

      {/* Compact search filter */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your notes…"
          aria-label="Search your notes"
          className="h-11 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 sm:h-10"
        />
      </div>

      {/* Honest empty states (§57) */}
      {filtered.length === 0 ? (
        <GlassCard hover={false} className="on-card px-4 py-10 text-center">
          {notes.length === 0 ? (
            <>
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <StickyNote className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium">Create your first note.</p>
              <p className="mt-1 text-xs text-muted-foreground">Quick reminders, rules and tricks — yours alone.</p>
              <button
                type="button"
                onClick={() => setDialog({ mode: 'create' })}
                className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-9"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New note
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No notes match your search.</p>
          )}
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
          {filtered.map((note, i) => {
            const sc = subjectColor(note.subject)
            const linked = resourceTitle(note.linkedResourceId)
            const preview = note.content.replace(/\s+/g, ' ').trim()
            const previewShort = preview.length > 80 ? `${preview.slice(0, 80)}…` : preview
            return (
              <motion.article
                key={note.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.24), duration: 0.2 }}
                className="p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-violet-500/30 text-violet-600 dark:text-violet-400" aria-label="Pinned" />}
                    <h3 className="truncate text-sm font-semibold leading-tight">{note.title}</h3>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <IconButton onClick={() => toggleNotePin(note.id)} label={note.pinned ? 'Unpin note' : 'Pin note to top'} active={note.pinned}>
                      {note.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        onMakeCard({ front: note.title, back: note.content, subject: note.subject, topic: note.topic })
                      }
                      label="Turn this note into a flashcard"
                    >
                      <Layers className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton onClick={() => setDialog({ mode: 'edit', id: note.id })} label="Edit note">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton onClick={() => setConfirmDelete(confirmDelete === note.id ? null : note.id)} label="Delete note">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </div>
                </div>

                {previewShort && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{previewShort}</p>}

                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                    {note.subject}
                  </span>
                  {note.topic && <span className="text-[10px] text-muted-foreground">· {note.topic}</span>}
                  {note.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                      #{tag}
                    </span>
                  ))}
                  {linked && (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:text-cyan-400">
                      <Link2 className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">Linked: {linked}</span>
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(note.updatedAt)}</span>
                </div>

                {/* Inline delete confirmation — no accidental deletes */}
                {confirmDelete === note.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2"
                    role="group"
                    aria-label="Confirm note deletion"
                  >
                    <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">Delete this note?</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          deleteNote(note.id)
                          setConfirmDelete(null)
                          toast.success('Note deleted', { description: note.title })
                        }}
                        className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-card/60 px-3 text-[11px] font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        Keep
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.article>
            )
          })}
        </GlassCard>
      )}

      {/* Create / edit dialog — remounts fresh per open */}
      <AnimatePresence>
        {dialog && (
          <NoteDialog
            key={dialog.mode === 'edit' ? `edit-${dialog.id}` : 'create'}
            note={editingNote}
            subjects={subjects}
            linkOptions={linkOptions}
            onClose={() => setDialog(null)}
            onSubmit={submitDialog}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
