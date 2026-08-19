/**
 * Seating plan PDF — landscape printable room-wise seating.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExamDTO } from '@/lib/exams/types'
import type { SeatingPlan } from '@/lib/exams/seating/types'
import { formatDateLong } from '@/lib/exams/format-helpers'

export function generateSeatingPlanPDF(exam: ExamDTO, plan: SeatingPlan): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('Demo School of Scholario', pageW / 2, 14, { align: 'center' })
  doc.setFontSize(11)
  doc.text(exam.name, pageW / 2, 20, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Academic Session ${exam.session}`, pageW / 2, 25, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('SEATING PLAN', pageW / 2, 30, { align: 'center' })

  // Table rows
  const rows: string[][] = []
  for (const room of plan.rooms) {
    const roomSeats = plan.seats.filter((s) => s.roomId === room.id)
    for (const seat of roomSeats) {
      if (seat.studentId) {
        rows.push([
          room.name + ' (' + room.roomNo + ')',
          seat.seatNumber,
          seat.studentName ?? '—',
          seat.studentRollNo ?? '—',
          seat.className ?? '—',
        ])
      }
    }
  }

  autoTable(doc, {
    head: [['Room', 'Seat #', 'Student', 'Roll No', 'Class']],
    body: rows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110] },
  })

  doc.save(`${exam.name.replace(/\s+/g, '-')}-seating-plan.pdf`)
}
