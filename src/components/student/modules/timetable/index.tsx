'use client'

/**
 * TimetableModule — Student Timetable.
 *
 * One canonical source (the Principal's published timetable store), two
 * purposeful views:
 *   - MY CLASS (default): the student's personal academic schedule
 *   - SCHOOL: read-only visibility across the whole school
 *
 * My Class answers "what do I have today / this week?" in one glance;
 * School answers "what is happening across my school?" without any of the
 * Principal's management density. The toggle lives up front — never buried.
 */
import { useState } from 'react'
import { CalendarDays, GraduationCap, Building2 } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
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
  const myClass = student ? `${student.className}-${student.section}` : 'Class 2-A'
  const rawSession = useSchoolSettingsStore((s) => s.academics?.currentSession)
  const sessionLabel = formatSessionLabel(normalizeSessionId(rawSession) ?? ACTIVE_SESSION_ID)

  return (
    <PageTransition>
      <div className="space-y-5">
        <SectionHeading
          title="Timetable"
          subtitle={`${myClass} · ${sessionLabel}`}
          icon={<CalendarDays className="h-5 w-5" />}
          action={
            <div className="inline-flex overflow-hidden rounded-lg border border-border bg-card p-0.5 shadow-2xs" role="tablist" aria-label="Timetable view">
              <button
                role="tab"
                aria-selected={view === 'my-class'}
                onClick={() => setView('my-class')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
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
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                  view === 'school' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Building2 className="h-3.5 w-3.5" aria-hidden /> School
              </button>
            </div>
          }
        />

        {view === 'my-class' ? (
          <ClassView className={myClass} sessionLabel={sessionLabel} slots={publishedSlots} publications={publications} />
        ) : (
          <SchoolView slots={publishedSlots} />
        )}
      </div>
    </PageTransition>
  )
}
