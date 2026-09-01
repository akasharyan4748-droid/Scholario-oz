import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// POST /api/exams/[id]/admit-cards  body: { classId, studentIds?: string[] (omit = all) }
// Returns student+schedule data needed for batch admit card PDF generation client-side.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { classId, studentIds } = body
    if (!classId) throw new Error('classId is required')

    // Validate
    const exam = await db.exam.findFirst({ where: { id, schoolId }, select: { id: true, name: true, type: true, session: true, startDate: true, endDate: true } })
    if (!exam) throw new Error('Exam not found')

    // Get real students
    const where: any = { classId, schoolId }
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      where.id = { in: studentIds }
    }
    const students = await db.student.findMany({
      where,
      orderBy: { rollNo: 'asc' },
      include: { user: { select: { name: true } }, class: true },
    })

    // Get schedule for this class
    const schedule = await db.examScheduleItem.findMany({
      where: { examId: id, classId },
      include: { subject: true },
      orderBy: { date: 'asc' },
    })

    const seatAssignments = await db.examSeatAssignment.findMany({
      where: { examId: id, classId },
    })

    const result = students.map((s) => {
      const seat = seatAssignments.find((sa) => sa.studentId === s.id)
      return {
        id: s.id,
        name: s.user?.name ?? '',
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        className: s.class?.name ?? '',
        room: seat?.room ?? null,
        seatNumber: seat?.seatNumber ?? null,
        schedule: schedule.map((item) => ({
          id: item.id,
          subjectId: item.subjectId,
          subjectName: item.subject?.name ?? null,
          date: item.date.toISOString().split('T')[0],
          startTime: item.startTime,
          endTime: item.endTime,
          room: item.room,
          invigilatorName: item.invigilatorName,
        })),
      }
    })

    return { exam, students: result }
  })
}
