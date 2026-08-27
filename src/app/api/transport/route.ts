import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const [vehicles, routes, drivers] = await Promise.all([
      db.vehicle.findMany({
        where: { schoolId },
        include: { driver: { include: { user: { select: { name: true, phone: true } } } }, route: true },
        orderBy: { number: 'asc' },
      }),
      db.route.findMany({
        where: { schoolId },
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'asc' },
      }),
      db.driver.findMany({
        where: { schoolId },
        include: { user: { select: { name: true, email: true, phone: true } }, vehicles: true },
      }),
    ])
    return { vehicles, routes, drivers }
  })
}
