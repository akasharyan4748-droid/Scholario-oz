'use client'

/**
 * TS-SETTINGS → Notifications.
 *
 * Five teacher channels. Parent messages + announcements are enforced
 * server-side in /api/notifications-feed (turning them off actually
 * silences the bell). attendance / academic / examDuty gate the matching
 * dashboard surfaces. Toggles save immediately (optimistic + revert) to
 * the server UserPreference row — they survive devices.
 */
import { Bell } from 'lucide-react'
import type { TeacherNotificationPrefs } from '@/lib/user-preferences'
import { useTeacherSettings } from './hooks'
import { SectionCard, ToggleRow, RowDivider, SettingsError, SettingsSkeleton } from './primitives'

const PREF_ROWS: { key: keyof TeacherNotificationPrefs; label: string; caption: string }[] = [
  { key: 'parentMessages', label: 'Parent messages', caption: 'New Parent Connect messages in your bell feed' },
  { key: 'announcements', label: 'Announcements', caption: 'School notices and events in your bell feed' },
  { key: 'examDuty', label: 'Examination duty', caption: 'Assigned invigilation duties and reminders' },
  { key: 'attendance', label: 'Attendance activity', caption: 'Class attendance summaries on your dashboard' },
  { key: 'academic', label: 'Academic activity', caption: 'Marks entry and lesson progress on your dashboard' },
]

export function NotificationsSection() {
  const { data, error, reload, savingKey, setNotificationPref } = useTeacherSettings()

  return (
    <SectionCard icon={Bell} title="Notifications" caption="Applies to your bell feed and dashboard">
      {error ? (
        <SettingsError onRetry={reload} />
      ) : !data ? (
        <SettingsSkeleton rows={5} />
      ) : (
        <>
          <div className="divide-y divide-border/60">
            {PREF_ROWS.slice(0, 2).map((row) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                checked={data.notifications[row.key]}
                saving={savingKey === row.key}
                onChange={(v) => void setNotificationPref(row.key, v)}
              />
            ))}
          </div>
          <RowDivider />
          <div className="divide-y divide-border/60">
            {PREF_ROWS.slice(2).map((row) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                checked={data.notifications[row.key]}
                saving={savingKey === row.key}
                onChange={(v) => void setNotificationPref(row.key, v)}
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
            Parent messages and announcements take effect in your notification bell immediately.
          </p>
        </>
      )}
    </SectionCard>
  )
}
