import type { ActiveSchool } from '../shared/sidebar'

export interface PlatformViewsProps {
  activeItem: string
  schools: ActiveSchool[]
  setSchools: React.Dispatch<React.SetStateAction<ActiveSchool[]>>
  onOpenSchoolWorkspace: (school: ActiveSchool) => void
}

export type SortingHatFilter = 'all' | 'schools' | 'users' | 'invoices' | 'logs'

export interface SortingHatEntry {
  type: string
  title: string
  detail: string
  item: ActiveSchool | null
}

export type SchoolStatusFilter = 'All' | 'Active' | 'Suspended' | 'Archived'
export type ViewMode = 'grid' | 'table'
