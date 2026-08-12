'use client'

/**
 * exams-pdf — Official Excel-style PDF exports for the Examinations module.
 *
 * P0-6: Real PDF generation using jsPDF + jspdf-autotable.
 *
 * Supports:
 *   1. Class Grade Sheet (all students, all subjects)
 *   2. Individual Student Report Card
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { school } from '@/lib/mock/school'
import {
  type Exam,
  calculateResult,
  GRADE_BOUNDARIES,
  getGradeForPercentage,
} from '@/lib/mock/exams-data'
import { class2AAttendance } from '@/lib/mock/attendance'

function formatDate(d: string): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_COLORS: Record<string, [number, number, number]> = {
  pass: [16, 185, 129],     // emerald
  fail: [244, 63, 94],      // rose
  absent: [139, 92, 246],   // violet
}

/* ──────────────────────────────────────────────────────────
   P0-6: Class Grade Sheet PDF
   ────────────────────────────────────────────────────────── */
export function generateGradeSheetPDF(exam: Exam): { filename: string } {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const classConfig = exam.classConfigs[0]
  if (!classConfig) return { filename: 'error.pdf' }

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(school.name.toUpperCase(), pageWidth / 2, 14, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('GRADE SHEET', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`${exam.name.toUpperCase()} · ${classConfig.className}`, pageWidth / 2, 26, { align: 'center' })
  doc.text(`Academic Session ${exam.session}`, pageWidth / 2, 32, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(14, 36, pageWidth - 14, 36)

  // Metadata
  doc.setFontSize(8)
  doc.text(`Date: ${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`, 14, 42)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 60, 42)

  // Build student rows
  const subjectNames = classConfig.subjects.map((s) => s.name)
  const students = class2AAttendance

  const rows = students.map((student, idx) => {
    const result = calculateResult(exam, classConfig.classId, student.rollNo)
    const marks = classConfig.marks.map((sm) => {
      const mark = sm.marks.find((m) => m.studentId === student.rollNo)
      if (mark?.isAbsent) return 'AB'
      return mark?.marksObtained?.toString() || '—'
    })
    return [
      String(idx + 1),
      student.rollNo,
      student.name,
      ...marks,
      `${result?.totalObtained}/${result?.totalMax}`,
      `${result?.percentage}%`,
      result?.grade || '—',
      result?.passed ? 'PASS' : 'FAIL',
    ]
  })

  const head = [['#', 'Roll', 'Student Name', ...subjectNames, 'Total', '%', 'Grade', 'Result']]

  autoTable(doc, {
    startY: 48,
    head,
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontSize: 7, fontStyle: 'bold', lineColor: [180, 180, 180], lineWidth: 0.2 },
    bodyStyles: { fontSize: 7, lineColor: [200, 200, 200], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 'auto' },
      ...Object.fromEntries(
        subjectNames.map((_, i) => [i + 3, { cellWidth: 18, halign: 'center' }])
      ),
      [subjectNames.length + 3]: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      [subjectNames.length + 4]: { cellWidth: 16, halign: 'center' },
      [subjectNames.length + 5]: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      [subjectNames.length + 6]: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Color PASS/FAIL
      if (data.section === 'body' && data.column.index === subjectNames.length + 6) {
        const val = data.cell.raw as string
        if (val === 'PASS') {
          data.cell.styles.textColor = STATUS_COLORS.pass
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = STATUS_COLORS.fail
          data.cell.styles.fontStyle = 'bold'
        }
      }
      // Color AB marks
      if (data.section === 'body' && data.column.index >= 3 && data.column.index < 3 + subjectNames.length) {
        const val = data.cell.raw as string
        if (val === 'AB') {
          data.cell.styles.textColor = STATUS_COLORS.absent
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`${school.shortName} · Scholario-OS`, 14, doc.internal.pageSize.getHeight() - 6)
      doc.text(`Page ${data.pageNumber}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 6)
      doc.setTextColor(0)
    },
  })

  // Summary at the bottom
  // @ts-expect-error
  const finalY = doc.lastAutoTable.finalY + 6
  const allResults = students.map((s) => calculateResult(exam, classConfig.classId, s.rollNo)).filter(Boolean)
  const passed = allResults.filter((r) => r!.passed).length
  const passRate = allResults.length > 0 ? (passed / allResults.length) * 100 : 0

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY', 14, finalY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Total Students: ${allResults.length}`, 14, finalY + 5)
  doc.text(`Passed: ${passed}`, 60, finalY + 5)
  doc.text(`Failed: ${allResults.length - passed}`, 100, finalY + 5)
  doc.text(`Pass Rate: ${passRate.toFixed(1)}%`, 140, finalY + 5)

  // Signature area
  doc.setDrawColor(180)
  doc.line(14, finalY + 18, 60, finalY + 18)
  doc.line(80, finalY + 18, 126, finalY + 18)
  doc.setFontSize(7)
  doc.text('Class Teacher', 28, finalY + 23)
  doc.text('Principal', 95, finalY + 23)

  const filename = `SCHOLARIO_${exam.name.replace(/\s+/g, '_')}_GradeSheet_${classConfig.className.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(filename)
  return { filename }
}

/* ──────────────────────────────────────────────────────────
   P0-6: Individual Student Report Card PDF
   ────────────────────────────────────────────────────────── */
export function generateStudentReportCardPDF(exam: Exam, studentId: string): { filename: string } {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const classConfig = exam.classConfigs[0]
  if (!classConfig) return { filename: 'error.pdf' }

  const student = class2AAttendance.find((s) => s.rollNo === studentId)
  if (!student) return { filename: 'error.pdf' }

  const result = calculateResult(exam, classConfig.classId, studentId)
  if (!result) return { filename: 'error.pdf' }

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(school.name.toUpperCase(), pageWidth / 2, 16, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('STUDENT REPORT CARD', pageWidth / 2, 23, { align: 'center' })

  doc.setFontSize(9)
  doc.text(`${exam.name} · Academic Session ${exam.session}`, pageWidth / 2, 29, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(14, 33, pageWidth - 14, 33)

  // Student info
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Student Name:', 14, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(student.name, 50, 42)

  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 14, 48)
  doc.setFont('helvetica', 'bold')
  doc.text(student.rollNo, 50, 48)

  doc.setFont('helvetica', 'normal')
  doc.text('Class:', 14, 54)
  doc.setFont('helvetica', 'bold')
  doc.text(classConfig.className, 50, 54)

  doc.setFont('helvetica', 'normal')
  doc.text('Exam Date:', 120, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(exam.startDate), 150, 42)

  // Subject marks table
  const subjectRows = classConfig.subjects.map((sub, idx) => {
    const sm = classConfig.marks[idx]
    const mark = sm?.marks.find((m) => m.studentId === studentId)
    const marksObtained = mark?.isAbsent ? 'AB' : mark?.marksObtained?.toString() || '—'
    const subResult = mark?.isAbsent
      ? { grade: '—', passed: false }
      : mark?.marksObtained !== null && mark?.marksObtained !== undefined
        ? getGradeForPercentage((mark.marksObtained / sub.maxMarks) * 100)
        : { grade: '—', color: '' }
    return [sub.name, String(sub.maxMarks), marksObtained, subResult.grade]
  })

  autoTable(doc, {
    startY: 60,
    head: [['Subject', 'Max Marks', 'Marks Obtained', 'Grade']],
    body: subjectRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontSize: 8, fontStyle: 'bold', lineColor: [180, 180, 180], lineWidth: 0.2 },
    bodyStyles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw as string
        if (val === 'AB') {
          data.cell.styles.textColor = STATUS_COLORS.absent
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // @ts-expect-error
  const afterTableY = doc.lastAutoTable.finalY + 8

  // Summary
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RESULT SUMMARY', 14, afterTableY)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Marks:`, 14, afterTableY + 6)
  doc.setFont('helvetica', 'bold')
  doc.text(`${result.totalObtained} / ${result.totalMax}`, 50, afterTableY + 6)

  doc.setFont('helvetica', 'normal')
  doc.text(`Percentage:`, 14, afterTableY + 12)
  doc.setFont('helvetica', 'bold')
  doc.text(`${result.percentage}%`, 50, afterTableY + 12)

  doc.setFont('helvetica', 'normal')
  doc.text(`Grade:`, 14, afterTableY + 18)
  doc.setFont('helvetica', 'bold')
  doc.text(result.grade, 50, afterTableY + 18)

  doc.setFont('helvetica', 'normal')
  doc.text(`Result:`, 14, afterTableY + 24)
  doc.setFont('helvetica', 'bold')
  doc.text(result.passed ? 'PASS' : 'FAIL', 50, afterTableY + 24)
  if (result.passed) {
    doc.setTextColor(16, 185, 129)
  } else {
    doc.setTextColor(244, 63, 94)
  }

  // Signatures
  doc.setDrawColor(180)
  doc.setTextColor(0)
  doc.line(14, afterTableY + 40, 70, afterTableY + 40)
  doc.line(100, afterTableY + 40, 156, afterTableY + 40)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Class Teacher', 32, afterTableY + 45)
  doc.text('Principal', 120, afterTableY + 45)

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text(`${school.shortName} · Scholario-OS`, 14, doc.internal.pageSize.getHeight() - 8)
  doc.setTextColor(0)

  const filename = `SCHOLARIO_ReportCard_${student.name.replace(/\s+/g, '_')}_${exam.name.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
  return { filename }
}
