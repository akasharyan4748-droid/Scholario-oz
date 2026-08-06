import type React from 'react'
import { FileText, Clock, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react'
import type { AdmissionStatus } from '@/lib/store/admission-store'
import type { AdmissionApplication } from '@/lib/store/admission-store'

export interface AdmissionsDashboardProps {
  onOpenWizard: (appId?: string) => void
  onOpenVerificationWorkspace: (appId: string) => void
  onOpenIssuanceWorkspace: (appId: string) => void
  onOpenSettingsModal: () => void
  onOpenOcrModal?: () => void
  onOpenBlankFormModal?: () => void
}

// Simplified status tabs — 5 meaningful stages
export interface StatusTab {
  key: AdmissionStatus | 'All'
  label: string
  icon: React.ElementType
}

export const STATUS_TABS: StatusTab[] = [
  { key: 'All', label: 'All', icon: FileText },
  { key: 'Submitted', label: 'In Review', icon: Clock },
  { key: 'Need Correction', label: 'Corrections', icon: AlertTriangle },
  { key: 'Approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'Completed', label: 'Enrolled', icon: UserCheck },
]

export type ActiveTab = AdmissionStatus | 'All'

export interface FilterState {
  activeTab: ActiveTab
  searchQuery: string
  selectedClass: string
  selectedSession: string
  selectedAdmissionType: string
  dateFrom: string
  dateTo: string
}

/**
 * Compute the simplified status counts used by the dashboard KPI strip + tabs.
 */
export function computeStatusCounts(applications: AdmissionApplication[]): {
  inReview: number
  needCorrection: number
  approved: number
  enrolled: number
  rejected: number
  drafts: number
  underReview: number
  statusCounts: Record<string, number>
} {
  const inReview = applications.filter((a) => a.status === 'Submitted' || a.status === 'Under Review').length
  const needCorrection = applications.filter((a) => a.status === 'Need Correction').length
  const approved = applications.filter((a) => a.status === 'Approved').length
  const enrolled = applications.filter((a) => a.status === 'Completed').length
  const rejected = applications.filter((a) => a.status === 'Rejected').length
  const drafts = applications.filter((a) => a.status === 'Draft').length
  const underReview = applications.filter((a) => a.status === 'Under Review').length

  const statusCounts: Record<string, number> = {
    All: applications.length,
    Draft: drafts,
    Submitted: inReview, // includes both Submitted + Under Review
    'Under Review': underReview,
    'Need Correction': needCorrection,
    Approved: approved,
    Rejected: rejected,
    Completed: enrolled,
  }

  return { inReview, needCorrection, approved, enrolled, rejected, drafts, underReview, statusCounts }
}

/**
 * Filter applications by tab, class, session, type, date range, and global search.
 */
export function filterApplications(applications: AdmissionApplication[], state: FilterState): AdmissionApplication[] {
  const { activeTab, searchQuery, selectedClass, selectedSession, selectedAdmissionType, dateFrom, dateTo } = state
  return applications.filter((app) => {
    // "Submitted" tab shows both Submitted AND Under Review
    if (activeTab === 'Submitted' && app.status !== 'Submitted' && app.status !== 'Under Review') return false
    if (activeTab !== 'All' && activeTab !== 'Submitted' && app.status !== activeTab) return false
    if (selectedClass !== 'All' && app.className !== selectedClass) return false
    if (selectedSession !== 'All' && app.academicSession !== selectedSession) return false
    if (selectedAdmissionType !== 'All' && (app.formData.admissionType || 'fresh') !== selectedAdmissionType) return false
    if (dateFrom && app.date && new Date(app.date) < new Date(dateFrom)) return false
    if (dateTo && app.date && new Date(app.date) > new Date(dateTo)) return false
    if (searchQuery.trim()) {
      // Global search across admission no, name, parent, phone, aadhaar, previous school
      const q = searchQuery.toLowerCase()
      const f = app.formData
      return (
        app.applicantName.toLowerCase().includes(q) ||
        app.admissionNo.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        (f.fatherName || '').toLowerCase().includes(q) ||
        (f.motherName || '').toLowerCase().includes(q) ||
        (f.fatherPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (f.motherPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (f.aadhaarNo || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        (f.previousSchool || '').toLowerCase().includes(q)
      )
    }
    return true
  })
}
