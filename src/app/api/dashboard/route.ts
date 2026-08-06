import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

// Per-school overview stats (principal/management/teacher) or super-admin platform stats
export async function GET() {
  return withUser(async (user) => {
    if (user.role === 'SUPER_ADMIN') {
      const setting = await db.platformSetting.findUnique({ where: { id: 'global' } })
      const showDemo = setting ? setting.showDemoSchool : true

      const schoolWhere = showDemo ? {} : { isDemo: false }
      const studentWhere = showDemo ? {} : { school: { isDemo: false } }
      const teacherWhere = showDemo ? {} : { school: { isDemo: false } }
      const paymentWhere = showDemo ? {} : { fee: { school: { isDemo: false } } }

      const [schoolsCount, studentsCount, teachersCount, revenueAgg] = await Promise.all([
        db.school.count({ where: schoolWhere }),
        db.student.count({ where: studentWhere }),
        db.teacher.count({ where: teacherWhere }),
        db.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      ])

      const byPlan = await db.school.groupBy({
        by: ['plan'],
        where: schoolWhere,
        _count: { id: true },
      })

      const recentSchools = await db.school.findMany({
        where: schoolWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          _count: {
            select: { users: true, students: true, teachers: true, classes: true },
          },
        },
      })

      return {
        scope: 'PLATFORM',
        showDemoSchool: showDemo,
        stats: {
          schools: schoolsCount,
          students: studentsCount,
          teachers: teachersCount,
          revenue: revenueAgg._sum.amount || 0,
        },
        byPlan,
        recentSchools: recentSchools.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          code: s.code,
          domain: s.domain,
          city: s.city,
          plan: s.plan,
          status: s.status,
          isDemo: Boolean(s.isDemo),
          createdAt: s.createdAt,
          counts: s._count,
        })),
      }
    }

    const schoolId = schoolScoped(user)
    const [students, teachers, classes, subjects, exams, vehicles, routes, books, notifications, feesTotal, feesPaid, overdue] = await Promise.all([
      db.student.count({ where: { schoolId } }),
      db.teacher.count({ where: { schoolId } }),
      db.class.count({ where: { schoolId } }),
      db.subject.count({ where: { schoolId } }),
      db.exam.count({ where: { schoolId } }),
      db.vehicle.count({ where: { schoolId } }),
      db.route.count({ where: { schoolId } }),
      db.libraryBook.count({ where: { schoolId } }),
      db.notification.count({ where: { schoolId } }),
      db.fee.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      db.fee.aggregate({ where: { schoolId, status: 'PAID' }, _sum: { paid: true } }),
      db.fee.count({ where: { schoolId, status: { in: ['UNPAID', 'OVERDUE'] } } }),
    ])

    // attendance last 7 days
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const attendanceRows = await db.attendance.groupBy({
      by: ['status'],
      where: { schoolId, date: { gte: since } },
      _count: { id: true },
    })
    const present = attendanceRows.find((r) => r.status === 'PRESENT')?._count.id || 0
    const absent = attendanceRows.find((r) => r.status === 'ABSENT')?._count.id || 0
    const late = attendanceRows.find((r) => r.status === 'LATE')?._count.id || 0
    const attendanceRate = students ? Math.round((present / Math.max(1, present + absent + late)) * 100) : 0

    // fee collection trend (last 6 months from payments)
    const payments = await db.payment.findMany({
      where: { fee: { schoolId } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const months: Record<string, number> = {}
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 7)
      months[key] = (months[key] || 0) + p.amount
    }
    const trend = Object.entries(months)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }))

    const recentActivity = await db.activityLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true } } },
    })

    const upcomingExams = await db.exam.findMany({
      where: { schoolId, status: { in: ['SCHEDULED', 'ONGOING'] } },
      orderBy: { startDate: 'asc' },
      take: 5,
      include: { class: { select: { name: true } } },
    })

    return {
      scope: 'SCHOOL',
      stats: {
        students,
        teachers,
        classes,
        subjects,
        exams,
        vehicles,
        routes,
        books,
        notifications,
        feesTotal: feesTotal._sum.amount || 0,
        feesPaid: feesPaid._sum.paid || 0,
        overdue,
        attendanceRate,
      },
      attendance: { present, absent, late },
      trend,
      recentActivity,
      upcomingExams,
    }
  })
}

// allow filtering via query for student/teacher/parent specific dashboards
export async function POST(req: NextRequest) {
  return withUser(async (user) => {
    const body = await req.json().catch(() => ({}))
    const scope = String(body.scope || 'me')

    if (user.role === 'STUDENT') {
      const student = await db.student.findUnique({
        where: { userId: user.id },
        include: { class: true, route: true, user: { select: { name: true, email: true } } },
      })
      if (!student) throw new Error('NOT_FOUND')
      const results = await db.result.findMany({
        where: { studentId: student.id },
        include: { subject: true, exam: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      const attendance = await db.attendance.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: { id: true },
      })
      const fees = await db.fee.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } })
      const assignments = await db.assignment.findMany({
        where: { classId: student.classId || undefined },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { subject: true },
      })
      const timetable = await db.timetable.findMany({
        where: { classId: student.classId || undefined },
        include: { subject: true },
        orderBy: [{ day: 'asc' }, { period: 'asc' }],
      })
      return { scope: 'STUDENT', student, results, attendance, fees, assignments, timetable }
    }

    if (user.role === 'PARENT') {
      const children = await db.student.findMany({
        where: { guardianId: user.id },
        include: { class: true, user: { select: { name: true, email: true } } },
      })
      if (!children.length) throw new Error('No linked students found')
      const childIds = children.map((c) => c.id)
      const results = await db.result.findMany({
        where: { studentId: { in: childIds } },
        include: { subject: true, exam: true, student: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      const fees = await db.fee.findMany({ where: { studentId: { in: childIds } }, include: { student: { include: { user: { select: { name: true } } } } } })
      const attendance = await db.attendance.groupBy({
        by: ['status', 'studentId'],
        where: { studentId: { in: childIds } },
        _count: { id: true },
      })
      return { scope: 'PARENT', children, results, fees, attendance }
    }

    if (user.role === 'TEACHER') {
      const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
      const myClasses = await db.class.findMany({
        where: { schoolId: user.schoolId! },
        include: { _count: { select: { students: true, subjects: true } } },
      })
      const myAssignments = await db.assignment.findMany({
        where: { createdBy: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { class: true, subject: true },
      })
      const myQuestions = await db.questionBank.count({ where: { schoolId: user.schoolId! } })
      const myPapers = await db.examPaper.count({ where: { createdBy: user.id } })
      const studentsCount = await db.student.count({ where: { schoolId: user.schoolId! } })
      // Today's timetable for this teacher
      const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)
      const todaySchedule = await db.timetable.findMany({
        where: { schoolId: user.schoolId!, day: todayKey, teacherName: { contains: user.name } },
        include: { subject: true, class: true },
        orderBy: { period: 'asc' },
        take: 10,
      })
      const recentResults = await db.result.count({
        where: { exam: { schoolId: user.schoolId! } },
      })
      return { scope: 'TEACHER', teacher, myClasses, myAssignments, myQuestions, myPapers, studentsCount, todaySchedule, recentResults }
    }

    if (user.role === 'DRIVER') {
      const driver = await db.driver.findUnique({
        where: { userId: user.id },
        include: { vehicles: { include: { route: true } } },
      })
      if (!driver) throw new Error('NOT_FOUND')
      const routeIds = driver.vehicles.map((v) => v.routeId).filter(Boolean) as string[]
      const studentsOnRoute = routeIds.length
        ? await db.student.count({ where: { routeId: { in: routeIds } } })
        : 0
      const students = routeIds.length
        ? await db.student.findMany({
            where: { routeId: { in: routeIds } },
            include: { user: { select: { name: true, phone: true } } },
            take: 50,
          })
        : []
      return { scope: 'DRIVER', driver, vehicles: driver.vehicles, studentsOnRoute, students }
    }

    return { scope }
  })
}
