'use client'

/**
 * SS-1 — Settings UI primitives.
 *
 * The design language follows the student workspace's established
 * system (GlassCard surfaces, divide-y rows, quiet labels) with the
 * Finance-benchmark spacing discipline: restrained borders, no card-in-
 * card nesting, one accent per interaction state.
 */
import { motion } from 'framer-motion'
import { Check, Loader2, School } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// ─── SectionCard ────────────────────────────────────────────────────

export function SectionCard({
  icon: Icon,
  title,
  caption,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  caption?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('scroll-mt-24', className)}
      aria-labelledby={`sec-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <header className="flex items-start gap-3 mb-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 id={`sec-${title.replace(/\s+/g, '-').toLowerCase()}`} className="font-semibold text-sm">
              {title}
            </h3>
            {caption && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{caption}</p>}
          </div>
        </header>
        {children}
      </GlassCard>
    </motion.section>
  )
}

// ─── Rows ───────────────────────────────────────────────────────────

/** Label + value row (read-only data). */
export function InfoRow({ label, value, managed = false }: { label: string; value: React.ReactNode; managed?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-6 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {managed && <ManagedBadge />}
      </div>
      <p className="text-xs font-semibold text-foreground text-left sm:text-right break-words">{value}</p>
    </div>
  )
}

/** The school-managed marker (PART 24: "Managed by school"). */
export function ManagedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
      <School className="h-2.5 w-2.5" aria-hidden />
      Managed by school
    </span>
  )
}

/** Toggle row with optional pending/error feedback. */
export function ToggleRow({
  label, caption, checked, onChange, disabled = false, saving = false, ariaLabel,
}: {
  label: string
  caption?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  saving?: boolean
  ariaLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        {caption && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{caption}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-label="Saving" />}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
        />
      </div>
    </div>
  )
}

/** Thin divider between logical groups inside a section. */
export function RowDivider() {
  return <div className="my-3 border-t border-border/70" role="separator" />
}

// ─── Save / status feedback ─────────────────────────────────────────

/** Brief inline confirmation (fades in after a successful save). */
export function SavedTick({ visible }: { visible: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400',
        !visible && 'pointer-events-none',
      )}
      aria-live="polite"
    >
      <Check className="h-3 w-3" aria-hidden /> Saved
    </motion.span>
  )
}

// ─── Empty / error states ───────────────────────────────────────────

export function SettingsError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-xs text-muted-foreground">Couldn&apos;t load this right now.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded px-1"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function SettingsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 rounded-xl bg-muted/60 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}
