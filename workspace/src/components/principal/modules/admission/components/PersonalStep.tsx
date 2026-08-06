'use client'

/**
 * Wizard Step 1 — Personal Details.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 */
import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { school } from '@/lib/mock/school'
import { AadhaarInput } from '@/components/shared/smart-inputs'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import {
  useAdmissionFeatureFlags,
} from '../lib/admission-utils'
import type { FormData } from '../constants'
import { StepHeader, Field } from './StepShared'

export function PersonalStep({ data, set, flags }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; flags: ReturnType<typeof useAdmissionFeatureFlags> }) {
  const adm = useSchoolSettingsStore.getState().admissionSettings
  const religionOptions = ['Hindu', 'Muslim', 'Other']

  const cleanAadhaarDigits = (data.aadhaarNo || '').replace(/\D/g, '')
  const isValidAadhaar = cleanAadhaarDigits.length === 12

  return (
    <div className="space-y-6">
      <StepHeader
        title="Personal Details"
        subtitle="Provide student's official identity, demographic, and category information"
        icon={<User className="h-5 w-5" />}
      />

      {/* SECTION 1: PRIMARY IDENTITY */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Basic Identity Information</h3>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Fields marked with <span className="text-destructive font-bold">*</span> are required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" hint="As appearing on official Birth Certificate / Passport">
            <Input
              value={data.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="e.g. Kabir"
              className="h-10"
              required
            />
          </Field>

          <Field label="Last Name" hint="Student's family or surname">
            <Input
              value={data.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="e.g. Das"
              className="h-10"
              required
            />
          </Field>

          <Field label="Date of Birth">
            <DatePicker
              value={data.dob}
              onChange={(v) => set('dob', v)}
              placeholder="Select birth date"
            />
          </Field>

          <Field label="Gender">
            <Select value={data.gender} onValueChange={(v) => set('gender', v as FormData['gender'])}>
              <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Nationality">
            <Input
              value={data.nationality || 'Indian'}
              onChange={(e) => set('nationality', e.target.value)}
              placeholder="e.g. Indian"
              className="h-10"
            />
          </Field>

          {flags.enableBloodGroup && (
            <Field label="Blood Group">
              <Select value={data.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </div>

      {/* SECTION 2: CATEGORY & RELIGION — conditional on flags */}
      {(flags.enableCategory || flags.enableReligion) && (
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {flags.enableCategory && flags.enableReligion ? 'Category & Religion'
              : flags.enableCategory ? 'Category'
              : 'Religion'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flags.enableCategory && (
            <Field label="Category">
              <Select value={data.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(school.categories || ['General', 'OBC', 'SC', 'ST', 'EWS']).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {flags.enableReligion && (
            <Field label="Religion">
              <Select value={data.religion || adm.defaultReligion} onValueChange={(v) => set('religion', v)}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select religion" /></SelectTrigger>
                <SelectContent>
                  {religionOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </div>
      )}

      {/* SECTION 3: NATIONAL IDENTITY (AADHAAR) — conditional on flag */}
      {flags.enableAadhaar && (
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Government Identification</h3>
          </div>
          {isValidAadhaar ? (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium">
              ✓ Valid 12-Digit Format
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium">
              12-Digit Required
            </Badge>
          )}
        </div>

        <Field label="Aadhaar Card Number" hint="Auto-formatted into 4-4-4 digit groupings for error-free entry">
          <AadhaarInput
            value={data.aadhaarNo}
            onChange={(v) => set('aadhaarNo', v)}
            placeholder="12-digit Aadhaar Number"
          />
        </Field>
      </div>
      )}
    </div>
  )
}
