'use client'

/**
 * TimetableModule — Principal's master scheduling workspace.
 *
 * Brief section 7 + 10 + 11 + 45: Four-tier state model:
 *
 *   VIEW: [ Export ] [ ✎ Edit ]
 *   EDIT (no changes): [ Export ] [ Cancel ] ● Editing
 *   EDIT (unsaved changes): [ Export ] [ Cancel ] [ Apply Changes ]
 *   PENDING PUBLISH (after Apply): [ Export ] [ Publish Update N ] [ ✎ Edit ]
 *   PUBLISHED: [ Export ] [ ✎ Edit ] (+ change indicators on affected slots)
 *
 * Draft state architecture (Brief section 27 + 49):
 *   - Edit mode mutates `draftSlots` (local React state, NOT the store)
 *   - Apply Changes: commits draftSlots → store, records changes, exits edit mode
 *   - Cancel: discards draftSlots (store unchanged), confirms if unsaved
 */
import { useState, useMemo, useEffect } from 'react'
import { Download, Pencil, Upload, AlertCircle, Check, CalendarClock } from 'lucide-react'
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
  type TimetableSlot,
  type TimetableChange,
} from './timetable-store'
import { teachers } from '@/lib/mock/teachers'
import { PERIODS, type TimetableSlot as Slot } from './data'
import { toast } from 'sonner'
import { OverviewCards } from './overview-cards'
import { FiltersBar } from './filters-bar'
import { ScheduleGrid } from './schedule-grid'
import { SlotEditorDialog, type MinimalSlotForm } from './slot-editor-dialog'
import { PublishDialog } from './publish-dialog'
import { AutoTimetableDialog } from './auto-timetable-dialog'
import { ConfirmDialog } from '../shared/confirm-dialog'
import { Trash2, AlertTriangle } from 'lucide-react'

export function TimetableModule() {
  // ── Store subscriptions ──
  const slots = useTimetableStore((s) => s.slots)
  const pendingChanges = useTimetableStore((s) => s.pendingChanges)
  const publications = useTimetableStore((s) => s.publications)
  const addSlotAction = useTimetableStore((s) => s.addSlot)
  const updateSlotAction = useTimetableStore((s) => s.updateSlot)
  const removeSlotAction = useTimetableStore((s) => s.removeSlot)
  const recordChange = useTimetableStore((s) => s.recordChange)
  const removePendingChange = useTimetableStore((s) => s.removePendingChange)
  const publish = useTimetableStore((s) => s.publish)

  // ── Draft state (local — only mutated during edit mode) ──
  const [draftSlots, setDraftSlots] = useState<Slot[]>(slots)
  const [editMode, setEditMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // ── UI state ──
  const [selectedClass, setSelectedClass] = useState<string>('Class 2-A')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<DayType>('Monday')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{ id: string; subject: string; teacherId: string } | null>(null)
  const [editorContext, setEditorContext] = useState({ day: 'Monday' as DayType, period: 1, periodName: 'Period 1', time: '08:30 AM - 09:15 AM', className: 'Class 2-A', room: 'Room 102' })
  const [minimalForm, setMinimalForm] = useState<MinimalSlotForm>({ subject: '', teacherId: '' })
  const [removeTarget, setRemoveTarget] = useState<Slot | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [autoOpen, setAutoOpen] = useState(false)

  // Sync draft when entering edit mode
  useEffect(() => {
    if (editMode) {
      setDraftSlots(slots)
      setHasUnsavedChanges(false)
    }
  }, [editMode, slots])

  // ── Derived state ──
  // In edit mode, display draftSlots; otherwise display store slots
  const displaySlots = editMode ? draftSlots : slots

  const conflictInfo = useMemo(
    () => {
      // For the editor: check against draftSlots (not the store)
      if (!editorOpen) return { hasConflict: false, teacherConflict: undefined, roomConflict: undefined, classConflict: undefined }
      const ctx = editorContext
      return detectConflicts(draftSlots, {
        day: ctx.day,
        period: ctx.period,
        teacherId: minimalForm.teacherId,
        room: ctx.room,
        className: ctx.className,
      }, editingSlot?.id)
    },
    [draftSlots, editorOpen, editorContext, minimalForm, editingSlot]
  )

  const filteredSlots = useMemo(() => {
    return displaySlots.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass
      const matchTeacher = selectedTeacher === 'all' || s.teacherId === selectedTeacher
      const matchRoom = selectedRoom === 'all' || s.room === selectedRoom
      return matchClass && matchTeacher && matchRoom
    })
  }, [displaySlots, selectedClass, selectedTeacher, selectedRoom])

  const globalConflictCount = useMemo(() => countAllConflicts(displaySlots), [displaySlots])
  const hasPendingPublish = pendingChanges.length > 0

  // ── Handlers ──
  const handleEnterEdit = () => {
    setDraftSlots(slots)
    setHasUnsavedChanges(false)
    setEditMode(true)
  }

  const handleExitEdit = () => {
    if (hasUnsavedChanges) {
      setDiscardOpen(true)
    } else {
      setEditMode(false)
    }
  }

  const handleDiscard = () => {
    setDraftSlots(slots)
    setHasUnsavedChanges(false)
    setEditMode(false)
    setDiscardOpen(false)
    setEditorOpen(false)
    setEditingSlot(null)
  }

  const handleApplyChanges = () => {
    // Commit draftSlots to the store + record changes
    // Compare draftSlots with slots to detect what changed
    const changes: Omit<TimetableChange, 'id' | 'publishedAt'>[] = []

    // Detect added/modified slots
    for (const draftSlot of draftSlots) {
      const original = slots.find((s) => s.id === draftSlot.id)
      if (!original) {
        // New slot
        changes.push({
          slotId: draftSlot.id,
          type: 'slot_added',
          summary: `New period: ${draftSlot.subject}`,
          context: `${draftSlot.className} · ${draftSlot.day} Period ${draftSlot.period}`,
          changeLabel: `+ ${draftSlot.subject}`,
        })
      } else {
        // Check for field changes
        const teacherObj = teachers.find((t) => t.id === draftSlot.teacherId)
        const newTeacherName = teacherObj?.name || draftSlot.teacherName
        if (original.teacherId !== draftSlot.teacherId) {
          const oldTeacher = teachers.find((t) => t.id === original.teacherId)
          changes.push({
            slotId: draftSlot.id, type: 'teacher_changed', summary: 'Teacher changed',
            context: `${draftSlot.className} · Period ${draftSlot.period}`,
            oldValue: original.teacherName, newValue: newTeacherName,
            changeLabel: `${original.teacherName} → ${newTeacherName}`,
          })
        }
        if (original.subject !== draftSlot.subject) {
          changes.push({
            slotId: draftSlot.id, type: 'subject_changed', summary: 'Subject changed',
            context: `${draftSlot.className} · Period ${draftSlot.period}`,
            oldValue: original.subject, newValue: draftSlot.subject,
            changeLabel: `${original.subject} → ${draftSlot.subject}`,
          })
        }
        if (original.room !== draftSlot.room) {
          changes.push({
            slotId: draftSlot.id, type: 'room_changed', summary: 'Room changed',
            context: `${draftSlot.className} · Period ${draftSlot.period}`,
            oldValue: original.room, newValue: draftSlot.room,
            changeLabel: `${original.room} → ${draftSlot.room}`,
          })
        }
        if (original.period !== draftSlot.period) {
          changes.push({
            slotId: draftSlot.id, type: 'period_changed', summary: 'Period changed',
            context: draftSlot.className,
            oldValue: `P${original.period}`, newValue: `P${draftSlot.period}`,
            changeLabel: `P${original.period} → P${draftSlot.period}`,
          })
        }
      }
    }

    // Detect removed slots
    for (const original of slots) {
      if (!draftSlots.find((s) => s.id === original.id)) {
        changes.push({
          slotId: original.id, type: 'slot_removed', summary: `Period removed: ${original.subject}`,
          context: `${original.className} · ${original.day} Period ${original.period}`,
          changeLabel: `− ${original.subject}`,
        })
      }
    }

    // Commit to store: replace slots with draftSlots
    // We do this by removing all old slots and adding all draft slots
    // But since we can't replace all at once, we'll use a batch approach
    for (const oldSlot of slots) {
      if (!draftSlots.find((s) => s.id === oldSlot.id)) {
        removeSlotAction(oldSlot.id)
      }
    }
    for (const draftSlot of draftSlots) {
      const original = slots.find((s) => s.id === draftSlot.id)
      if (!original) {
        addSlotAction(draftSlot)
      } else if (JSON.stringify(original) !== JSON.stringify(draftSlot)) {
        updateSlotAction(draftSlot.id, draftSlot)
      }
    }

    // Record changes
    for (const change of changes) {
      recordChange(change)
    }

    setEditMode(false)
    setHasUnsavedChanges(false)
    toast.success('Changes applied', {
      description: changes.length > 0 ? `${changes.length} change${changes.length === 1 ? '' : 's'} ready to publish` : undefined,
    })
  }

  const handleOpenAssign = (day: DayType, period: number, className: string) => {
    const periodObj = PERIODS.find((p) => p.number === period)
    // Auto-derive room from existing class slots
    const existingClassSlot = draftSlots.find((s) => s.className === className)
    const room = existingClassSlot?.room || 'Room 102'
    setEditorContext({
      day, period,
      periodName: periodObj?.name || `Period ${period}`,
      time: periodObj?.time || '08:30 AM - 09:15 AM',
      className, room,
    })
    setEditingSlot(null)
    setMinimalForm({ subject: '', teacherId: '' })
    setEditorOpen(true)
  }

  const handleEditSlot = (slot: Slot) => {
    const periodObj = PERIODS.find((p) => p.number === slot.period)
    setEditorContext({
      day: slot.day, period: slot.period,
      periodName: periodObj?.name || `Period ${slot.period}`,
      time: slot.time, className: slot.className, room: slot.room,
    })
    setEditingSlot({ id: slot.id, subject: slot.subject, teacherId: slot.teacherId })
    setMinimalForm({ subject: slot.subject, teacherId: slot.teacherId })
    setEditorOpen(true)
  }

  const handleSaveSlot = () => {
    if (conflictInfo.hasConflict) return

    const teacherObj = teachers.find((t) => t.id === minimalForm.teacherId)
    const teacherName = teacherObj?.name || 'Assigned Faculty'
    const periodObj = PERIODS.find((p) => p.number === editorContext.period)

    if (editingSlot) {
      // Update existing slot in draft
      setDraftSlots((prev) => prev.map((s) =>
        s.id === editingSlot.id
          ? { ...s, subject: minimalForm.subject, teacherId: minimalForm.teacherId, teacherName }
          : s
      ))
    } else {
      // Add new slot to draft
      const newSlot: Slot = {
        id: `tt-${Date.now().toString().slice(-6)}`,
        day: editorContext.day,
        period: editorContext.period,
        time: periodObj?.time || editorContext.time,
        className: editorContext.className,
        subject: minimalForm.subject,
        teacherId: minimalForm.teacherId,
        teacherName,
        room: editorContext.room,
        type: 'Lecture',
      }
      setDraftSlots((prev) => [...prev, newSlot])
    }

    setHasUnsavedChanges(true)
    setEditorOpen(false)
  }

  const handleRemoveSlot = () => {
    if (!removeTarget) return
    setDraftSlots((prev) => prev.filter((s) => s.id !== removeTarget.id))
    setHasUnsavedChanges(true)
    setRemoveTarget(null)
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
              <DropdownMenuItem onClick={() => handleExport('class')} className="text-xs">Class timetable</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('teacher')} className="text-xs">Teacher timetable</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('master')} className="text-xs">Master timetable</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {editMode ? (
            <>
              {hasUnsavedChanges ? (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleExitEdit}>Cancel</Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApplyChanges}
                    disabled={globalConflictCount > 0}
                  >
                    <Check className="h-3.5 w-3.5" /> Apply Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleExitEdit}>Cancel</Button>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Editing
                  </span>
                  {/* Auto Timetable — only in edit mode (Brief section 29) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => setAutoOpen(true)}
                    title="Auto timetable"
                    aria-label="Auto timetable"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </Button>
                </>
              )}
              {globalConflictCount > 0 && hasUnsavedChanges && (
                <span className="text-[10px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {globalConflictCount} conflict{globalConflictCount === 1 ? '' : 's'}
                </span>
              )}
            </>
          ) : hasPendingPublish ? (
            <>
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

      {/* Pending publish banner */}
      {hasPendingPublish && !editMode && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">
              {pendingChanges.length} timetable change{pendingChanges.length === 1 ? '' : 's'} ready to publish
            </span>
          </div>
        </div>
      )}

      <OverviewCards slots={displaySlots} conflictCount={globalConflictCount} />

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
        onDuplicateSlot={(slot) => {
          // Duplicate in draft
          const newSlot = { ...slot, id: `tt-${Date.now().toString().slice(-6)}` }
          setDraftSlots((prev) => [...prev, newSlot])
          setHasUnsavedChanges(true)
          toast.success('Slot duplicated')
        }}
        onRemoveSlot={(slot) => setRemoveTarget(slot)}
        onAssignPeriod={(day, period) => {
          // Derive className from selectedClass filter
          const className = selectedClass !== 'all' ? selectedClass : 'Class 2-A'
          handleOpenAssign(day, period, className)
        }}
      />

      {/* Minimal slot editor */}
      <SlotEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        context={editorContext}
        editingSlot={editingSlot}
        form={minimalForm}
        setForm={setMinimalForm}
        conflictInfo={conflictInfo}
        onSave={handleSaveSlot}
      />

      {/* Remove confirmation */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove this period?"
        description={`${removeTarget?.subject} · ${removeTarget?.className} · ${removeTarget?.day} Period ${removeTarget?.period}.`}
        tone="destructive"
        icon={Trash2}
        confirmLabel="Remove"
        onConfirm={handleRemoveSlot}
      />

      {/* Discard changes confirmation */}
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your unsaved timetable edits will be lost."
        tone="destructive"
        icon={AlertTriangle}
        confirmLabel="Discard"
        onConfirm={handleDiscard}
      />

      {/* Publish confirmation */}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        changes={pendingChanges}
        conflictCount={globalConflictCount}
        onPublish={handlePublish}
        onRemoveChange={removePendingChange}
      />

      {/* Auto Timetable */}
      <AutoTimetableDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        existingSlots={draftSlots}
        onGenerate={(generated) => {
          setDraftSlots(generated)
          setHasUnsavedChanges(true)
        }}
      />
    </PageTransition>
  )
}

export default TimetableModule
