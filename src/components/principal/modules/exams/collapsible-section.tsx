'use client'

/**
 * CollapsibleSection — a reusable wrapper for large information-dense
 * sections. Renders a compact header with an optional title, optional
 * right-side controls, and a tiny collapse/expand toggle.
 *
 * Behaviour:
 *  - Collapsed: only the header row is visible (title + toggle).
 *  - Expanded: header + children.
 *
 * The toggle is a tiny icon button (chevron-up when expanded, chevron-down
 * when collapsed). It is keyboard accessible (Enter/Space), has an aria-label,
 * and shows a tooltip on hover via the `title` attribute.
 *
 * State can be either uncontrolled (default open) or controlled via the
 * `open` / `onOpenChange` props.
 */

import { useState, useId } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title?: string
  /** Optional small subtitle / count shown next to the title. */
  subtitle?: string
  /** Optional right-side controls rendered in the header (filters, buttons). */
  actions?: React.ReactNode
  /** Header accent colour — subtle left border. */
  accent?: 'default' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'
  /** Default expanded state (uncontrolled). Defaults to true. */
  defaultOpen?: boolean
  /** Controlled open state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
  /** Override the header padding. Defaults to compact. */
  headerClassName?: string
}

const ACCENT_CLASSES: Record<NonNullable<CollapsibleSectionProps['accent']>, string> = {
  default: 'border-l-border',
  emerald: 'border-l-emerald-500/40',
  amber: 'border-l-amber-500/40',
  rose: 'border-l-rose-500/40',
  sky: 'border-l-sky-500/40',
  violet: 'border-l-violet-500/40',
}

export function CollapsibleSection({
  title,
  subtitle,
  actions,
  accent = 'default',
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  headerClassName,
}: CollapsibleSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  const panelId = useId()

  const toggle = () => {
    const next = !isOpen
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div className={cn('rounded-lg border border-border/60 overflow-hidden', className)}>
      <div
        className={cn(
          'px-3 py-2 border-b border-border/40 bg-muted/30 border-l-2 flex items-center justify-between gap-2',
          ACCENT_CLASSES[accent],
          headerClassName,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {title && (
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide truncate">
              {title}
            </p>
          )}
          {subtitle && (
            <span className="text-[9px] text-muted-foreground/70 truncate">· {subtitle}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div id={panelId} role="region" aria-label={title ? `${title} content` : 'Section content'}>
          {children}
        </div>
      )}
    </div>
  )
}
