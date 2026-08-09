'use client'

/**
 * TimetableModule — Principal's master scheduling workspace.
 *
 * Brief section 5 + 27 + 34: Two clear states + 3-tier state model:
 *
 *   VIEW MODE (default):
 *     [ Export ] [ ✎ Edit ]
 *     Clean, calm — empty periods show subtle "+" but page feels like a viewer.
 *
 *   EDIT MODE:
 *     [ Editing... ] [ Cancel ] [ Save Changes ]
 *     Empty periods become actionable, existing slots editable on click.
 *
 *   AFTER SAVE (pending publish):
 *     [ Export ] [ ↑ Publish Update ]
 *     Changes saved to master but not yet published to users.
 *
 *   AFTER PUBLISH:
 *     [ Export ]
 *     Back to calm normal state. Change indicators appear on affected slots
 *     for 72 hours.
 *
 * Brief section 32: Cancel discards only UNSAVED edits — saved pending
 *   publish changes are preserved.
 *
 * Brief section 33: Publish disabled if conflicts exist.
 */
import { useState, useMemo } from 'react'
import { Download, Pencil, Upload, X, AlertCircle } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useTimetableStore,
  detectConflicts,
  countAllConflicts,
  type DayType,
  type TimetableFormState,
  type TimetableSlot,
  type TimetableChange,
} from './timetable-store'
import { teachers } from '@/lib/mock/teachers'
import { initialFormState } from './data'
import { toast } from 'sonner'
import { OverviewCards } from './overview-cards'
import { FiltersBar } from './filters-bar'
import { ScheduleGrid } from './schedule-grid'
import { SlotEditorDialog } from './slot-editor-dialog'
import { PublishDialog } from './publish-dialog'
import { ConfirmDialog } from '../shared/confirm-dialog'
import { Trash2 } from 'lucide-react'

export function TimetableModule() {
  // ── Store subscriptions ──
  const slots = useTimetableStore((s) => s.slots)
  const pendingChanges = useTimetableStore((s) => s.pendingChanges)
  const publications = useTimetableStore((s) => s.publications)
  const addSlot = useTimetableStore((s) => s.addSlot)
  const updateSlot = useTimetableStore((s) => s.updateSlot)
  const removeSlot = useTimetableStore((s) => s.removeSlot)
  const duplicateSlot = useTimetableStore((s) => s.duplicateSlot)
  const recordChange = useTimetableStore((s) => s.recordChange)
  const publish = useTimetableStore((s) => s.publish)

  // ── UI state ──
  const [selectedClass, setSelectedClass] = useState<string>('Class 2-A')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<DayType>('Monday')

  const [editMode, setEditMode] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [form, setForm] = useState<TimetableFormState>(initialFormState)
  const [removeTarget, setRemoveTarget] = useState<TimetableSlot | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)

  // ── Derived state ──
  const conflictInfo = useMemo(
    () => detectConflicts(slots, form, editingSlot?.id),
    [slots, form, editingSlot]
  )

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass
      const matchTeacher = selectedTeacher === 'all' || s.teacherId === selectedTeacher
      const matchRoom = selectedRoom === 'all' || s.room === selectedRoom
      return matchClass && matchTeacher && matchRoom
    })
  }, [slots, selectedClass, selectedTeacher, selectedRoom])

  const globalConflictCount = useMemo(() => countAllConflicts(slots), [slots])
  const hasPendingPublish = pendingChanges.length > 0

  // ── Handlers ──
  const handleOpenAdd = (day?: DayType, period?: number) => {
    setEditingSlot(null)
    const next = { ...initialFormState }
    if (day) next.day = day
    if (period) next.period = period
    if (selectedClass !== 'all') next.className = selectedClass
    setForm(next)
    setEditorOpen(true)
  }

  const handleEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot)
    setForm({
      day: slot.day,
      period: slot.period,
      className: slot.className,
      subject: slot.subject,
      teacherId: slot.teacherId,
      room: slot.room,
      type: slot.type as 'Lecture' | 'Lab' | 'Sports',
    })
    setEditorOpen(true)
  }

  const handleDuplicateSlot = (slot: TimetableSlot) => {
    duplicateSlot(slot.id)
    toast.success('Slot duplicated', {
      description: `${slot.subject} · ${slot.className} (${slot.day} P${slot.period})`,
    })
  }

  const handleSaveSlot = () => {
    if (conflictInfo.hasConflict) {
      toast.error('Cannot save — conflict detected')
      return
    }
    const periodObj = [
      { number: 1, time: '08:30 AM - 09:15 AM' },
      { number: 2, time: '09:15 AM - 10:00 AM' },
      { number: 3, time: '10:00 AM - 10:45 AM' },
      { number: 5, time: '11:00 AM - 11:45 AM' },
      { number: 6, time: '11:45 AM - 12:30 PM' },
      { number: 8, time: '01:15 PM - 02:00 PM' },
      { number: 9, time: '02:00 PM - 02:45 PM' },
    ].find((p) => p.number === form.period)

    const teacherObj = teachers.find((t) => t.id === form.teacherId)
    const teacherName = teacherObj?.name || 'Assigned Faculty'

    if (editingSlot) {
      // Detect what changed for the change record
      const changes: Partial<Record<'teacher' | 'room' | 'period' | 'subject' | 'class', { from: string; to: string }>> = {}
      if (editingSlot.teacherId !== form.teacherId) changes.teacher = { from: editingSlot.teacherName, to: teacherName }
      if (editingSlot.room !== form.room) changes.room = { from: editingSlot.room, to: form.room }
      if (editingSlot.period !== form.period) changes.period = { from: `Period ${editingSlot.period}`, to: `Period ${form.period}` }
      if (editingSlot.subject !== form.subject) changes.subject = { from: editingSlot.subject, to: form.subject }
      if (editingSlot.className !== form.className) changes.class = { from: editingSlot.className, to: form.className }

      updateSlot(editingSlot.id, {
        day: form.day,
        period: form.period,
        time: periodObj?.time || editingSlot.time,
        className: form.className,
        subject: form.subject,
        teacherId: form.teacherId,
        teacherName,
        room: form.room,
        type: form.type,
      })

      // Record changes for pending publish
      if (changes.teacher) recordChange({ slotId: editingSlot.id, type: 'teacher_changed', summary: `Teacher changed: ${changes.teacher.from} → ${changes.teacher.to}`, context: `${form.className} · Period ${form.period}` })
      if (changes.room) recordChange({ slotId: editingSlot.id, type: 'room_changed', summary: `Room changed: ${changes.room.from} → ${changes.room.to}`, context: `${form.className} · Period ${form.period}` })
      if (changes.period) recordChange({ slotId: editingSlot.id, type: 'period_changed', summary: `Period changed: ${changes.period.from} → ${changes.period.to}`, context: form.className })
      if (changes.subject) recordChange({ slotId: editingSlot.id, type: 'subject_changed', summary: `Subject changed: ${changes.subject.from} → ${changes.subject.to}`, context: form.className })
      if (changes.class) recordChange({ slotId: editingSlot.id, type: 'class_changed', summary: `Class changed: ${changes.class.from} → ${changes.class.to}`, context: `Period ${form.period}` })

      toast.success('Timetable slot updated')
    } else {
      const newSlotId = `tt-${Date.now().toString().slice(-6)}`
      const newSlot: TimetableSlot = {
        id: newSlotId,
        day: form.day,
        period: form.period,
        time: periodObj?.time || '08:30 AM - 09:15 AM',
        className: form.className,
        subject: form.subject,
        teacherId: form.teacherId,
        teacherName,
        room: form.room,
        type: form.type,
      }
      addSlot(newSlot)
      recordChange({ slotId: newSlotId, type: 'slot_added', summary: `New period: ${form.subject}`, context: `${form.className} · Period ${form.period}` })
      toast.success('New period added', {
        description: `${form.className} · ${form.subject} (${form.day} P${form.period})`,
      })
    }
    setEditorOpen(false)
  }

  const handleRemoveSlot = () => {
    if (!removeTarget) return
    recordChange({ slotId: removeTarget.id, type: 'slot_removed', summary: `Period removed: ${removeTarget.subject}`, context: `${removeTarget.className} · ${removeTarget.day} Period ${removeTarget.period}` })
    removeSlot(removeTarget.id)
    toast.success('Period removed')
    setRemoveTarget(null)
  }

  const handleEnterEdit = () => {
    setEditMode(true)
    setForm(initialFormState)
  }

  const handleExitEdit = () => {
    // Cancel: discard only UNSAVED edits (Brief section 32).
    // Saved pending publish changes remain in the store.
    setEditMode(false)
    setEditorOpen(false)
    setEditingSlot(null)
  }

  const handlePublish = () => {
    if (globalConflictCount > 0) {
      toast.error('Resolve conflicts before publishing')
      return
    }
    const version = publish('Dr. Ananya Iyer')
    if (version) {
      toast.success('Timetable published', {
        description: `${version.changeCount} change${version.changeCount === 1 ? '' : 's'} shared with affected users`,
      })
      setEditMode(false)
      setPublishOpen(false)
    }
  }

  const handleExport = (type: 'class' | 'teacher' | 'master') => {
    const labels = {
      class: `${selectedClass === 'all' ? 'All Classes' : selectedClass} timetable`,
      teacher: 'Teacher timetable',
      master: 'Master school timetable',
    }
    toast.success('Exporting PDF', { description: labels[type] })
  }

  return (
    <PageTransition className="space-y-5">
      {/* Compact header — title + contextual actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Timetable</h1>
          <p className="text-xs text-muted-foreground mt-0.5">School-wide master schedule</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export — always available */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport('class')} className="text-xs">
                Class timetable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('teacher')} className="text-xs">
                Teacher timetable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('master')} className="text-xs">
                Master timetable
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {editMode ? (
            <>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleExitEdit}>
                Cancel
              </Button>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Editing
              </span>
            </>
          ) : hasPendingPublish ? (
            <>
              {/* Publish action appears after save (Brief section 11 + 27) */}
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setPublishOpen(true)}
                disabled={globalConflictCount > 0}
              >
                <Upload className="h-3.5 w-3.5" /> Publish Update
                {pendingChanges.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0 rounded-full bg-white/20 text-[9px] font-bold">
                    {pendingChanges.length}
                  </span>
                )}
              </Button>
              {globalConflictCount > 0 && (
                <span className="text-[10px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {globalConflictCount} conflict{globalConflictCount === 1 ? '' : 's'}
                </span>
              )}
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleEnterEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleEnterEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Pending publish banner (Brief section 29) */}
      {hasPendingPublish && !editMode && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">
              {pendingChanges.length} change{pendingChanges.length === 1 ? '' : 's'} ready to publish
            </span>
          </div>
        </div>
      )}

      <OverviewCards slots={slots} conflictCount={globalConflictCount} />

      <FiltersBar
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedTeacher={selectedTeacher}
        setSelectedTeacher={setSelectedTeacher}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      <ScheduleGrid
        selectedDay={selectedDay}
        selectedClass={selectedClass}
        filteredSlots={filteredSlots}
        editMode={editMode}
        publications={publications}
        onEditSlot={handleEditSlot}
        onDuplicateSlot={handleDuplicateSlot}
        onRemoveSlot={(slot) => setRemoveTarget(slot)}
        onAssignPeriod={handleOpenAdd}
      />

      {/* Contextual slot editor (Dialog — handles nested searchable selects) */}
      <SlotEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingSlot={editingSlot}
        form={form}
        setForm={setForm}
        conflictInfo={conflictInfo}
        onSave={handleSaveSlot}
      />

      {/* Remove confirmation */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove this period?"
        description={`${removeTarget?.subject} · ${removeTarget?.className} · ${removeTarget?.day} Period ${removeTarget?.period}. This will remove the assignment from the master timetable.`}
        tone="destructive"
        icon={Trash2}
        confirmLabel="Remove"
        onConfirm={handleRemoveSlot}
      />

      {/* Publish confirmation */}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        changes={pendingChanges}
        conflictCount={globalConflictCount}
        onPublish={handlePublish}
      />
    </PageTransition>
  )
}

export default TimetableModule
