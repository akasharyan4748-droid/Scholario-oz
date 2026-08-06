'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTeachersStore } from '@/lib/store/teachers-store'
import { formatINR, formatDate } from '@/lib/format'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import {
  initialFormState,
  masterInchargePositions,
  availableClassesList,
  subjectList,
  buildNewTeacherRecord,
  type AddTeacherForm,
} from './add-teacher-data'
import { Step1BasicInfo, Step2Qualifications, Step3Appointment, Step4Academic } from './add-teacher-steps'

interface Props {
  onSuccess: (teacher: TeacherRecord) => void
  onCancel?: () => void
}

/**
 * 5-step Add Teacher wizard — Basic Info → Qualifications → Appointment &
 * Salary → Academic Assignment → Review & Create. Delegates per-step JSX
 * to the step components in `add-teacher-steps.tsx` and the record builder
 * to `add-teacher-data.ts`.
 */
export function AddTeacherWizard({ onSuccess, onCancel }: Props) {
  const { teachers } = useTeachersStore()

  // Master incharge positions list, filtered against already-assigned ones
  const assignedInchargePositions = useMemo(() => {
    const taken = new Set<string>()
    teachers.forEach((t) => {
      if (t.status === 'Active') {
        t.positions?.forEach((p) => {
          if (p.status === 'Active' && p.positionTitle) taken.add(p.positionTitle)
        })
        if (t.department && t.department !== 'Academic') taken.add(t.department)
      }
    })
    return taken
  }, [teachers])

  const availableInchargePositions = useMemo(
    () => masterInchargePositions.filter((pos) => !assignedInchargePositions.has(pos)),
    [assignedInchargePositions],
  )

  const classesWithClassTeacher = useMemo(() => {
    const taken = new Set<string>()
    teachers.forEach((t) => {
      if (t.status === 'Active') {
        if (t.designation?.includes('Class Teacher')) {
          const match = t.designation.match(/\(([^)]+)\)/)
          if (match && match[1]) taken.add(match[1])
        }
        t.positions?.forEach((p) => {
          if (p.status === 'Active' && p.positionTitle?.includes('Class Teacher')) {
            const match = p.positionTitle.match(/\(([^)]+)\)/)
            if (match && match[1]) taken.add(match[1])
          }
        })
      }
    })
    return taken
  }, [teachers])

  const classesWithAsstClassTeacher = useMemo(() => {
    const taken = new Set<string>()
    teachers.forEach((t) => {
      if (t.status === 'Active') {
        t.positions?.forEach((p) => {
          if (p.status === 'Active' && p.positionTitle?.includes('Assistant Class Teacher')) {
            const match = p.positionTitle.match(/\(([^)]+)\)/)
            if (match && match[1]) taken.add(match[1])
          }
        })
      }
    })
    return taken
  }, [teachers])

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<AddTeacherForm>(initialFormState)

  const setF = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }))

  const toggleClass = (cls: string) => {
    setForm((prev) => {
      const exists = prev.selectedClasses.includes(cls)
      const updated = exists ? prev.selectedClasses.filter((c) => c !== cls) : [...prev.selectedClasses, cls]
      return { ...prev, selectedClasses: updated }
    })
  }

  const toggleSubject = (sub: string) => {
    setForm((prev) => {
      const exists = prev.selectedSubjects.includes(sub)
      const updated = exists ? prev.selectedSubjects.filter((s) => s !== sub) : [...prev.selectedSubjects, sub]
      return { ...prev, selectedSubjects: updated }
    })
  }

  const handleFinish = () => {
    const newTeacher = buildNewTeacherRecord(form)
    onSuccess(newTeacher)
  }

  const stepProps = { form, setF }
  const step4Props = {
    ...stepProps,
    availableInchargePositions,
    availableClassesList,
    classesWithClassTeacher,
    classesWithAsstClassTeacher,
    subjectList,
    toggleClass,
    toggleSubject,
  }

  return (
    <GlassCard className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-2">
        <h2 className="font-display text-lg font-bold">Add Teacher</h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          Step {step} of 5
        </Badge>
      </div>

      {step === 1 && <Step1BasicInfo {...stepProps} />}
      {step === 2 && <Step2Qualifications {...stepProps} />}
      {step === 3 && <Step3Appointment {...stepProps} />}
      {step === 4 && <Step4Academic {...step4Props} />}

      {/* STEP 5: REVIEW & CREATE */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-foreground">Review</h3>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-display text-xl font-bold">
                {form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{form.name}</h3>
                <p className="text-xs text-muted-foreground">{(form as any).designation || 'Subject Teacher'} · {(form as any).department || 'Academic'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <ReviewTile label="Employee ID" value="Auto-generated" />
              <ReviewTile label="Joining Date" value={formatDate(form.joiningDate)} />
              <ReviewTile label="Employment" value={form.employmentType} />
              <ReviewTile label="Salary" value={`${formatINR(Number(form.salary))}/mo`} />
              <ReviewTile label="Mobile" value={form.phone} mono />
              <ReviewTile label="Email" value={form.email} />
              <ReviewTile label="Subjects" value={form.selectedSubjects.join(', ') || 'None'} />
              <ReviewTile label="Classes" value={form.selectedClasses.join(', ') || 'None'} />
              <ReviewTile label="Class Teacher" value={form.classTeacherRole !== 'None' ? form.classTeacherRole : 'No'} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="text-xs">
              Cancel
            </Button>
          )}
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="bg-primary text-primary-foreground">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md">
            <UserPlus className="h-4 w-4" /> Create Teacher
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

function ReviewTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className={mono ? 'font-semibold text-foreground mt-0.5 font-mono' : 'font-semibold text-foreground mt-0.5'}>{value}</p>
    </div>
  )
}
