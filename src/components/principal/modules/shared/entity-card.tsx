'use client'

/**
 * EntityCard — universal SCHOLARIO entity presentation card.
 *
 * All entity cards (Subject, Teacher, Student, Class) share the same
 * visual grammar:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ [icon/avatar]  Primary name                 │
 *   │                CODE · CATEGORY              │
 *   │                Assigned teacher / metadata  │
 *   │                                  [Action]   │
 *   └─────────────────────────────────────────────┘
 *
 * Brief section 26: "universal entity-card system" — same surface, border,
 * radius, typography, metadata, spacing, hover, action treatment for all
 * entities. They can have different content but share the design family.
 *
 * Brief section 39: NO box-inside-box — EntityCard is a single surface.
 *
 * Brief section 40: typography hierarchy:
 *   - Primary name:    `text-sm font-medium text-foreground`
 *   - Code/category:   `text-[10px] text-muted-foreground`
 *   - Metadata:        `text-[10px] text-muted-foreground`
 *   - Action:          `text-[10px] font-medium`
 */
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EntityCardProps {
  /** Leading visual: icon for subjects, avatar tile for people. */
  leading?: ReactNode
  /** Primary name line (subject name, teacher name, etc.) */
  title: string
  /** Optional secondary line shown below the title (badge row, code · category). */
  secondary?: ReactNode
  /** Optional tertiary metadata line (e.g. "EMP-014 · Mathematics"). */
  metadata?: ReactNode
  /** Optional trailing action (Archive button, Edit button, etc.) */
  action?: ReactNode
  /** Optional click handler — when provided, card becomes a button with hover lift. */
  onClick?: () => void
  /** Optional className to override surface treatment. */
  className?: string
  /** Visual tone — affects hover border. Default 'default' (border). */
  tone?: 'default' | 'muted' | 'vacant'
}

export function EntityCard({
  leading,
  title,
  secondary,
  metadata,
  action,
  onClick,
  className,
  tone = 'default',
}: EntityCardProps) {
  const isVacant = tone === 'vacant'
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border/60 bg-card p-3 transition-colors',
        onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-sm',
        !onClick && tone === 'default' && 'hover:border-border',
        tone === 'muted' && 'border-border/40 bg-muted/30',
        isVacant && 'border-dashed border-border/40 bg-muted/20',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {leading && (
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              isVacant ? 'bg-muted/40 text-muted-foreground/60' : 'bg-muted text-foreground text-[10px] font-semibold'
            )}>
              {leading}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn(
              'text-sm font-medium truncate leading-tight',
              isVacant ? 'text-muted-foreground/60 italic' : 'text-foreground'
            )}>
              {title}
            </p>
            {secondary && (
              <div className="flex items-center gap-1.5 mt-1">{secondary}</div>
            )}
            {metadata && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight truncate">{metadata}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="shrink-0">{action}</div>
        )}
      </div>
    </div>
  )
}
