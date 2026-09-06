'use client'

/**
 * school-profile — the single school identity resolver.
 *
 * SOURCE OF TRUTH: the tenant's School Settings (`school-settings-store`
 * → General tab). Every document surface (certificates, receipts, letters,
 * payslips, form previews, exports) should read its branding from here —
 * NOT from the static `lib/mock/school` snapshot.
 *
 * `lib/mock/school` remains only as the FALLBACK for fields the settings
 * store has not been populated with, so a fresh tenant never renders a
 * document with empty letterhead.
 *
 * Usage:
 *   - Inside React components:  `const profile = useSchoolProfile()`
 *   - In plain functions / store seeds: `getSchoolProfile()`
 */

import { useMemo } from 'react'
import { school } from '@/lib/mock/school'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

export interface SchoolProfile {
  /** Full official school name. */
  name: string
  /** Short name (crest label, footers). */
  shortName: string
  tagline: string
  affiliation: string
  address: string
  phone: string
  email: string
  website: string
  /** Principal's full name — document signatory. */
  principal: string
  vicePrincipal: string
  established: number
  /** Current academic session, e.g. "2026-2027". */
  academicYear: string
}

function resolveFromSettings(
  general: {
    schoolName?: string
    shortName?: string
    tagline?: string
    affiliation?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    principalName?: string
    vicePrincipalName?: string
    established?: number
  },
  currentSession?: string,
): SchoolProfile {
  return {
    name: general.schoolName?.trim() || school.name,
    shortName: general.shortName?.trim() || school.shortName,
    tagline: general.tagline?.trim() || school.tagline,
    affiliation: general.affiliation?.trim() || school.affiliation,
    address: general.address?.trim() || school.address,
    phone: general.phone?.trim() || school.phone,
    email: general.email?.trim() || school.email,
    website: general.website?.trim() || school.website,
    principal: general.principalName?.trim() || school.principal,
    vicePrincipal: general.vicePrincipalName?.trim() || school.vicePrincipal,
    established: general.established || school.established,
    academicYear: currentSession?.trim() || school.academicYear,
  }
}

/** Live snapshot for non-React contexts (store seeds, HTML builders). */
export function getSchoolProfile(): SchoolProfile {
  try {
    const s = useSchoolSettingsStore.getState()
    return resolveFromSettings(s.general, s.academics?.currentSession)
  } catch {
    return resolveFromSettings({}, '')
  }
}

/** Reactive hook for React document renderers. */
export function useSchoolProfile(): SchoolProfile {
  const general = useSchoolSettingsStore((s) => s.general)
  const currentSession = useSchoolSettingsStore((s) => s.academics.currentSession)
  return useMemo(
    () => resolveFromSettings(general, currentSession),
    [general, currentSession],
  )
}
