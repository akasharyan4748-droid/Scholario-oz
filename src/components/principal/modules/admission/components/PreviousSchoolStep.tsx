'use client'

/**
 * Wizard Step 5 — Previous School Information.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 */
import { School as SchoolIcon, SkipForward } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import type { FormData } from '../constants'
import { StepHeader, Field } from './StepShared'

export function PreviousSchoolStep({ data, set, onSkip }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; admissionType?: string; onSkip?: () => void }) {
  const adm = useSchoolSettingsStore.getState().admissionSettings

  const handleSkip = () => {
    set('previousSchool', '')
    set('previousClass', '')
    set('previousYear', '')
    set('reasonForLeaving', 'No Previous Records Available')
    toast.info('Previous School skipped', { description: 'Reason: No Previous Records Available' })
    onSkip?.()
  }

  return (
    <div>
      <StepHeader title="Previous School Information" subtitle="Past academic record of the applicant" icon={<SchoolIcon className="h-5 w-5" />} />
      <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Previous School Name" full>
              <Input value={data.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} placeholder="Enter previous school name" />
            </Field>

            <Field label="Previous Class">
              <Input value={data.previousClass} onChange={(e) => set('previousClass', e.target.value)} placeholder="e.g. Class 3, UKG" />
            </Field>

            <Field label="Previous Session">
              <Select value={data.previousYear} onValueChange={(val) => set('previousYear', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {['2025–2026', '2024–2025', '2023–2024', '2022–2023', '2021–2022'].map((session) => (
                    <SelectItem key={session} value={session}>{session}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Previous Board">
              <Select value={data.previousBoard} onValueChange={(v) => set('previousBoard', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select board" /></SelectTrigger>
                <SelectContent>
                  {adm.previousBoards.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Transfer Certificate (TC) Number">
              <Input value={data.tcNumber} onChange={(e) => set('tcNumber', e.target.value)} placeholder="Enter TC number" />
            </Field>

            <Field label="Reason for Leaving" full>
              <Textarea value={data.reasonForLeaving} onChange={(e) => set('reasonForLeaving', e.target.value)} placeholder="e.g. Relocation, better opportunities" className="min-h-[50px]" />
            </Field>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={handleSkip} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <SkipForward className="h-3.5 w-3.5" /> Skip — No Previous Records
            </Button>
          </div>
        </div>
    </div>
  )
}
