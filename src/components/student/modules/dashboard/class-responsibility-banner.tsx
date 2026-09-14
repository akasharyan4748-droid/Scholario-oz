'use client'

/**
 * ClassResponsibilityBanner — subtle "Class Responsibility" strip on the
 * student dashboard (spec §23). Appears ONLY while the student holds an
 * active position; the dashboard layout itself is unchanged otherwise.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Megaphone, ListTodo, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import { POSITION_DEFS, hasCapability, filterActivePositions } from '@/lib/student-positions'
import { useAcademicSession } from '@/lib/academic-session'
import { formatDate } from '@/lib/format'
import { DEMO_STUDENT_ID } from '../applications/student'

export function ClassResponsibilityBanner({ onNavigate }: { onNavigate: (key: string) => void }) {
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  // RB-1 — canonical session-scoped activity resolver (raw array + useMemo
  // keeps the zustand v5 selector on a stable ref).
  const allPositions = useStudentsStore((s) => s.studentPositions)
  const sessionId = useAcademicSession().id
  const positions = useMemo(
    () => filterActivePositions(allPositions, DEMO_STUDENT_ID, sessionId),
    [allPositions, sessionId],
  )

  if (!student || positions.length === 0) return null
  const primary = positions[0]
  const title = POSITION_DEFS[primary.key]?.title ?? 'Class Responsibility'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-3.5 sm:p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{title}</p>
            <span className="text-xs text-muted-foreground">
              {student.className}-{student.section} · since {formatDate(primary.assignedOn)} · by {primary.assignedByName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            You can post class updates, report issues and coordinate class activities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasCapability(positions, 'post-class-updates') && (
            <button
              onClick={() => onNavigate('my-class')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm',
                'hover:shadow-md hover:bg-primary/90 transition-all',
              )}
            >
              <Megaphone className="h-3.5 w-3.5" /> Class updates
            </button>
          )}
          {hasCapability(positions, 'view-class-tasks') && (
            <button
              onClick={() => onNavigate('my-class')}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-background px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <ListTodo className="h-3.5 w-3.5" /> My tasks <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
