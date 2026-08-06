'use client'

// Timetable module — composition root.
//
// Owns the timetable slots state, the filter state, the modal open/close
// state, the form state, and the conflict-detection memo. Composes the
// overview metric cards, filters bar, master schedule grid, and the
// add/edit slot modal.

import { useState, useMemo } from 'react'
import { CalendarDays, Download, Plus } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { school } from '@/lib/mock/school'
import { teachers } from '@/lib/mock/teachers'
import { toast } from 'sonner'
import {
  INITIAL_SLOTS,
  PERIODS,
  initialFormState,
  type DayType,
  type TimetableFormState,
  type TimetableSlot,
} from './data'
import { OverviewCards } from './overview-cards'
import { FiltersBar } from './filters-bar'
import { ScheduleGrid } from './schedule-grid'
import { SlotModal } from './slot-modal'

export function TimetableModule() {
  const [slots, setSlots] = useState<TimetableSlot[]>(INITIAL_SLOTS)
  const [selectedClass, setSelectedClass] = useState<string>('Class 2-A')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<DayType>('Monday')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [form, setForm] = useState<TimetableFormState>(initialFormState)

  // Conflict Checking Logic
  const conflictInfo = useMemo(() => {
    const teacher = teachers.find((t) => t.id === form.teacherId || t.employeeId === form.teacherId)
    const teacherName = teacher?.name || 'Selected Teacher'

    // Check teacher conflict (Is this teacher already teaching another class in the same day & period?)
    const teacherConflict = slots.find(
      (s) =>
        s.day === form.day &&
        s.period === form.period &&
        (s.teacherId === form.teacherId || s.teacherName === teacherName) &&
        s.id !== editingSlot?.id
    )

    // Check room conflict (Is this room already occupied by another class in the same day & period?)
    const roomConflict = slots.find(
      (s) =>
        s.day === form.day &&
        s.period === form.period &&
        s.room === form.room &&
        s.id !== editingSlot?.id
    )

    // Check class conflict (Does this class already have a slot in this period?)
    const classConflict = slots.find(
      (s) =>
        s.day === form.day &&
        s.period === form.period &&
        s.className === form.className &&
        s.id !== editingSlot?.id
    )

    return {
      teacherConflict,
      roomConflict,
      classConflict,
      hasConflict: Boolean(teacherConflict || roomConflict),
    }
  }, [form.day, form.period, form.teacherId, form.room, form.className, slots, editingSlot])

  // Filtered Slots for the Timetable View
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass
      const matchTeacher = selectedTeacher === 'all' || s.teacherId === selectedTeacher || s.teacherName === selectedTeacher
      return matchClass && matchTeacher
    })
  }, [slots, selectedClass, selectedTeacher])

  // Open modal for new slot creation
  const handleOpenAddModal = (day?: DayType, periodNumber?: number) => {
    setEditingSlot(null)
    if (day) setForm((prev) => ({ ...prev, day }))
    if (periodNumber) setForm((prev) => ({ ...prev, period: periodNumber }))
    if (selectedClass !== 'all') setForm((prev) => ({ ...prev, className: selectedClass }))
    setIsAddModalOpen(true)
  }

  // Open modal for editing existing slot
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
    setIsAddModalOpen(true)
  }

  // Save / Update Slot
  const handleSaveSlot = () => {
    if (conflictInfo.hasConflict) {
      toast.error('Scheduling Conflict Detected', {
        description: 'Please resolve teacher or room double-booking before saving.',
      })
      return
    }

    const teacherObj = teachers.find((t) => t.id === form.teacherId || t.employeeId === form.teacherId)
    const teacherName = teacherObj?.name || 'Assigned Faculty'
    const periodObj = PERIODS.find((p) => p.number === form.period)

    if (editingSlot) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === editingSlot.id
            ? {
                ...s,
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
            : s
        )
      )
      toast.success('Timetable slot updated successfully')
    } else {
      const newSlot: TimetableSlot = {
        id: `tt-${Date.now().toString().slice(-4)}`,
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
      setSlots((prev) => [...prev, newSlot])
      toast.success('New timetable slot added', {
        description: `${form.className} · ${form.subject} (${form.day} Period ${form.period})`,
      })
    }

    setIsAddModalOpen(false)
  }

  // Delete Slot
  const handleDeleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id))
    toast.success('Timetable period removed')
  }

  // Export Timetable PDF
  const handleExportPDF = () => {
    toast.success('Exporting Timetable PDF', {
      description: `${selectedClass} master schedule for ${school.name}`,
    })
  }

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="School Timetable & Schedule Manager"
        subtitle={`${school.name} · Master class routines, room allocations, & conflict resolution`}
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => handleOpenAddModal()}
            >
              <Plus className="h-4 w-4" /> Add Timetable Slot
            </Button>
          </div>
        }
      />

      {/* Overview Metric Chips */}
      <OverviewCards slots={slots} />

      {/* Filters Bar */}
      <FiltersBar
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedTeacher={selectedTeacher}
        setSelectedTeacher={setSelectedTeacher}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      {/* Master Timetable Schedule Grid */}
      <ScheduleGrid
        selectedDay={selectedDay}
        selectedClass={selectedClass}
        filteredSlots={filteredSlots}
        onEditSlot={handleEditSlot}
        onDeleteSlot={handleDeleteSlot}
        onAssignPeriod={handleOpenAddModal}
      />

      {/* ADD / EDIT TIMETABLE SLOT MODAL */}
      <SlotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingSlot={editingSlot}
        form={form}
        setForm={setForm}
        conflictInfo={conflictInfo}
        onSubmit={handleSaveSlot}
      />
    </PageTransition>
  )
}

// Default export for safety / convenience alias.
export default TimetableModule
