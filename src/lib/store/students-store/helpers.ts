// Virtual occupied count (deterministic, for display only).
//
// Returns a pseudo-random but stable seat-occupancy figure for a given
// section so the UI can render "X / capacity" badges without a real DB.
export function getVirtualOccupied(sectionId: string, capacity: number): number {
  let hash = 0
  for (let i = 0; i < sectionId.length; i++) hash = sectionId.charCodeAt(i) + ((hash << 5) - hash)
  const fillRate = 0.78 + (Math.abs(hash) % 18) / 100
  return Math.round(capacity * fillRate)
}
