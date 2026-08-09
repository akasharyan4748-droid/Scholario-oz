'use client'

/**
 * SubjectCard — universal subject representation shared by:
 *   - Class Overview tab (read-only)
 *   - Class Subjects tab (with optional management actions)
 *
 * Visual language:
 *   - Compact premium card (single surface, no nested boxes)
 *   - Subject icon · name (primary)
 *   - Code badge · category (secondary)
 *   - Assigned teacher (tertiary, muted)
 *
 * The card never wraps another card around it. Action buttons (when enabled)
 * appear inline on the right, only visible when `manageable` is true.
 *
 * Brief sections 11, 12, 38, 39 — one universal SubjectCard used everywhere.
 */
import { BookOpen, Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getTeacherById } from '@/lib/mock/teachers'
import { SUBJECTS_BY_LEVEL } from '@/lib/store/students-store/constants'
import type { ClassRecord } from '@/lib/store/students-store'

export interface SubjectCardProps {
  /** Subject display name, e.g. "English" */
  subject: string
  /** Class context — used to resolve Core vs Elective category */
  cls: ClassRecord
  /** Optional assigned teacher id; resolved to teacher record */
  teacherId?: string
  /** When true, exposes the inline Archive action. Default false (read-only). */
  manageable?: boolean
  /** Optional handler invoked when user clicks Archive. Required when manageable=true. */
  onArchive?: (subject: string) => void
  /** Optional className to tweak card surface from caller */
  className?: string
}

export function SubjectCard({ subject, cls, teacherId, manageable = false, onArchive, className }: SubjectCardProps) {
  const levelSubjects = SUBJECTS_BY_LEVEL[cls.level] || []
  const category = levelSubjects.includes(subject) ? 'Core' : 'Elective'
  const code = subject.substring(0, 3).toUpperCase()
  const teacher = teacherId ? getTeacherById(teacherId) : null

  return (
    <div className={cn(
      'rounded-lg border border-border/60 bg-card p-3 hover:border-border transition-colors',
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground truncate">{subject}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{code}</Badge>
            <span className="text-[10px] text-muted-foreground">{category}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {teacher ? `${teacher.name} · ${teacher.employeeId}` : 'No teacher assigned'}
          </p>
        </div>
        {manageable && onArchive && (
          <button
            type="button"
            onClick={() => onArchive(subject)}
            className="text-[10px] text-amber-600 hover:text-amber-700 font-medium px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors shrink-0 inline-flex items-center gap-1"
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>
        )}
      </div>
    </div>
  )
}
