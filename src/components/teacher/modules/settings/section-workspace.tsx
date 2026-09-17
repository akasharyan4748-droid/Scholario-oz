'use client'

/**
 * TS-SETTINGS → Workspace Defaults.
 *
 * Default class: persisted server-side (UserPreference.workspace) and
 * validated against the teacher's authorized classes — Class Attendance
 * and other class-scoped modules start on this class.
 *
 * Academic session: school-managed, read-only here (it is NOT a teacher
 * decision — shown for context with the Managed by school marker).
 */
import { Briefcase, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeacherSettings } from './hooks'
import { SectionCard, InfoRow, SettingsError, SettingsSkeleton } from './primitives'

export function WorkspaceSection() {
  const { data, error, reload, savingKey, setDefaultClass } = useTeacherSettings()
  const saving = savingKey === 'defaultClassId'

  const selected = data?.workspace.defaultClassId ?? undefined
  const selectedLabel =
    data?.classes.find((c) => c.id === data.workspace.defaultClassId)?.label ?? undefined

  return (
    <SectionCard icon={Briefcase} title="Workspace Defaults" caption="Where class-scoped modules start">
      {error ? (
        <SettingsError onRetry={reload} />
      ) : !data ? (
        <SettingsSkeleton rows={3} />
      ) : (
        <>
          {data.classes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You have no assigned classes yet — a default class can be chosen once the school
              assigns your teaching load.
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-1">
              <div className="min-w-0">
                <p className="text-xs font-semibold">Default class</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Class Attendance opens on this class first.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-label="Saving" />}
                <Select
                  value={selected ?? 'none'}
                  onValueChange={(v) => void setDefaultClass(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[190px]" aria-label="Default class">
                    <SelectValue placeholder="First assigned class">
                      {selectedLabel ?? 'First assigned class'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">First assigned class</SelectItem>
                    {data.classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                        {c.isClassTeacher ? ' · Class Teacher' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-border/70">
            <div className="divide-y divide-border/60">
              <InfoRow
                label="Academic session"
                value={data.school.academicYear || '—'}
                managed
              />
              <InfoRow label="School" value={data.school.name ?? '—'} managed />
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
              The academic session is set by your school office for everyone — it changes only
              when they roll the school year forward.
            </p>
          </div>
        </>
      )}
    </SectionCard>
  )
}
