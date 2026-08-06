'use client'

import { FileSpreadsheet } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { AuditLogItem } from '@/lib/store/teachers-store'

interface Props {
  auditLogs: AuditLogItem[]
}

/**
 * Activity Audit Logs tab — immutable audit trail of teacher lifecycle events.
 */
export function AuditLogsTab({ auditLogs }: Props) {
  return (
    <GlassCard className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-base">Teacher Lifecycle Activity & Audit Trail</h3>
          <p className="text-xs text-muted-foreground">Immutable audit records for teacher registration, position assignments, emergency overrides, and salary updates.</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {auditLogs.length} Logged Events
        </Badge>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-3.5 bg-card/40 hover:bg-card/70 transition-colors flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold',
                    log.isEmergencyOverride
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-primary/30 bg-primary/10 text-primary'
                  )}
                >
                  {log.category}
                </Badge>
                <span className="font-bold text-xs text-foreground">{log.targetTeacherName}</span>
                <span className="text-xs text-muted-foreground">by {log.actorName} ({log.actorRole})</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted/40 p-1.5 rounded">{log.details}</p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground shrink-0 font-mono">
              {formatDate(log.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
