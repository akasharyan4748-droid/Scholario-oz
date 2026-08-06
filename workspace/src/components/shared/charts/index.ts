/* ============================================================
   charts/index.ts
   Barrel re-export for the premium chart system.

   Backward-compatibility entry point: every named export that
   used to live in the monolithic `charts.tsx` is re-exported
   here so existing imports like:
       import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
   continue to resolve unchanged.
   ============================================================ */

// Shared helpers (not part of the original public surface but
// exported here so internal callers can opt-in if needed).
export { AXIS_TICK, formatAxisTick } from './colors'
export { PremiumTooltip, GlowFilter } from './utils'

// Recharts-based premium charts
export { ChartCard, AreaTrend, DualArea } from './legacy'
export { BarTrend, GroupedBar } from './legacy-bar'
export { Donut, MiniLine, RadialGauge, ProgressBar } from './legacy-circular'
