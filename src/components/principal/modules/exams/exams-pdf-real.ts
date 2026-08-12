'use client'

/**
 * exams-pdf — Official PDF exports for the Examinations module.
 * Uses REAL API data (ExamDTO, StudentResult, ExamAnalyticsDTO).
 * Generates A4 documents that look like official school printouts.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type ExamDTO, type StudentResult, type ExamAnalyticsDTO, getGradeForPercentage } from '@/lib/exams/types'

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SCHOOL_INFO = {
  name: 'Demo School of Scholario',
  address: '100 Knowledge Parkway, Sector 47, Gurugram',
  phone: '+91 124 4567 800',
  email: 'office@demoschool.edu',
  academicYear: '2025-2026',
}

interface PdfResult {
  filename: string
  blobUrl: string
}

function saveDoc(doc: jsPDF, filename: string): PdfResult {
  const blobUrl = doc.output('bloburl') as unknown as string
  // Also trigger a download
  doc.save(filename)
  return { filename, blobUrl }
}

// ─── 1. Class Grade Sheet PDF ─────────────────────────────────────────

export function generateClassGradeSheetPDF(
  exam: ExamDTO,
  className: string,
  results: StudentResult[],
  analytics: ExamAnalyticsDTO | null
): PdfResult {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ── School Header ──
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_INFO.name.toUpperCase(), pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${SCHOOL_INFO.address} · Phone: ${SCHOOL_INFO.phone}`, pageWidth / 2, 17, { align: 'center' })
  doc.text(`Email: ${SCHOOL_INFO.email} · Academic Year ${SCHOOL_INFO.academicYear}`, pageWidth / 2, 21, { align: 'center' })

  // ── Title ──
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.6)
  doc.line(10, 25, pageWidth - 10, 25)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`${exam.name.toUpperCase()} — GRADE SHEET`, pageWidth / 2, 31, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Class: ${className}   |   Type: ${exam.type}   |   Session: ${exam.session ?? ''}   |   Date: ${formatDate(exam.startDate)} — ${formatDate(exam.endDate)}`,
    pageWidth / 2, 36, { align: 'center' }
  )

  // ── Summary band ──
  if (analytics) {
    doc.setFillColor(245, 247, 250)
    doc.rect(10, 40, pageWidth - 20, 8, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Students: ${analytics.totalStudents}`, 12, 45)
    doc.text(`Passed: ${analytics.passed}`, 60, 45)
    doc.text(`Failed: ${analytics.failed}`, 90, 45)
    doc.text(`Pass %: ${analytics.passRate}%`, 120, 45)
    doc.text(`Class Average: ${analytics.averagePercentage}%`, 160, 45)
    doc.text(`Highest: ${analytics.highestPercentage}%`, 210, 45)
    doc.text(`Lowest: ${analytics.lowestPercentage}%`, 250, 45)
  }

  // ── Grade Sheet Table ──
  const subjectCols = results[0]?.subjects ?? []
  const head: any[] = [
    [
      { content: '#', styles: { halign: 'center', cellWidth: 8 } },
      { content: 'Roll No', styles: { halign: 'center', cellWidth: 14 } },
      { content: 'Student Name', styles: { cellWidth: 40 } },
      ...subjectCols.map((s) => ({ content: s.subjectName.slice(0, 8), styles: { halign: 'center' } })),
      { content: 'Total', styles: { halign: 'center' } },
      { content: '%', styles: { halign: 'center' } },
      { content: 'Grade', styles: { halign: 'center' } },
      { content: 'Rank', styles: { halign: 'center' } },
      { content: 'Result', styles: { halign: 'center' } },
    ],
  ]

  const body: any[] = results.map((r, i) => {
    const marks = subjectCols.map((subj) => {
      const sm = r.subjects.find((x) => x.subjectId === subj.subjectId)
      if (!sm) return '—'
      if (sm.isAbsent) return 'AB'
      return sm.marksObtained === null ? '—' : String(sm.marksObtained)
    })
    return [
      { content: String(i + 1), styles: { halign: 'center' } },
      { content: r.rollNo ?? '—', styles: { halign: 'center' } },
      { content: r.studentName, styles: { fontStyle: 'bold' } },
      ...marks.map((m: string) => ({ content: m, styles: { halign: 'center' } })),
      { content: `${r.totalObtained}/${r.totalMax}`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: `${r.percentage}%`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: r.grade, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: r.rank ? String(r.rank) : '—', styles: { halign: 'center' } },
      { content: r.passed ? 'PASS' : 'FAIL', styles: { halign: 'center', textColor: r.passed ? [16, 185, 129] : [244, 63, 94], fontStyle: 'bold' } },
    ]
  })

  autoTable(doc, {
    head,
    body,
    startY: 50,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      // Footer
      const footerY = pageHeight - 8
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text('Generated by SCHOLARIO-OS Examination Module', 10, footerY)
      doc.text(`Page ${data.pageNumber}`, pageWidth - 14, footerY, { align: 'right' })
      doc.text(`Print Date: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, footerY, { align: 'center' })
    },
  })

  // ── Signatures ──
  const finalY = (doc as any).lastAutoTable?.finalY || 60
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.3)
  doc.line(20, finalY + 20, 80, finalY + 20)
  doc.line(pageWidth / 2 - 30, finalY + 20, pageWidth / 2 + 30, finalY + 20)
  doc.line(pageWidth - 80, finalY + 20, pageWidth - 20, finalY + 20)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text('Class Teacher', 50, finalY + 24, { align: 'center' })
  doc.text('Exam Coordinator', pageWidth / 2, finalY + 24, { align: 'center' })
  doc.text('Principal', pageWidth - 50, finalY + 24, { align: 'center' })

  const filename = `${exam.name.replace(/[^a-zA-Z0-9]+/g, '_')}_GradeSheet_${className.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}

// ─── 2. Individual Student Report Card PDF ────────────────────────────

export function generateStudentReportCardPDF(
  exam: ExamDTO,
  className: string,
  student: { id: string; name: string; rollNo: string | null },
  result: StudentResult
): PdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ── Border ──
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.8)
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16)
  doc.setLineWidth(0.2)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // ── Header ──
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_INFO.name.toUpperCase(), pageWidth / 2, 22, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(SCHOOL_INFO.address, pageWidth / 2, 27, { align: 'center' })
  doc.text(`Phone: ${SCHOOL_INFO.phone} · Email: ${SCHOOL_INFO.email}`, pageWidth / 2, 31, { align: 'center' })

  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.4)
  doc.line(20, 34, pageWidth - 20, 34)

  // ── Title ──
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`${exam.name.toUpperCase()}`, pageWidth / 2, 41, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`PROGRESS REPORT · ACADEMIC SESSION ${exam.session ?? SCHOOL_INFO.academicYear}`, pageWidth / 2, 46, { align: 'center' })

  // ── Student info box ──
  doc.setFillColor(248, 250, 252)
  doc.rect(15, 51, pageWidth - 30, 22, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Name:', 18, 57)
  doc.text('Roll No:', 18, 62)
  doc.text('Class:', 18, 67)
  doc.setFont('helvetica', 'normal')
  doc.text(student.name, 50, 57)
  doc.text(student.rollNo ?? '—', 50, 62)
  doc.text(className, 50, 67)

  doc.setFont('helvetica', 'bold')
  doc.text('Exam Type:', pageWidth / 2 + 20, 57)
  doc.text('Date:', pageWidth / 2 + 20, 62)
  doc.text('Result:', pageWidth / 2 + 20, 67)
  doc.setFont('helvetica', 'normal')
  doc.text(exam.type, pageWidth / 2 + 50, 57)
  doc.text(`${formatDate(exam.startDate)} — ${formatDate(exam.endDate)}`, pageWidth / 2 + 50, 62)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(result.passed ? 16 : 244, result.passed ? 185 : 63, result.passed ? 129 : 94)
  doc.text(result.passed ? 'PASSED' : 'FAILED', pageWidth / 2 + 50, 67)
  doc.setTextColor(0, 0, 0)

  // ── Marks Table ──
  const head = [['Subject', 'Max Marks', 'Pass Marks', 'Marks Obtained', '%', 'Grade', 'Status']]
  const body: any[] = result.subjects.map((s) => {
    const gradeInfo = getGradeForPercentage(s.percentage)
    return [
      s.subjectName,
      String(s.maxMarks),
      String(s.passMarks),
      s.isAbsent ? 'ABSENT' : (s.marksObtained === null ? '—' : String(s.marksObtained)),
      s.isAbsent ? '—' : `${s.percentage}%`,
      s.isAbsent ? '—' : gradeInfo.grade,
      s.isAbsent ? 'Absent' : (s.passed ? 'Pass' : 'Fail'),
    ]
  })

  // Total row
  body.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [240, 245, 250] } },
    { content: String(result.totalMax), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 245, 250] } },
    { content: '', styles: { fillColor: [240, 245, 250] } },
    { content: String(result.totalObtained), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 245, 250] } },
    { content: `${result.percentage}%`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 245, 250] } },
    { content: result.grade, styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 245, 250] } },
    { content: result.passed ? 'PASS' : 'FAIL', styles: { fontStyle: 'bold', halign: 'center', textColor: result.passed ? [16, 185, 129] : [244, 63, 94], fillColor: [240, 245, 250] } },
  ])

  autoTable(doc, {
    head,
    body,
    startY: 78,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 251, 253] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
    },
  })

  // ── Rank + Summary ──
  const finalY = (doc as any).lastAutoTable?.finalY || 120
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Overall Percentage: ${result.percentage}%`, 15, finalY + 8)
  doc.text(`Grade: ${result.grade}`, 80, finalY + 8)
  doc.text(`Rank: ${result.rank ?? '—'}`, 130, finalY + 8)
  doc.text(`Subjects Passed: ${result.subjectsPassed}/${result.subjectsCount}`, 165, finalY + 8)

  // ── Remarks ──
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Class Teacher Remarks:', 15, finalY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text('__________________________________________________', 55, finalY + 18)

  doc.setFont('helvetica', 'bold')
  doc.text('Principal Remarks:', 15, finalY + 24)
  doc.setFont('helvetica', 'normal')
  doc.text('__________________________________________________', 55, finalY + 24)

  // ── Signatures ──
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.3)
  doc.line(20, finalY + 42, 90, finalY + 42)
  doc.line(pageWidth - 90, finalY + 42, pageWidth - 20, finalY + 42)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Class Teacher', 55, finalY + 46, { align: 'center' })
  doc.text('Principal', pageWidth - 55, finalY + 46, { align: 'center' })

  // ── Footer ──
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('This is a computer-generated report card from SCHOLARIO-OS.', pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 9, { align: 'center' })

  const filename = `${exam.name.replace(/[^a-zA-Z0-9]+/g, '_')}_ReportCard_${student.name.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}

// ─── 3. Admit Card PDF ─────────────────────────────────────────────────

export function generateAdmitCardPDF(
  exam: ExamDTO,
  className: string,
  student: { id: string; name: string; rollNo: string | null; admissionNo?: string | null },
  schedule: ExamDTO['schedule']
): PdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ── Outer border ──
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(1)
  doc.rect(15, 15, pageWidth - 30, 80)

  // ── School Header ──
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_INFO.name.toUpperCase(), pageWidth / 2, 25, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`${SCHOOL_INFO.address}`, pageWidth / 2, 30, { align: 'center' })
  doc.text(`Ph: ${SCHOOL_INFO.phone} · ${SCHOOL_INFO.email}`, pageWidth / 2, 34, { align: 'center' })

  // ── Title ──
  doc.setFillColor(15, 118, 110)
  doc.rect(15, 38, pageWidth - 30, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`EXAMINATION ADMIT CARD — ${exam.name.toUpperCase()}`, pageWidth / 2, 43.5, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ── Student info ──
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Name:', 20, 53)
  doc.text('Roll No:', 20, 60)
  doc.text('Class:', 20, 67)
  doc.text('Admission No:', 20, 74)
  doc.text('Session:', 20, 81)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(student.name, 60, 53)
  doc.text(student.rollNo ?? '—', 60, 60)
  doc.text(className, 60, 67)
  doc.text(student.admissionNo ?? '—', 60, 74)
  doc.text(exam.session ?? SCHOOL_INFO.academicYear, 60, 81)

  // Photo box (top-right)
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.3)
  doc.rect(pageWidth - 45, 50, 25, 32)
  doc.setFontSize(7)
  doc.text('Affix Photo', pageWidth - 32, 67, { align: 'center' })

  // ── Exam Schedule Table ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('EXAMINATION SCHEDULE', pageWidth / 2, 105, { align: 'center' })

  const head = [['Subject', 'Date', 'Time', 'Room', 'Invigilator']]
  const body = schedule.map((s) => [
    s.subjectName ?? '—',
    formatDate(s.date),
    `${s.startTime} — ${s.endTime}`,
    s.room ?? '—',
    s.invigilatorName ?? '—',
  ])

  autoTable(doc, {
    head,
    body,
    startY: 110,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 251, 253] },
  })

  // ── Instructions ──
  const finalY = (doc as any).lastAutoTable?.finalY || 150
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Instructions to Candidates:', 15, finalY + 8)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const instructions = [
    '1. Report to the examination hall 15 minutes before the scheduled start time.',
    '2. Carry this admit card at every examination session. Entry will not be permitted without it.',
    '3. Bring your own stationery. Borrowing during the examination is not allowed.',
    '4. Mobile phones, smart watches, and any electronic devices are strictly prohibited.',
    '5. Students must occupy their assigned seats only.',
    '6. Any form of unfair means will lead to disqualification from the examination.',
  ]
  instructions.forEach((line, i) => {
    doc.text(line, 15, finalY + 14 + i * 4)
  })

  // ── Signatures ──
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.3)
  doc.line(20, pageHeight - 30, 80, pageHeight - 30)
  doc.line(pageWidth - 80, pageHeight - 30, pageWidth - 20, pageHeight - 30)
  doc.setFontSize(8)
  doc.text('Exam Coordinator', 50, pageHeight - 26, { align: 'center' })
  doc.text('Principal', pageWidth - 50, pageHeight - 26, { align: 'center' })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')} by SCHOLARIO-OS`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  const filename = `${exam.name.replace(/[^a-zA-Z0-9]+/g, '_')}_AdmitCard_${student.name.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}
