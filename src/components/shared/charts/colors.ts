/* ============================================================
   charts/colors.ts
   Shared axis + tick formatting helpers for premium charts.
   ============================================================ */

export const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

/* ---------- Smart axis formatter (K / M abbreviation) ---------- */
export function formatAxisTick(v: number) {
  if (typeof v !== 'number' || isNaN(v)) return ''
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${Math.round(v / 1_000)}K`
  return String(Math.round(v))
}
