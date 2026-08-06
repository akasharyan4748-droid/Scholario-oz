import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// POST /api/admissions/public
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentName, parentName, email, phone, grade, notes, schoolSlug } = body

    if (!studentName || !parentName || !phone) {
      return NextResponse.json({ success: false, error: 'Student name, parent name, and phone number are required.' }, { status: 400 })
    }

    // Find the school
    const school = await db.school.findFirst({
      where: schoolSlug ? { slug: schoolSlug } : { isDemo: true },
    })

    if (!school) {
      return NextResponse.json({ success: false, error: 'Target school not found.' }, { status: 404 })
    }

    // Record the admission inquiry in ActivityLog and create a Notification for School Admins
    await db.activityLog.create({
      data: {
        schoolId: school.id,
        action: 'ADMISSION_INQUIRY',
        detail: `New Admission Inquiry: Student: ${studentName}, Parent: ${parentName}, Grade: ${grade || 'N/A'}, Phone: ${phone}, Email: ${email || 'N/A'}${notes ? `, Notes: ${notes}` : ''}`,
      },
    })

    // Create notification for school staff
    await db.notification.create({
      data: {
        schoolId: school.id,
        title: `New Admission Inquiry: ${studentName}`,
        message: `Parent ${parentName} applied for Grade ${grade || 'N/A'}. Contact: ${phone} (${email || 'No email'}).`,
        audience: 'STAFF',
        priority: 'HIGH',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admission inquiry submitted successfully! The school admissions team will contact you shortly.',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to submit admission inquiry' }, { status: 500 })
  }
}
