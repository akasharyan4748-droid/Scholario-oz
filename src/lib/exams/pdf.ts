'use client'

/**
 * exams-pdf — Official PDF exports for the Examinations module.
 * Single merged file (was exams-pdf-real.ts + exams-pdf-extended.ts).
 * School info is passed in via SchoolContextDTO — no hardcoding.
 * AdmitCardConfig + ReportCardConfig toggles are honored by the generators.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  type ExamDTO,
  type StudentResult,
  type ExamAnalyticsDTO,
  type SeatAssignmentDTO,
  type AdmitCardStudent,
  type SchoolContextDTO,
  type AdmitCardConfigDTO,
  type ReportCardConfigDTO,
  getGradeForPercentage,
} from './types'

// ─── Shared helpers ──────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PdfResult {
  filename: string
  blobUrl: string
}

function saveDoc(doc: jsPDF, filename: string): PdfResult {
  const blobUrl = doc.output('bloburl') as unknown as string
  doc.save(filename)
  return { filename, blobUrl }
}

function drawSchoolHeader(doc: jsPDF, school: SchoolContextDTO, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  // Optional logo (drawn as a placeholder square if logoUrl is set)
  if (school.logoUrl) {
    try {
      doc.addImage(school.logoUrl, 'PNG', 14, 10, 16, 16)
    } catch {
      // Ignore — image may be on a different origin
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(school.schoolName, pageWidth / 2, 18, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const addr = [school.address, school.city].filter(Boolean).join(', ')
  if (addr) doc.text(addr, pageWidth / 2, 25, { align: 'center' })
  const contact = [school.phone, school.email].filter(Boolean).join('  |  ')
  if (contact) doc.text(contact, pageWidth / 2, 30, { align: 'center' })
  if (subtitle) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(subtitle, pageWidth / 2, 40, { align: 'center' })
  }
  // Horizontal rule
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.8)
  doc.line(14, 44, pageWidth - 14, 44)
}

// ─── 1. Class Grade Sheet (all students × all subjects) ──────────────

export function generateClassGradeSheetPDF(
  exam: ExamDTO,
  className: string,
  results: StudentResult[],
  analytics: ExamAnalyticsDTO,
  school: SchoolContextDTO,
): PdfResult {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  drawSchoolHeader(doc, school, `${exam.name} — Class ${className} Grade Sheet`)

  const head: string[][] = [['Roll', 'Name', ...results[0]?.subjects.map((s) => s.subjectName) ?? [], 'Total', '%', 'Grade', 'Rank']]
  const body: string[][] = results.map((r) => [
    r.rollNo ?? '—',
    r.studentName,
    ...(r.subjects.map((s) => (s.isAbsent ? 'AB' : s.marksObtained !== null ? String(s.marksObtained) : '—'))),
    `${r.totalObtained}/${r.totalMax}`,
    `${r.percentage.toFixed(1)}%`,
    r.grade,
    r.rank ? String(r.rank) : '—',
  ])

  autoTable(doc, {
    head,
    body,
    startY: 50,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 249] },
    margin: { left: 14, right: 14 },
  })

  // Summary
  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Summary — Pass ${analytics.passRate}% • Avg ${analytics.averagePercentage}% • Highest ${analytics.highestPercentage}% • Lowest ${analytics.lowestPercentage}%`, 14, endY)

  const filename = `${exam.name.replace(/\s+/g, '_')}_GradeSheet_${className}.pdf`
  return saveDoc(doc, filename)
}

// ─── 2. Single Student Report Card ──────────────────────────────────

export function generateStudentReportCardPDF(
  exam: ExamDTO,
  result: StudentResult,
  school: SchoolContextDTO,
  config: ReportCardConfigDTO,
): PdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  drawSchoolHeader(doc, school, `${exam.name} — Report Card`)

  // Student info box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(result.studentName, 14, 56)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Roll No: ${result.rollNo ?? '—'}`, 14, 62)
  doc.text(`Class: ${result.className}`, 14, 67)
  if (school.academicYear) doc.text(`Academic Year: ${school.academicYear}`, 14, 72)
  if (exam.session) doc.text(`Session: ${exam.session}`, 120, 62)

  // Subject marks table
  const head = [['Subject', 'Max', 'Obtained', '%', 'Grade', 'Status']]
  const body = result.subjects.map((s) => [
    s.subjectName,
    String(s.maxMarks),
    s.isAbsent ? 'AB' : s.marksObtained !== null ? String(s.marksObtained) : '—',
    s.isAbsent ? '—' : `${s.percentage.toFixed(1)}%`,
    s.isAbsent ? '—' : s.passed ? 'PASS' : 'FAIL',
    s.isAbsent ? 'ABSENT' : '',
  ])
  if (config.showPercentage !== false) {
    // Append totals row
    body.push([
      'TOTAL',
      String(result.totalMax),
      String(result.totalObtained),
      `${result.percentage.toFixed(1)}%`,
      result.grade,
      result.passed ? 'PASS' : 'FAIL',
    ])
  }

  autoTable(doc, {
    head,
    body,
    startY: 78,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: { 5: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Conditional blocks per ReportCardConfig
  if (config.showRank !== false && result.rank) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Class Rank: ${result.rank}`, 14, y)
    y += 8
  }
  if (config.showPercentage !== false) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`Overall: ${result.percentage.toFixed(2)}%  •  Grade: ${result.grade}`, 14, y)
    y += 10
  }
  if (config.showRemarks) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Remarks:', 14, y)
    doc.rect(14, y + 2, 180, 18)
    y += 26
  }
  if (config.showClassTeacherSign) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Class Teacher Signature', 14, y + 12)
    doc.line(14, y + 14, 80, y + 14)
  }
  if (config.showPrincipalSign) {
    doc.text('Principal Signature', 120, y + 12)
    doc.line(120, y + 14, 180, y + 14)
  }

  const filename = `${exam.name.replace(/\s+/g, '_')}_ReportCard_${result.studentName.replace(/\s+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}

// ─── 3. Admit Card (batch — all students of a class) ─────────────────

export function generateBatchAdmitCardPDF(
  exam: ExamDTO,
  className: string,
  students: AdmitCardStudent[],
  school: SchoolContextDTO,
  config: AdmitCardConfigDTO,
): PdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  students.forEach((s, idx) => {
    if (idx > 0) doc.addPage()
    drawSchoolHeader(doc, school, `${exam.name} — Admit Card`)

    // Student info
    let y = 56
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(s.name, 14, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (config.showRollNumber) {
      doc.text(`Roll No: ${s.rollNo ?? '—'}`, 14, y)
      y += 5
    }
    doc.text(`Class: ${s.className}${s.section ? ` (${s.section})` : ''}`, 14, y)
    if (s.stream && s.stream !== 'General') {
      doc.text(`Stream: ${s.stream}`, 100, y)
    }
    y += 5
    if (school.academicYear) {
      doc.text(`Session: ${school.academicYear}`, 14, y)
      y += 5
    }
    if (s.admissionNo) {
      doc.text(`Admission No: ${s.admissionNo}`, 100, y - 5)
    }
    y += 4

    // Exam schedule table (only if configured to show)
    if (config.showTimetable && s.schedule.length > 0) {
      const head = [['Subject', 'Date', 'Time', 'Room', 'Seat']]
      const body = s.schedule.map((sch) => [
        sch.subjectName,
        formatDate(sch.date),
        `${sch.startTime} - ${sch.endTime}`,
        sch.room ?? '—',
        sch.seatNumber !== null ? String(sch.seatNumber) : '—',
      ])
      autoTable(doc, {
        head,
        body,
        startY: y,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110], textColor: 255 },
        margin: { left: 14, right: 14 },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    }

    // Instructions (only if configured)
    if (config.showInstructions) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Instructions:', 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const instructions = [
        '1. Report to the examination hall 15 minutes before the scheduled time.',
        '2. Bring your own stationery. Borrowing is not permitted during the exam.',
        '3. Mobile phones and smart devices are strictly prohibited.',
        '4. Any form of malpractice will lead to disqualification.',
        '5. Follow the seating plan displayed outside the examination hall.',
      ]
      for (const line of instructions) {
        doc.text(line, 14, y)
        y += 4
      }
    }

    // Signatures
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Student Signature', 14, 280)
    doc.line(14, 282, 60, 282)
    doc.text('Principal Signature', pageWidth - 60, 280)
    doc.line(pageWidth - 60, 282, pageWidth - 14, 282)
  })

  const filename = `${exam.name.replace(/\s+/g, '_')}_AdmitCards_${className}.pdf`
  return saveDoc(doc, filename)
}

// ─── 4. Seating Plan (room-by-room layout) ───────────────────────────

export function generateSeatingPlanPDF(
  exam: ExamDTO,
  seatAssignments: SeatAssignmentDTO[],
  school: SchoolContextDTO,
): PdfResult {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  drawSchoolHeader(doc, school, `${exam.name} — Seating Plan`)

  // Group by room
  const byRoom = new Map<string, SeatAssignmentDTO[]>()
  for (const s of seatAssignments) {
    if (!byRoom.has(s.room)) byRoom.set(s.room, [])
    byRoom.get(s.room)!.push(s)
  }

  const rooms = Array.from(byRoom.keys()).sort()
  let y = 52
  for (const room of rooms) {
    const seats = byRoom.get(room)!
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Room: ${room}  (${seats.length} students)`, 14, y)
    y += 4

    const head = [['Seat #', 'Roll', 'Student Name', 'Class']]
    const body = seats
      .sort((a, b) => a.seatNumber - b.seatNumber)
      .map((s) => [String(s.seatNumber), s.studentRollNo ?? '—', s.studentName, s.className])

    autoTable(doc, {
      head,
      body,
      startY: y,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    if (y > 180) {
      doc.addPage()
      y = 20
    }
  }

  const filename = `${exam.name.replace(/\s+/g, '_')}_SeatingPlan.pdf`
  return saveDoc(doc, filename)
}
