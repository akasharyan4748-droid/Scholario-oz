'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  SettingsCard, SettingsCardSection, ToggleRow, ValueRow,
} from '@/components/principal/modules/shared/settings-primitives'
import { useDirtyState } from '@/components/principal/modules/shared/use-settings-dirty'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Lock, SlidersHorizontal, Stethoscope, Bus, Award, FileStack,
} from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

/**
 * GeneralTab — broad Admission Settings.
 *
 * Settings split into two categories:
 *  - "Soft" (Privacy, Duplicate Detection, Rejection Retention, Custom Fields):
 *    tracked in local draft, committed via the global ActionBar at page level.
 *  - "Immediate" (Medical, Transport, Hostel, Scholarship, Fee Waiver, Photos):
 *    applied instantly with toast confirmation — they take effect at once.
 */
export function GeneralTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags

  // Draft state for soft settings
  const initial = useMemo(() => ({
    showPersonalDataOnLetter: settings.showPersonalDataOnLetter,
    dupEnabled: settings.duplicateDetection.enabled,
    retentionDays: settings.rejectionRetentionDays || 60,
    enableCustomFields: flags.enableCustomFields,
  }), [settings.showPersonalDataOnLetter, settings.duplicateDetection.enabled,
       settings.rejectionRetentionDays, flags.enableCustomFields])

  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)

  // Re-sync when store catches up from elsewhere
  useEffect(() => { setDraft(initial) }, [initial])

  // Compute dirty by JSON compare
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  )

  // Stable save + discard fns (recreated only when draft/initial changes)
  const save = useCallback(async () => {
    setSaving(true)
    try {
      store.updateAdmissionSettings({
        showPersonalDataOnLetter: draft.showPersonalDataOnLetter,
        rejectionRetentionDays: draft.retentionDays,
      })
      store.updateDuplicateDetection({ enabled: draft.dupEnabled })
      store.updateAdmissionFeatureFlags({ enableCustomFields: draft.enableCustomFields } as any)
    } finally {
      setSaving(false)
    }
  }, [draft, store])

  const discard = useCallback(() => {
    setDraft(initial)
  }, [initial])

  // Register this tab's dirty + commit fns with the global provider
  useDirtyState('admission-general', dirty, save, discard)

  // Immediate-effect toggles
  const toggleImmediate = (key: keyof typeof flags) => {
    store.updateAdmissionFeatureFlags({ [key]: !flags[key] } as any)
    toast.success(`${FLAG_LABELS[key]} ${flags[key] ? 'disabled' : 'enabled'}`)
  }

  void saving

  return (
    <SettingsCard>
      <SettingsCardSection title="Privacy" icon={Lock} defaultOpen>
        <ToggleRow
          label="Sensitive Data Protection"
          checked={!draft.showPersonalDataOnLetter}
          onCheckedChange={(v) => setDraft({ ...draft, showPersonalDataOnLetter: !v })}
        />
      </SettingsCardSection>

      <SettingsCardSection title="Duplicate Detection" icon={SlidersHorizontal} defaultOpen>
        <ToggleRow
          label="Enable Duplicate Detection"
          checked={draft.dupEnabled}
          onCheckedChange={(v) => setDraft({ ...draft, dupEnabled: v })}
        />
      </SettingsCardSection>

      <SettingsCardSection title="Medical" icon={Stethoscope}>
        <ToggleRow label="Medical Section" checked={flags.enableMedical}
          onCheckedChange={() => toggleImmediate('enableMedical')} />
      </SettingsCardSection>

      <SettingsCardSection title="Transport & Hostel" icon={Bus}>
        <ToggleRow label="Transport Facility" checked={flags.enableTransport}
          onCheckedChange={() => toggleImmediate('enableTransport')} />
        <ToggleRow label="Hostel Facility" checked={flags.enableHostel}
          onCheckedChange={() => toggleImmediate('enableHostel')} />
      </SettingsCardSection>

      <SettingsCardSection title="Financial" icon={Award}>
        <ToggleRow label="Scholarship" checked={flags.enableScholarship}
          onCheckedChange={() => toggleImmediate('enableScholarship')} />
        <ToggleRow label="Fee Waiver" checked={flags.enableFeeWaiver}
          onCheckedChange={() => toggleImmediate('enableFeeWaiver')} />
      </SettingsCardSection>

      <SettingsCardSection title="Documents" icon={FileStack}>
        <ToggleRow label="Student Photo" checked={flags.enableStudentPhoto}
          onCheckedChange={() => toggleImmediate('enableStudentPhoto')} />
        <ToggleRow label="Parent Photo" checked={flags.enableParentPhoto}
          onCheckedChange={() => toggleImmediate('enableParentPhoto')} />
        <ToggleRow label="Signature Upload" checked={flags.enableSignature}
          onCheckedChange={() => toggleImmediate('enableSignature')} />
      </SettingsCardSection>

      <SettingsCardSection title="Advanced" icon={SlidersHorizontal}>
        <ToggleRow label="Custom Fields" checked={draft.enableCustomFields}
          onCheckedChange={(v) => setDraft({ ...draft, enableCustomFields: v })} />
        <ValueRow label="Rejection Retention">
          <div className="flex items-center gap-2">
            <Input type="number" min={30} max={90} value={draft.retentionDays}
              onChange={(e) => setDraft({
                ...draft,
                retentionDays: Math.max(30, Math.min(90, parseInt(e.target.value) || 60)),
              })}
              className="w-16 h-7 text-center text-xs" />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </ValueRow>
      </SettingsCardSection>
    </SettingsCard>
  )
}

const FLAG_LABELS: Record<string, string> = {
  enableMedical: 'Medical Section',
  enableHostel: 'Hostel Facility',
  enableTransport: 'Transport Facility',
  enableScholarship: 'Scholarship',
  enableFeeWaiver: 'Fee Waiver',
  enableStudentPhoto: 'Student Photo',
  enableParentPhoto: 'Parent Photo',
  enableSignature: 'Signature Upload',
  enableCustomFields: 'Custom Fields',
}
