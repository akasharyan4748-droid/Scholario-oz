'use client'

/**
 * SubjectCard — universal subject entity presentation.
 *
 * Built on the shared `EntityCard` primitive — same surface / border /
 * typography / spacing as TeacherCard, StudentCard, etc.
 *
 * Brief section 11 + 12: ONE SubjectCard used by both Overview (read-only)
 * and Subjects (management) tabs. Variant is selected via the `manageable`
 * prop — no markup duplication.
 *
 * Brief section 14: Normal mode stays clean. Management mode reveals
 * the Archive action intentionally — destructive actions are NOT exposed
 * constantly to prevent accidental clicks.
 *
 * Brief section 38: Same visual grammar as TeacherCard.
 */
import { BookOpen, Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EntityCard } from '../../shared/entity-card'
import { SUBJECTS_BY_LEVEL } from '@/lib/store/students-store/constants'
import { getTeacherById } from '@/lib/mock/teachers'
import type { ClassRecord } from '@/lib/store/students-store'

export interface SubjectCardProps {
  /** Subject display name, e.g. "English" */
  subject: string
  /** Class context — used to resolve Core vs Elective + look up assigned teacher */
  cls: ClassRecord
  /** When true, exposes the inline Archive action. Default false (read-only). */
  manageable?: boolean
  /** Optional handler invoked when user clicks Archive. Required when manageable=true. */
  onArchive?: (subject: string) => void
  /** Optional className to tweak surface from caller */
  className?: string
}

export function SubjectCard({ subject, cls, manageable = false, onArchive, className }: SubjectCardProps) {
  const levelSubjects = SUBJECTS_BY_LEVEL[cls.level] || []
  const category = levelSubjects.includes(subject) ? 'Core' : 'Elective'
  const code = subject.substring(0, 3).toUpperCase()
  const teacherId = cls.subjectTeachers?.[subject]
  const teacher = teacherId ? getTeacherById(teacherId) : null

  return (
    <EntityCard
      className={className}
      leading={<BookOpen className="h-3.5 w-3.5 text-primary" />}
      title={subject}
      secondary={
        <>
          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{code}</Badge>
          <span className="text-[10px] text-muted-foreground">{category}</span>
        </>
      }
      metadata={teacher ? `${teacher.name} · ${teacher.employeeId}` : 'No teacher assigned'}
      action={
        manageable && onArchive ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onArchive(subject) }}
            className="text-[10px] text-amber-600 hover:text-amber-700 font-medium px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors inline-flex items-center gap-1"
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>
        ) : undefined
      }
    />
  )
}
