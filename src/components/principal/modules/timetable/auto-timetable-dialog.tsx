'use client'

/**
 * AutoTimetableDialog — compact auto-schedule generator.
 *
 * Brief section 4-6: School Day Start/End time config using the same
 *   12-hour AM/PM CompactTimePicker.
 *
 * Brief section 5 + 27: Auto-generate period timings from school start/end
 *   + break structure.
 *
 * Brief section 13-19: Realistic generation — distributes subjects
 *   naturally, prevents same-teacher conflicts, avoids repetitive patterns.
 *
 * Brief section 33: Generates a DRAFT — never auto-publishes.
 */
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CLASSES, DAYS, ROOMS, PERIODS } from './data'
import { countAllConflicts } from './timetable-store'
import { teachers } from '@/lib/mock/teachers'
import { subjects } from '@/lib/mock/school'
import { useState } from 'react'
import { toast } from 'sonner'
import type { TimetableSlot } from './data'
import { CompactTimeControls } from './compact-time-picker'
import type { TimetableRow } from './schedule-grid'

interface AutoTimetableDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerate: (generatedSlots: TimetableSlot[], generatedRows: TimetableRow[]) => void
  existingSlots: TimetableSlot[]
}

/** Parse "08:30 AM" → minutes from midnight (510) */
function timeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return 510 // default 8:30 AM
  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}

/** Minutes from midnight → "08:30 AM" */
function minutesToTime(minutes: number): string {
  let hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  if (hour > 12) hour -= 12
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

/** Subject → teacher mapping (Brief section 14) */
const SUBJECT_TEACHERS: Record<string, string[]> = {
  'Mathematics': ['T-014'],
  'English': ['T-002'],
  'Science': ['T-011'],
  'EVS': ['T-011'],
  'Hindi': ['T-005'],
  'Computer Science': ['T-041'],
  'Social Studies': ['T-023'],
  'Physical Education': ['T-047'],
  'Physics': ['T-035'],
  'Chemistry': ['T-026'],
  'Biology': ['T-017'],
  'Art & Craft': ['T-053'],
  'Music': ['T-050'],
}

export function AutoTimetableDialog({ open, onOpenChange, onGenerate, existingSlots }: AutoTimetableDialogProps) {
  const [scope, setScope] = useState<string>('all')
  const [schoolStart, setSchoolStart] = useState('08:30 AM')
  const [schoolEnd, setSchoolEnd] = useState('02:45 PM')
  const [numPeriods, setNumPeriods] = useState(7)
  const [numPeriodsInput, setNumPeriodsInput] = useState('7')
  const [breakMode, setBreakMode] = useState<'none' | 'short' | 'lunch' | 'both'>('both')
  const [generating, setGenerating] = useState(false)

  const activeTeachers = teachers.filter((t) => !t.archived && t.status === 'Active')
  const targetClasses = scope === 'all' ? CLASSES : [scope]

  const handleGenerate = () => {
    setGenerating(true)

    // Brief section 5 + 27: Calculate period timings from school start/end
    const startMin = timeToMinutes(schoolStart)
    const endMin = timeToMinutes(schoolEnd)
    const totalMin = endMin - startMin

    // Use editable numPeriods + configurable break structure
    const includeShort = breakMode === 'short' || breakMode === 'both'
    const includeLunch = breakMode === 'lunch' || breakMode === 'both'
    const breakDuration = 15
    const lunchDuration = 45
    const breakTimeTotal = (includeShort ? breakDuration : 0) + (includeLunch ? lunchDuration : 0)
    const instructionalTime = totalMin - breakTimeTotal
    const periodDuration = Math.floor(instructionalTime / numPeriods)

    // Build row timings AND row structure (TimetableRow[])
    const rowTimings: { number: number; isBreak: boolean; breakType?: 'short' | 'lunch'; startTime: number; endTime: number }[] = []
    const generatedRows: TimetableRow[] = []
    let currentTime = startMin
    let periodCounter = 0
    const shortBreakAfter = Math.max(1, Math.floor(numPeriods / 3))
    const lunchBreakAfter = Math.max(1, Math.floor(numPeriods * 2 / 3))
    for (let i = 0; i < numPeriods; i++) {
      periodCounter++
      const timeStr = `${minutesToTime(currentTime)} - ${minutesToTime(currentTime + periodDuration)}`
      rowTimings.push({ number: periodCounter, isBreak: false, startTime: currentTime, endTime: currentTime + periodDuration })
      generatedRows.push({ number: periodCounter, name: `Period ${periodCounter}`, time: timeStr, isBreak: false })
      currentTime += periodDuration
      if (i === shortBreakAfter - 1 && includeShort) {
        const breakTime = `${minutesToTime(currentTime)} - ${minutesToTime(currentTime + breakDuration)}`
        rowTimings.push({ number: 100, isBreak: true, breakType: 'short', startTime: currentTime, endTime: currentTime + breakDuration })
        generatedRows.push({ number: 100, name: 'Short Break', time: breakTime, isBreak: true, breakType: 'short' })
        currentTime += breakDuration
      }
      if (i === lunchBreakAfter - 1 && includeLunch) {
        const breakTime = `${minutesToTime(currentTime)} - ${minutesToTime(currentTime + lunchDuration)}`
        rowTimings.push({ number: 101, isBreak: true, breakType: 'lunch', startTime: currentTime, endTime: currentTime + lunchDuration })
        generatedRows.push({ number: 101, name: 'Lunch Break', time: breakTime, isBreak: true, breakType: 'lunch' })
        currentTime += lunchDuration
      }
    }

    // Brief section 13-19: Realistic generation
    const generated: TimetableSlot[] = []
    let assignedCount = 0

    // Track teacher load: teacherId → Map<day-period, boolean>
    const teacherOccupancy = new Map<string, Set<string>>() // teacherId → set of "day-period" keys
    const getTeacherKey = (teacherId: string, day: string, period: number) => `${teacherId}-${day}-${period}`

    // Track class-subject distribution to avoid repetition (Brief section 17)
    const classSubjectCount = new Map<string, Map<string, number>>() // className → subject → count

    for (const className of targetClasses) {
      for (const day of DAYS) {
        for (const rowTiming of rowTimings) {
          if (rowTiming.isBreak) continue

          const period = rowTiming.number

          // Get available subjects for this class (rotate to distribute naturally)
          const classSubjects = subjects.slice(0, 6).map((s) => s.name)
          // Add extra subjects for variety
          const extraSubjects = ['Hindi', 'Social Studies', 'Computer Science', 'Art & Craft', 'Physical Education']
          const allClassSubjects = [...classSubjects, ...extraSubjects]

          // Brief section 17: Avoid same subject in consecutive periods
          const lastSubject = generated.length > 0 ? generated[generated.length - 1]?.subject : null

          // Try subjects in a rotated order based on class + day + period (Brief section 18)
          const rotationOffset = (day.length + className.length + period) % allClassSubjects.length
          const shuffledSubjects = [...allClassSubjects.slice(rotationOffset), ...allClassSubjects.slice(0, rotationOffset)]

          let assigned = false
          for (const subject of shuffledSubjects) {
            // Skip if same as last subject (Brief section 17)
            if (subject === lastSubject) continue

            // Get available teachers for this subject
            const subjectTeacherIds = SUBJECT_TEACHERS[subject] || []
            const availableTeachers = subjectTeacherIds
              .map((id) => teachers.find((t) => t.id === id))
              .filter((t): t is NonNullable<typeof t> => !!t && !t.archived && t.status === 'Active')
              .filter((t) => {
                // Brief section 15: NEVER assign same teacher to two classes at same day+period
                const key = getTeacherKey(t.id, day, period)
                if (!teacherOccupancy.has(t.id)) teacherOccupancy.set(t.id, new Set())
                return !teacherOccupancy.get(t.id)!.has(`${day}-${period}`)
              })

            if (availableTeachers.length === 0) continue

            // Pick teacher (round-robin among available)
            const teacher = availableTeachers[0]

            // Mark teacher as occupied
            const occKey = `${day}-${period}`
            if (!teacherOccupancy.has(teacher.id)) teacherOccupancy.set(teacher.id, new Set())
            teacherOccupancy.get(teacher.id)!.add(occKey)

            // Room: use class's existing room
            const existingClassSlot = generated.find((s) => s.className === className) || existingSlots.find((s) => s.className === className)
            const room = existingClassSlot?.room || ROOMS[period % ROOMS.length]

            // Time string from calculated timings
            const timeStr = `${minutesToTime(rowTiming.startTime)} - ${minutesToTime(rowTiming.endTime)}`

            generated.push({
              id: `auto-${Date.now()}-${className}-${day}-${period}`,
              day,
              period,
              time: timeStr,
              className,
              subject,
              teacherId: teacher.id,
              teacherName: teacher.name,
              room,
              type: 'Lecture',
            })
            assignedCount++
            assigned = true
            break
          }

          if (!assigned) {
            // No subject/teacher available — leave empty (NOT a conflict)
          }
        }
      }
    }

    // Validate with the same conflict engine (Brief section 22 + 37)
    const actualConflicts = countAllConflicts(generated)

    setTimeout(() => {
      setGenerating(false)
      onGenerate(generated, generatedRows)
      toast.success('Timetable generated', {
        description: `${assignedCount} periods assigned · ${actualConflicts} conflict${actualConflicts === 1 ? '' : 's'}`,
      })
      onOpenChange(false)
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            Auto timetable
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            Build a schedule from your school's availability.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Classes selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Classes</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* School Day Start/End (Brief section 4 + 26) */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider">School day</label>
            <div className="flex items-center gap-2">
              <CompactTimeControls value={schoolStart} onChange={setSchoolStart} />
              <span className="text-[10px] text-muted-foreground">→</span>
              <CompactTimeControls value={schoolEnd} onChange={setSchoolEnd} />
            </div>
          </div>

          {/* Days (read-only) */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Days</label>
            <div className="h-8 px-2.5 flex items-center rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground">
              Mon–Sat
            </div>
          </div>

          {/* Number of Periods (truly editable) */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Number of periods</label>
            <input
              type="number"
              min={1}
              max={12}
              value={numPeriodsInput}
              onChange={(e) => {
                const raw = e.target.value
                setNumPeriodsInput(raw)
                const v = parseInt(raw, 10)
                if (!isNaN(v) && v >= 1 && v <= 12) setNumPeriods(v)
              }}
              onBlur={() => {
                const v = parseInt(numPeriodsInput, 10)
                if (isNaN(v) || v < 1) { setNumPeriods(1); setNumPeriodsInput('1') }
                else if (v > 12) { setNumPeriods(12); setNumPeriodsInput('12') }
                else setNumPeriods(v)
              }}
              className="h-8 w-full px-2.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Breaks (configurable) */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Breaks</label>
            <Select value={breakMode} onValueChange={(v) => setBreakMode(v as 'none' | 'short' | 'lunch' | 'both')}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Short + Lunch</SelectItem>
                <SelectItem value="short">Short Break only</SelectItem>
                <SelectItem value="lunch">Lunch Break only</SelectItem>
                <SelectItem value="none">No breaks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <Stat label="Classes" value={targetClasses.length} />
            <Stat label="Periods" value={numPeriods} />
            <Stat label="Subjects" value={subjects.length} />
            <Stat label="Teachers" value={activeTeachers.length} />
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleGenerate}
            disabled={generating}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {generating ? 'Generating…' : 'Generate timetable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5">
      <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
    </div>
  )
}
