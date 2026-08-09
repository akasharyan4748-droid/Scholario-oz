'use client'

/**
 * SlotEditorDialog — compact contextual slot editor.
 *
 * Brief section 9 + 10: Clean slot editor with searchable selection
 * components (similar to the Teacher picker already used in Students &
 * Classes). Uses shadcn Dialog (NOT a custom motion.div overlay) for
 * consistent modal behavior across the app.
 *
 * Brief section 14: Real-time conflict detection shown inline while
 * the user selects. Save is disabled when a conflict exists.
 *
 * Brief section 12: Compact — does not show all fields as giant form
 * inputs simultaneously. Two-column grid for Day/Period and Class/Subject,
 * then Teacher/Room via searchable selects.
 */
import { useMemo, useState } from 'react'
import { Search, Check, ChevronDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { teachers } from '@/lib/mock/teachers'
import { subjects } from '@/lib/mock/school'
import {
  CLASSES, DAYS, PERIODS, ROOMS,
  type DayType,
  type TimetableConflictInfo,
  type TimetableFormState,
} from './data'

interface SlotEditorDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingSlot: { id: string } | null
  form: TimetableFormState
  setForm: React.Dispatch<React.SetStateAction<TimetableFormState>>
  conflictInfo: TimetableConflictInfo
  onSave: () => void
}

export function SlotEditorDialog({
  open,
  onOpenChange,
  editingSlot,
  form,
  setForm,
  conflictInfo,
  onSave,
}: SlotEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">
            {editingSlot ? 'Edit Period' : 'Assign New Period'}
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {editingSlot ? 'Update the timetable assignment' : 'Create a new timetable slot'}
          </DialogDescription>
        </DialogHeader>

        {/* Inline conflict warning */}
        {conflictInfo.hasConflict && (
          <div className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
            <div className="text-[10px] space-y-0.5">
              <p className="font-bold">Conflict detected</p>
              {conflictInfo.teacherConflict && (
                <p>Teacher already assigned to {conflictInfo.teacherConflict.className} in {conflictInfo.teacherConflict.room}.</p>
              )}
              {conflictInfo.roomConflict && (
                <p>Room {conflictInfo.roomConflict.room} already occupied by {conflictInfo.roomConflict.className}.</p>
              )}
              {conflictInfo.classConflict && (
                <p>{conflictInfo.classConflict.className} already has a period here.</p>
              )}
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Day + Period */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day">
              <CompactSelect
                value={form.day}
                onChange={(v) => setForm((prev) => ({ ...prev, day: v as DayType }))}
                options={DAYS.map((d) => ({ value: d, label: d }))}
              />
            </Field>
            <Field label="Period">
              <CompactSelect
                value={String(form.period)}
                onChange={(v) => setForm((prev) => ({ ...prev, period: Number(v) }))}
                options={PERIODS.filter((p) => !p.isBreak).map((p) => ({
                  value: String(p.number),
                  label: `${p.name} (${p.time.split(' - ')[0]})`,
                }))}
              />
            </Field>
          </div>

          {/* Class + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class / Section">
              <CompactSelect
                value={form.className}
                onChange={(v) => setForm((prev) => ({ ...prev, className: v }))}
                options={CLASSES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="Subject">
              <SearchableField
                pickerId="subject"
                value={form.subject}
                onChange={(v) => setForm((prev) => ({ ...prev, subject: v }))}
                placeholder="Select subject"
                options={[
                  ...subjects.map((s) => ({
                    id: s.name,
                    label: s.name,
                    meta: s.code,
                  })),
                  ...['Hindi', 'Social Studies', 'Computer Science', 'Art & Craft', 'Physical Education']
                    .filter((s) => !subjects.find((sub) => sub.name === s))
                    .map((s) => ({ id: s, label: s, meta: '' })),
                ]}
              />
            </Field>
          </div>

          {/* Teacher (searchable with avatar) */}
          <Field label="Teacher">
            <SearchableField
              pickerId="teacher"
              value={form.teacherId}
              onChange={(v) => setForm((prev) => ({ ...prev, teacherId: v }))}
              placeholder="Select teacher"
              options={teachers
                .filter((t) => !t.archived && t.status === 'Active')
                .map((t) => ({
                  id: t.id,
                  label: t.name,
                  avatar: t.avatar,
                  meta: `${t.employeeId} · ${t.department}`,
                }))}
            />
          </Field>

          {/* Room */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room / Lab">
              <CompactSelect
                value={form.room}
                onChange={(v) => setForm((prev) => ({ ...prev, room: v }))}
                options={ROOMS.map((r) => ({ value: r, label: r }))}
              />
            </Field>
            <Field label="Type">
              <CompactSelect
                value={form.type}
                onChange={(v) => setForm((prev) => ({ ...prev, type: v as 'Lecture' | 'Lab' | 'Sports' }))}
                options={[
                  { value: 'Lecture', label: 'Lecture' },
                  { value: 'Lab', label: 'Lab' },
                  { value: 'Sports', label: 'Sports' },
                ]}
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={conflictInfo.hasConflict}
          >
            {editingSlot ? 'Update Period' : 'Assign Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Field — label wrapper                                              */
/* ------------------------------------------------------------------ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-foreground">{label}</label>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CompactSelect — shadcn Select for short option lists               */
/* ------------------------------------------------------------------ */
function CompactSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const selected = options.find((o) => o.value === value)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full h-8 px-2.5 rounded-lg border border-border bg-card text-xs text-foreground hover:border-primary/40 transition-colors"
        >
          <span className="truncate">{selected?.label || 'Select…'}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 max-h-64 overflow-y-auto" align="start" sideOffset={4}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors text-xs',
              o.value === value && 'bg-muted/30'
            )}
          >
            <span className="truncate">{o.label}</span>
            {o.value === value && <Check className="h-3 w-3 text-emerald-600 shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/* SearchableField — searchable select for Teacher / Subject           */
/*   Brief section 10: searchable selection with avatar + metadata     */
/* ------------------------------------------------------------------ */
function SearchableField({ pickerId, value, onChange, placeholder, options }: {
  pickerId: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { id: string; label: string; avatar?: string; meta?: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((o) => o.id === value)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.meta || '').toLowerCase().includes(q)
    )
  }, [options, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full h-8 px-2.5 rounded-lg border border-border bg-card text-xs hover:border-primary/40 transition-colors"
        >
          {selected ? (
            <span className="flex items-center gap-1.5 min-w-0">
              {selected.avatar && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-foreground text-[8px] font-semibold">
                  {selected.avatar}
                </span>
              )}
              <span className="text-foreground truncate">{selected.label}</span>
              {selected.meta && <span className="text-[9px] text-muted-foreground truncate">{selected.meta}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              key={`search-${pickerId}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 h-8 text-xs bg-card"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No results found.</p>
          ) : filtered.slice(0, 50).map((o) => {
            const isSelected = o.id === value
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setSearch('') }}
                className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-muted/40 transition-colors"
              >
                {o.avatar && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
                    {o.avatar}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">{o.label}</p>
                  {o.meta && <p className="text-[10px] text-muted-foreground leading-tight truncate">{o.meta}</p>}
                </div>
                {isSelected && (
                  <span className="text-[10px] text-emerald-600 font-medium shrink-0 inline-flex items-center gap-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
