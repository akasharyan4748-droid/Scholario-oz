import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { importMarksCsv } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// POST /api/exams/[id]/marks/import  body: { classId, subjectId, rows: CsvImportRow[] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({ rows: [] }))
      const result = await importMarksCsv(id, body.classId, body.subjectId, schoolId, user, body.rows || [])
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
