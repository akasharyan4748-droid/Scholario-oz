import type React from 'react'
import {
  User, Users, MapPin, School, HeartPulse, GraduationCap, Wallet,
  FileText, Camera,
} from 'lucide-react'
import type { SectionKey } from '@/lib/store/admission-store'

export interface SectionConfig {
  key: SectionKey
  title: string
  icon: React.ElementType
}

export interface SectionVisibilityFlags {
  enableMedical?: boolean
  enablePreviousSchool?: boolean
  enableStudentPhoto?: boolean
}

/**
 * Build the verification checklist, filtered by the admission feature flags.
 * Settings like `enableMedical`, `enablePreviousSchool`, and
 * `enableStudentPhoto` actually hide the corresponding sections — they're
 * not visual-only toggles.
 */
export function getSectionsConfig(flags: SectionVisibilityFlags = {}): SectionConfig[] {
  const base: SectionConfig[] = [
    { key: 'personal', title: '1. Personal Information', icon: User },
    { key: 'parents', title: '2. Parents & Emergency Contacts', icon: Users },
    { key: 'address', title: '3. Address & Residence Details', icon: MapPin },
  ]

  if (flags.enablePreviousSchool !== false) {
    base.push({ key: 'previousSchool', title: '4. Previous School & TC Record', icon: School })
  }

  if (flags.enableMedical !== false) {
    base.push({ key: 'medical', title: '5. Medical & Physical Health Profile', icon: HeartPulse })
  }

  base.push({ key: 'classAllocation', title: '6. Class & Stream Allocation', icon: GraduationCap })
  base.push({ key: 'fees', title: '7. Fee Structure & Concessions', icon: Wallet })
  base.push({ key: 'documents', title: '8. Certificate & Document Scans', icon: FileText })

  if (flags.enableStudentPhoto !== false) {
    base.push({ key: 'photo', title: '9. Student Photo & Visual Identity', icon: Camera })
  }

  return base
}

// Backward-compat: full unfiltered list (used by callers that haven't been
// updated to pass flags yet). New callers should use getSectionsConfig(flags).
export const SECTIONS_CONFIG: SectionConfig[] = getSectionsConfig()
