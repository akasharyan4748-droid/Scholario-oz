'use client'

import { UserCheck } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTeacherById } from '@/lib/mock/teachers'
import { type ClassRecord } from '@/lib/store/students-store'
import { toast } from 'sonner'

export function TeachersPanel({
  classRecord, teacher,
}: {
  classRecord: ClassRecord
  teacher: ReturnType<typeof getTeacherById>
}) {
  return (
    <div className="space-y-3">
      {teacher && (
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-primary" /> Class Teacher Assignment</h4>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <GradientAvatar name={teacher.name} initials={teacher.avatar} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{teacher.name}</p>
              <p className="text-xs text-muted-foreground">{teacher.designation} · {teacher.department}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{teacher.experience} years · {teacher.qualification}</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Since 2024</Badge>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.info('Replace class teacher')}>Replace</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.info('Temporary assignment')}>Temporary</Button>
          </div>
        </div>
      )}
    </div>
  )
}
