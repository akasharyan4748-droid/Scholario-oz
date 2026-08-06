'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  SettingsCard, SettingsCardSection, ToggleRow, ValueRow, ActionBar,
} from '@/components/principal/modules/shared/settings-primitives'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Lock, SlidersHorizontal, Stethoscope, Bus, Award, FileStack,
} from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

/**
 * GeneralTab — the broadest settings for the Admissions module.
 *
 * Toggle-style flags (Medical / Transport / Hostel / etc.) are applied
 * immediately and toast-confirm — the user sees the effect at once.
 *
 * "Soft" settings that affect multiple downstream computations
 * (Privacy, Duplicate Detection, Rejection Retention, Custom Fields) are
 * queued in local state and committed via the sticky ActionBar's Save
 * button. The bar appears only when there are unsaved changes.
 */
export function GeneralTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags

  // ---- Local draft state for "soft" settings (Privacy, Dup, Retention, Custom Fields) ----
  const initialDraft = useMemo(() => ({
    showPersonalDataOnLetter: settings.showPersonalDataOnLetter,
    dupEnabled: settings.duplicateDetection.enabled,
    retentionDays: settings.rejectionRetentionDays || 60,
    enableCustomFields: flags.enableCustomFields,
  }), [settings.showPersonalDataOnLetter, settings.duplicateDetection.enabled,
       settings.rejectionRetentionDays, flags.enableCustomFields])

  const [draft, setDraft] = useState(initialDraft)
  const [saving, setSaving] = useState(false)

  // Re-sync when the store catches up from elsewhere.
  useEffect(() => { setDraft(initialDraft) }, [initialDraft])

  const dirty = (
    draft.showPersonalDataOnLetter !== initialDraft.showPersonalDataOnLetter ||
    draft.dupEnabled !== initialDraft.dupEnabled ||
    draft.retentionDays !== initialDraft.retentionDays ||
    draft.enableCustomFields !== initialDraft.enableCustomFields
  )

  const handleDiscard = () => {
    setDraft(initialDraft)
    toast.info('Changes discarded')
  }

  const handleSave = () => {
    setSaving(true)
    try {
      store.updateAdmissionSettings({
        showPersonalDataOnLetter: draft.showPersonalDataOnLetter,
        rejectionRetentionDays: draft.retentionDays,
      })
      store.updateDuplicateDetection({ enabled: draft.dupEnabled })
      store.updateAdmissionFeatureFlags({ enableCustomFields: draft.enableCustomFields } as any)
      toast.success('Settings saved')
    } catch (e) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ---- Immediate-effect toggles (medical, transport, hostel, financial, docs) ----
  const toggleImmediate = (key: keyof typeof flags) => {
    store.updateAdmissionFeatureFlags({ [key]: !flags[key] } as any)
    toast.success(`${FLAG_LABELS[key]} ${flags[key] ? 'disabled' : 'enabled'}`)
  }

  return (
    <>
      <SettingsCard>
        {/* Privacy — soft setting (queued for Save) */}
        <SettingsCardSection title="Privacy" icon={Lock} defaultOpen>
          <ToggleRow
            label="Sensitive Data Protection"
            checked={!draft.showPersonalDataOnLetter}
            onCheckedChange={(v) => setDraft({ ...draft, showPersonalDataOnLetter: !v })}
          />
        </SettingsCardSection>

        {/* Duplicate Detection — soft setting (queued for Save) */}
        <SettingsCardSection title="Duplicate Detection" icon={SlidersHorizontal} defaultOpen>
          <ToggleRow
            label="Enable Duplicate Detection"
            checked={draft.dupEnabled}
            onCheckedChange={(v) => setDraft({ ...draft, dupEnabled: v })}
          />
        </SettingsCardSection>

        {/* Medical — immediate */}
        <SettingsCardSection title="Medical" icon={Stethoscope}>
          <ToggleRow
            label="Medical Section"
            checked={flags.enableMedical}
            onCheckedChange={() => toggleImmediate('enableMedical')}
          />
        </SettingsCardSection>

        {/* Transport & Hostel — immediate */}
        <SettingsCardSection title="Transport & Hostel" icon={Bus}>
          <ToggleRow label="Transport Facility" checked={flags.enableTransport}
            onCheckedChange={() => toggleImmediate('enableTransport')} />
          <ToggleRow label="Hostel Facility" checked={flags.enableHostel}
            onCheckedChange={() => toggleImmediate('enableHostel')} />
        </SettingsCardSection>

        {/* Financial — immediate */}
        <SettingsCardSection title="Financial" icon={Award}>
          <ToggleRow label="Scholarship" checked={flags.enableScholarship}
            onCheckedChange={() => toggleImmediate('enableScholarship')} />
          <ToggleRow label="Fee Waiver" checked={flags.enableFeeWaiver}
            onCheckedChange={() => toggleImmediate('enableFeeWaiver')} />
        </SettingsCardSection>

        {/* Documents — immediate */}
        <SettingsCardSection title="Documents" icon={FileStack}>
          <ToggleRow label="Student Photo" checked={flags.enableStudentPhoto}
            onCheckedChange={() => toggleImmediate('enableStudentPhoto')} />
          <ToggleRow label="Parent Photo" checked={flags.enableParentPhoto}
            onCheckedChange={() => toggleImmediate('enableParentPhoto')} />
          <ToggleRow label="Signature Upload" checked={flags.enableSignature}
            onCheckedChange={() => toggleImmediate('enableSignature')} />
        </SettingsCardSection>

        {/* Advanced — Custom Fields is soft (queued), Retention is soft (queued) */}
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

      <ActionBar
        dirty={dirty}
        saving={saving}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </>
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
