'use client'

/**
 * TimetablePDF — generates a printable timetable layout and triggers
 * the browser's print-to-PDF via window.print().
 *
 * Brief section 2D: The PDF looks like a real school timetable with
 * SCHOLARIO header, class/day info, and a clean grid.
 *
 * Brief section 2E: Handles all periods, breaks, single/multi-class.
 *
 * Brief section 3: Read-only — never modifies timetable state.
 */
import type { TimetableSlot } from './data'
import type { TimetableRow } from './schedule-grid'
import { getTeacherById } from '@/lib/mock/teachers'
import { school } from '@/lib/mock/school'

export function exportTimetablePDF(
  slots: TimetableSlot[],
  rows: TimetableRow[],
  selectedDay: string,
  selectedClass: string,
  visibleClasses: string[]
) {
  const daySlots = slots.filter((s) => s.day === selectedDay)
  const isAllClasses = selectedClass === 'all'
  const title = isAllClasses ? 'Master Timetable' : `${selectedClass} Timetable`
  _printTimetable(daySlots, rows, selectedDay, title, selectedClass, visibleClasses)
}

export function exportTeacherTimetablePDF(
  slots: TimetableSlot[],
  rows: TimetableRow[],
  teacherId: string,
  teacherName: string
) {
  const teacherSlots = slots.filter((s) => s.teacherId === teacherId)
  _printTimetable(teacherSlots, rows, 'All Days', `${teacherName} Timetable`, teacherName, ['Subject', 'Class', 'Room'])
}

function _printTimetable(
  daySlots: TimetableSlot[],
  rows: TimetableRow[],
  dayLabel: string,
  title: string,
  contextLabel: string,
  columns: string[]
) {

  const resolveTeacherName = (slot: TimetableSlot) =>
    slot.teacherName || getTeacherById(slot.teacherId)?.name || '—'

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} — ${dayLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 12px; }
  .school-name { font-size: 18px; font-weight: 700; color: #059669; }
  .timetable-title { font-size: 14px; font-weight: 600; color: #4b5563; }
  .day-info { font-size: 12px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 10px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; color: #4b5563; }
  .period-col { width: 90px; white-space: nowrap; }
  .break-row { background: #fef3c7; }
  .break-row td { font-style: italic; text-align: center; color: #92400e; font-weight: 600; }
  .subject { font-weight: 600; color: #059669; }
  .teacher { color: #4b5563; margin-top: 2px; }
  .room { color: #9ca3af; margin-top: 1px; }
  @media print { body { padding: 16px; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school-name">${school.name}</div>
      <div class="timetable-title">${title}</div>
    </div>
    <div class="day-info">${dayLabel}${contextLabel === 'all' ? '' : ' · ' + contextLabel}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="period-col">Period</th>
        ${columns.map(col => `<th>${col}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => {
        if (row.isBreak) {
          return `<tr class="break-row"><td>${row.name}<br><span style="font-size:8px;color:#9ca3af">${row.time}</span></td><td colspan="${columns.length}" style="text-align:center;font-style:italic;color:#92400e">— ${row.name} (${row.time}) —</td></tr>`
        }
        return `<tr>
          <td class="period-col">${row.name}<br><span style="font-size:8px;color:#9ca3af">${row.time}</span></td>
          ${columns.map((col, ci) => {
            // For class-based export: find slot by className
            // For teacher-based export: columns are Subject, Class, Room
            if (columns.length === 1) {
              // Single class column
              const slot = daySlots.find(s => s.period === row.number && s.className === col)
              if (!slot) return '<td style="text-align:center;color:#d1d5db">—</td>'
              return `<td><div class="subject">${slot.subject}</div><div class="teacher">${resolveTeacherName(slot)}</div><div class="room">${slot.room}</div></td>`
            } else if (columns[0] === 'Subject') {
              // Teacher export: find the slot for this teacher in this period
              const slot = daySlots.find(s => s.period === row.number)
              if (!slot) return '<td style="text-align:center;color:#d1d5db">—</td>'
              if (ci === 0) return `<td><div class="subject">${slot.subject}</div></td>`
              if (ci === 1) return `<td>${slot.className}</td>`
              return `<td>${slot.room}</td>`
            } else {
              const slot = daySlots.find(s => s.period === row.number && s.className === col)
              if (!slot) return '<td style="text-align:center;color:#d1d5db">—</td>'
              return `<td><div class="subject">${slot.subject}</div><div class="teacher">${resolveTeacherName(slot)}</div><div class="room">${slot.room}</div></td>`
            }
          }).join('')}
        </tr>`
      }).join('')}
    </tbody>
  </table>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    // Fallback: use a hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document || iframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      iframe.contentWindow?.focus()
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 500)
    }
    return
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 500)
}
