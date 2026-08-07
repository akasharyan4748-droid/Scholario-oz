'use client'

/**
 * ModuleHeader — minimal page header for Principal Panel modules.
 *
 * Replaces the old SectionHeading pattern which duplicated the sidebar's
 * title + added an icon + verbose storytelling subtitle.
 *
 * The sidebar already tells the user which module they're in. This header
 * just provides the actions row (buttons) and an optional one-line context
 * strip (counts/dates) — no repeated title, no icon, no descriptions.
 *
 * Pattern:
 *   <ModuleHeader
 *     actions={<><SettingsBtn/><AddBtn/></>}
 *     meta={[`${total} teachers`, `${depts} departments`]}
 *   />
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModuleHeaderProps {
  /** Optional short label, only when context requires it. Most modules omit. */
  label?: string
  /** Action buttons rendered on the right */
  actions?: ReactNode
  /** Short meta items rendered on the left as a context strip (e.g. counts) */
  meta?: string[]
  /** Sticky on scroll */
  sticky?: boolean
  className?: string
}

export function ModuleHeader({
  label,
  actions,
  meta,
  sticky = false,
  className,
}: ModuleHeaderProps) {
  // If neither label nor meta nor actions, render nothing.
  if (!label && !meta?.length && !actions) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        sticky && 'sticky top-0 z-20 bg-background/95 backdrop-blur py-3 -mt-3 mb-3',
        !sticky && 'mb-4',
        className
      )}
    >
      {/* Left side: optional label + meta strip */}
      <div className="flex items-baseline gap-3 min-w-0">
        {label && (
          <h1 className="text-base font-semibold tracking-tight text-foreground truncate">
            {label}
          </h1>
        )}
        {meta && meta.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/40">·</span>}
                <span className="truncate">{m}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Right side: actions */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
