/**
 * Seat availability logic.
 */
import type { ClassSeatConfig } from '@/lib/store/school-settings-store'

/* ---------- Seat availability logic ---------- */
export type SeatStatus = 'available' | 'limited' | 'waitlist' | 'full'

export interface SeatInfo {
  status: SeatStatus
  capacity: number
  enrolled: number
  available: number
  fillRate: number
  waitlisted: boolean
}

export function getSeatInfo(seatConfigs: ClassSeatConfig[], className: string): SeatInfo {
  const cfg = seatConfigs.find((c) => c.className === className)
  if (!cfg) {
    return { status: 'available', capacity: 0, enrolled: 0, available: 0, fillRate: 0, waitlisted: false }
  }
  const available = Math.max(0, cfg.capacity - cfg.enrolled)
  const fillRate = cfg.capacity > 0 ? cfg.enrolled / cfg.capacity : 0
  let status: SeatStatus = 'available'
  if (available === 0) status = 'full'
  else if (fillRate >= cfg.waitlistThreshold) status = 'waitlist'
  else if (fillRate >= 0.75) status = 'limited'
  return {
    status,
    capacity: cfg.capacity,
    enrolled: cfg.enrolled,
    available,
    fillRate,
    waitlisted: status === 'full' || status === 'waitlist',
  }
}
