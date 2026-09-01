// Cascading address query helpers backed by the assembled
// INDIAN_STATES dataset. Used by the Admissions wizard Address step
// to populate state → district → city dropdowns.

import { INDIAN_STATES } from './states-data'
import { PIN_REGEX } from './constants'

export function getStatesForCountry(country: string): string[] {
  if (country === 'India') return INDIAN_STATES.map((s) => s.name)
  return []
}

export function getDistrictsForState(country: string, state: string): string[] {
  if (country !== 'India') return []
  const s = INDIAN_STATES.find((x) => x.name === state)
  return s ? s.districts.map((d) => d.name) : []
}

export function getCitiesForDistrict(country: string, state: string, district: string): string[] {
  if (country !== 'India') return []
  const s = INDIAN_STATES.find((x) => x.name === state)
  if (!s) return []
  const d = s.districts.find((x) => x.name === district)
  return d ? d.cities : []
}

export function validateIndianPin(pin: string): boolean {
  return PIN_REGEX.test((pin || '').trim())
}
