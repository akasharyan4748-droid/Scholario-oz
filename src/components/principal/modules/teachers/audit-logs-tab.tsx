'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRelativeTime, formatDate } from '@/lib/format'
import type { AuditLogItem } from '@/lib/store/teachers-store'

interface Props {
  auditLogs: AuditLogItem[]
}

/**
 * Audit Logs — concise activity feed (GitHub Activity / Linear style).
 *
 * No large heading, no descriptive paragraph. Each event is a compact
 * row with: status badge · teacher name · action · time · actor.
 */
export function AuditLogsTab({ auditLogs }: Props) {
  if (auditLogs.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
      {auditLogs.map((log) => {
        const isEmergency = log.isEmergencyOverride
        return (
          <div
            key={log.id}
            className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors flex items-center gap-3 flex-wrap"
          >
            {/* Status badge — color-coded by category */}
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-semibold shrink-0',
                isEmergency
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              )}
            >
              {log.category}
            </Badge>

            {/* Teacher + actor — single line */}
            <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-sm text-foreground truncate">{log.targetTeacherName}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{log.actorName}</span>
            </div>

            {/* Action details — muted mono, truncated */}
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[40%] hidden sm:block">
              {log.details}
            </p>

            {/* Time — relative + absolute on hover */}
            <span
              className="text-[11px] text-muted-foreground font-mono shrink-0 ml-auto"
              title={formatDate(log.timestamp)}
            >
              {formatRelativeTime(log.timestamp)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
