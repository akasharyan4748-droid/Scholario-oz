import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

// Role tag → human label for the acknowledgement feed.
function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'PRINCIPAL': return 'Principal'
    case 'TEACHER': return 'Teacher'
    case 'STUDENT': return 'Student'
    case 'PARENT': return 'Parent'
    default: return 'Staff'
  }
}

// GET /api/announcements/[id]/reads — delivery analytics for one broadcast.
// Returns every persisted acknowledgement (NotificationRead rows) with the
// acknowledgee's name, role and read timestamp so the Communication History
// modal can show WHO acknowledged the broadcast and WHEN — completing the
// delivery-analytics story that raw ack counts started.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      if (user.role !== 'PRINCIPAL') throw new Error('FORBIDDEN')
      const { id } = await params

      // School-scoped guard: the notification must belong to caller's school.
      const notification = await db.notification.findFirst({
        where: { id, schoolId },
        select: { id: true },
      })
      if (!notification) throw new Error('NOT_FOUND')

      const reads = await db.notificationRead.findMany({
        where: { notificationId: id },
        orderBy: { readAt: 'asc' },
        include: {
          user: { select: { name: true, role: true } },
        },
      })

      return {
        reads: reads.map((r) => ({
          id: r.id,
          name: r.user?.name ?? 'Unknown user',
          role: roleLabel(r.user?.role),
          readAt: r.readAt,
        })),
      }
    },
    { roles: ['PRINCIPAL'] }
  )
}
