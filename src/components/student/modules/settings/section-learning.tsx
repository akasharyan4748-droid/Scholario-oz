'use client'

/**
 * SS-1 — Settings → Learning (Study Preferences).
 *
 * Only preferences with REAL consumers: flashcard reminders gate the
 * Dashboard "Flashcards Due" KPI + Up Next · REVIEW row; planner
 * reminders gate Up Next · TASK. Both persist server-side
 * (UserPreference.learning via /api/student/settings) so they follow
 * the student across devices.
 */
import { GraduationCap } from 'lucide-react'
import { useStudentNotifPrefsStore } from '@/lib/store/student-notif-prefs-store'
import { SectionCard, ToggleRow } from './primitives'

export function LearningSection() {
  const prefs = useStudentNotifPrefsStore((s) => s.learning)
  const setPref = useStudentNotifPrefsStore((s) => s.setLearningPref)
  const saving = useStudentNotifPrefsStore((s) => s.learningSync === 'saving')

  return (
    <SectionCard icon={GraduationCap} title="Study Preferences" caption="What your dashboard reminds you about">
      <div className="divide-y divide-border/60">
        <ToggleRow
          label="Flashcard reminders"
          caption="Show cards due for review on your dashboard"
          checked={prefs.flashcardReminders}
          saving={saving}
          onChange={(v) => setPref('flashcardReminders', v)}
          ariaLabel="Flashcard reminders"
        />
        <ToggleRow
          label="Study planner reminders"
          caption="Show your nearest upcoming study task on your dashboard"
          checked={prefs.plannerReminders}
          saving={saving}
          onChange={(v) => setPref('plannerReminders', v)}
          ariaLabel="Study planner reminders"
        />
      </div>
    </SectionCard>
  )
}
