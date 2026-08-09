'use client'

/**
 * TimetableModule — Principal's master scheduling workspace.
 *
 * Brief section 4 + 5: Keep the structure (Header → Summary → Filters →
 * Schedule) but evolve it into a "School Scheduling Workspace" rather
 * than an "analytics dashboard + giant table".
 *
 * Brief section 37: Uses the canonical `useTimetableStore` (Zustand +
 * persist) so slot mutations survive page reloads.
 *
 * Brief section 14: Real-time conflict detection while editing.
 */
import { useState, useMemo } from 'react'
import { Plus, Download } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTimetableStore, detectConflicts, type DayType, type TimetableFormState, type TimetableSlot } from './timetable-store'
import { teachers } from '@/lib/mock/teachers'
import { initialFormState } from './data'
import { toast } from 'sonner'
import { OverviewCards } from './overview-cards'
import { FiltersBar } from './filters-bar'
import { ScheduleGrid } from './schedule-grid'
import { SlotEditorDialog } from './slot-editor-dialog'
import { ConfirmDialog } from '../shared/confirm-dialog'
import { Trash2, AlertTriangle } from 'lucide-react'

export function TimetableModule() {
  // Subscribe to canonical store — slots persist across reloads.
  const slots = useTimetableStore((s) => s.slots)
  const addSlot = useTimetableStore((s) => s.addSlot)
  const updateSlot = useTimetableStore((s) => s.updateSlot)
  const removeSlot = useTimetableStore((s) => s.removeSlot)
  const duplicateSlot = useTimetableStore((s) => s.duplicateSlot)

  const [selectedClass, setSelectedClass] = useState<string>('Class 2-A')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<DayType>('Monday')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [form, setForm] = useState<TimetableFormState>(initialFormState)
  const [removeTarget, setRemoveTarget] = useState<TimetableSlot | null>(null)

  // Real-time conflict detection (Brief section 14)
  const conflictInfo = useMemo(
    () => detectConflicts(slots, form, editingSlot?.id),
    [slots, form, editingSlot]
  )

  // Filtered slots for the timetable view
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass
      const matchTeacher = selectedTeacher === 'all' || s.teacherId === selectedTeacher
      const matchRoom = selectedRoom === 'all' || s.room === selectedRoom
      return matchClass && matchTeacher && matchRoom
    })
  }, [slots, selectedClass, selectedTeacher, selectedRoom])

  // Count real conflicts across ALL slots (not just filtered)
  const conflictCount = useMemo(() => {
    const seen = new Map<string, TimetableSlot>()
    let count = 0
    for (const s of slots) {
      const key = `${s.day}-${s.period}-${s.teacherId}`
      if (seen.has(key)) {
        count++
      } else {
        seen.set(key, s)
      }
    }
    // Also check room conflicts
    const roomSeen = new Map<string, TimetableSlot>()
    for (const s of slots) {
      const key = `${s.day}-${s.period}-${s.room}`
      if (roomSeen.has(key)) {
        count++
      } else {
        roomSeen.set(key, s)
      }
    }
    return count
  }, [slots])

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

    // Resolve teacher name from teacherId so the grid can display it
    const teacherObj = teachers.find((t) => t.id === form.teacherId)
    const teacherName = teacherObj?.name || 'Assigned Faculty'

    if (editingSlot) {
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
      toast.success('Timetable slot updated')
    } else {
      const newSlot: TimetableSlot = {
        id: `tt-${Date.now().toString().slice(-6)}`,
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
      toast.success('New period added', {
        description: `${form.className} · ${form.subject} (${form.day} P${form.period})`,
      })
    }
    setEditorOpen(false)
  }

  const handleRemoveSlot = () => {
    if (!removeTarget) return
    removeSlot(removeTarget.id)
    toast.success('Period removed')
    setRemoveTarget(null)
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
      {/* Compact header — title + actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Timetable</h1>
          <p className="text-xs text-muted-foreground mt-0.5">School-wide master schedule</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleOpenAdd()}
          >
            <Plus className="h-3.5 w-3.5" /> Add Slot
          </Button>
        </div>
      </div>

      <OverviewCards slots={slots} conflictCount={conflictCount} />

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
        onEditSlot={handleEditSlot}
        onDuplicateSlot={handleDuplicateSlot}
        onRemoveSlot={(slot) => setRemoveTarget(slot)}
        onAssignPeriod={handleOpenAdd}
      />

      <SlotEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingSlot={editingSlot}
        form={form}
        setForm={setForm}
        conflictInfo={conflictInfo}
        onSave={handleSaveSlot}
      />

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
    </PageTransition>
  )
}

export default TimetableModule
