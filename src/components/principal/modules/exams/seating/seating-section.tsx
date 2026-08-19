'use client'

/**
 * SeatingSection — examination room + seat allocation system.
 *
 * Uses REAL student data from the Students & Classes Zustand store.
 * Uses REAL teacher data from the teachers mock.
 * Each room has its own eligible class selection.
 */

import { useState, useMemo } from 'react'
import { Plus, Trash2, RefreshCw, Download, Users, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import type { ExamRoom, SeatingPlan, SeatingStudent, SeatingType, InvigilatorAssignment } from '@/lib/exams/seating/types'
import { computeCapacity } from '@/lib/exams/seating/types'
import { generateSeatingPlan, seatsForRoom, roomOccupancy } from '@/lib/exams/seating/generator'
import { SeatingMap } from './seating-map'
import { generateSeatingPlanPDF } from '@/lib/exams/seating-pdf'
import { useStudentsStore } from '@/lib/store/students-store'
import { useTeachersMockStore } from '@/lib/store/teachers-mock-store'

interface Props {
  exam: ExamDTO
}

export function SeatingSection({ exam }: Props) {
  const [rooms, setRooms] = useState<ExamRoom[]>([
    { id: 'room-1', name: 'Room A', roomNo: 'A-101', rows: 5, cols: 6, seatingType: 'single', capacity: 30, eligibleClassIds: [] },
  ])
  const [plan, setPlan] = useState<SeatingPlan | null>(null)
  const [invigilators, setInvigilators] = useState<InvigilatorAssignment[]>([])

  // Get real students from the Students & Classes store.
  const allStudents = useStudentsStore((s) => s.students)
  // Get real teachers from the teachers mock store.
  const allTeachers = useTeachersMockStore((s) => s.teachers)

  // Build student records eligible for the exam's classes.
  const studentsByClass = useMemo(() => {
    const map = new Map<string, SeatingStudent[]>()
    for (const examClass of exam.classes) {
      const classStudents = allStudents
        .filter((s) => s.classId === examClass.classId && s.status === 'Active')
        .map((s) => ({
          id: s.id,
          name: s.name,
          rollNo: s.rollNo,
          classId: examClass.classId,
          className: examClass.className,
        }))
      map.set(examClass.classId, classStudents)
    }
    return map
  }, [exam.classes, allStudents])

  const totalEligibleStudents = useMemo(() => {
    const ids = new Set<string>()
    for (const students of studentsByClass.values()) {
      for (const s of students) ids.add(s.id)
    }
    return ids.size
  }, [studentsByClass])

  const totalCapacity = useMemo(() => rooms.reduce((sum, r) => sum + r.capacity, 0), [rooms])

  const handleAddRoom = () => {
    const idx = rooms.length + 1
    setRooms((r) => [...r, {
      id: `room-${Date.now()}`, name: `Room ${String.fromCharCode(64 + idx)}`,
      roomNo: `A-${100 + idx}`, rows: 5, cols: 6, seatingType: 'single' as SeatingType,
      capacity: 30, eligibleClassIds: [],
    }])
  }

  const handleUpdateRoom = (id: string, field: keyof ExamRoom, value: any) => {
    setRooms((rs) => rs.map((r) => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (field === 'rows' || field === 'cols' || field === 'seatingType') {
        updated.capacity = computeCapacity(updated.rows, updated.cols, updated.seatingType)
      }
      return updated
    }))
  }

  const handleRemoveRoom = (id: string) => setRooms((rs) => rs.filter((r) => r.id !== id))

  const toggleEligibleClass = (roomId: string, classId: string) => {
    setRooms((rs) => rs.map((r) => {
      if (r.id !== roomId) return r
      const eligible = r.eligibleClassIds.includes(classId)
        ? r.eligibleClassIds.filter((c) => c !== classId)
        : [...r.eligibleClassIds, classId]
      return { ...r, eligibleClassIds: eligible }
    }))
  }

  const handleGenerate = () => {
    if (rooms.length === 0) { toast.error('Add at least one room'); return }
    if (rooms.some((r) => r.eligibleClassIds.length === 0)) {
      toast.error('Each room needs at least one eligible class')
      return
    }
    const result = generateSeatingPlan(exam.id, rooms, studentsByClass)
    setPlan(result)
    if (result.fits) {
      toast.success(`${result.totalAssigned} students seated`)
    } else {
      toast.warning(`${result.totalAssigned} seated, ${result.totalUnassigned} need more seats`)
    }
  }

  const handleDownload = () => {
    if (!plan) { toast.error('No seating plan to export'); return }
    try {
      generateSeatingPlanPDF(exam, plan)
      toast.success('Seating plan PDF downloaded')
    } catch (e: any) {
      toast.error('Export failed', { description: e.message })
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat icon={<Layers className="h-3 w-3" />} label="Rooms" value={String(rooms.length)} />
        <Stat icon={<Users className="h-3 w-3" />} label="Capacity" value={String(totalCapacity)} />
        <Stat icon={<Users className="h-3 w-3" />} label="Students" value={String(totalEligibleStudents)} />
        <Stat icon={<RefreshCw className="h-3 w-3" />} label="Status" value={plan ? (plan.fits ? 'Ready' : 'Partial') : 'Not Generated'} />
      </div>

      {/* Rooms + actions */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground">Examination Rooms</p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleGenerate}>
            <RefreshCw className="h-3 w-3" /> {plan ? 'Regenerate' : 'Generate'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleDownload} disabled={!plan}>
            <Download className="h-3 w-3" /> Download
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleAddRoom}>
            <Plus className="h-3 w-3" /> Add Room
          </Button>
        </div>
      </div>

      {/* Room cards */}
      {rooms.map((room) => {
        const roomStudents = room.eligibleClassIds.flatMap((cId) => studentsByClass.get(cId) ?? [])
        return (
          <div key={room.id} className="rounded-lg border border-border/60 p-3 space-y-2">
            {/* Room header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{room.name}</p>
                <p className="text-[10px] text-muted-foreground">{room.roomNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {room.rows}×{room.cols} {room.seatingType} · {room.capacity} seats
                </span>
                <button onClick={() => handleRemoveRoom(room.id)} className="text-muted-foreground hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Room config */}
            <div className="flex items-center gap-2 flex-wrap">
              <Input value={room.name} onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)} placeholder="Name" className="h-7 text-xs flex-1 min-w-[80px]" />
              <Input value={room.roomNo} onChange={(e) => handleUpdateRoom(room.id, 'roomNo', e.target.value)} placeholder="Room #" className="h-7 text-xs w-20" />
              <Input type="number" value={room.rows} onChange={(e) => handleUpdateRoom(room.id, 'rows', Number(e.target.value))} className="h-7 text-xs w-12" min={1} max={20} />
              <span className="text-[10px] text-muted-foreground">×</span>
              <Input type="number" value={room.cols} onChange={(e) => handleUpdateRoom(room.id, 'cols', Number(e.target.value))} className="h-7 text-xs w-12" min={1} max={20} />
              <Select value={room.seatingType} onValueChange={(v) => handleUpdateRoom(room.id, 'seatingType', v as SeatingType)}>
                <SelectTrigger size="sm" className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Eligible classes */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground mr-1">Classes:</span>
              {exam.classes.map((c: any) => {
                const isSelected = room.eligibleClassIds.includes(c.classId)
                const count = (studentsByClass.get(c.classId) ?? []).length
                return (
                  <button
                    key={c.classId}
                    onClick={() => toggleEligibleClass(room.id, c.classId)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                      isSelected ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/30',
                    )}
                  >
                    {c.className} ({count})
                  </button>
                )
              })}
            </div>

            {/* Seating map (after generation) */}
            {plan && (() => {
              const { occupied, capacity: cap } = roomOccupancy(plan, room.id)
              return (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-[10px] font-semibold', occupied === cap ? 'text-emerald-600' : 'text-muted-foreground')}>
                      {occupied} / {cap} occupied
                    </span>
                    {/* Invigilator */}
                    <InvigilatorAssign roomId={room.id} assignments={invigilators} setAssignments={setInvigilators} teachers={allTeachers} />
                  </div>
                  <SeatingMap room={room} plan={plan} />
                </div>
              )
            })()}
          </div>
        )
      })}

      {/* Unassigned warning */}
      {plan && !plan.fits && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-300">
          {plan.totalUnassigned} students need additional seating. Add more rooms or increase capacity.
        </div>
      )}

      {/* Empty state */}
      {allStudents.length === 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No student records available for seating. Ensure students are added in Students &amp; Classes.
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[11px] font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

function InvigilatorAssign({ roomId, assignments, setAssignments, teachers }: {
  roomId: string
  assignments: InvigilatorAssignment[]
  setAssignments: React.Dispatch<React.SetStateAction<InvigilatorAssignment[]>>
  teachers: any[]
}) {
  const roomAssignment = assignments.find((a) => a.roomId === roomId)
  const handleSelect = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    if (!teacher) return
    setAssignments((prev) => {
      const without = prev.filter((a) => a.roomId !== roomId)
      return [...without, { roomId, teacherId, teacherName: teacher.name }]
    })
  }
  return (
    <Select value={roomAssignment?.teacherId ?? ''} onValueChange={handleSelect}>
      <SelectTrigger size="sm" className="h-6 text-[9px] w-32"><SelectValue placeholder="Invigilator" /></SelectTrigger>
      <SelectContent>
        {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
