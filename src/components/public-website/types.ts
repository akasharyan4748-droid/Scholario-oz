export interface PublicSchoolData {
  id: string
  name: string
  slug: string
  code: string
  address?: string
  city?: string
  phone?: string
  email?: string
  themeColor?: string
  academicYear?: string
  isDemo?: boolean
  counts?: {
    students: number
    teachers: number
    classes: number
    subjects: number
  }
  announcements?: Array<{
    id: string
    title: string
    message: string
    createdAt: string
    priority: string
  }>
}

export interface PublicWebsiteProps {
  onOpenPortal: (role?: string) => void
  onOpenPlatform?: () => void
}
