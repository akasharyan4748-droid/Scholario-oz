'use client'

/**
 * SS-1 — Settings → Notifications.
 *
 * Every channel below maps to a REAL feed surface (no categories for
 * removed modules): messages + announcements are enforced server-side
 * in /api/notifications-feed; timetable/exams/fees/library gate the
 * Notices feed items. Toggles save immediately (optimistic + revert),
 * persisted on the server (UserPreference), so they survive devices.
 */
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import {
  useStudentNotifPrefsStore,
  type StudentNotifPrefs,
} from '@/lib/store/student-notif-prefs-store'
import { SectionCard, ToggleRow, RowDivider, SettingsError, SettingsSkeleton } from './primitives'

const PREF_ROWS: { key: keyof StudentNotifPrefs; label: string; caption: string }[] = [
  { key: 'timetable', label: 'Timetable updates', caption: 'Changes published for your class' },
  { key: 'exams', label: 'Exams & results', caption: 'Exam schedules and result announcements' },
  { key: 'fees', label: 'Fees', caption: 'Term fee reminders' },
  { key: 'library', label: 'Library', caption: 'Overdue books and fines' },
  { key: 'messages', label: 'Messages', caption: 'New messages from teachers and school' },
  { key: 'announcements', label: 'Announcements', caption: 'School notices and events' },
]

export function NotificationsSection() {
  const prefs = useStudentNotifPrefsStore((s) => s.prefs)
  const setPref = useStudentNotifPrefsStore((s) => s.setPref)
  const sync = useStudentNotifPrefsStore((s) => s.sync)
  const [loaded, setLoaded] = useState(false)

  // First paint uses the localStorage cache; a single server GET confirms
  // the truth (StudentPanel hydrates globally — this is the safety net).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/student/settings', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          const server = j?.data?.notifications
          if (server && !cancelled) useStudentNotifPrefsStore.getState().hydrate(server)
        }
      } catch {
        /* cache stays in charge */
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Surface revert failures once (the store already reverted the value).
  useEffect(() => {
    if (sync === 'error') toast.error('Couldn\u2019t save that change — reverted.')
  }, [sync])

  const saving = sync === 'saving'

  return (
    <SectionCard icon={Bell} title="Notifications" caption="Applies to your bell feed and Notices">
      {!loaded ? (
        <SettingsSkeleton rows={5} />
      ) : prefs ? (
        <>
          <div className="divide-y divide-border/60">
            {PREF_ROWS.slice(0, 4).map((row) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                checked={prefs[row.key]}
                saving={saving}
                onChange={(v) => setPref(row.key, v)}
              />
            ))}
          </div>
          <RowDivider />
          <div className="divide-y divide-border/60">
            {PREF_ROWS.slice(4).map((row) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                checked={prefs[row.key]}
                saving={saving}
                onChange={(v) => setPref(row.key, v)}
              />
            ))}
          </div>
        </>
      ) : (
        <SettingsError />
      )}
    </SectionCard>
  )
}
