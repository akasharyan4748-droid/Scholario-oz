'use client'

/**
 * SeatingSection — examination room + seat allocation system.
 *
 * Spec: Schedule = WHEN. Seating = WHERE.
 * Rooms, seats, students, invigilators — all managed here.
 */

import { useState, useMemo } from 'react'
import { MapPin, Plus, Trash2, Sparkles, Download, Users, Layers, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import type { ExamRoom, SeatingPlan, SeatingStudent, SeatingType, InvigilatorAssignment } from '@/lib/exams/seating/types'
import { CLASS_BANDS } from '@/lib/exams/seating/types'
import { computeCapacity, generateSeatingPlan, seatsForRoom } from '@/lib/exams/seating/generator'
import { SeatingMap } from './seating-map'
import { generateSeatingPlanPDF } from '@/lib/exams/seating-pdf'

interface Props {
  exam: ExamDTO
}

export function SeatingSection({ exam }: Props) {
  const [rooms, setRooms] = useState<ExamRoom[]>([
    { id: 'room-1', name: 'Room A', roomNo: 'A-101', rows: 5, cols: 6, seatingType: 'single', capacity: 30 },
  ])
  const [plan, setPlan] = useState<SeatingPlan | null>(null)
  const [classBandId, setClassBandId] = useState(CLASS_BANDS[4].id)
  const [invigilators, setInvigilators] = useState<InvigilatorAssignment[]>([])

  const totalCapacity = useMemo(() => rooms.reduce((sum, r) => sum + r.capacity, 0), [rooms])

  // Mock students: derive from exam.classes (gradeLevel-based band filtering)
  const eligibleStudents = useMemo<SeatingStudent[]>(() => {
    const band = CLASS_BANDS.find((b) => b.id === classBandId)
    if (!band) return []
    return exam.classes
      .filter((c: any) => band.grades.includes(parseInt(c.gradeLevel ?? '0', 10)))
      .flatMap((c: any) => {
        const count = Math.max(2, Math.min(8, c.studentCount || 4))
        return Array.from({ length: count }, (_, i) => ({
          id: `${c.classId}-stu-${i}`,
          name: `Student ${i + 1}`,
          rollNo: `${String(i + 1).padStart(2, '0')}`,
          classId: c.classId,
          className: c.className,
          gradeLevel: parseInt(c.gradeLevel ?? '0', 10),
        }))
      })
  }, [exam.classes, classBandId])

  const handleAddRoom = () => {
    const idx = rooms.length + 1
    setRooms((r) => [...r, {
      id: `room-${Date.now()}`,
      name: `Room ${String.fromCharCode(64 + idx)}`,
      roomNo: `A-${100 + idx}`,
      rows: 5, cols: 6, seatingType: 'single', capacity: 30,
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

  const handleRemoveRoom = (id: string) => {
    setRooms((rs) => rs.filter((r) => r.id !== id))
  }

  const handleGenerate = () => {
    if (rooms.length === 0) { toast.error('Add at least one room'); return }
    if (eligibleStudents.length === 0) { toast.error('No eligible students for this class band'); return }
    const result = generateSeatingPlan(exam.id, rooms, eligibleStudents, classBandId)
    setPlan(result)
    if (result.fits) {
      toast.success(`Seating generated: ${result.totalAssigned} students assigned`)
    } else {
      toast.warning(`Seating generated: ${result.totalAssigned} assigned, ${result.totalUnassigned} could not be seated`)
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

  const band = CLASS_BANDS.find((b) => b.id === classBandId)
  const canGenerate = rooms.length > 0 && eligibleStudents.length > 0

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SummaryStat icon={<Layers className="h-3 w-3" />} label="Rooms" value={String(rooms.length)} />
        <SummaryStat icon={<Users className="h-3 w-3" />} label="Capacity" value={String(totalCapacity)} />
        <SummaryStat icon={<Users className="h-3 w-3" />} label="Students" value={String(eligibleStudents.length)} />
        <SummaryStat icon={<MapPin className="h-3 w-3" />} label="Class Band" value={band?.label ?? '—'} />
        <SummaryStat
          icon={<Sparkles className="h-3 w-3" />}
          label="Status"
          value={plan ? (plan.fits ? 'Ready' : 'Partial') : 'Not Generated'}
        />
      </div>

      {/* Room management + generation controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Examination Rooms</p>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleAddRoom}>
            <Plus className="h-3 w-3" /> Add Room
          </Button>
        </div>
        <div className="space-y-2">
          {rooms.map((room) => (
            <RoomEditor key={room.id} room={room} onUpdate={handleUpdateRoom} onRemove={handleRemoveRoom} />
          ))}
        </div>

        {/* Class band selector */}
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground shrink-0">Class Band</Label>
          <Select value={classBandId} onValueChange={setClassBandId}>
            <SelectTrigger size="sm" className="text-xs h-7 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CLASS_BANDS.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Generate / download buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleGenerate} disabled={!canGenerate}>
            <Sparkles className="h-3 w-3" /> {plan ? 'Regenerate' : 'Generate Seating'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleDownload} disabled={!plan}>
            <Download className="h-3 w-3" /> Download Plan
          </Button>
          {plan && !plan.fits && (
            <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded">
              {plan.totalUnassigned} students could not be seated — add more rooms.
            </span>
          )}
        </div>
      </div>

      {/* Seating plan — room-by-room visual map */}
      {plan && plan.rooms.map((room) => {
        const roomSeats = seatsForRoom(plan, room.id)
        const occupied = roomSeats.filter((s) => s.studentId !== null).length
        return (
          <div key={room.id} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold">{room.name} — {room.roomNo}</p>
                <p className="text-[10px] text-muted-foreground">{room.rows}×{room.cols} {room.seatingType} · {room.capacity} seats</p>
              </div>
              <span className={cn('text-[10px] font-semibold', occupied === room.capacity ? 'text-emerald-600' : 'text-muted-foreground')}>
                {occupied} / {room.capacity} occupied
              </span>
            </div>
            <SeatingMap room={room} plan={plan} />
            {/* Invigilator assignment per room */}
            <InvigilatorRow roomId={room.id} assignments={invigilators} setAssignments={setInvigilators} />
          </div>
        )
      })}
    </div>
  )
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function RoomEditor({ room, onUpdate, onRemove }: {
  room: ExamRoom
  onUpdate: (id: string, field: keyof ExamRoom, value: any) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input value={room.name} onChange={(e) => onUpdate(room.id, 'name', e.target.value)} placeholder="Room name" className="h-7 text-xs flex-1 min-w-[80px]" />
      <Input value={room.roomNo} onChange={(e) => onUpdate(room.id, 'roomNo', e.target.value)} placeholder="Room #" className="h-7 text-xs w-20" />
      <Input type="number" value={room.rows} onChange={(e) => onUpdate(room.id, 'rows', Number(e.target.value))} className="h-7 text-xs w-14" min={1} max={20} />
      <span className="text-[10px] text-muted-foreground">×</span>
      <Input type="number" value={room.cols} onChange={(e) => onUpdate(room.id, 'cols', Number(e.target.value))} className="h-7 text-xs w-14" min={1} max={20} />
      <Select value={room.seatingType} onValueChange={(v) => onUpdate(room.id, 'seatingType', v as SeatingType)}>
        <SelectTrigger size="sm" className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single</SelectItem>
          <SelectItem value="double">Double</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-8">{room.capacity}</span>
      <button onClick={() => onRemove(room.id)} className="text-muted-foreground hover:text-rose-500 shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function InvigilatorRow({ roomId, assignments, setAssignments }: {
  roomId: string
  assignments: InvigilatorAssignment[]
  setAssignments: React.Dispatch<React.SetStateAction<InvigilatorAssignment[]>>
}) {
  const [teacherName, setTeacherName] = useState('')
  const roomAssignments = assignments.filter((a) => a.roomId === roomId)

  const handleAdd = () => {
    if (!teacherName.trim()) return
    setAssignments((prev) => [...prev, { roomId, teacherId: `t-${Date.now()}`, teacherName: teacherName.trim() }])
    setTeacherName('')
  }

  const handleRemove = (teacherId: string) => {
    setAssignments((prev) => prev.filter((a) => a.teacherId !== teacherId))
  }

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
      <span className="text-[9px] uppercase font-semibold text-muted-foreground shrink-0">Invigilator</span>
      {roomAssignments.map((a) => (
        <span key={a.teacherId} className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
          {a.teacherName}
          <button onClick={() => handleRemove(a.teacherId)} className="hover:text-rose-500">×</button>
        </span>
      ))}
      <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Add teacher" className="h-6 text-[10px] w-32" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }} />
    </div>
  )
}
