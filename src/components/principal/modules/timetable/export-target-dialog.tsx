'use client'

/**
 * ExportTargetDialog — compact target selector for class/teacher export.
 *
 * Brief section 1B + 1C: When user clicks Classwise or Teacherwise,
 * open this small dialog to select which class or teacher to export.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CLASSES } from './data'
import { teachers } from '@/lib/mock/teachers'

export interface ExportTarget {
  type: 'class' | 'teacher'
  target: string
}

export function ExportTargetDialog({
  open,
  onOpenChange,
  exportType,
  onExport,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  exportType: 'class' | 'teacher'
  onExport: (target: string) => void
}) {
  const [selected, setSelected] = useState<string>('')

  const label = exportType === 'class' ? 'class' : 'teacher'
  const title = exportType === 'class' ? 'Export Class Timetable' : 'Export Teacher Timetable'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-[10px]">Select a {label} to export.</DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder={`Select ${label}…`} />
            </SelectTrigger>
            <SelectContent>
              {exportType === 'class'
                ? CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                : teachers.filter((t) => !t.archived && t.status === 'Active').map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} · {t.department}</SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30"
            disabled={!selected}
            onClick={() => { onExport(selected); onOpenChange(false); setSelected('') }}
          >
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
