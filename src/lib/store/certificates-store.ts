'use client'

/**
 * Certificates Store — Document Generation system.
 *
 * Generates official school documents (bonafide, transfer, character, ID
 * card, fee receipt, migration, marksheet) with multiple templates per
 * document type and a full history log.
 *
 * Data sources (NO duplication):
 *   - Students:          useStudentsStore (canonical)
 *   - School branding:   @/lib/mock/school
 *   - Fee transactions:  useFeeStore.transactions
 *   - Exam marks:        useMockMarksStore + useMockExamsStore
 *
 * Document numbering: <PREFIX>/<YEAR>/<SEQ5>
 *   e.g. BON/2026/00001, TC/2026/00001, CHR/2026/00001, ID/2026/00001,
 *        FEE/2026/00001, MIG/2026/00001, MS/2026/00001
 */

import { create } from 'zustand'

// ─── Document types ───────────────────────────────────────────────────

export type DocType =
  | 'Bonafide'
  | 'Transfer'
  | 'Character'
  | 'ID Card'
  | 'Fee Receipt'
  | 'Migration'
  | 'Marksheet'

export type TemplateStyle =
  | 'Classic'
  | 'Modern'
  | 'Formal'
  | 'Minimal'
  | 'Standard'
  | 'Compact'

export type DocStatus = 'Generated' | 'Printed' | 'Downloaded' | 'Issued'

export interface DocumentTemplate {
  id: string
  name: string
  docType: DocType
  style: TemplateStyle
  isDefault: boolean
  active: boolean
  accentColor: string
}

export interface GeneratedDocument {
  id: string
  docType: DocType
  docNumber: string
  studentId?: string
  studentName: string
  admissionNo?: string
  class?: string
  templateId: string
  templateName: string
  generatedBy: string
  generatedAt: string
  status: DocStatus
  data: Record<string, any>
}

// ─── Document number prefixes ─────────────────────────────────────────

export const DOC_PREFIX: Record<DocType, string> = {
  'Bonafide': 'BON',
  'Transfer': 'TC',
  'Character': 'CHR',
  'ID Card': 'ID',
  'Fee Receipt': 'FEE',
  'Migration': 'MIG',
  'Marksheet': 'MS',
}

/** Academic year used in doc numbers (matches the school's academic year). */
export const CERT_YEAR = '2026'

// ─── Default templates ───────────────────────────────────────────────

const CERT_STYLES: TemplateStyle[] = ['Classic', 'Modern', 'Formal', 'Minimal']
const ACCENTS = {
  Classic: '#0d9488', // teal-600
  Modern: '#0ea5e9',  // sky-500
  Formal: '#7c3aed',  // violet-600
  Minimal: '#475569', // slate-600
  Standard: '#0d9488',
  Compact: '#475569',
}

function buildCertTemplates(docType: DocType, prefix: string): DocumentTemplate[] {
  return CERT_STYLES.map((style, i) => ({
    id: `tpl-${prefix}-${style.toLowerCase()}`,
    name: `${style} ${docType}`,
    docType,
    style,
    isDefault: i === 0,
    active: true,
    accentColor: (ACCENTS as any)[style],
  }))
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  ...buildCertTemplates('Bonafide', 'bon'),
  ...buildCertTemplates('Transfer', 'tc'),
  ...buildCertTemplates('Character', 'chr'),
  ...buildCertTemplates('Migration', 'mig'),
  // Marksheets
  {
    id: 'tpl-ms-standard',
    name: 'Standard Marksheet',
    docType: 'Marksheet',
    style: 'Standard',
    isDefault: true,
    active: true,
    accentColor: ACCENTS.Standard,
  },
  {
    id: 'tpl-ms-modern',
    name: 'Modern Academic',
    docType: 'Marksheet',
    style: 'Modern',
    isDefault: false,
    active: true,
    accentColor: ACCENTS.Modern,
  },
  {
    id: 'tpl-ms-compact',
    name: 'Compact Marksheet',
    docType: 'Marksheet',
    style: 'Compact',
    isDefault: false,
    active: true,
    accentColor: ACCENTS.Compact,
  },
  // ID Cards
  {
    id: 'tpl-id-classic',
    name: 'Classic ID Card',
    docType: 'ID Card',
    style: 'Classic',
    isDefault: true,
    active: true,
    accentColor: ACCENTS.Classic,
  },
  {
    id: 'tpl-id-modern',
    name: 'Modern ID Card',
    docType: 'ID Card',
    style: 'Modern',
    isDefault: false,
    active: true,
    accentColor: ACCENTS.Modern,
  },
  {
    id: 'tpl-id-compact',
    name: 'Compact ID Card',
    docType: 'ID Card',
    style: 'Compact',
    isDefault: false,
    active: true,
    accentColor: ACCENTS.Compact,
  },
  // Fee Receipts
  {
    id: 'tpl-fee-standard',
    name: 'Standard Receipt',
    docType: 'Fee Receipt',
    style: 'Standard',
    isDefault: true,
    active: true,
    accentColor: ACCENTS.Standard,
  },
  {
    id: 'tpl-fee-compact',
    name: 'Compact Receipt',
    docType: 'Fee Receipt',
    style: 'Compact',
    isDefault: false,
    active: true,
    accentColor: ACCENTS.Compact,
  },
]

// ─── Seed generated documents (small starter log) ─────────────────────
// These give the History tab something to show on first load. All
// numbers continue from this starting count when new docs are generated.

function seedDocs(): GeneratedDocument[] {
  const base = [
    { type: 'Bonafide' as DocType, name: 'Aarav Sharma', adm: 'DSO2024001', cls: 'Class 9', daysAgo: 2, status: 'Issued' as DocStatus },
    { type: 'Transfer' as DocType, name: 'Diya Patel', adm: 'DSO2024002', cls: 'Class 9', daysAgo: 5, status: 'Downloaded' as DocStatus },
    { type: 'Character' as DocType, name: 'Vivaan Reddy', adm: 'DSO2024003', cls: 'Class 9', daysAgo: 7, status: 'Printed' as DocStatus },
    { type: 'ID Card' as DocType, name: 'Ananya Singh', adm: 'DSO2024004', cls: 'Class 9', daysAgo: 11, status: 'Issued' as DocStatus },
    { type: 'Marksheet' as DocType, name: 'Reyansh Kumar', adm: 'DSO2024005', cls: 'Class 9', daysAgo: 14, status: 'Issued' as DocStatus },
    { type: 'Fee Receipt' as DocType, name: 'Saanvi Verma', adm: 'DSO2024006', cls: 'Class 10', daysAgo: 17, status: 'Printed' as DocStatus },
    { type: 'Migration' as DocType, name: 'Arjun Nair', adm: 'DSO2024007', cls: 'Class 12', daysAgo: 21, status: 'Downloaded' as DocStatus },
    { type: 'Bonafide' as DocType, name: 'Myra Gupta', adm: 'DSO2024008', cls: 'Class 10', daysAgo: 28, status: 'Issued' as DocStatus },
  ]
  // Counters per type for seed numbering
  const counters: Record<string, number> = {}
  return base.map((b, i) => {
    const prefix = DOC_PREFIX[b.type]
    counters[prefix] = (counters[prefix] ?? 0) + 1
    const seq = counters[prefix].toString().padStart(5, '0')
    const docNumber = `${prefix}/${CERT_YEAR}/${seq}`
    const date = new Date(Date.now() - b.daysAgo * 86400_000).toISOString()
    const tmpl = DEFAULT_TEMPLATES.find((t) => t.docType === b.type && t.isDefault)!
    return {
      id: `doc-seed-${i + 1}`,
      docType: b.type,
      docNumber,
      studentId: undefined,
      studentName: b.name,
      admissionNo: b.adm,
      class: b.cls,
      templateId: tmpl.id,
      templateName: tmpl.name,
      generatedBy: 'Dr. Sarah Jenkins',
      generatedAt: date,
      status: b.status,
      data: { purpose: b.type === 'Bonafide' ? 'Bank Account Opening' : '—' },
    }
  })
}

// ─── Store interface ─────────────────────────────────────────────────

export interface CertificatesState {
  templates: DocumentTemplate[]
  documents: GeneratedDocument[]
  counters: Record<string, number> // prefix → last seq number used

  // Queries
  getTemplatesForType: (docType: DocType) => DocumentTemplate[]
  getTemplateById: (id: string) => DocumentTemplate | undefined
  getDefaultTemplate: (docType: DocType) => DocumentTemplate | undefined
  getDocumentHistory: (filters?: {
    search?: string
    docType?: DocType | 'all'
    status?: DocStatus | 'all'
  }) => GeneratedDocument[]
  getDocumentById: (id: string) => GeneratedDocument | undefined
  getKpis: () => {
    total: number
    thisMonth: number
    activeTemplates: number
    pending: number
  }

  // Mutations
  generateDocument: (input: {
    docType: DocType
    templateId: string
    student?: { id: string; name: string; admissionNo?: string; class?: string }
    studentId?: string
    studentName?: string
    admissionNo?: string
    class?: string
    generatedBy?: string
    data: Record<string, any>
  }) => GeneratedDocument

  setDefaultTemplate: (docType: DocType, templateId: string) => void
  duplicateTemplate: (templateId: string) => DocumentTemplate | undefined
  toggleTemplateActive: (templateId: string) => void
  renameTemplate: (templateId: string, name: string) => void
  updateDocStatus: (docId: string, status: DocStatus) => void
  deleteDocument: (docId: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────

function pad5(n: number): string {
  return n.toString().padStart(5, '0')
}

function nextDocNumber(prefix: string, counters: Record<string, number>): string {
  const seq = (counters[prefix] ?? 0) + 1
  return `${prefix}/${CERT_YEAR}/${pad5(seq)}`
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ─── Store ───────────────────────────────────────────────────────────

const SEED_DOCS = seedDocs()
const SEED_COUNTERS: Record<string, number> = {}
for (const d of SEED_DOCS) {
  const prefix = DOC_PREFIX[d.docType]
  const seq = parseInt(d.docNumber.split('/')[2] ?? '0', 10)
  if (!Number.isNaN(seq) && seq > (SEED_COUNTERS[prefix] ?? 0)) {
    SEED_COUNTERS[prefix] = seq
  }
}

export const useCertificatesStore = create<CertificatesState>((set, get) => ({
  templates: DEFAULT_TEMPLATES,
  documents: SEED_DOCS,
  counters: SEED_COUNTERS,

  getTemplatesForType: (docType) =>
    get().templates.filter((t) => t.docType === docType),

  getTemplateById: (id) => get().templates.find((t) => t.id === id),

  getDefaultTemplate: (docType) =>
    get().templates.find((t) => t.docType === docType && t.isDefault) ??
    get().templates.find((t) => t.docType === docType),

  getDocumentHistory: (filters) => {
    let docs = [...get().documents].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    )
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim()
      docs = docs.filter((d) =>
        d.studentName.toLowerCase().includes(q) ||
        (d.admissionNo ?? '').toLowerCase().includes(q) ||
        d.docNumber.toLowerCase().includes(q),
      )
    }
    if (filters?.docType && filters.docType !== 'all') {
      docs = docs.filter((d) => d.docType === filters.docType)
    }
    if (filters?.status && filters.status !== 'all') {
      docs = docs.filter((d) => d.status === filters.status)
    }
    return docs
  },

  getDocumentById: (id) => get().documents.find((d) => d.id === id),

  getKpis: () => {
    const docs = get().documents
    return {
      total: docs.length,
      thisMonth: docs.filter((d) => isThisMonth(d.generatedAt)).length,
      activeTemplates: get().templates.filter((t) => t.active).length,
      pending: docs.filter((d) => d.status === 'Generated').length,
    }
  },

  generateDocument: (input) => {
    const state = get()
    const prefix = DOC_PREFIX[input.docType]
    const seq = (state.counters[prefix] ?? 0) + 1
    const docNumber = `${prefix}/${CERT_YEAR}/${pad5(seq)}`
    const tmpl = state.templates.find((t) => t.id === input.templateId)
    const studentId = input.student?.id ?? input.studentId
    const studentName = input.student?.name ?? input.studentName ?? ''
    const admissionNo = input.student?.admissionNo ?? input.admissionNo
    const cls = input.student?.class ?? input.class

    const doc: GeneratedDocument = {
      id: `doc-${Date.now()}-${seq}`,
      docType: input.docType,
      docNumber,
      studentId,
      studentName,
      admissionNo,
      class: cls,
      templateId: input.templateId,
      templateName: tmpl?.name ?? input.docType,
      generatedBy: input.generatedBy ?? 'Dr. Sarah Jenkins',
      generatedAt: new Date().toISOString(),
      status: 'Generated',
      data: input.data,
    }
    set((s) => ({
      documents: [doc, ...s.documents],
      counters: { ...s.counters, [prefix]: seq },
    }))
    return doc
  },

  setDefaultTemplate: (docType, templateId) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.docType === docType
          ? { ...t, isDefault: t.id === templateId }
          : t,
      ),
    }))
  },

  duplicateTemplate: (templateId) => {
    const src = get().templates.find((t) => t.id === templateId)
    if (!src) return undefined
    const newId = `tpl-${src.docType.toLowerCase().replace(/\s/g, '')}-copy-${Date.now().toString(36)}`
    const copy: DocumentTemplate = {
      ...src,
      id: newId,
      name: `${src.name} (Copy)`,
      isDefault: false,
      active: true,
    }
    set((s) => ({ templates: [...s.templates, copy] }))
    return copy
  },

  toggleTemplateActive: (templateId) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId
          ? { ...t, active: !t.active, isDefault: t.isDefault && t.active ? false : t.isDefault }
          : t,
      ),
    }))
  },

  renameTemplate: (templateId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId ? { ...t, name: trimmed } : t,
      ),
    }))
  },

  updateDocStatus: (docId, status) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId ? { ...d, status } : d,
      ),
    }))
  },

  deleteDocument: (docId) => {
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== docId),
    }))
  },
}))
