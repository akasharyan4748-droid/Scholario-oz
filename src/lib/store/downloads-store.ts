'use client'

/**
 * Downloads Store — Document Library.
 *
 * Aggregates the school's downloadable document library:
 *   · Official Forms    — static, downloadable blank forms
 *   · Templates         — editable office templates
 *   · Reports           — generated reports from various modules
 *   · Generated         — pulled live from the certificates-store
 *                         (bonafide, transfer, character, ID card,
 *                          fee receipt, migration, marksheet)
 *
 * Data sources (NO duplication):
 *   - Generated docs:  useCertificatesStore.documents (canonical)
 *   - Static docs:     STATIC_DOCS (defined below)
 *
 * Visual + interaction language follows the rest of SCHOLARIO:
 * emerald/teal primary, subtle borders, no big colorful icon squares.
 */

import { create } from 'zustand'
import {
  useCertificatesStore,
  type GeneratedDocument as CertGeneratedDocument,
  type DocType as CertDocType,
} from './certificates-store'

// ─── Types ──────────────────────────────────────────────────────────

export type DocSource = 'Official Form' | 'Template' | 'Generated' | 'Report' | 'Resource'
export type DocFormat = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'JPG'
export type DocCategory =
  | 'Admissions'
  | 'Student Records'
  | 'Finance'
  | 'Academics'
  | 'Operations'
  | 'Health'
  | 'Transport'

export type SortBy = 'recent' | 'name-az' | 'name-za' | 'type'

export type CategoryTab =
  | 'All'
  | 'Recent'
  | 'Generated'
  | 'Forms'
  | 'Templates'
  | 'Reports'

export interface DownloadDocument {
  id: string
  name: string
  description: string // SHORT — max 5 words
  category: DocCategory
  format: DocFormat
  source: DocSource
  updatedDate: string
  size?: string
  // For generated documents — link to source
  studentId?: string
  studentName?: string
  docNumber?: string
  // For downloadable — URL or blob reference
  downloadUrl?: string
}

interface DownloadsState {
  // Filters / search
  query: string
  categoryFilter: 'All' | DocCategory
  categoryTab: CategoryTab
  sortBy: SortBy

  // Per-document usage tracking (for Quick Access + Recent)
  downloadsCount: Record<string, number>
  lastAccessedAt: Record<string, string>

  // Search + filter actions
  setQuery: (q: string) => void
  search: (q: string) => void // alias of setQuery
  setCategoryFilter: (c: 'All' | DocCategory) => void
  setCategoryTab: (t: CategoryTab) => void
  setSortBy: (s: SortBy) => void
  resetFilters: () => void

  // Document list operations
  getAllDocuments: () => DownloadDocument[]
  getFilteredDocuments: () => DownloadDocument[]
  getQuickAccess: () => DownloadDocument[]
  getDocumentById: (id: string) => DownloadDocument | undefined
  getCountsByTab: () => Record<CategoryTab, number>

  // Download (returns filename for toast)
  download: (doc: DownloadDocument) => string
  recordPreview: (doc: DownloadDocument) => void
}

// ─── Static document catalogue ────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

const STATIC_DOCS: DownloadDocument[] = [
  // ── Official Forms (8) ──────────────────────────────────────────────
  { id: 'doc-form-admission', name: 'Admission Form', description: 'New admission application', category: 'Admissions', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(28), size: '184 KB' },
  { id: 'doc-form-registration', name: 'Registration Form', description: 'Pre-admission registration form', category: 'Admissions', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(35), size: '142 KB' },
  { id: 'doc-form-prospectus', name: 'School Prospectus', description: 'School overview & curriculum', category: 'Admissions', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(14), size: '2.4 MB' },
  { id: 'doc-form-transport', name: 'Transport Application Form', description: 'Bus pickup & drop request', category: 'Transport', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(42), size: '128 KB' },
  { id: 'doc-form-hostel', name: 'Hostel Application Form', description: 'Boarding facility application', category: 'Operations', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(56), size: '156 KB' },
  { id: 'doc-form-medical', name: 'Medical Declaration Form', description: 'Student health & emergency', category: 'Health', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(21), size: '96 KB' },
  { id: 'doc-form-sports', name: 'Sports Participation Form', description: 'Consent for sports events', category: 'Operations', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(12), size: '110 KB' },
  { id: 'doc-form-examination', name: 'Examination Form', description: 'Board / internal exam form', category: 'Academics', format: 'PDF', source: 'Official Form', updatedDate: daysAgo(7), size: '132 KB' },

  // ── Templates (5) ──────────────────────────────────────────────────
  { id: 'doc-tpl-fee-receipt', name: 'Fee Receipt Template', description: 'Auto-calc fee receipt sheet', category: 'Finance', format: 'XLSX', source: 'Template', updatedDate: daysAgo(9), size: '38 KB' },
  { id: 'doc-tpl-id-card', name: 'ID Card Template', description: 'Editable student ID layout', category: 'Student Records', format: 'PDF', source: 'Template', updatedDate: daysAgo(18), size: '420 KB' },
  { id: 'doc-tpl-salary-slip', name: 'Salary Slip Template', description: 'Monthly payroll slip layout', category: 'Finance', format: 'XLSX', source: 'Template', updatedDate: daysAgo(15), size: '42 KB' },
  { id: 'doc-tpl-tc-format', name: 'Transfer Certificate Format', description: 'Official TC layout template', category: 'Student Records', format: 'PDF', source: 'Template', updatedDate: daysAgo(24), size: '88 KB' },
  { id: 'doc-tpl-fee-structure', name: 'Fee Structure Sheet', description: 'Class-wise annual fee sheet', category: 'Finance', format: 'XLSX', source: 'Template', updatedDate: daysAgo(5), size: '46 KB' },

  // ── Reports (4) ─────────────────────────────────────────────────────
  { id: 'doc-rpt-fee-monthly', name: 'Monthly Fee Collection Report', description: 'Fees collected this month', category: 'Finance', format: 'PDF', source: 'Report', updatedDate: daysAgo(3), size: '512 KB' },
  { id: 'doc-rpt-payroll-summary', name: 'Payroll Summary Report', description: 'Staff payroll disbursement', category: 'Finance', format: 'PDF', source: 'Report', updatedDate: daysAgo(4), size: '380 KB' },
  { id: 'doc-rpt-attendance', name: 'Attendance Report', description: 'Student attendance summary', category: 'Academics', format: 'PDF', source: 'Report', updatedDate: daysAgo(2), size: '290 KB' },
  { id: 'doc-rpt-exam-result', name: 'Examination Result Report', description: 'Class-wise result analysis', category: 'Academics', format: 'PDF', source: 'Report', updatedDate: daysAgo(6), size: '640 KB' },
]

// ─── Cert doc → Download document mapping ────────────────────────────

const CERT_CATEGORY: Record<CertDocType, DocCategory> = {
  'Bonafide': 'Student Records',
  'Transfer': 'Student Records',
  'Character': 'Student Records',
  'ID Card': 'Student Records',
  'Fee Receipt': 'Finance',
  'Migration': 'Academics',
  'Marksheet': 'Academics',
}

const CERT_SIZE: Record<CertDocType, string> = {
  'Bonafide': '92 KB',
  'Transfer': '88 KB',
  'Character': '78 KB',
  'ID Card': '156 KB',
  'Fee Receipt': '64 KB',
  'Migration': '84 KB',
  'Marksheet': '124 KB',
}

function certToDownloadDoc(cert: CertGeneratedDocument): DownloadDocument {
  return {
    id: `doc-gen-${cert.id}`,
    name: `${cert.docType} — ${cert.studentName || 'Student'}`,
    description: cert.docNumber,
    category: CERT_CATEGORY[cert.docType],
    format: 'PDF',
    source: 'Generated',
    updatedDate: cert.generatedAt,
    size: CERT_SIZE[cert.docType],
    studentId: cert.studentId,
    studentName: cert.studentName,
    docNumber: cert.docNumber,
  }
}

// ─── Sort helpers ────────────────────────────────────────────────────

function byName(a: DownloadDocument, b: DownloadDocument, asc: boolean): number {
  const r = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  return asc ? r : -r
}

function byDateDesc(a: DownloadDocument, b: DownloadDocument): number {
  return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
}

function byType(a: DownloadDocument, b: DownloadDocument): number {
  // Group by format then by name
  const r = a.format.localeCompare(b.format)
  return r !== 0 ? r : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

// ─── Store ────────────────────────────────────────────────────────────

const STATIC_BY_ID: Record<string, DownloadDocument> = STATIC_DOCS.reduce(
  (acc, d) => {
    acc[d.id] = d
    return acc
  },
  {} as Record<string, DownloadDocument>,
)

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  query: '',
  categoryFilter: 'All',
  categoryTab: 'All',
  sortBy: 'recent',
  downloadsCount: {
    'doc-form-admission': 12,
    'doc-tpl-fee-receipt': 9,
    'doc-form-medical': 7,
    'doc-rpt-fee-monthly': 6,
    'doc-tpl-id-card': 5,
  },
  lastAccessedAt: {
    'doc-form-admission': daysAgo(1),
    'doc-tpl-fee-receipt': daysAgo(2),
    'doc-form-medical': daysAgo(3),
    'doc-rpt-fee-monthly': daysAgo(4),
    'doc-tpl-id-card': daysAgo(5),
  },

  setQuery: (q) => set({ query: q }),
  search: (q) => set({ query: q }),
  setCategoryFilter: (c) => set({ categoryFilter: c }),
  setCategoryTab: (t) => set({ categoryTab: t }),
  setSortBy: (s) => set({ sortBy: s }),
  resetFilters: () =>
    set({ query: '', categoryFilter: 'All', categoryTab: 'All', sortBy: 'recent' }),

  getAllDocuments: () => {
    const certDocs = useCertificatesStore.getState().documents.map(certToDownloadDoc)
    // Newest first by default
    const all = [...STATIC_DOCS, ...certDocs]
    return all.sort(byDateDesc)
  },

  getCountsByTab: () => {
    const certDocs = useCertificatesStore.getState().documents.map(certToDownloadDoc)
    const forms = STATIC_DOCS.filter((d) => d.source === 'Official Form').length
    const templates = STATIC_DOCS.filter((d) => d.source === 'Template').length
    const reports = STATIC_DOCS.filter((d) => d.source === 'Report').length
    const generated = certDocs.length
    const all = STATIC_DOCS.length + generated
    return {
      All: all,
      Recent: all,
      Forms: forms,
      Templates: templates,
      Reports: reports,
      Generated: generated,
    }
  },

  getFilteredDocuments: () => {
    const state = get()
    const all = get().getAllDocuments()

    let docs = all

    // Tab filter (acts as a primary source filter, except All / Recent)
    const tab = state.categoryTab
    if (tab === 'Forms') {
      docs = docs.filter((d) => d.source === 'Official Form')
    } else if (tab === 'Templates') {
      docs = docs.filter((d) => d.source === 'Template')
    } else if (tab === 'Reports') {
      docs = docs.filter((d) => d.source === 'Report')
    } else if (tab === 'Generated') {
      docs = docs.filter((d) => d.source === 'Generated')
    } else if (tab === 'Recent') {
      docs = docs.sort(byDateDesc).slice(0, 8)
    }

    // Category filter (secondary)
    if (state.categoryFilter !== 'All') {
      docs = docs.filter((d) => d.category === state.categoryFilter)
    }

    // Search by name, category, student name, doc number
    const q = state.query.trim().toLowerCase()
    if (q) {
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.studentName ?? '').toLowerCase().includes(q) ||
          (d.docNumber ?? '').toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q),
      )
    }

    // Sort
    const sort = state.sortBy
    if (sort === 'name-az') docs = [...docs].sort((a, b) => byName(a, b, true))
    else if (sort === 'name-za') docs = [...docs].sort((a, b) => byName(a, b, false))
    else if (sort === 'type') docs = [...docs].sort(byType)
    else docs = [...docs].sort(byDateDesc) // 'recent' default

    return docs
  },

  getQuickAccess: () => {
    const state = get()
    // Sort by downloadsCount desc, then by last accessed desc
    const all = get().getAllDocuments()
    const scored = all
      .map((d) => ({
        doc: d,
        count: state.downloadsCount[d.id] ?? 0,
        last: state.lastAccessedAt[d.id] ?? d.updatedDate,
      }))
      .filter((s) => s.count > 0 || state.lastAccessedAt[s.doc.id])
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return new Date(b.last).getTime() - new Date(a.last).getTime()
      })
      .slice(0, 5)
      .map((s) => s.doc)
    return scored
  },

  getDocumentById: (id) => get().getAllDocuments().find((d) => d.id === id),

  download: (doc) => {
    const baseName = (doc.docNumber ?? doc.name).replace(/[^A-Za-z0-9\-]/g, '_')
    const filename = `${baseName}.${doc.format.toLowerCase()}`

    set((s) => ({
      downloadsCount: {
        ...s.downloadsCount,
        [doc.id]: (s.downloadsCount[doc.id] ?? 0) + 1,
      },
      lastAccessedAt: {
        ...s.lastAccessedAt,
        [doc.id]: new Date().toISOString(),
      },
    }))

    return filename
  },

  recordPreview: (doc) => {
    set((s) => ({
      lastAccessedAt: {
        ...s.lastAccessedAt,
        [doc.id]: new Date().toISOString(),
      },
    }))
  },
}))

// Re-export for components that need the underlying cert record
export { STATIC_BY_ID as STATIC_DOCS_BY_ID, STATIC_DOCS, certToDownloadDoc, CERT_CATEGORY }
