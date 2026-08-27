'use client'

/**
 * Wizard Step 1 — Personal Details.
 *
 * Redesigned to match the Parents step's clean layout philosophy:
 * single container, section dividers via `border-t`, headings + spacing,
 * no card-in-card nesting.
 */
import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { school } from '@/lib/mock/school'
import { AadhaarInput } from '@/components/shared/smart-inputs'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useAdmissionFeatureFlags } from '../lib/admission-utils'
import type { FormData } from '../constants'
import { StepHeader, Field } from './StepShared'

export function PersonalStep({
  data, set, flags,
}: {
  data: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  flags: ReturnType<typeof useAdmissionFeatureFlags>
}) {
  const adm = useSchoolSettingsStore.getState().admissionSettings
  const religionOptions = ['Hindu', 'Muslim', 'Other']
  const cleanAadhaarDigits = (data.aadhaarNo || '').replace(/\D/g, '')
  const isValidAadhaar = cleanAadhaarDigits.length === 12

  return (
    <div>
      <StepHeader
        title="Personal Details"
        subtitle="Official identity, demographic, and category information"
        icon={<User className="h-5 w-5" />}
      />

      <div className="space-y-5">
        {/* SECTION 1 — PRIMARY IDENTITY */}
        <div>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">
            Basic Identity
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="First Name">
              <Input value={data.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="e.g. Kabir" className="h-10" required />
            </Field>
            <Field label="Last Name">
              <Input value={data.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="e.g. Das" className="h-10" required />
            </Field>
            <Field label="Date of Birth">
              <DatePicker value={data.dob} onChange={(v) => set('dob', v)} placeholder="Select birth date" />
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
              <Input value={data.nationality || 'Indian'}
                onChange={(e) => set('nationality', e.target.value)}
                placeholder="e.g. Indian" className="h-10" />
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

        {/* SECTION 2 — CATEGORY & RELIGION (conditional) */}
        {(flags.enableCategory || flags.enableReligion) && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">
              {flags.enableCategory && flags.enableReligion ? 'Category & Religion'
                : flags.enableCategory ? 'Category'
                : 'Religion'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

        {/* SECTION 3 — GOVERNMENT ID (Aadhaar, conditional) */}
        {flags.enableAadhaar && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                Government Identification
              </p>
              <span className={`text-[10px] font-medium ${isValidAadhaar ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isValidAadhaar ? '✓ Valid 12-digit' : '12-digit required'}
              </span>
            </div>
            <Field label="Aadhaar Card Number">
              <AadhaarInput value={data.aadhaarNo} onChange={(v) => set('aadhaarNo', v)} placeholder="12-digit Aadhaar Number" />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}
