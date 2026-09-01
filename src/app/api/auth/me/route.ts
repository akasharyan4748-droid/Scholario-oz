import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return api(async () => {
    const user = await getCurrentUser()
    return { user }
  })
}
