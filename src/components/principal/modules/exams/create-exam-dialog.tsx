'use client'

/**
 * CreateExamDialog — 5-step examination creation flow.
 *
 * Calls POST /api/exams with real class IDs + subject IDs from the API.
 * The exam persists to the Prisma DB and survives page refresh.
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
import { useCreateExam } from '@/lib/exams/use-exams'
import { EXAM_TYPES, type ExamDTO, type ExamType } from '@/lib/exams/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClassDTO {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  studentCount: number
  room?: string | null
  subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
}

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  classes: ClassDTO[]
  onCreated: (exam: ExamDTO) => void
}

const STEPS = ['Details', 'Classes', 'Subjects', 'Schedule', 'Review']

interface SubjectConfig {
  subjectId: string
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

export function CreateExamDialog({ open, onOpenChange, classes, onCreated }: CreateExamDialogProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState<ExamType>('Unit Test')
  const [session, setSession] = useState('2025-2026')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [subjectsByClass, setSubjectsByClass] = useState<Record<string, SubjectConfig[]>>({})
  const { create, loading } = useCreateExam()

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0)
        setName('')
        setType('Unit Test')
        setSession('2025-2026')
        setStartDate('')
        setEndDate('')
        setSelectedClassIds([])
        setSubjectsByClass({})
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  // Auto-select all subjects of a class when it's added
  useEffect(() => {
    for (const classId of selectedClassIds) {
      if (!subjectsByClass[classId]) {
        const cls = classes.find((c) => c.id === classId)
        if (cls) {
          setSubjectsByClass((prev) => ({
            ...prev,
            [classId]: cls.subjects.map((s) => ({
              subjectId: s.id,
              name: s.name,
              maxMarks: s.fullMarks,
              passingMarks: s.passMarks,
              theoryMarks: s.fullMarks,
              practicalMarks: 0,
              date: '',
              startTime: '09:00',
              endTime: '10:00',
              room: cls.room ?? '',
            })),
          }))
        }
      }
    }
    // Remove subjects for classes no longer selected
    setSubjectsByClass((prev) => {
      const next: Record<string, SubjectConfig[]> = {}
      for (const classId of selectedClassIds) {
        if (prev[classId]) next[classId] = prev[classId]
      }
      return next
    })
  }, [selectedClassIds, classes])

  const canProceed = () => {
    if (step === 0) return name.trim() && startDate
    if (step === 1) return selectedClassIds.length > 0
    if (step === 2) return Object.values(subjectsByClass).every((subs) => subs.length > 0)
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    )
  }

  const updateSubject = (classId: string, subjectId: string, field: keyof SubjectConfig, value: string | number) => {
    setSubjectsByClass((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).map((s) => s.subjectId === subjectId ? { ...s, [field]: value } : s),
    }))
  }

  const handleCreate = async () => {
    try {
      const exam = await create({
        name: name.trim(),
        type,
        session,
        startDate,
        endDate: endDate || startDate,
        passPercentage: 33,
        classIds: selectedClassIds,
        subjectsByClass: Object.fromEntries(
          Object.entries(subjectsByClass).map(([classId, subs]) => [
            classId,
            subs.map((s) => ({
              subjectId: s.subjectId,
              maxMarks: s.maxMarks,
              passMarks: s.passingMarks,
              theoryMarks: s.theoryMarks,
              practicalMarks: s.practicalMarks,
            })),
          ])
        ),
        schedule: Object.entries(subjectsByClass).flatMap(([classId, subs]) =>
          subs
            .filter((s) => s.date)
            .map((s) => ({
              classId,
              subjectId: s.subjectId,
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room || undefined,
              invigilatorName: undefined,
            }))
        ),
      })
      toast.success('Examination created', {
        description: `"${exam.name}" has been saved. Students from selected classes are now ready for marks entry.`,
      })
      onCreated(exam)
      onOpenChange(false)
    } catch (e: any) {
      toast.error('Failed to create examination', { description: e.message })
    }
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
              <div className="space-y-1.5">
                <Label>Academic Session</Label>
                <Input value={session} onChange={(e) => setSession(e.target.value)} placeholder="2025-2026" className="text-sm" />
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
              <p className="text-[10px] text-muted-foreground">Students from selected classes are auto-loaded for marks entry.</p>
              {classes.length === 0 && (
                <p className="text-[10px] text-rose-600">No classes found. Add classes in the Classes module first.</p>
              )}
              {classes.map((cls) => (
                <label key={cls.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedClassIds.includes(cls.id)}
                    onCheckedChange={() => toggleClass(cls.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cls.studentCount} students · {cls.subjects.length} subjects available</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label>Subjects & Marks Configuration</Label>
              <p className="text-[10px] text-muted-foreground">Subjects load from class configuration. Adjust per subject as needed.</p>
              {selectedClassIds.map((classId) => {
                const cls = classes.find((c) => c.id === classId)
                const subs = subjectsByClass[classId] || []
                return (
                  <div key={classId} className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">{cls?.name}</p>
                    <div className="rounded-lg border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border">
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Max</TableHead>
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Pass</TableHead>
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Theory</TableHead>
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Practical</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subs.map((s) => (
                            <TableRow key={s.subjectId} className="border-b border-border/40 last:border-0">
                              <TableCell className="py-1.5 text-xs font-medium">{s.name}</TableCell>
                              <TableCell className="py-1.5 text-center">
                                <Input type="number" value={s.maxMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'maxMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                              </TableCell>
                              <TableCell className="py-1.5 text-center">
                                <Input type="number" value={s.passingMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'passingMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                              </TableCell>
                              <TableCell className="py-1.5 text-center">
                                <Input type="number" value={s.theoryMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'theoryMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                              </TableCell>
                              <TableCell className="py-1.5 text-center">
                                <Input type="number" value={s.practicalMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'practicalMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Label>Schedule (Optional)</Label>
              <p className="text-[10px] text-muted-foreground">Optional. Schedule items can also be added later from the workspace.</p>
              {selectedClassIds.map((classId) => {
                const cls = classes.find((c) => c.id === classId)
                const subs = subjectsByClass[classId] || []
                return (
                  <div key={classId} className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">{cls?.name}</p>
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
                          {subs.map((s) => (
                            <TableRow key={s.subjectId} className="border-b border-border/40 last:border-0">
                              <TableCell className="py-1.5 text-xs font-medium">{s.name}</TableCell>
                              <TableCell className="py-1.5">
                                <DatePicker value={s.date} onChange={(v) => updateSubject(classId, s.subjectId, 'date', v)} compact placeholder="Date" className="w-[120px]" />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <div className="flex items-center gap-1">
                                  <Input type="time" value={s.startTime} onChange={(e) => updateSubject(classId, s.subjectId, 'startTime', e.target.value)} className="h-7 text-xs w-16" />
                                  <span className="text-[10px] text-muted-foreground">–</span>
                                  <Input type="time" value={s.endTime} onChange={(e) => updateSubject(classId, s.subjectId, 'endTime', e.target.value)} className="h-7 text-xs w-16" />
                                </div>
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input value={s.room} onChange={(e) => updateSubject(classId, s.subjectId, 'room', e.target.value)} className="h-7 text-xs w-24" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label>Review & Create</Label>
              <div className="rounded-lg border border-border divide-y divide-border/40">
                <ReviewRow label="Name" value={name || '—'} />
                <ReviewRow label="Type" value={type} />
                <ReviewRow label="Session" value={session} />
                <ReviewRow label="Start Date" value={startDate || '—'} />
                <ReviewRow label="End Date" value={endDate || '—'} />
                <ReviewRow label="Classes" value={selectedClassIds.map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean).join(', ')} />
                <ReviewRow label="Subjects" value={`${Object.values(subjectsByClass).reduce((s, subs) => s + subs.length, 0)} subjects across ${selectedClassIds.length} classes`} />
                <ReviewRow label="Schedule items" value={`${Object.values(subjectsByClass).flat().filter((s) => s.date).length} scheduled`} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Mark rows auto-create for every student × subject. You can enter marks immediately after.
              </p>
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
                disabled={loading}
              >
                {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
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
      <span className="text-xs font-medium text-foreground truncate max-w-[300px] text-right">{value}</span>
    </div>
  )
}
