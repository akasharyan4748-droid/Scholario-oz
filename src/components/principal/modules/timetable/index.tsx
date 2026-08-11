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
  useTimetableStore,
  detectConflicts,
  countAllConflicts,
  getConflictedSlotIds,
  type DayType,
  type TimetableSlot,
  type TimetableChange,
} from './timetable-store'
import { teachers } from '@/lib/mock/teachers'
import { buildInitialRows, type TimetableSlot as Slot } from './data'
import type { TimetableRow } from './schedule-grid'
import {
  recomputeRowTimes,
  reanchorTimelineAtRow,
  renumberVisiblePeriods,
  defaultDurationForRow,
} from './time-engine'
import { toast } from 'sonner'
import { OverviewCards } from './overview-cards'
import { FiltersBar } from './filters-bar'
import { ScheduleGrid } from './schedule-grid'
import { SlotEditorDialog, type MinimalSlotForm } from './slot-editor-dialog'
import { PublishDialog } from './publish-dialog'
import { AutoTimetableDialog } from './auto-timetable-dialog'
import { ConfirmDialog } from '../shared/confirm-dialog'
import { exportTimetablePDF } from './timetable-pdf'
import { ExportPreview } from './export-preview'
import { Trash2, AlertTriangle } from 'lucide-react'
import { CLASSES } from './data'

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
  const cancelAllPendingChanges = useTimetableStore((s) => s.cancelAllPendingChanges)
  const publish = useTimetableStore((s) => s.publish)

  // ── Draft state (local — only mutated during edit mode) ──
  const [draftSlots, setDraftSlots] = useState<Slot[]>(slots)
  const [draftRows, setDraftRows] = useState<TimetableRow[]>(buildInitialRows())
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
  const [exportPreview, setExportPreview] = useState<
    | { html: string; title: string; subtitle: string; orientation: 'portrait' | 'landscape' }
    | null
  >(null)

  // Sync draft when entering edit mode (Brief section 27)
  useEffect(() => {
    if (editMode) {
      setDraftSlots(slots)
      setDraftRows(buildInitialRows())
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
  const conflictedSlotIds = useMemo(() => getConflictedSlotIds(displaySlots), [displaySlots])
  const hasPendingPublish = pendingChanges.length > 0

  // ── Handlers ──
  const handleEnterEdit = () => {
    setDraftSlots(slots)
    setDraftRows(buildInitialRows())
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
    setDraftRows(buildInitialRows())
    setHasUnsavedChanges(false)
    setEditMode(false)
    setDiscardOpen(false)
    setEditorOpen(false)
    setEditingSlot(null)
  }

  // ── Row management handlers (Brief section 4-10 + 19) ──
  // All structural mutations funnel through recomputeRowTimes so the
  // timeline is always chronologically valid (Brief 1.7 + 1.8).
  const handleInsertRow = (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => {
    setDraftRows((prev) => {
      const insertIdx = prev.findIndex((r) => r.number === afterRowNumber) + 1
      const isBreak = type !== 'period'
      const breakType = type === 'short_break' ? 'short' : type === 'lunch_break' ? 'lunch' : undefined
      const newRow: TimetableRow = {
        number: Date.now(), // stable internal id (NOT visible period number)
        name: isBreak ? (type === 'short_break' ? 'Short Break' : 'Lunch Break') : 'Period',
        time: '', // derived below
        isBreak,
        breakType,
        durationMin: defaultDurationForRow(isBreak, breakType),
      }
      const next = [...prev]
      next.splice(insertIdx, 0, newRow)
      // Brief 2: renumber visible period names
      const renumbered = renumberVisiblePeriods(next)
      // Brief 1.7: recompute all times from the anchor (first row's start)
      return recomputeRowTimes(renumbered)
    })
    setHasUnsavedChanges(true)
  }

  const handleDeleteRow = (rowNumber: number) => {
    // Brief 2 + 1.7: When a structural row is deleted, slots that referenced
    // its `.number` as their period are orphaned (no row to render in).
    // Remove them from the draft so the data stays consistent with the UI.
    setDraftSlots((prevSlots) => prevSlots.filter((s) => s.period !== rowNumber))
    setDraftRows((prev) => {
      const next = prev.filter((r) => r.number !== rowNumber)
      const renumbered = renumberVisiblePeriods(next)
      return recomputeRowTimes(renumbered)
    })
    setHasUnsavedChanges(true)
  }

  // Brief 1.7 + 1.8: When the user edits one row's start/end via TimeEditor,
  // derive the new durationMin for that row and CASCADE the timeline forward.
  // Rows before the edited row are untouched (still valid). Rows after re-anchor
  // from the edited row's new end. No stale times, no overlaps, no backwards time.
  const handleEditRowTime = (rowNumber: number, newTime: string) => {
    setDraftRows((prev) => reanchorTimelineAtRow(prev, rowNumber, newTime))
    setHasUnsavedChanges(true)
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
    // Brief 15: Look up time from the canonical draftRows, NOT stale PERIODS.
    const row = draftRows.find((r) => r.number === period)
    // Auto-derive room: use the class's existing room from any slot, or 'Auto'
    const existingClassSlot = draftSlots.find((s) => s.className === className)
    const room = existingClassSlot?.room || 'Auto'
    setEditorContext({
      day, period,
      periodName: row?.name || `Period ${period}`,
      time: row?.time || '08:30 AM - 09:15 AM',
      className, room,
    })
    setEditingSlot(null)
    setMinimalForm({ subject: '', teacherId: '' })
    setEditorOpen(true)
  }

  const handleEditSlot = (slot: Slot) => {
    // Brief 15: Use canonical draftRows time — slot.time may be stale after row mutations.
    const row = draftRows.find((r) => r.number === slot.period)
    setEditorContext({
      day: slot.day, period: slot.period,
      periodName: row?.name || `Period ${slot.period}`,
      time: row?.time || slot.time, className: slot.className, room: slot.room,
    })
    setEditingSlot({ id: slot.id, subject: slot.subject, teacherId: slot.teacherId })
    setMinimalForm({ subject: slot.subject, teacherId: slot.teacherId })
    setEditorOpen(true)
  }

  const handleSaveSlot = () => {
    if (conflictInfo.hasConflict) return

    const teacherObj = teachers.find((t) => t.id === minimalForm.teacherId)
    const teacherName = teacherObj?.name || 'Assigned Faculty'
    // Brief 15: Canonical time from draftRows (not stale PERIODS).
    const row = draftRows.find((r) => r.number === editorContext.period)

    if (editingSlot) {
      // Update existing slot in draft
      setDraftSlots((prev) => prev.map((s) =>
        s.id === editingSlot.id
          ? { ...s, subject: minimalForm.subject, teacherId: minimalForm.teacherId, teacherName, time: row?.time || s.time }
          : s
      ))
    } else {
      // Add new slot to draft
      const newSlot: Slot = {
        id: `tt-${Date.now().toString().slice(-6)}`,
        day: editorContext.day,
        period: editorContext.period,
        time: row?.time || editorContext.time,
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

  // Brief section 14 + 15: Exports always use the CURRENT validated state —
  // draftSlots/draftRows in edit mode, store slots/PERIODS in view mode.
  // Time + Preview + PDF share ONE timeline source (Brief 15).
  const activeRows = editMode ? draftRows : buildInitialRows()
  const activeSlots = editMode ? draftSlots : slots

  // Brief PART 2: Simplify export — master timetable only (no class/teacher
  // dropdown). Removes unnecessary scope-selection UI.
  const handleExport = () => {
    const { html, title, subtitle, orientation } = exportTimetablePDF(
      activeSlots, activeRows, selectedDay, 'all', CLASSES
    )
    setExportPreview({ html, title, subtitle, orientation })
  }

  return (
    <PageTransition className="space-y-5">
      {/* Brief PART 1: NO duplicate page title — topbar already shows "Timetable".
          Content begins directly with the subtitle + controls. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">School-wide master schedule</p>

        <div className="flex items-center gap-2">
          {/* Brief PART 2: Single Export action — master timetable only */}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

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
        conflictedSlotIds={conflictedSlotIds}
        rows={draftRows}
        onEditSlot={handleEditSlot}
        onDuplicateSlot={(slot) => {
          // Duplicate in draft
          const newSlot = { ...slot, id: `tt-${Date.now().toString().slice(-6)}` }
          setDraftSlots((prev) => [...prev, newSlot])
          setHasUnsavedChanges(true)
          toast.success('Slot duplicated')
        }}
        onRemoveSlot={(slot) => setRemoveTarget(slot)}
        onAssignPeriod={(day, period, className) => {
          // Use the EXACT clicked cell's className (Brief section 17-21)
          handleOpenAssign(day, period, className)
        }}
        onInsertRow={handleInsertRow}
        onDeleteRow={handleDeleteRow}
        onEditRowTime={handleEditRowTime}
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
        onCancelAll={() => {
          cancelAllPendingChanges()
          setPublishOpen(false)
          toast.success('All changes cancelled — timetable restored to last published state')
        }}
      />

      {/* Auto Timetable */}
      <AutoTimetableDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        existingSlots={draftSlots}
        onGenerate={(generated, generatedRows) => {
          setDraftSlots(generated)
          setDraftRows(generatedRows)
          setHasUnsavedChanges(true)
        }}
      />

      {/* Export preview — full-screen overlay with Back + Download PDF */}
      <ExportPreview
        preview={exportPreview}
        onClose={() => setExportPreview(null)}
      />
    </PageTransition>
  )
}

export default TimetableModule
