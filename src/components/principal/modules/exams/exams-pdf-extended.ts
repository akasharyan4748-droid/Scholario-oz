'use client'

/**
 * exams-pdf-extended — additional PDF reports for P1 features.
 *   1. Class-wise batch Admit Card PDF (all students of a class in one PDF)
 *   2. Seating Plan PDF (room-by-room seat layout)
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type ExamDTO } from '@/lib/exams/types'
import { type AdmitCardStudent } from '@/lib/exams/use-exams-extended'
import { type SeatAssignmentDTO } from '@/lib/exams/use-exams-extended'

interface PdfResult {
  filename: string
  blobUrl: string
}

function saveDoc(doc: jsPDF, filename: string): PdfResult {
  const blobUrl = doc.output('bloburl') as unknown as string
  doc.save(filename)
  return { filename, blobUrl }
}

const SCHOOL_INFO = {
  name: 'Demo School of Scholario',
  address: '100 Knowledge Parkway, Sector 47, Gurugram',
  phone: '+91 124 4567 800',
  email: 'office@demoschool.edu',
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── 1. Class-wise batch Admit Card PDF ──────────────────────────────

export function generateBatchAdmitCardPDF(
  exam: Partial<ExamDTO>,
  className: string,
  students: AdmitCardStudent[]
): PdfResult {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  students.forEach((student, idx) => {
    if (idx > 0) doc.addPage()

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
    doc.text(SCHOOL_INFO.address, pageWidth / 2, 30, { align: 'center' })
    doc.text(`Ph: ${SCHOOL_INFO.phone} · ${SCHOOL_INFO.email}`, pageWidth / 2, 34, { align: 'center' })

    // ── Title ──
    doc.setFillColor(15, 118, 110)
    doc.rect(15, 38, pageWidth - 30, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`EXAMINATION ADMIT CARD — ${exam.name?.toUpperCase()}`, pageWidth / 2, 43.5, { align: 'center' })
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
    doc.text(exam.session ?? '2025-2026', 60, 81)

    // Photo + seat box
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.3)
    doc.rect(pageWidth - 45, 50, 25, 32)
    doc.setFontSize(7)
    doc.text('Affix Photo', pageWidth - 32, 67, { align: 'center' })

    // Seat info
    if (student.room || student.seatNumber) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 118, 110)
      doc.text(`Room: ${student.room ?? '—'}   Seat: ${student.seatNumber ?? '—'}`, pageWidth / 2, 89, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    // ── Exam Schedule Table ──
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('EXAMINATION SCHEDULE', pageWidth / 2, 105, { align: 'center' })

    const head = [['Subject', 'Date', 'Time', 'Room', 'Invigilator']]
    const body = student.schedule.map((s) => [
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
    doc.text(`Student ${idx + 1} of ${students.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  })

  const filename = `${exam.name?.replace(/[^a-zA-Z0-9]+/g, '_') ?? 'Exam'}_AdmitCards_${className.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}

// ─── 2. Seating Plan PDF ──────────────────────────────────────────────

export function generateSeatingPlanPDF(
  exam: Partial<ExamDTO>,
  className: string,
  seats: SeatAssignmentDTO[]
): PdfResult {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_INFO.name.toUpperCase(), pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${SCHOOL_INFO.address} · Phone: ${SCHOOL_INFO.phone}`, pageWidth / 2, 17, { align: 'center' })

  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.6)
  doc.line(10, 22, pageWidth - 10, 22)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`${exam.name?.toUpperCase()} — SEATING PLAN`, pageWidth / 2, 28, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Class: ${className}   |   Session: ${exam.session ?? ''}   |   ${seats.length} students seated`, pageWidth / 2, 33, { align: 'center' })

  // Group seats by room
  const byRoom = new Map<string, SeatAssignmentDTO[]>()
  for (const s of seats) {
    if (!byRoom.has(s.room)) byRoom.set(s.room, [])
    byRoom.get(s.room)!.push(s)
  }

  const rooms = Array.from(byRoom.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  let y = 42
  for (const [room, roomSeats] of rooms) {
    if (y > pageHeight - 40) { doc.addPage(); y = 20 }

    // Room header
    doc.setFillColor(15, 118, 110)
    doc.rect(10, y, pageWidth - 20, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${room}  —  ${roomSeats.length} students`, 12, y + 4.2)
    doc.setTextColor(0, 0, 0)

    // Table
    autoTable(doc, {
      head: [['Seat #', 'Row', 'Col', 'Roll No', 'Student Name']],
      body: roomSeats.map((s) => [
        String(s.seatNumber),
        String(s.row ?? '—'),
        String(s.column ?? '—'),
        s.studentRollNo ?? '—',
        s.studentName,
      ]),
      startY: y + 6,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [240, 245, 250], textColor: 60, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 251, 253] },
    })
    y = ((doc as any).lastAutoTable?.finalY || y + 30) + 8
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated by SCHOLARIO-OS · ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 5, { align: 'center' })

  const filename = `${exam.name?.replace(/[^a-zA-Z0-9]+/g, '_') ?? 'Exam'}_SeatingPlan_${className.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
  return saveDoc(doc, filename)
}
