'use client'

import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, UserPlus, CheckCircle2,
  User, GraduationCap, Wallet, Shield, Camera, FileText,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
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
import { Step5PhotoSignature } from './add-teacher-step-photo'
import { StepperHeader, type WizardStep } from '../admission/components/StepperHeader'
import { NavigationControls } from '../admission/components/NavigationControls'

interface Props {
  onSuccess: (teacher: TeacherRecord) => void
  onCancel?: () => void
}

const TEACHER_STEPS: WizardStep[] = [
  { id: 1, label: 'Basic Info', icon: User },
  { id: 2, label: 'Qualifications', icon: GraduationCap },
  { id: 3, label: 'Appointment', icon: Wallet },
  { id: 4, label: 'Academic', icon: Shield },
  { id: 5, label: 'Photo & Sign', icon: Camera },
  { id: 6, label: 'Review', icon: CheckCircle2 },
]

export function AddTeacherWizard({ onSuccess, onCancel }: Props) {
  const { teachers } = useTeachersStore()

  const assignedInchargePositions = useMemo(() => {
    const taken = new Set<string>()
    teachers.forEach((t) => {
      if (t.status === 'Active') {
        t.positions?.forEach((p) => { if (p.status === 'Active' && p.positionTitle) taken.add(p.positionTitle) })
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
          const m = t.designation.match(/\(([^)]+)\)/)
          if (m?.[1]) taken.add(m[1])
        }
        t.positions?.forEach((p) => {
          if (p.status === 'Active' && p.positionTitle?.includes('Class Teacher')) {
            const m = p.positionTitle.match(/\(([^)]+)\)/)
            if (m?.[1]) taken.add(m[1])
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
            const m = p.positionTitle.match(/\(([^)]+)\)/)
            if (m?.[1]) taken.add(m[1])
          }
        })
      }
    })
    return taken
  }, [teachers])

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<AddTeacherForm>(initialFormState)
  const stepperScrollRef = useRef<HTMLDivElement>(null)

  const setF = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }))

  const toggleClass = (cls: string) => {
    setForm((prev) => {
      const ex = prev.selectedClasses.includes(cls)
      return { ...prev, selectedClasses: ex ? prev.selectedClasses.filter((c) => c !== cls) : [...prev.selectedClasses, cls] }
    })
  }
  const toggleSubject = (sub: string) => {
    setForm((prev) => {
      const ex = prev.selectedSubjects.includes(sub)
      return { ...prev, selectedSubjects: ex ? prev.selectedSubjects.filter((s) => s !== sub) : [...prev.selectedSubjects, sub] }
    })
  }

  const currentVisibleIndex = TEACHER_STEPS.findIndex((s) => s.id === step)

  const handleBack = () => {
    if (currentVisibleIndex > 0) setStep(TEACHER_STEPS[currentVisibleIndex - 1].id)
  }
  const handleNext = () => {
    if (currentVisibleIndex < TEACHER_STEPS.length - 1) setStep(TEACHER_STEPS[currentVisibleIndex + 1].id)
  }
  const handleSubmit = () => {
    onSuccess(buildNewTeacherRecord(form))
  }

  const stepProps = { form, setF }
  const step4Props = {
    ...stepProps,
    availableInchargePositions, availableClassesList,
    classesWithClassTeacher, classesWithAsstClassTeacher,
    subjectList, toggleClass, toggleSubject,
  }

  return (
    <>
      {/* Stepper Header — same as Admissions */}
      <StepperHeader
        visibleSteps={TEACHER_STEPS}
        step={step}
        currentVisibleIndex={currentVisibleIndex}
        stepperScrollRef={stepperScrollRef}
        onSelect={setStep}
      />

      {/* Step content — animated transitions matching Admissions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          <GlassCard className="p-4 sm:p-6">
            {step === 1 && <Step1BasicInfo {...stepProps} />}
            {step === 2 && <Step2Qualifications {...stepProps} />}
            {step === 3 && <Step3Appointment {...stepProps} />}
            {step === 4 && <Step4Academic {...step4Props} />}
            {step === 5 && <Step5PhotoSignature form={form} setF={setF} />}

            {/* STEP 6 — Review (single clean page, no tabs/toggles) */}
            {step === 6 && (
              <div className="space-y-5">
                {/* Teacher summary — profile card, subordinate to Review title */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {(form.name || '?').split(' ').map((n: string) => n[0] || '?').join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{form.name || 'New Teacher'}</p>
                    <p className="text-xs text-muted-foreground truncate">Subject Teacher · Academic</p>
                  </div>
                </div>

                {/* Review fields — grouped by section with dividers */}
                <div>
                  <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Employment</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <ReviewField label="Employee ID" value="Auto-generated" />
                    <ReviewField label="Joining Date" value={form.joiningDate ? formatDate(form.joiningDate) : '—'} />
                    <ReviewField label="Employment" value={form.employmentType} />
                    <ReviewField label="Salary" value={form.salary ? `${formatINR(Number(form.salary))}/mo` : '—'} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Contact</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <ReviewField label="Mobile" value={form.phone || '—'} mono />
                    <ReviewField label="Email" value={form.email || '—'} />
                    <ReviewField label="Blood Group" value={form.bloodGroup || '—'} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Academic</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReviewField label="Subjects" value={form.selectedSubjects.length ? form.selectedSubjects.join(', ') : 'None'} />
                    <ReviewField label="Classes" value={form.selectedClasses.length ? form.selectedClasses.join(', ') : 'None'} />
                    <ReviewField label="Class Teacher" value={form.classTeacherRole !== 'None' ? form.classTeacherRole : 'No'} />
                  </div>
                </div>

                {/* Photo + Signature preview */}
                {(form.photoDataUrl || form.signatureDataUrl) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Documents</p>
                    <div className="flex gap-4">
                      {form.photoDataUrl && (
                        <div>
                          <img src={form.photoDataUrl} alt="Photo" className="h-16 w-16 rounded-lg object-cover border border-border" />
                          <p className="text-[10px] text-muted-foreground mt-1">Photo</p>
                        </div>
                      )}
                      {form.signatureDataUrl && (
                        <div>
                          <img src={form.signatureDataUrl} alt="Signature" className="h-16 w-24 rounded-lg object-contain border border-border bg-white" />
                          <p className="text-[10px] text-muted-foreground mt-1">Signature</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls — same as Admissions */}
      <NavigationControls
        visibleSteps={TEACHER_STEPS}
        step={step}
        currentVisibleIndex={currentVisibleIndex}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        submitLabel="Create Teacher"
        submitIcon={UserPlus}
      />

      {/* Cancel button — separate from the main nav */}
      {onCancel && (
        <div className="mt-2 text-center">
          <Button variant="ghost" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
        </div>
      )}
    </>
  )
}

function ReviewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-foreground mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
