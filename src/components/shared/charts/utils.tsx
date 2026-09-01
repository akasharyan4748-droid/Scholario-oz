'use client'

/* ============================================================
   charts/utils.tsx
   Shared premium tooltip + reusable SVG glow filter.
   Internal helpers (not re-exported from barrel) used by all
   recharts-based chart components.
   ============================================================ */

import { type TooltipProps } from 'recharts'

/* ---------- Shared premium tooltip ---------- */
export function PremiumTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="premium-tooltip">
      <div className="premium-tooltip-inner">
        {label != null && (
          <div className="px-2.5 pt-2 pb-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/60 mb-1.5">
            {label}
          </div>
        )}
        <div className="flex flex-col gap-1 px-2.5 pb-2">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0 ring-2 ring-white/40 dark:ring-white/10"
                  style={{ background: entry.color }}
                />
                <span className="text-muted-foreground truncate">{entry.name}</span>
              </div>
              <span className="font-display font-semibold tabular-nums">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                {(entry.payload as any)?.suffix ?? ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .premium-tooltip {
          pointer-events: none;
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12));
        }
        .premium-tooltip-inner {
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--popover);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          min-width: 140px;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

/* ---------- Soft glow filter (reusable) ---------- */
export function GlowFilter({ id, intensity = 3 }: { id: string; intensity?: number }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={intensity} result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}
