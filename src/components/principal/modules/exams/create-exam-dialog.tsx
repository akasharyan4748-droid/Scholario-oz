'use client'

/**
 * CreateExamDialog — step-based examination creation flow.
 *
 * Brief §9: Steps: Basic Details → Classes → Subjects & Marks → Schedule → Review
 * Brief §10: Marks are configurable per subject.
 */

import { useState, useEffect } from 'react'
import { Check, ChevronRight, ChevronLeft, Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { classSections } from '@/lib/mock/attendance'
import { EXAM_TYPES, type ExamType, type ExamSubject, type ScheduleEntry } from '@/lib/mock/exams-data'
import { useExamsStore } from '@/lib/store/exams-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: () => void
}

const STEPS = ['Details', 'Classes', 'Subjects', 'Schedule', 'Review']

interface SubjectConfig {
  id: string
  name: string
  maxMarks: number
  passingMarks: number
  theoryMarks: number
  practicalMarks: number
  date: string
  startTime: string
  endTime: string
  room: string
}

const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { id: 's1', name: 'English', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' },
  { id: 's2', name: 'Mathematics', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' },
  { id: 's3', name: 'Science', maxMarks: 50, passingMarks: 17, theoryMarks: 40, practicalMarks: 10, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' },
  { id: 's4', name: 'Social Studies', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' },
  { id: 's5', name: 'Hindi', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' },
  { id: 's6', name: 'Computer Science', maxMarks: 50, passingMarks: 17, theoryMarks: 30, practicalMarks: 20, date: '', startTime: '09:00', endTime: '10:00', room: 'Computer Lab' },
]

export function CreateExamDialog({ open, onOpenChange, onCreate }: CreateExamDialogProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState<ExamType>('Unit Test')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['class-2-a'])
  const [subjects, setSubjects] = useState<SubjectConfig[]>(DEFAULT_SUBJECTS)

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0)
        setName('')
        setType('Unit Test')
        setStartDate('')
        setEndDate('')
        setSelectedClasses(['class-2-a'])
        setSubjects(DEFAULT_SUBJECTS)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const canProceed = () => {
    if (step === 0) return name.trim() && startDate
    if (step === 1) return selectedClasses.length > 0
    if (step === 2) return subjects.length > 0
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleCreate = () => {
    // P0-1: Actually persist to the store
    const createExam = useExamsStore.getState().createExam

    const examSubjects: ExamSubject[] = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      maxMarks: s.maxMarks,
      passingMarks: s.passingMarks,
      theoryMarks: s.theoryMarks,
      practicalMarks: s.practicalMarks,
    }))

    const schedule: ScheduleEntry[] = subjects.map((s, idx) => ({
      subjectId: s.id,
      subjectName: s.name,
      className: classSections.find((c) => c.id === selectedClasses[0])?.name || selectedClasses[0],
      date: s.date || startDate,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      invigilator: '',
    }))

    const examId = createExam({
      name: name.trim(),
      type,
      session: '2025–2026',
      startDate,
      endDate: endDate || startDate,
      classIds: selectedClasses,
      subjects: examSubjects,
      schedule,
    })

    toast.success('Examination created', {
      description: `${name} has been created as a draft. You can now configure subjects, schedule, and enter marks.`,
    })

    onCreate()
    onOpenChange(false)
  }

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    )
  }

  const updateSubject = (id: string, field: keyof SubjectConfig, value: string | number) => {
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }

  const addSubject = () => {
    setSubjects((prev) => [...prev, { id: `s${prev.length + 1}`, name: '', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0, date: '', startTime: '09:00', endTime: '10:00', room: 'Room 102' }])
  }

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-2xl p-0 gap-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold">Create Examination</DialogTitle>
          <DialogDescription className="text-[10px]">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/60">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                'flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold transition-colors',
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-6', i < step ? 'bg-emerald-500' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="p-4 space-y-3">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label>Examination Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Unit Test 4" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Examination Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ExamType)}>
                  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date <span className="text-destructive">*</span></Label>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <Label>Select Classes</Label>
              <p className="text-[10px] text-muted-foreground">Choose which classes will participate in this examination.</p>
              {classSections.map((cls) => (
                <label key={cls.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={() => toggleClass(cls.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cls.teacher} · {cls.total} students</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subjects & Marks Configuration</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addSubject}>
                  <Plus className="h-3 w-3" /> Add Subject
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Max</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Pass</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Theory</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Practical</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s) => (
                      <TableRow key={s.id} className="border-b border-border/40 last:border-0">
                        <TableCell className="py-1.5">
                          <Input value={s.name} onChange={(e) => updateSubject(s.id, 'name', e.target.value)} placeholder="Subject name" className="h-7 text-xs" />
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <Input type="number" value={s.maxMarks} onChange={(e) => updateSubject(s.id, 'maxMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <Input type="number" value={s.passingMarks} onChange={(e) => updateSubject(s.id, 'passingMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <Input type="number" value={s.theoryMarks} onChange={(e) => updateSubject(s.id, 'theoryMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <Input type="number" value={s.practicalMarks} onChange={(e) => updateSubject(s.id, 'practicalMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <button onClick={() => removeSubject(s.id)} className="text-muted-foreground hover:text-rose-500 transition-colors text-xs">✕</button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[10px] text-muted-foreground">Total marks = Theory + Practical. Calculated automatically.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label>Schedule</Label>
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Date</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Time</TableHead>
                      <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s) => (
                      <TableRow key={s.id} className="border-b border-border/40 last:border-0">
                        <TableCell className="py-1.5 text-xs font-medium">{s.name || '—'}</TableCell>
                        <TableCell className="py-1.5">
                          <DatePicker value={s.date} onChange={(v) => updateSubject(s.id, 'date', v)} compact placeholder="Date" className="w-[120px]" />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="flex items-center gap-1">
                            <Input type="time" value={s.startTime} onChange={(e) => updateSubject(s.id, 'startTime', e.target.value)} className="h-7 text-xs w-16" />
                            <span className="text-[10px] text-muted-foreground">–</span>
                            <Input type="time" value={s.endTime} onChange={(e) => updateSubject(s.id, 'endTime', e.target.value)} className="h-7 text-xs w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input value={s.room} onChange={(e) => updateSubject(s.id, 'room', e.target.value)} className="h-7 text-xs w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label>Review & Create</Label>
              <div className="rounded-lg border border-border divide-y divide-border/40">
                <ReviewRow label="Name" value={name || '—'} />
                <ReviewRow label="Type" value={type} />
                <ReviewRow label="Start Date" value={startDate || '—'} />
                <ReviewRow label="End Date" value={endDate || '—'} />
                <ReviewRow label="Classes" value={selectedClasses.map((id) => classSections.find((c) => c.id === id)?.name).filter(Boolean).join(', ')} />
                <ReviewRow label="Subjects" value={`${subjects.length} subjects configured`} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBack}
              disabled={step === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCreate}
              >
                <Check className="h-3.5 w-3.5" /> Create Examination
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground truncate">{value}</span>
    </div>
  )
}
