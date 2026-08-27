import { cn } from '@/lib/utils'

// Minimal KPI stat card
export function KpiStat({ label, value, sub, color, bg }: { label: string; value: number; sub: string; color: string; bg: string }) {
  return (
    <div className={cn('rounded-xl border border-border p-3.5', bg)}>
      <span className="text-[10px] uppercase font-bold text-muted-foreground block">{label}</span>
      <span className={cn('font-display text-2xl font-extrabold block my-0.5', color)}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </div>
  )
}
