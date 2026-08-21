'use client'

/**
 * comm-shared — Shared primitives for the Communication Center.
 *
 * - CommTab type
 * - CategoryBadge (semantic colors)
 * - StatusBadge
 * - ChannelBadge
 * - AudienceBadge
 * - CommPanel (rounded card)
 * - EmptyState
 * - COMM_GLOBAL_STYLES for reduced motion
 */

import { motion } from 'framer-motion'
import { Smartphone, MessageSquare, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnnouncementCategory, Channel, CommStatus } from '@/lib/store/communication-store'

// ─── Tab type ────────────────────────────────────────────────────────

export type CommTab = 'announcements' | 'circulars' | 'compose' | 'history'

// ─── Category accents ────────────────────────────────────────────────

const CATEGORY_ACCENTS: Record<AnnouncementCategory, { bg: string; text: string; border: string; icon: string }> = {
  Academic: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/20', icon: 'bg-violet-500/10 text-violet-600' },
  Event: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-600' },
  Holiday: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/20', icon: 'bg-amber-500/10 text-amber-600' },
  General: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-500/20', icon: 'bg-sky-500/10 text-sky-600' },
  Emergency: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/20', icon: 'bg-rose-500/10 text-rose-600' },
  Parents: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-600' },
  Transport: { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-500/20', icon: 'bg-cyan-500/10 text-cyan-600' },
  Examination: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/20', icon: 'bg-violet-500/10 text-violet-600' },
}

export function categoryAccent(c: AnnouncementCategory) {
  return CATEGORY_ACCENTS[c] ?? CATEGORY_ACCENTS.General
}

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const a = categoryAccent(category)
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold', a.bg, a.text)}>
      {category}
    </span>
  )
}

// ─── Status accents ──────────────────────────────────────────────────

export function statusAccent(s: CommStatus): string {
  switch (s) {
    case 'Sent': case 'Delivered': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'Scheduled': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'Draft': return 'bg-muted text-muted-foreground'
    case 'Partially Delivered': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'Failed': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'Archived': return 'bg-muted/60 text-muted-foreground line-through'
  }
}

export function StatusBadge({ status }: { status: CommStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', statusAccent(status))}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

// ─── Channel icons ────────────────────────────────────────────────────

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  switch (channel) {
    case 'Push': return <Smartphone className={className} />
    case 'SMS': return <MessageSquare className={className} />
    case 'Email': return <Mail className={className} />
  }
}

export function ChannelBadge({ channels }: { channels: Channel[] }) {
  return (
    <div className="inline-flex items-center gap-1">
      {channels.map((c) => (
        <span key={c} className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium',
          c === 'Push' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' :
          c === 'SMS' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
          'bg-amber-500/10 text-amber-700 dark:text-amber-300',
        )}>
          <ChannelIcon channel={c} className="h-2.5 w-2.5" />
          {c}
        </span>
      ))}
    </div>
  )
}

// ─── Audience badge ──────────────────────────────────────────────────

export function AudienceBadge({ audience }: { audience: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-muted/60 text-muted-foreground">
      {audience}
    </span>
  )
}

// ─── CommPanel ────────────────────────────────────────────────────────

interface PanelProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function CommPanel({ title, subtitle, action, children, className, bodyClassName }: PanelProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <div className="min-w-0">
            {title && <p className="text-xs font-semibold tracking-tight">{title}</p>}
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────

export function CommEmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

// ─── Reduced motion styles ───────────────────────────────────────────

export const COMM_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .comm-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
