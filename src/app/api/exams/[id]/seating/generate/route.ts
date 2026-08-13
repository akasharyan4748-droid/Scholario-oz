import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { generateSeatingPlan } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// POST /api/exams/[id]/seating/generate  body: { classId, rooms: [{name, capacity}] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await generateSeatingPlan(id, body.classId, schoolId, user, body.rooms || [])
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
