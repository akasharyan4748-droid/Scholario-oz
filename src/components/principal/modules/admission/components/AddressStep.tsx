'use client'

/**
 * Wizard Step 3 — Address Information.
 *
 * Layout: Country / State / District / Address Line / PIN Code (no City field).
 * District already identifies the location; City was redundant form length.
 * Both Current + Permanent addresses use the same minimal structure.
 */
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  COUNTRIES, getStatesForCountry, getDistrictsForState, validateIndianPin,
} from '@/lib/indian-address'
import type { FormData } from '../constants'
import { StepHeader, Field } from './StepShared'

export function AddressStep({
  data,
  set,
  onToggleSameAddress,
}: {
  data: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  onToggleSameAddress: (checked: boolean) => void
}) {
  const currentStates = getStatesForCountry(data.country)
  const currentDistricts = getDistrictsForState(data.country, data.state)
  const permStates = getStatesForCountry(data.permCountry)
  const permDistricts = getDistrictsForState(data.permCountry, data.permState)

  const pinValid = data.pincode ? validateIndianPin(data.pincode) : null
  const permPinValid = data.permPincode ? validateIndianPin(data.permPincode) : null

  const handleCountryChange = (v: string) => {
    set('country', v)
    set('state', '')
    set('district', '')
    set('pincode', '')
  }
  const handleStateChange = (v: string) => {
    set('state', v)
    set('district', '')
  }
  const handleDistrictChange = (v: string) => {
    set('district', v)
  }

  return (
    <div>
      <StepHeader title="Address Information" subtitle="Residential and permanent communication details" icon={<MapPin className="h-5 w-5" />} />
      <div className="space-y-6">
        {/* CURRENT ADDRESS */}
        <div>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">CURRENT ADDRESS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Country">
              <Select value={data.country} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="State">
              <Select value={data.state} onValueChange={handleStateChange}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>
                  {currentStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="District">
              <Select value={data.district} onValueChange={handleDistrictChange} disabled={!data.state}>
                <SelectTrigger className="w-full"><SelectValue placeholder={data.state ? 'Select District' : 'Select state first'} /></SelectTrigger>
                <SelectContent>
                  {currentDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Address Line">
              <Textarea
                value={data.currentAddress}
                onChange={(e) => set('currentAddress', e.target.value)}
                placeholder="House no, street, area"
                className="min-h-[60px]"
              />
            </Field>

            <Field label="PIN Code" hint={pinValid === false ? 'Enter a valid 6-digit PIN' : '6-digit postal code'}>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={data.pincode}
                onChange={(e) => set('pincode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="e.g. 122003"
                className={cn(pinValid === false && 'border-rose-500/50 focus-visible:ring-rose-500/20')}
              />
            </Field>
          </div>
        </div>

        {/* PERMANENT ADDRESS */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">PERMANENT ADDRESS</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3 py-1.5 transition-colors">
              <Checkbox
                checked={data.sameAsCurrentAddress}
                onCheckedChange={(v) => onToggleSameAddress(v === true)}
              />
              <span className="text-xs font-semibold text-primary">Same as Current Address</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Country">
              <Select value={data.permCountry} onValueChange={(v) => { set('permCountry', v); set('permState', ''); set('permDistrict', '') }} disabled={data.sameAsCurrentAddress}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="State">
              <Select value={data.permState} onValueChange={(v) => { set('permState', v); set('permDistrict', '') }} disabled={data.sameAsCurrentAddress}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>
                  {permStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="District">
              <Select value={data.permDistrict} onValueChange={(v) => set('permDistrict', v)} disabled={data.sameAsCurrentAddress || !data.permState}>
                <SelectTrigger className="w-full"><SelectValue placeholder={data.permState ? 'Select District' : 'Select state first'} /></SelectTrigger>
                <SelectContent>
                  {permDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Address Line">
              <Textarea
                value={data.permAddress}
                disabled={data.sameAsCurrentAddress}
                onChange={(e) => set('permAddress', e.target.value)}
                placeholder="House no, street, area"
                className="min-h-[60px] disabled:opacity-60 disabled:bg-muted/50"
              />
            </Field>

            <Field label="PIN Code" hint={permPinValid === false ? 'Enter a valid 6-digit PIN' : undefined}>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={data.permPincode}
                disabled={data.sameAsCurrentAddress}
                onChange={(e) => set('permPincode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="e.g. 122003"
                className={cn('disabled:opacity-60 disabled:bg-muted/50', permPinValid === false && 'border-rose-500/50')}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
