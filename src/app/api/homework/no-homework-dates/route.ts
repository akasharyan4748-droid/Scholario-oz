import { withUser, schoolScoped } from '@/lib/api'
import { listNoHomeworkDates, addNoHomeworkDate, removeNoHomeworkDate } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await listNoHomeworkDates(schoolId)
  })
}

export async function POST(req: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      if (!body.date) throw new Error('Date required')
      return await addNoHomeworkDate(schoolId, body.date, body.reason)
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
