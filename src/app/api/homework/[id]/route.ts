import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getHomework, updateHomework, deleteHomework, getSubmissions } from '@/lib/homework/service'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const include = searchParams.get('include')

    if (include === 'submissions') {
      const [homework, submissions] = await Promise.all([
        getHomework(id, schoolId),
        getSubmissions(id, schoolId),
      ])
      return { homework, submissions }
    }
    return await getHomework(id, schoolId)
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      return await updateHomework(id, schoolId, user, body)
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      await deleteHomework(id, schoolId, user)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
