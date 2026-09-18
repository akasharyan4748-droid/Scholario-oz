import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/timetable — the teacher's OWN weekly schedule.
 *
 * PERMISSION MODEL (server-decided, school-scoped):
 *   · cells — Timetable cells of this school whose teacherName matches the
 *     signed-in teacher (case-insensitive trim — the same resolution rule
 *     the Dashboard and Lesson Planner use);
 *   · a teacher can never see another teacher's cells: the name filter is
 *     applied server-side before anything is returned;
 *   · subjects/classes come from the row relations, never fabricated.
 *
 * ONE query fetches every Timetable row of the school (~78). Three things
 * derive from that single snapshot:
 *   · cells        — the teacher's own rows (name filter above);
 *   · periodTimes  — the school's period ladder (P1–P7) taken from ALL
 *     rows, so FREE periods still carry real times;
 *   · conflicts    — honest, server-side conflict detection for the
 *     teacher's OWN cells:
 *       · teacher — two of the teacher's own cells share day+period
 *         (she cannot be in two places at once);
 *       · room    — the teacher's cell sits in a room that ANOTHER row
 *         (any teacher) also uses at that day+period — reported without
 *         leaking the other teacher's name;
 *       · class   — the teacher's cell's class has another row at the
 *         same day+period (two subjects booked for one class).
 *     The live demo data is conflict-free; the scan is a safety net that
 *     surfaces problems instead of hiding them.
 *
 * Shape: { cells, stats, academicSession, periodTimes, schoolDays, conflicts }.
 */

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function dayRank(day: string): number {
  const i = DAY_ORDER.indexOf(day)
  return i === -1 ? DAY_ORDER.length : i
}

interface PeriodTime {
  period: number
  startTime: string | null
  endTime: string | null
}

interface CellEntry {
  subjectName: string
  classLabel: string
  room: string | null
}

type TimetableConflict =
  | { kind: 'teacher'; day: string; period: number; entries: CellEntry[] }
  | { kind: 'room'; day: string; period: number; label: string; detail: string }
  | { kind: 'class'; day: string; period: number; label: string; detail: string }

const CONFLICT_DETAIL = {
  room: 'This room is booked for another class at this slot',
  class: 'Two subjects are scheduled for this class at this slot',
} as const

export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      const allRows = await db.timetable.findMany({
        where: { schoolId },
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
        },
      })

      // ── the teacher's OWN cells (server-side name scoping) ──────────
      const ownRows = teacherName
        ? allRows.filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
        : []

      const cells = ownRows
        .map((r) => ({
          day: r.day,
          period: r.period,
          startTime: r.startTime,
          endTime: r.endTime,
          subjectName: r.subject?.name ?? 'Subject',
          classLabel: classLabelOf(r.class),
          room: r.room,
        }))
        .sort((a, b) => dayRank(a.day) - dayRank(b.day) || a.period - b.period)

      // ── school period ladder from ALL rows (times are consistent per
      //    period; first row seen wins) — FREE periods keep real times ──
      const ladder = new Map<number, PeriodTime>()
      for (const r of allRows) {
        if (ladder.has(r.period)) continue
        ladder.set(r.period, { period: r.period, startTime: r.startTime, endTime: r.endTime })
      }
      const periodTimes = [...ladder.values()].sort((a, b) => a.period - b.period)

      // ── teaching days that exist school-wide (canonical order first) ─
      const seenDays = new Set(allRows.map((r) => r.day))
      const schoolDays = DAY_ORDER.filter((d) => seenDays.has(d))
      for (const d of [...seenDays].sort()) {
        if (!schoolDays.includes(d)) schoolDays.push(d)
      }

      // ── conflict detection (teacher's OWN cells vs the school rows) ──
      const conflicts: TimetableConflict[] = []

      // teacher: two+ of the teacher's own cells share day+period
      const ownSlots = new Map<string, { day: string; period: number; entries: CellEntry[] }>()
      for (const c of cells) {
        const key = `${c.day}|${c.period}`
        const group = ownSlots.get(key) ?? { day: c.day, period: c.period, entries: [] }
        group.entries.push({ subjectName: c.subjectName, classLabel: c.classLabel, room: c.room })
        ownSlots.set(key, group)
      }
      for (const group of ownSlots.values()) {
        if (group.entries.length > 1) {
          conflicts.push({ kind: 'teacher', ...group })
        }
      }

      // usage counters over EVERY school row (any teacher)
      const roomUse = new Map<string, number>() // room|day|period → rows
      const classUse = new Map<string, number>() // classId|day|period → rows
      for (const r of allRows) {
        if (r.room) {
          const k = `${r.room}|${r.day}|${r.period}`
          roomUse.set(k, (roomUse.get(k) ?? 0) + 1)
        }
        const ck = `${r.classId}|${r.day}|${r.period}`
        classUse.set(ck, (classUse.get(ck) ?? 0) + 1)
      }

      // room / class conflicts touching the teacher's own cells
      // (deduped per slot+label; other teachers are NEVER named)
      const reportedRooms = new Set<string>()
      const reportedClasses = new Set<string>()
      for (const r of ownRows) {
        if (r.room) {
          const k = `${r.room}|${r.day}|${r.period}`
          if ((roomUse.get(k) ?? 0) > 1 && !reportedRooms.has(k)) {
            reportedRooms.add(k)
            conflicts.push({
              kind: 'room',
              day: r.day,
              period: r.period,
              label: r.room,
              detail: CONFLICT_DETAIL.room,
            })
          }
        }
        const ck = `${r.classId}|${r.day}|${r.period}`
        if ((classUse.get(ck) ?? 0) > 1 && !reportedClasses.has(ck)) {
          reportedClasses.add(ck)
          conflicts.push({
            kind: 'class',
            day: r.day,
            period: r.period,
            label: classLabelOf(r.class),
            detail: CONFLICT_DETAIL.class,
          })
        }
      }

      conflicts.sort(
        (a, b) =>
          dayRank(a.day) - dayRank(b.day) ||
          a.period - b.period ||
          (a.kind === 'teacher' ? 0 : a.kind === 'room' ? 1 : 2) -
            (b.kind === 'teacher' ? 0 : b.kind === 'room' ? 1 : 2),
      )

      // ── stats ────────────────────────────────────────────────────────
      const classes = new Set(cells.map((c) => c.classLabel))
      const subjects = new Set(cells.map((c) => c.subjectName))
      const days = new Set(cells.map((c) => c.day))

      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { academicYear: true },
      })

      return {
        cells,
        stats: {
          periodsPerWeek: cells.length,
          classes: classes.size,
          subjects: subjects.size,
          teachingDays: days.size,
        },
        academicSession: school?.academicYear ?? null,
        periodTimes,
        schoolDays,
        conflicts,
      }
    },
    { roles: ['TEACHER'] }
  )
}
