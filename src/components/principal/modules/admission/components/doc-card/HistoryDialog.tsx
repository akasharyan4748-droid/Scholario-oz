'use client'

import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AuditLogEntry, DocItem } from './types'

interface HistoryDialogProps {
  doc: DocItem
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  historyLogs: AuditLogEntry[]
}

/**
 * Document audit trail modal: header with History icon + title + doc name,
 * a vertical timeline of audit log entries (action, timestamp, actor,
 * details), and a Close History footer.
 */
export function HistoryDialog({
  doc,
  isOpen,
  onOpenChange,
  historyLogs,
}: HistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border shadow-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Document Audit Trail
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Complete activity and verification log for {doc.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {historyLogs.map((log, idx) => (
            <div
              key={log.id}
              className="relative pl-5 pb-3 border-l-2 border-border/80 last:border-l-transparent last:pb-0"
            >
              <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>{log.action}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {log.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Actor: <strong className="text-foreground">{log.actor}</strong>
              </p>
              <p className="text-[11px] text-muted-foreground/90 mt-0.5 bg-muted/30 p-2 rounded border border-border/40">
                {log.details}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close History
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
