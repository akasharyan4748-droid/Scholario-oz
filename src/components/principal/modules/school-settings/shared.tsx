'use client'

import { GlassCard } from '@/components/shared/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Header block used by each settings tab — icon + title + description.
// Mirrors the original markup in the monolithic `school-settings.tsx`.
export function TabHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div>
      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald-600" /> {title}
      </h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

// Compact section group used inside a SettingsTab to cluster related
// fields (Finance Settings grouping pattern): a 10px uppercase muted
// label with a hairline rule, then the field grid. Keeps long forms
// scannable without adding visual weight.
export function FieldGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <h4 className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
          {label}
        </h4>
        <div className="h-px flex-1 bg-border" aria-hidden />
      </div>
      {children}
    </section>
  )
}

// Wrapper used by every settings tab. Renders a GlassCard with consistent
// padding/spacing. When `action` is provided, the header sits in a flex row
// alongside the action slot (e.g. the "Add Book to Store" button); otherwise
// just the header is rendered on its own.
export function SettingsTab({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <GlassCard className="p-6 space-y-6">
      {action ? (
        <div className="flex items-center justify-between">
          <TabHeader icon={icon} title={title} description={description} />
          {action}
        </div>
      ) : (
        <TabHeader icon={icon} title={title} description={description} />
      )}
      {children}
    </GlassCard>
  )
}
