'use client'

/**
 * TimetableModule — Student Timetable.
 *
 * One canonical source (the Principal's published timetable store), two
 * genuinely DIFFERENT reading experiences:
 *   - MY CLASS (default): the student's personal schedule as a vertical,
 *     chronological timeline — enrollment resolves the class, never the
 *     student
 *   - SCHOOL: the read-only MASTER TIMETABLE sheet — full week, every
 *     class, every period
 *
 * The app header already says "Timetable", so the views themselves open
 * with their own context (MY CLASS / Class 2-A · Section A / session or
 * SCHOOL / Master Timetable) — never a repeated big page title.
 */
import { useState } from 'react'
import { GraduationCap, Building2 } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { useTimetableStore } from '@/lib/store/timetable-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACTIVE_SESSION_ID, normalizeSessionId, formatSessionLabel } from '@/lib/academic-session'
import { ClassView } from './class-view'
import { SchoolView } from './school-view'

/** The canonical demo student (single roster backs every role). */
const STUDENT_ID = 'STU-58'

export function TimetableModule() {
  const [view, setView] = useState<'my-class' | 'school'>('my-class')

  // ── Canonical data (live-synced with the Principal's publications) ──
  const publishedSlots = useTimetableStore((s) => s.publishedSlots)
  const publications = useTimetableStore((s) => s.publications)

  // ── Identity — enrollment decides the class, settings decide the session ──
  const student = useStudentsStore((s) => s.students.find((x) => x.id === STUDENT_ID))
  const classLabel = student ? `${student.className}-${student.section}` : 'Class 2-A'
  const section = student?.section ?? 'A'
  const rawSession = useSchoolSettingsStore((s) => s.academics?.currentSession)
  const sessionLabel = formatSessionLabel(normalizeSessionId(rawSession) ?? ACTIVE_SESSION_ID)
  const schoolName = useSchoolSettingsStore((s) => s.general?.schoolName) ?? 'Your school'

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-5">
        {/* The one prominent control: which timetable am I reading? */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-border bg-card p-0.5 shadow-2xs" role="tablist" aria-label="Timetable view">
            <button
              role="tab"
              aria-selected={view === 'my-class'}
              onClick={() => setView('my-class')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-all',
                view === 'my-class' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden /> My Class
            </button>
            <button
              role="tab"
              aria-selected={view === 'school'}
              onClick={() => setView('school')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-all',
                view === 'school' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden /> School
            </button>
          </div>
          <p className="text-xs text-muted-foreground/80">
            {view === 'my-class' ? 'Your personal class schedule' : 'Your school’s full master timetable'}
          </p>
        </div>

        {view === 'my-class' ? (
          <ClassView
            classLabel={classLabel}
            section={section}
            sessionLabel={sessionLabel}
            slots={publishedSlots}
            publications={publications}
          />
        ) : (
          <SchoolView
            slots={publishedSlots}
            schoolName={schoolName}
            sessionLabel={sessionLabel}
            myClass={classLabel}
          />
        )}
      </div>
    </PageTransition>
  )
}
