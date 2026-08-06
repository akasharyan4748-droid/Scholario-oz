'use client'

import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  TeacherRecord,
  PositionDefinition,
} from '@/lib/store/teachers-store'

interface Props {
  positions: PositionDefinition[]
  teachers: TeacherRecord[]
  onOpenAssignModal: () => void
  onOpenCustomModal: () => void
}

/**
 * Positions & Dynamic Permission Matrix section.
 *
 * Defined in the original `teachers.tsx` but never rendered in the visible
 * UI. Preserved here so the export surface stays identical to the
 * pre-refactor module — ready to wire up if the principal-panel ever
 * surfaces a "Positions" tab.
 */
export function PositionManagementSection({
  positions,
  teachers,
  onOpenAssignModal,
  onOpenCustomModal,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-6 backdrop-blur">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-bold">Positions & Dynamic Permission Matrix</h3>
            <p className="text-xs text-muted-foreground">Dynamic positions carry modular permissions. Non-hardcoded roles adapt teacher panel views upon acceptance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenCustomModal} className="text-xs">
              <Plus className="h-3.5 w-3.5" /> Create Custom Position
            </Button>
            <Button size="sm" onClick={onOpenAssignModal} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Shield className="h-3.5 w-3.5" /> Assign Position to Teacher
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((pos) => {
            const assignedTeachers = teachers.filter((t) =>
              t.positions.some((p) => p.positionId === pos.id && p.status === 'Active')
            )

            return (
              <div key={pos.id} className="rounded-2xl border border-border bg-card/40 p-4 space-y-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{pos.title}</h4>
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary mt-1">
                      {pos.category} {pos.isCustom && '· Custom'}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {assignedTeachers.length} Active Teachers
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{pos.description}</p>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Carried System Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {pos.permissions.slice(0, 4).map((p) => (
                      <span key={p} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                        {p}
                      </span>
                    ))}
                    {pos.permissions.length > 4 && (
                      <span className="text-[9px] text-primary font-medium">+{pos.permissions.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
