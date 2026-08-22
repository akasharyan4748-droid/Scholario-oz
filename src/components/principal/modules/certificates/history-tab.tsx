'use client'

/**
 * history-tab — searchable document history with actions.
 *
 * Search by student name, admission no, or doc number. Filter by doc type
 * and status. Each row: primary Download action + "More" dropdown for the
 * remaining actions (Preview, Print, Regenerate, Mark issued, Delete).
 *
 * Design language: single emerald accent on doc-type icon (size h-7,
 * tinted chip). Doc-type pill is a neutral muted pill (color no longer
 * differentiates types — the label does).
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Printer, Download, RotateCw, X, Filter,
  MoreVertical, Trash2, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import {
  useCertificatesStore,
  type DocType, type DocStatus, type GeneratedDocument, type DocumentTemplate,
} from '@/lib/store/certificates-store'
import {
  DOC_TYPES, DOC_TYPE_BY_LABEL, CertPanel, DocStatusBadge, CertEmptyState,
} from './cert-shared'
import {
  CertificatePreview, MarksheetPreview, IDCardPreview, FeeReceiptPreview,
  type MarksheetData,
} from './previews'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import type { FeeTransaction } from '@/lib/store/fee-store'

export function HistoryTab() {
  const [search, setSearch] = useState('')
  const [docType, setDocType] = useState<DocType | 'all'>('all')
  const [status, setStatus] = useState<DocStatus | 'all'>('all')
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null)

  const documents = useCertificatesStore((s) => s.documents)
  const getDocumentHistory = useCertificatesStore((s) => s.getDocumentHistory)
  const updateDocStatus = useCertificatesStore((s) => s.updateDocStatus)
  const deleteDocument = useCertificatesStore((s) => s.deleteDocument)
  const generateDocument = useCertificatesStore((s) => s.generateDocument)
  const templates = useCertificatesStore((s) => s.templates)
  const students = useStudentsStore((s) => s.students)
  const transactions = useFeeStore((s) => s.transactions)

  const filtered = useMemo(
    () => getDocumentHistory({ search, docType, status }),
    [getDocumentHistory, search, docType, status],
  )

  // Stats line — single home for these counts (not duplicated elsewhere).
  const issuedCount = filtered.filter((d) => d.status === 'Issued').length
  const printedCount = filtered.filter((d) => d.status === 'Printed').length
  const downloadedCount = filtered.filter((d) => d.status === 'Downloaded').length

  function handlePrint(doc: GeneratedDocument) {
    setPreviewDoc(doc)
    // Defer to allow modal to render before print
    setTimeout(() => window.print(), 250)
  }
  function handleDownload(doc: GeneratedDocument) {
    updateDocStatus(doc.id, 'Downloaded')
    const blob = new Blob([buildDownloadHTML(doc)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.docNumber.replace(/[\/\\]/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Document downloaded', { description: `${doc.docNumber}.html` })
  }
  function handleRegenerate(doc: GeneratedDocument) {
    const tpl = templates.find((t) => t.id === doc.templateId)
    const student = students.find((s) => s.id === doc.studentId)
    if (tpl && student) {
      const newDoc = generateDocument({
        docType: doc.docType,
        templateId: tpl.id,
        student: {
          id: student.id,
          name: student.name,
          admissionNo: student.admissionNo,
          class: student.className,
        },
        data: doc.data,
      })
      toast.success('Regenerated', { description: newDoc.docNumber })
    } else {
      // Regenerate without a student (e.g. seed doc) — use the stored snapshot
      const newDoc = generateDocument({
        docType: doc.docType,
        templateId: doc.templateId,
        studentName: doc.studentName,
        admissionNo: doc.admissionNo,
        class: doc.class,
        data: doc.data,
      })
      toast.success('Regenerated', { description: newDoc.docNumber })
    }
  }
  function handleMarkIssued(doc: GeneratedDocument) {
    updateDocStatus(doc.id, 'Issued')
    toast.success('Marked as issued', { description: doc.docNumber })
  }
  function handleDelete(doc: GeneratedDocument) {
    deleteDocument(doc.id)
    toast.success('Deleted', { description: doc.docNumber })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <CertPanel bodyClassName="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, admission no, doc number…"
              className="h-9 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Filter className="h-3 w-3" />
          </div>
          <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
            <SelectTrigger className="h-9 text-xs w-[150px]">
              <SelectValue placeholder="Doc type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DOC_TYPES.map((d) => (
                <SelectItem key={d.label} value={d.label}>{d.short}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Generated">Generated</SelectItem>
              <SelectItem value="Printed">Printed</SelectItem>
              <SelectItem value="Downloaded">Downloaded</SelectItem>
              <SelectItem value="Issued">Issued</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline" size="sm"
            className="h-9 text-xs gap-1"
            onClick={() => { setSearch(''); setDocType('all'); setStatus('all') }}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </CertPanel>

      {/* Stats line — single home for these counts (Academics pattern:
          muted text · separators, status-coloured numbers as small accents). */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
        <span>Showing <strong className="text-foreground tabular-nums">{filtered.length}</strong> of <strong className="text-foreground tabular-nums">{documents.length}</strong> documents</span>
        <span className="text-muted-foreground/40">·</span>
        <span>Issued: <strong className="text-emerald-600 tabular-nums">{issuedCount}</strong></span>
        <span className="text-muted-foreground/40">·</span>
        <span>Printed: <strong className="text-amber-600 tabular-nums">{printedCount}</strong></span>
        <span className="text-muted-foreground/40">·</span>
        <span>Downloaded: <strong className="text-cyan-600 tabular-nums">{downloadedCount}</strong></span>
      </div>

      {/* Table */}
      <CertPanel bodyClassName="p-0">
        {filtered.length === 0 ? (
          <CertEmptyState
            icon={<Search className="h-5 w-5" />}
            title="No documents match the filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-semibold px-3 py-2">Student</th>
                  <th className="text-left font-semibold px-3 py-2">Type</th>
                  <th className="text-left font-semibold px-3 py-2">Doc No</th>
                  <th className="text-left font-semibold px-3 py-2 hidden md:table-cell">Template</th>
                  <th className="text-left font-semibold px-3 py-2 hidden sm:table-cell">Date</th>
                  <th className="text-left font-semibold px-3 py-2">Status</th>
                  <th className="text-right font-semibold px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const d = DOC_TYPE_BY_LABEL[doc.docType]
                  const Icon = d.icon
                  return (
                    <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {/* Small neutral icon chip — single emerald accent (consistent with doc-type grid) */}
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{doc.studentName || '—'}</p>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {doc.admissionNo ?? '—'} · {doc.class ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {/* Neutral muted pill — color no longer differentiates types; the label does. */}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-muted text-muted-foreground">
                          {doc.docType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-foreground">{doc.docNumber}</td>
                      <td className="px-3 py-2 hidden md:table-cell text-[10px] text-muted-foreground">{doc.templateName}</td>
                      <td className="px-3 py-2 hidden sm:table-cell text-[10px] text-muted-foreground">
                        {formatDate(doc.generatedAt)}
                      </td>
                      <td className="px-3 py-2"><DocStatusBadge status={doc.status} /></td>
                      <td className="px-3 py-2">
                        {/* Primary Download action + More dropdown for the rest */}
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-[10px] gap-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => handleDownload(doc)}
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="More actions"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                                <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrint(doc)}>
                                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRegenerate(doc)}>
                                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                              </DropdownMenuItem>
                              {doc.status !== 'Issued' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleMarkIssued(doc)}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark issued
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10"
                                onClick={() => handleDelete(doc)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CertPanel>

      {/* Preview modal */}
      <AnimatePresence>
        {previewDoc && (
          <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Preview modal ───────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: GeneratedDocument; onClose: () => void }) {
  const templates = useCertificatesStore((s) => s.templates)
  const students = useStudentsStore((s) => s.students)
  const transactions = useFeeStore((s) => s.transactions)
  const template = templates.find((t) => t.id === doc.templateId) as DocumentTemplate | undefined
  const student = students.find((s) => s.id === doc.studentId) as StudentRecord | undefined
  const txn = transactions.find((t) => t.id === doc.data?.transactionId) as FeeTransaction | undefined

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-card rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 no-print">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{doc.docNumber} · {doc.docType}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {doc.studentName} · {doc.templateName} · {formatDate(doc.generatedAt)}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
          {template && <ModalPreview doc={doc} template={template} student={student} txn={txn} />}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ModalPreview({
  doc, template, student, txn,
}: {
  doc: GeneratedDocument
  template: DocumentTemplate
  student?: StudentRecord
  txn?: FeeTransaction
}) {
  const dt = doc.docType
  if (dt === 'Bonafide' || dt === 'Transfer' || dt === 'Character' || dt === 'Migration') {
    return (
      <CertificatePreview
        docType={dt}
        template={template}
        student={student}
        docNumber={doc.docNumber}
        purpose={doc.data?.purpose}
      />
    )
  }
  if (dt === 'Marksheet') {
    return (
      <MarksheetPreview
        template={template}
        student={student}
        data={doc.data?.marksheet as MarksheetData | undefined}
        docNumber={doc.docNumber}
      />
    )
  }
  if (dt === 'ID Card') {
    return <IDCardPreview template={template} student={student} />
  }
  if (dt === 'Fee Receipt') {
    return <FeeReceiptPreview template={template} transaction={txn} docNumber={doc.docNumber} />
  }
  return null
}

// ─── Download HTML builder ───────────────────────────────────────────

function buildDownloadHTML(doc: GeneratedDocument): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${doc.docNumber} — ${doc.docType}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 24px; color: #0f172a; }
  h1 { color: #0d9488; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  td, th { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
  th { background: #f1f5f9; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; }
  .doc-number { font-family: monospace; font-weight: 700; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h2>${doc.docType}</h2>
      <p>${doc.studentName} · ${doc.admissionNo ?? ''} · ${doc.class ?? ''}</p>
    </div>
    <div>
      <p class="doc-number">${doc.docNumber}</p>
      <p>${formatDate(doc.generatedAt)}</p>
    </div>
  </div>
  <h3>Template</h3>
  <p>${doc.templateName}</p>
  <h3>Document Data</h3>
  <table>
    ${Object.entries(doc.data ?? {}).map(([k, v]) => `<tr><th>${k}</th><td>${typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</td></tr>`).join('\n')}
  </table>
  <p style="font-size: 11px; color: #64748b; margin-top: 24px;">
    Generated by ${doc.generatedBy} on ${formatDate(doc.generatedAt)}. Status: ${doc.status}.
  </p>
</body>
</html>`
}
