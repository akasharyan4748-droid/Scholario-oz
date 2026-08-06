export type School = {
  id: string
  name: string
  slug: string
  code: string
  domain?: string
  city?: string
  plan: string
  status: string
  isDemo?: boolean
  academicYear?: string
  createdAt: string
  counts?: { users: number; students: number; teachers: number; classes: number }
}
