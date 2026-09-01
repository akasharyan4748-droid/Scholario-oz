import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { school as schoolMock, classList as classListMock, subjects as subjectsMock } from '@/lib/mock/school'

export const runtime = 'nodejs'

// GET /api/schools/public?slug=demo-school (or defaults to the demo school)
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug') || 'demo-school'

    let school: any = null
    try {
      // Find school by slug or fallback to first demo school
      school = await db.school.findUnique({
        where: { slug },
        include: {
          _count: {
            select: { students: true, teachers: true, classes: true, subjects: true, libraryBooks: true },
          },
          classes: {
            select: { id: true, name: true, gradeLevel: true, section: true, room: true },
            take: 12,
          },
          subjects: {
            select: { id: true, name: true, code: true },
            take: 12,
          },
          notifications: {
            where: { audience: { in: ['ALL', 'STUDENTS', 'PUBLIC'] } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, message: true, priority: true, createdAt: true },
          },
        },
      })

      if (!school) {
        school = await db.school.findFirst({
          where: { isDemo: true },
          include: {
            _count: {
              select: { students: true, teachers: true, classes: true, subjects: true, libraryBooks: true },
            },
            classes: {
              select: { id: true, name: true, gradeLevel: true, section: true, room: true },
              take: 12,
            },
            subjects: {
              select: { id: true, name: true, code: true },
              take: 12,
            },
            notifications: {
              where: { audience: { in: ['ALL', 'STUDENTS', 'PUBLIC'] } },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, title: true, message: true, priority: true, createdAt: true },
            },
          },
        })
      }
    } catch (_dbError) {
      // DB error or not connected; fallback to mock data
      school = null
    }

    if (school) {
      return NextResponse.json({
        success: true,
        data: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          code: school.code,
          domain: school.domain,
          address: school.address,
          city: school.city,
          phone: school.phone,
          email: school.email,
          themeColor: school.themeColor,
          accentColor: school.accentColor,
          academicYear: school.academicYear,
          isDemo: Boolean(school.isDemo),
          counts: school._count,
          classes: school.classes,
          subjects: school.subjects,
          announcements: school.notifications,
        },
      })
    }

    // Fallback to mock demo school data
    return NextResponse.json({
      success: true,
      data: {
        id: 'demo-school-id',
        name: schoolMock.name,
        slug: 'demo-school',
        code: 'SCH-DEMO',
        domain: schoolMock.website,
        address: schoolMock.address,
        city: 'Gurugram',
        phone: schoolMock.phone,
        email: schoolMock.email,
        themeColor: '#0d9488',
        accentColor: '#14b8a6',
        academicYear: schoolMock.academicYear,
        isDemo: true,
        counts: {
          students: schoolMock.totalStudents,
          teachers: schoolMock.totalTeachers,
          classes: schoolMock.classes,
          subjects: subjectsMock.length,
          libraryBooks: 4500,
        },
        classes: classListMock.map(c => ({ id: c.id, name: c.name, grade: c.name, section: c.sections[0] || 'A', room: '101' })),
        subjects: subjectsMock.map(s => ({ id: s.id, name: s.name, code: s.code, department: 'Academic' })),
        announcements: [
          {
            id: 'a1',
            title: 'Welcome to SCHOLARIO-OS',
            message: 'Annual admissions for session 2025-2026 are now open.',
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch public school data' }, { status: 500 })
  }
}
