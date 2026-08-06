'use client'

import { motion } from 'framer-motion'
import { BadgeAlert, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PositionAssignment } from '@/lib/store/teachers-store'

interface PendingAssignmentsBannerProps {
  assignments: PositionAssignment[]
  onAccept: (paId: string, title: string) => void
  onDecline: (paId: string) => void
  onClarify: (paId: string) => void
}

export function PendingAssignmentsBanner({
  assignments,
  onAccept,
  onDecline,
  onClarify,
}: PendingAssignmentsBannerProps) {
  if (assignments.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      {assignments.map((pa) => (
        <motion.div
          key={pa.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 sm:p-5 shadow-lg backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                <BadgeAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-base text-foreground">
                    New Position Assignment Pending: <strong className="text-amber-600 dark:text-amber-400">{pa.positionTitle}</strong>
                  </span>
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]">
                    Action Required
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned by <strong className="font-semibold text-foreground">{pa.assignedBy}</strong> on {pa.assignedDate}. Accepting this responsibility will activate corresponding system permissions and modules.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onClarify(pa.id)}
                className="text-xs bg-background/80 hover:bg-accent border-amber-500/30"
              >
                Request Clarification
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(pa.id)}
                className="text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
              >
                <XCircle className="h-3.5 w-3.5" /> Decline
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(pa.id, pa.positionTitle)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept Position
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
