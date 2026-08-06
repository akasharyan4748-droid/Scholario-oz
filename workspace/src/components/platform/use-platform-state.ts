import { useState } from 'react'
import type { ActiveSchool } from '../shared/sidebar'
import type {
  SortingHatEntry,
  SortingHatFilter,
  SchoolStatusFilter,
  ViewMode,
} from './types'

export function buildSortingHatDatabase(schools: ActiveSchool[]): SortingHatEntry[] {
  return [
    { type: 'School', title: 'Emerald Heights Academy', detail: 'emerald.scholario.com • Active', item: schools[0] },
    { type: 'School', title: 'Royal Oak Lyceum', detail: 'royaloak.org • Active', item: schools[1] },
    { type: 'School', title: 'St. Xavier International', detail: 'stxaviers.edu • Active', item: schools[2] },
    { type: 'User', title: 'Dr. Sarah Jenkins', detail: 'Principal Admin • Emerald Heights', item: null },
    { type: 'User', title: 'Robert Vance', detail: 'Platform Operator • System Admin', item: null },
    { type: 'Invoice', title: 'INV-2026-0892 ($12,400)', detail: 'Enterprise License • Royal Oak', item: null },
    { type: 'Invoice', title: 'INV-2026-0893 ($18,900)', detail: 'Enterprise License • St. Xavier', item: null },
    { type: 'Audit Log', title: 'SEC-8921 Encryption Key Rotation', detail: 'System Admin • 10m ago', item: null },
    { type: 'Report', title: 'Global Q2 Tenant Utilization Matrix', detail: 'Generated • Today 09:00 AM', item: null },
    { type: 'Student', title: 'Arjun Sharma (STU-0842)', detail: 'Grade X-B • Emerald Heights', item: null },
    { type: 'Teacher', title: 'Prof. Marcus Vance', detail: 'Physics Dept Head • St. Xavier', item: null },
  ]
}

export function filterSortingHat(
  database: SortingHatEntry[],
  query: string,
  filter: SortingHatFilter,
): SortingHatEntry[] {
  return database.filter((item) => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)

    if (filter === 'schools') return matchesQuery && item.type === 'School'
    if (filter === 'users') return matchesQuery && (item.type === 'User' || item.type === 'Student' || item.type === 'Teacher')
    if (filter === 'invoices') return matchesQuery && item.type === 'Invoice'
    if (filter === 'logs') return matchesQuery && item.type === 'Audit Log'
    return matchesQuery
  })
}

export interface PlatformSchoolsState {
  // Sorting Hat
  sortingHatQuery: string
  setSortingHatQuery: (q: string) => void
  sortingHatFilter: SortingHatFilter
  setSortingHatFilter: (f: SortingHatFilter) => void

  // Schools Module
  schoolSearch: string
  setSchoolSearch: (q: string) => void
  statusFilter: SchoolStatusFilter
  setStatusFilter: (s: SchoolStatusFilter) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void

  // Create School Modal
  showCreateModal: boolean
  setShowCreateModal: (s: boolean) => void
  newSchoolName: string
  setNewSchoolName: (s: string) => void
  newSchoolDomain: string
  setNewSchoolDomain: (s: string) => void
  newSchoolCode: string
  setNewSchoolCode: (s: string) => void

  // Handlers
  handleCreateSchool: (e: React.FormEvent) => void
  handleToggleStatus: (id: string, targetStatus: 'Active' | 'Suspended' | 'Archived') => void
  handleDeleteSchool: (id: string) => void
}

export function usePlatformSchoolsState(
  schools: ActiveSchool[],
  setSchools: React.Dispatch<React.SetStateAction<ActiveSchool[]>>,
): PlatformSchoolsState {
  // Sorting Hat Search State
  const [sortingHatQuery, setSortingHatQuery] = useState('')
  const [sortingHatFilter, setSortingHatFilter] = useState<SortingHatFilter>('all')

  // Schools Module State
  const [schoolSearch, setSchoolSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SchoolStatusFilter>('All')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Create School Modal / Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newSchoolDomain, setNewSchoolDomain] = useState('')
  const [newSchoolCode, setNewSchoolCode] = useState('')

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchoolName || !newSchoolDomain) return
    const newSchool: ActiveSchool = {
      id: String(schools.length + 1),
      name: newSchoolName,
      domain: newSchoolDomain.includes('.') ? newSchoolDomain : `${newSchoolDomain}.scholario.com`,
      code: newSchoolCode || `SCH-0${schools.length + 1}`,
      status: 'Active',
    }
    setSchools([...schools, newSchool])
    setNewSchoolName('')
    setNewSchoolDomain('')
    setNewSchoolCode('')
    setShowCreateModal(false)
  }

  const handleToggleStatus = (id: string, targetStatus: 'Active' | 'Suspended' | 'Archived') => {
    setSchools(schools.map((s) => (s.id === id ? { ...s, status: targetStatus } : s)))
  }

  const handleDeleteSchool = (id: string) => {
    if (confirm('Are you sure you want to delete this school tenant? This action cannot be undone.')) {
      setSchools(schools.filter((s) => s.id !== id))
    }
  }

  return {
    sortingHatQuery,
    setSortingHatQuery,
    sortingHatFilter,
    setSortingHatFilter,
    schoolSearch,
    setSchoolSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    showCreateModal,
    setShowCreateModal,
    newSchoolName,
    setNewSchoolName,
    newSchoolDomain,
    setNewSchoolDomain,
    newSchoolCode,
    setNewSchoolCode,
    handleCreateSchool,
    handleToggleStatus,
    handleDeleteSchool,
  }
}
