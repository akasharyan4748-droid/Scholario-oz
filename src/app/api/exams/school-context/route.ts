import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import type { SchoolContextDTO } from '@/lib/exams/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true, name: true, code: true, address: true, city: true,
        phone: true, email: true, logoUrl: true, academicYear: true, board: true,
      },
    })
    if (!school) throw new Error('NOT_FOUND')
    const dto: SchoolContextDTO = {
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      address: school.address,
      city: school.city,
      phone: school.phone,
      email: school.email,
      logoUrl: school.logoUrl,
      academicYear: school.academicYear,
      board: school.board as SchoolContextDTO['board'],
    }
    return dto
  })
}
