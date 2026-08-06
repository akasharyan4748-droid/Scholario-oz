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

export const SECTIONS_CONFIG: SectionConfig[] = [
  { key: 'personal', title: '1. Personal Information', icon: User },
  { key: 'parents', title: '2. Parents & Emergency Contacts', icon: Users },
  { key: 'address', title: '3. Address & Residence Details', icon: MapPin },
  { key: 'previousSchool', title: '4. Previous School & TC Record', icon: School },
  { key: 'medical', title: '5. Medical & Physical Health Profile', icon: HeartPulse },
  { key: 'classAllocation', title: '6. Class & Stream Allocation', icon: GraduationCap },
  { key: 'fees', title: '7. Fee Structure & Concessions', icon: Wallet },
  { key: 'documents', title: '8. Certificate & Document Scans', icon: FileText },
  { key: 'photo', title: '9. Student Photo & Visual Identity', icon: Camera },
]
