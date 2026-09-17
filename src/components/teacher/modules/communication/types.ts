/**
 * communication/types — the client-safe DTO contract for the Communication
 * Hub's two real server sources.
 *
 * 1. GET /api/announcements            → { announcements: AnnouncementDTO[] }
 *    (authenticated, any role — the school's published Notification rows)
 * 2. GET /api/teacher/parent-connect    → ParentConnectPayload
 *    (from '@/lib/teacher-hub-types' — reused verbatim, no duplicate models)
 *
 * Dates are ISO strings. Nothing here is mock data.
 */

export interface AnnouncementDTO {
  id: string
  title: string
  message: string
  /** ALL | STUDENTS | PARENTS | TEACHERS | STAFF | CLASS:<class name> */
  audience: string
  /** URGENT | HIGH | NORMAL */
  priority: string
  /** sender display name (the API resolves the user) */
  sender: string
  createdAt: string
  /** how many recipients acknowledged/read the notification */
  acknowledgedBy: number
  /** estimated audience size — null when the server cannot estimate */
  estimatedRecipients: number | null
}
