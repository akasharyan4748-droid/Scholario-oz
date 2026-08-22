'use client'

/**
 * generate-tab — the document generation workflow.
 *
 * Steps:
 *   1. Pick a document type (icon grid — single emerald accent).
 *   2. For Marksheets: pick exam → class → student.
 *      For Fee Receipts: pick student → pick fee transaction.
 *      For everything else: pick student.
 *   3. Pick a template (filtered by doc type; default preselected).
 *   4. Live preview pane shows the actual document with real data.
 *   5. Generate → store.generateDocument + toast.
 */

import { useMemo, useState, useEffect } from 'react'
import {
  Search, Sparkles, Check, RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { school } from '@/lib/mock/school'
import { formatDate, formatINR } from '@/lib/format'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import type { FeeTransaction } from '@/lib/store/fee-store'
import { useMockExamsStore } from '@/lib/exams/mock-exams-data'
import { useMockMarksStore } from '@/lib/exams/mock-marks-data'
import {
  useCertificatesStore,
  type DocType, type DocumentTemplate,
} from '@/lib/store/certificates-store'
import {
  DOC_TYPES, DOC_TYPE_BY_LABEL, CertPanel,
} from './cert-shared'
import {
  DocumentCard, DocumentThumbnail, getDocTypeMeta,
} from '@/components/shared/document-primitives'
import {
  CertificatePreview, MarksheetPreview, IDCardPreview, FeeReceiptPreview,
  type MarksheetData, type MarksheetRow,
} from './previews'

export function GenerateTab() {
  const [docType, setDocType] = useState<DocType | null>(null)
  const [studentId, setStudentId] = useState<string>('')
  const [examId, setExamId] = useState<string>('')
  const [classId, setClassId] = useState<string>('')
  const [txnId, setTxnId] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [purpose, setPurpose] = useState<string>('')
  const [genSearch, setGenSearch] = useState<string>('')

  const students = useStudentsStore((s) => s.students)
  const exams = useMockExamsStore((s) => s.exams)
  const transactions = useFeeStore((s) => s.transactions)
  const templates = useCertificatesStore((s) => s.templates)
  const generateDocument = useCertificatesStore((s) => s.generateDocument)

  // ─── Derived data ──────────────────────────────────────────────────
  const meta = docType ? DOC_TYPE_BY_LABEL[docType] : null

  const filteredStudents = useMemo(() => {
    if (!genSearch.trim()) return students.slice(0, 40)
    const q = genSearch.toLowerCase().trim()
    return students
      .filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q),
      )
      .slice(0, 40)
  }, [students, genSearch])

  // For marksheet — only show students in the selected class
  const exam = exams.find((e) => e.id === examId)
  const examClasses = exam?.classes ?? []
  const examSubjects = exam ? exam.subjects.filter((s) => s.classId === classId) : []
  const marks = useMockMarksStore((s) => s.marks)
  const initMarks = useMockMarksStore((s) => s.initMarks)

  // Auto-init marks for the selected exam when a class is picked (so the
  // marksheet preview has data even before the user opens the exam in the
  // Examinations module).
  useEffect(() => {
    if (!exam || !classId) return
    const hasMarks = marks.some((m) => m.examId === exam.id && m.classId === classId)
    if (hasMarks) return
    const classStudents = students
      .filter((s) => s.classId === classId)
      .map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo, classId: s.classId, className: s.className }))
    if (classStudents.length > 0) {
      initMarks(exam, classStudents)
    }
  }, [exam, classId, students, marks, initMarks])

  // Filter students by class for marksheet selection
  const classStudents = useMemo(() => {
    if (docType !== 'Marksheet') return students
    return students.filter((s) => s.classId === classId)
  }, [students, classId, docType])

  // ─── Template list for the active doc type ────────────────────────
  const docTemplates = useMemo(
    () => (docType ? templates.filter((t) => t.docType === docType) : []),
    [templates, docType],
  )

  // Pick a default template when doc type changes
  useEffect(() => {
    if (!docType) return
    const def = docTemplates.find((t) => t.isDefault) ?? docTemplates[0]
    setTemplateId(def?.id ?? '')
  }, [docType, docTemplates])

  // ─── Reset sub-state when doc type changes ────────────────────────
  useEffect(() => {
    setStudentId('')
    setExamId('')
    setClassId('')
    setTxnId('')
    setPurpose('')
    setGenSearch('')
  }, [docType])

  // ─── Selected student + transaction + marksheet data ──────────────
  const selectedStudent = students.find((s) => s.id === studentId) as StudentRecord | undefined
  const selectedTxn = transactions.find((t) => t.id === txnId) as FeeTransaction | undefined
  const selectedTemplate = templates.find((t) => t.id === templateId) as DocumentTemplate | undefined

  // Compute marksheet data on-the-fly (cheap — at most ~10 subjects).
  const marksheetData: MarksheetData | undefined =
    docType === 'Marksheet' && selectedStudent && exam && classId
      ? computeMarksheet(exam, classId, selectedStudent, marks, examSubjects)
      : undefined

  // ─── Can generate? ────────────────────────────────────────────────
  const canGenerate = (() => {
    if (!docType || !templateId) return false
    if (!selectedStudent) return false
    if (docType === 'Marksheet' && (!examId || !classId || !marksheetData)) return false
    if (docType === 'Fee Receipt' && !selectedTxn) return false
    return true
  })()

  // ─── Generate ─────────────────────────────────────────────────────
  function handleGenerate() {
    if (!docType || !selectedStudent || !selectedTemplate) return
    let data: Record<string, any> = {}
    let classInfo = selectedStudent.className
    if (docType === 'Marksheet' && marksheetData && exam) {
      data = { examId: exam.id, examName: exam.name, classId, marksheet: marksheetData }
      classInfo = `${exam.name} · ${selectedStudent.className}`
    } else if (docType === 'Fee Receipt' && selectedTxn) {
      data = {
        transactionId: selectedTxn.id,
        receiptNo: selectedTxn.receiptNo,
        amount: selectedTxn.amount,
        mode: selectedTxn.mode,
        purpose: selectedTxn.purpose,
      }
      classInfo = selectedTxn.className
    } else {
      data = { purpose: purpose || '—' }
    }
    const doc = generateDocument({
      docType,
      templateId,
      student: {
        id: selectedStudent.id,
        name: selectedStudent.name,
        admissionNo: selectedStudent.admissionNo,
        class: classInfo,
      },
      generatedBy: school.principal,
      data,
    })
    toast.success(`${docType} generated`, {
      description: `${doc.docNumber} · ${selectedStudent.name}`,
    })
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT — workflow */}
      <div className="lg:col-span-5 space-y-4">
        {/* Step 1 — Doc type grid */}
        <CertPanel
          title="1. Document type"
          action={
            docType && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setDocType(null)}
              >
                Change
              </button>
            )
          }
        >
          {!docType ? (
            // Selection grid — larger DocumentCards (2-col), single emerald accent.
            // Icon differentiates the type via the doc-type meta; the color stays
            // consistent. Strong selected state: border-2 + ring-2 + check badge.
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOC_TYPES.map((d) => {
                const meta = getDocTypeMeta(d.label)
                return (
                  <DocumentCard
                    key={d.label}
                    docType={d.label}
                    name={d.short}
                    description={d.description}
                    category={meta?.category}
                    selected={false}
                    onClick={() => setDocType(d.label)}
                  />
                )
              })}
            </div>
          ) : (
            <SelectedDocChip docType={docType} />
          )}
        </CertPanel>

        {docType && (
          <>
            {/* Step 2 — Source data */}
            <CertPanel
              title="2. Source data"
              subtitle={
                meta?.needsExam
                  ? 'Examination → Class → Student'
                  : meta?.needsFeeTxn
                    ? 'Student → Fee transaction'
                    : 'Select student'
              }
            >
              {meta?.needsExam ? (
                <div className="space-y-3">
                  <FieldLabel label="Examination" />
                  <Select value={examId} onValueChange={setExamId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose examination" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} · {e.session} · {e.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldLabel label="Class" />
                  <Select value={classId} onValueChange={setClassId} disabled={!examId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={examId ? 'Choose class' : 'Pick examination first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {examClasses.map((c) => (
                        <SelectItem key={c.classId} value={c.classId}>
                          {c.className}{c.stream ? ` · ${c.stream}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldLabel label="Student" />
                  <StudentPicker
                    students={classStudents}
                    value={studentId}
                    onChange={setStudentId}
                    search={genSearch}
                    onSearch={setGenSearch}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <FieldLabel label="Student" />
                  <StudentPicker
                    students={filteredStudents}
                    value={studentId}
                    onChange={setStudentId}
                    search={genSearch}
                    onSearch={setGenSearch}
                  />

                  {meta?.needsFeeTxn && selectedStudent && (
                    <>
                      <FieldLabel label="Fee transaction" />
                      <Select
                        value={txnId}
                        onValueChange={setTxnId}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Choose fee payment" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactions
                            .filter((t) => t.studentId === selectedStudent.id)
                            .slice(0, 25)
                            .map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.receiptNo} · {formatDate(t.date)} · {formatINR(t.amount)} · {t.mode}
                              </SelectItem>
                            ))}
                          {transactions.filter((t) => t.studentId === selectedStudent.id).length === 0 && (
                            <SelectItem value="__none" disabled>No transactions found for this student</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {docType === 'Bonafide' && selectedStudent && (
                    <>
                      <FieldLabel label="Purpose (optional)" />
                      <Input
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Bank account opening, passport, scholarship"
                        className="h-9 text-xs"
                      />
                    </>
                  )}
                </div>
              )}
            </CertPanel>
          </>
        )}

        {docType && docTemplates.length > 0 && (
          <CertPanel
            title="3. Template"
            action={selectedTemplate && (
              <span className="text-[10px] text-muted-foreground">
                Style: <strong className="text-foreground">{selectedTemplate.style}</strong>
              </span>
            )}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {docTemplates.map((t) => {
                const active = t.id === templateId
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      'relative flex flex-col items-start gap-1.5 rounded-lg border p-2 text-left transition-all hover:-translate-y-0.5',
                      active
                        ? 'border-foreground bg-muted/40 shadow-sm ring-1 ring-foreground/30'
                        : 'border-border hover:border-foreground/40',
                    )}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span
                        className="h-4 w-4 rounded shrink-0"
                        style={{ background: t.accentColor }}
                      />
                      <span className="text-[10px] font-semibold leading-tight truncate">{t.style}</span>
                      {t.isDefault && (
                        <span className="ml-auto text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">{t.name}</p>
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </CertPanel>
        )}

        {docType && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="flex-1 h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate {docType}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canGenerate}
              onClick={() => window.print()}
              className="h-9 text-xs gap-1 no-print"
            >
              <RotateCw className="h-3.5 w-3.5" /> Print preview
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT — preview */}
      <div className="lg:col-span-7">
        <CertPanel
          title="Live preview"
          subtitle={docType ? docType : 'Pick a document type'}
          className="h-full"
          bodyClassName="p-2 sm:p-4 bg-slate-50"
        >
          <PreviewArea
            docType={docType}
            student={selectedStudent}
            template={selectedTemplate}
            txn={selectedTxn}
            marksheetData={marksheetData}
            purpose={purpose}
          />
        </CertPanel>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
}

// SelectedDocChip — substantial selected-state indicator. Uses the shared
// DocumentThumbnail (paper silhouette + emerald edge stripe + doc-type glyph)
// so the user sees a real document thumbnail of what they picked, not a tiny
// utility chip. The "Change" affordance lives in the parent CertPanel header.
function SelectedDocChip({ docType }: { docType: DocType }) {
  const d = DOC_TYPE_BY_LABEL[docType]
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/[0.06] ring-2 ring-emerald-500/20 px-3 py-2.5">
      <DocumentThumbnail docType={docType} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight truncate">{d.short}</p>
        <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{d.description}</p>
      </div>
    </div>
  )
}

function StudentPicker({
  students, value, onChange, search, onSearch,
}: {
  students: StudentRecord[]
  value: string
  onChange: (id: string) => void
  search: string
  onSearch: (q: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, admission no, class…"
          className="h-9 pl-8 text-xs"
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border/50">
        {students.length === 0 && (
          <p className="text-[11px] text-muted-foreground p-3 text-center">No students found.</p>
        )}
        {students.map((s) => {
          const active = s.id === value
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors',
                active ? 'bg-primary/10' : 'hover:bg-muted/40',
              )}
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-semibold text-white')}>
                {s.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold truncate">{s.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {s.admissionNo} · {s.className}{s.section ? ` · Sec ${s.section}` : ''}
                </p>
              </div>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewArea({
  docType, student, template, txn, marksheetData, purpose,
}: {
  docType: DocType | null
  student?: StudentRecord
  template?: DocumentTemplate
  txn?: FeeTransaction
  marksheetData?: MarksheetData
  purpose?: string
}) {
  if (!docType || !template) {
    // Refined document placeholder — a large DocumentThumbnail (paper
    // silhouette with emerald edge stripe) on a soft muted canvas. Feels
    // like a document canvas waiting for input, not a flat empty state.
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" aria-hidden />
          <DocumentThumbnail size="xl" tone="emerald" className="relative" />
        </div>
        <p className="mt-5 text-sm font-semibold text-foreground">Select a document type</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-[280px] leading-relaxed">
          The live preview will appear here with real student data, formatted like an actual document.
        </p>
      </div>
    )
  }
  // Certificates
  if (docType === 'Bonafide' || docType === 'Transfer' || docType === 'Character' || docType === 'Migration') {
    return (
      <CertificatePreview
        docType={docType}
        template={template}
        student={student}
        purpose={purpose}
      />
    )
  }
  if (docType === 'Marksheet') {
    return (
      <MarksheetPreview
        template={template}
        student={student}
        data={marksheetData}
      />
    )
  }
  if (docType === 'ID Card') {
    return <IDCardPreview template={template} student={student} />
  }
  if (docType === 'Fee Receipt') {
    return <FeeReceiptPreview template={template} transaction={txn} />
  }
  return null
}

// ─── Marksheet computation ──────────────────────────────────────────

import type { ExamDTO, ExamSubjectConfigDTO, ExamMarkDTO } from '@/lib/exams/types'

function computeMarksheet(
  exam: ExamDTO,
  classId: string,
  student: StudentRecord,
  marks: ExamMarkDTO[],
  examSubjects: ExamSubjectConfigDTO[],
): MarksheetData {
  // Try real exam marks first
  if (examSubjects.length > 0) {
    const rows = examSubjects.map((subj) => {
      const mark = marks.find(
        (m) =>
          m.examId === exam.id &&
          m.classId === classId &&
          m.subjectId === subj.subjectId &&
          m.studentId === student.id,
      )
      const obtained = mark?.marksObtained ?? 0
      return {
        subject: subj.subjectName,
        max: subj.maxMarks,
        pass: subj.passMarks,
        obtained,
        isAbsent: mark?.status === 'ABSENT',
      }
    })
    const totalMax = rows.reduce((s, r) => s + r.max, 0)
    const totalObtained = rows.reduce((s, r) => s + (r.isAbsent ? 0 : r.obtained), 0)
    const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    const passed = rows.every((r) => r.isAbsent || r.obtained >= r.pass)
    return {
      examName: exam.name,
      className: student.className,
      section: student.section,
      session: exam.session ?? school.academicYear,
      rows,
      totalMax,
      totalObtained,
      percentage: pct,
      grade: gradeFor(pct),
      result: passed ? 'PASS' : 'FAIL',
      remarks: passed ? 'Conduct: Excellent. Regularity: Satisfactory.' : 'Re-examination recommended.',
    }
  }
  // Fallback — derive from student.academics.subjects (max 100)
  const rows: MarksheetRow[] = student.academics.subjects.map((subj) => ({
    subject: subj.name,
    max: 100,
    pass: 33,
    obtained: Math.round((subj.percent / 100) * 100),
  }))
  const totalMax = rows.length * 100
  const totalObtained = rows.reduce((s, r) => s + r.obtained, 0)
  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  return {
    examName: 'Academic Performance Report',
    className: student.className,
    section: student.section,
    session: school.academicYear,
    rows,
    totalMax,
    totalObtained,
    percentage: pct,
    grade: gradeFor(pct),
    result: pct >= 33 ? 'PASS' : 'FAIL',
    remarks: 'Based on cumulative academic record.',
  }
}

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A1'
  if (pct >= 80) return 'A2'
  if (pct >= 70) return 'B1'
  if (pct >= 60) return 'B2'
  if (pct >= 50) return 'C1'
  if (pct >= 33) return 'C2'
  return 'E'
}
