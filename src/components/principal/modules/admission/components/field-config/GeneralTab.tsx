'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  SettingsCard, SettingsCardSection, ToggleRow, ValueRow,
} from '@/components/principal/modules/shared/settings-primitives'
import { useDirtyState } from '@/components/principal/modules/shared/use-settings-dirty'
import { Input } from '@/components/ui/input'
import {
  Lock, SlidersHorizontal, Stethoscope, Bus, Award, FileStack,
} from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

/**
 * GeneralTab — broad Admission Settings.
 *
 * Per spec: EVERY setting must trigger the global dirty state and reveal
 * the sticky Save/Discard bar. So all toggles are tracked in a local
 * draft and committed only when the user clicks Save. Nothing applies
 * immediately — the user always gets a chance to Discard.
 */
export function GeneralTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags

  // Draft state for ALL settings on this tab (single source of truth).
  const initial = useMemo(() => ({
    showPersonalDataOnLetter: settings.showPersonalDataOnLetter,
    dupEnabled: settings.duplicateDetection.enabled,
    retentionDays: settings.rejectionRetentionDays || 60,
    enableCustomFields: flags.enableCustomFields,
    enableMedical: flags.enableMedical,
    enableTransport: flags.enableTransport,
    enableHostel: flags.enableHostel,
    enableScholarship: flags.enableScholarship,
    enableFeeWaiver: flags.enableFeeWaiver,
    enableStudentPhoto: flags.enableStudentPhoto,
    enableParentPhoto: flags.enableParentPhoto,
    enableSignature: flags.enableSignature,
  }), [settings.showPersonalDataOnLetter, settings.duplicateDetection.enabled,
       settings.rejectionRetentionDays, flags])

  const [draft, setDraft] = useState(initial)

  // Re-sync when store catches up from elsewhere (e.g. after Save).
  useEffect(() => { setDraft(initial) }, [initial])

  // Compute dirty by JSON compare — any change in any field flips this.
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  )

  // Save commits every draft field to the real store at once.
  const save = useCallback(async () => {
    store.updateAdmissionSettings({
      showPersonalDataOnLetter: draft.showPersonalDataOnLetter,
      rejectionRetentionDays: draft.retentionDays,
    })
    store.updateDuplicateDetection({ enabled: draft.dupEnabled })
    store.updateAdmissionFeatureFlags({
      enableCustomFields: draft.enableCustomFields,
      enableMedical: draft.enableMedical,
      enableTransport: draft.enableTransport,
      enableHostel: draft.enableHostel,
      enableScholarship: draft.enableScholarship,
      enableFeeWaiver: draft.enableFeeWaiver,
      enableStudentPhoto: draft.enableStudentPhoto,
      enableParentPhoto: draft.enableParentPhoto,
      enableSignature: draft.enableSignature,
    } as any)
  }, [draft, store])

  const discard = useCallback(() => {
    setDraft(initial)
  }, [initial])

  // Register this tab's dirty + commit fns with the global provider.
  useDirtyState('admission-general', dirty, save, discard)

  // Helper to flip a single draft boolean.
  const toggle = (key: keyof typeof draft) => (v: boolean) =>
    setDraft((prev) => ({ ...prev, [key]: v }))

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
          onCheckedChange={toggle('dupEnabled')}
        />
      </SettingsCardSection>

      <SettingsCardSection title="Medical" icon={Stethoscope}>
        <ToggleRow label="Medical Section" checked={draft.enableMedical}
          onCheckedChange={toggle('enableMedical')} />
      </SettingsCardSection>

      <SettingsCardSection title="Transport & Hostel" icon={Bus}>
        <ToggleRow label="Transport Facility" checked={draft.enableTransport}
          onCheckedChange={toggle('enableTransport')} />
        <ToggleRow label="Hostel Facility" checked={draft.enableHostel}
          onCheckedChange={toggle('enableHostel')} />
      </SettingsCardSection>

      <SettingsCardSection title="Financial" icon={Award}>
        <ToggleRow label="Scholarship" checked={draft.enableScholarship}
          onCheckedChange={toggle('enableScholarship')} />
        <ToggleRow label="Fee Waiver" checked={draft.enableFeeWaiver}
          onCheckedChange={toggle('enableFeeWaiver')} />
      </SettingsCardSection>

      <SettingsCardSection title="Documents" icon={FileStack}>
        <ToggleRow label="Student Photo" checked={draft.enableStudentPhoto}
          onCheckedChange={toggle('enableStudentPhoto')} />
        <ToggleRow label="Parent Photo" checked={draft.enableParentPhoto}
          onCheckedChange={toggle('enableParentPhoto')} />
        <ToggleRow label="Signature Upload" checked={draft.enableSignature}
          onCheckedChange={toggle('enableSignature')} />
      </SettingsCardSection>

      <SettingsCardSection title="Advanced" icon={SlidersHorizontal}>
        <ToggleRow label="Custom Fields" checked={draft.enableCustomFields}
          onCheckedChange={toggle('enableCustomFields')} />
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
