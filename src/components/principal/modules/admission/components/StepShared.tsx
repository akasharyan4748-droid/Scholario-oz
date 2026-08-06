'use client'

/**
 * Admission Module — Shared presentational primitives used across wizard steps.
 *
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 * Behaviour preserved byte-for-byte.
 */
import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Standard step header — icon + title + subtitle with a bottom divider. */
export function StepHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

/** Standard labelled field wrapper. */
export function Field({ label, children, full, hint }: { label: string; children: ReactNode; full?: boolean; hint?: string }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <Label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

/** Compact icon-and-label button used inside the Documents step action row. */
export function DocActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

/** Small pill used in the Documents step summary bar. */
export function SummaryPill({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold',
        className
      )}
    >
      <span className="opacity-80">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
