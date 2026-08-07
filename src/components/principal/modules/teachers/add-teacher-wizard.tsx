'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, UserPlus, GraduationCap } from 'lucide-react'
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
import { StepHeader } from '../admission/components/StepShared'

interface Props {
  onSuccess: (teacher: TeacherRecord) => void
  onCancel?: () => void
}

/**
 * Add Teacher wizard — 5-step flow mirroring the Admission wizard's clean
 * design language: single container, StepHeader per step, dividers between
 * sections, no box-in-box nesting.
 */
export function AddTeacherWizard({ onSuccess, onCancel }: Props) {
  const { teachers } = useTeachersStore()

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

  const stepMeta = [
    { title: 'Basic Information', subtitle: 'Personal and contact details' },
    { title: 'Qualifications', subtitle: 'Education and experience' },
    { title: 'Appointment & Salary', subtitle: 'Joining date, employment type, payroll' },
    { title: 'Academic Assignment', subtitle: 'Subjects, classes, positions' },
    { title: 'Review & Create', subtitle: 'Confirm details before saving' },
  ]
  const current = stepMeta[step - 1]

  return (
    <div>
      <StepHeader
        title={current.title}
        subtitle={current.subtitle}
        icon={<GraduationCap className="h-5 w-5" />}
        right={<Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">Step {step} of 5</Badge>}
      />

      <div className="space-y-5">
        {step === 1 && <Step1BasicInfo {...stepProps} />}
        {step === 2 && <Step2Qualifications {...stepProps} />}
        {step === 3 && <Step3Appointment {...stepProps} />}
        {step === 4 && <Step4Academic {...step4Props} />}

        {/* STEP 5 — Review (no box-in-box; uses single container with dividers) */}
        {step === 5 && (
          <div className="space-y-5">
            {/* Identity summary */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-base">
                {form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-base text-foreground truncate">{form.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {(form as any).designation || 'Subject Teacher'} · {(form as any).department || 'Academic'}
                </p>
              </div>
            </div>

            {/* Review fields — grouped by section, separated by dividers */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Employment</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ReviewField label="Employee ID" value="Auto-generated" />
                <ReviewField label="Joining Date" value={formatDate(form.joiningDate)} />
                <ReviewField label="Employment" value={form.employmentType} />
                <ReviewField label="Salary" value={`${formatINR(Number(form.salary))}/mo`} />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Contact</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ReviewField label="Mobile" value={form.phone} mono />
                <ReviewField label="Email" value={form.email} />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Academic</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReviewField label="Subjects" value={form.selectedSubjects.join(', ') || 'None'} />
                <ReviewField label="Classes" value={form.selectedClasses.join(', ') || 'None'} />
                <ReviewField label="Class Teacher" value={form.classTeacherRole !== 'None' ? form.classTeacherRole : 'No'} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-border">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="text-xs h-8">Cancel</Button>
          )}
          <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="h-8 text-xs">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </div>
        {step < 5 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> Create Teacher
          </Button>
        )}
      </div>
    </div>
  )
}

/* Compact review field — no card background, just label + value */
function ReviewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-foreground mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
