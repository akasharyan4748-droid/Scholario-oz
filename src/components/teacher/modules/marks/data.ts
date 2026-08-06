// Static data, types, and shared helpers for the Marks Entry module.
//
// `MAX_MARKS` maps subject name → maximum marks for that subject's exam.
// `seededMark` is a deterministic pseudo-random mark generator used to
// pre-fill the table with plausible scores. `MarksStats` is the shape of the
// computed stats consumed by both the stat strip and the publish dialog.

export const MAX_MARKS: Record<string, number> = {
  Mathematics: 50,
  'Computer Science': 50,
}

// Deterministic seed-based mark generator
export function seededMark(seed: number, max: number): number {
  const r = ((seed * 9301 + 49297) % 233280) / 233280
  return Math.max(20, Math.round(max * (0.6 + r * 0.4)))
}

export interface MarksStats {
  avg: number
  highest: number
  lowest: number
  passCount: number
  total: number
}
