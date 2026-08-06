'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  PageHeader, SegmentedTabs, SettingsCard, SettingsCardSection,
  ToggleRow, ValueRow, ActionBar,
} from '@/components/principal/modules/shared/settings-primitives'
import { Input } from '@/components/ui/input'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  IdCard, Workflow, FileStack, Wallet, Calendar, SlidersHorizontal,
} from 'lucide-react'
import { useTeacherSettingsStore } from './teacher-settings-store'

type TabId = 'general' | 'documents' | 'integration'

const TABS: Array<{ value: TabId; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'documents', label: 'Documents' },
  { value: 'integration', label: 'Integration' },
]

/**
 * TeacherSettingsPage — full-page settings sub-route for the Teachers module.
 *
 * Same architecture as AdmissionSettingsPage: PageHeader with Back button +
 * SegmentedTabs, sticky ActionBar with Discard/Save (Save disabled until
 * dirty).
 */
export function TeacherSettingsPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>('general')
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Teacher Settings"
        subtitle="ID generation, joining workflow, document requirements, payroll."
        onBack={onBack}
        actions={<SegmentedTabs value={tab} onValueChange={setTab} tabs={TABS} />}
      />
      {tab === 'general' && <GeneralTab />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'integration' && <IntegrationTab />}
    </div>
  )
}

/* ---------------- General tab ---------------- */

function GeneralTab() {
  const store = useTeacherSettingsStore()
  const initial = useMemo(() => ({
    teacherIdPrefix: store.teacherIdPrefix,
    teacherIdDigits: store.teacherIdDigits,
    joiningWorkflow: store.joiningWorkflow,
    probationMonths: store.probationMonths,
    defaultNoticePeriodDays: store.defaultNoticePeriodDays,
    enableCustomFields: store.flags.enableCustomFields,
  }), [store.teacherIdPrefix, store.teacherIdDigits, store.joiningWorkflow,
       store.probationMonths, store.defaultNoticePeriodDays, store.flags.enableCustomFields])

  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setDraft(initial) }, [initial])

  const dirty = (
    draft.teacherIdPrefix !== initial.teacherIdPrefix ||
    draft.teacherIdDigits !== initial.teacherIdDigits ||
    draft.joiningWorkflow !== initial.joiningWorkflow ||
    draft.probationMonths !== initial.probationMonths ||
    draft.defaultNoticePeriodDays !== initial.defaultNoticePeriodDays ||
    draft.enableCustomFields !== initial.enableCustomFields
  )

  const handleDiscard = () => { setDraft(initial); toast.info('Changes discarded') }
  const handleSave = () => {
    setSaving(true)
    try {
      store.updateSettings({
        teacherIdPrefix: draft.teacherIdPrefix,
        teacherIdDigits: draft.teacherIdDigits,
        joiningWorkflow: draft.joiningWorkflow,
        probationMonths: draft.probationMonths,
        defaultNoticePeriodDays: draft.defaultNoticePeriodDays,
      })
      store.updateFlags({ enableCustomFields: draft.enableCustomFields })
      toast.success('Settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <>
      <SettingsCard>
        <SettingsCardSection title="Teacher ID" icon={IdCard} defaultOpen>
          <ValueRow label="Prefix">
            <Input value={draft.teacherIdPrefix}
              onChange={(e) => setDraft({ ...draft, teacherIdPrefix: e.target.value.toUpperCase().slice(0, 6) })}
              className="w-24 h-7 text-xs uppercase" />
          </ValueRow>
          <ValueRow label="Digits">
            <Input type="number" min={2} max={8} value={draft.teacherIdDigits}
              onChange={(e) => setDraft({ ...draft, teacherIdDigits: Math.max(2, Math.min(8, parseInt(e.target.value) || 4)) })}
              className="w-16 h-7 text-center text-xs" />
          </ValueRow>
        </SettingsCardSection>

        <SettingsCardSection title="Joining Workflow" icon={Workflow}>
          <ValueRow label="Approval Mode">
            <Select value={draft.joiningWorkflow}
              onValueChange={(v: 'auto' | 'approval') => setDraft({ ...draft, joiningWorkflow: v })}>
              <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approval">Requires Approval</SelectItem>
                <SelectItem value="auto">Auto-Onboard</SelectItem>
              </SelectContent>
            </Select>
          </ValueRow>
          <ValueRow label="Probation Period">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={24} value={draft.probationMonths}
                onChange={(e) => setDraft({ ...draft, probationMonths: Math.max(0, Math.min(24, parseInt(e.target.value) || 6)) })}
                className="w-16 h-7 text-center text-xs" />
              <span className="text-xs text-muted-foreground">months</span>
            </div>
          </ValueRow>
          <ValueRow label="Notice Period">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={90} value={draft.defaultNoticePeriodDays}
                onChange={(e) => setDraft({ ...draft, defaultNoticePeriodDays: Math.max(0, Math.min(90, parseInt(e.target.value) || 30)) })}
                className="w-16 h-7 text-center text-xs" />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </ValueRow>
        </SettingsCardSection>

        <SettingsCardSection title="Advanced" icon={SlidersHorizontal}>
          <ToggleRow label="Custom Fields" checked={draft.enableCustomFields}
            onCheckedChange={(v) => setDraft({ ...draft, enableCustomFields: v })} />
        </SettingsCardSection>
      </SettingsCard>

      <ActionBar dirty={dirty} saving={saving} onDiscard={handleDiscard} onSave={handleSave} />
    </>
  )
}

/* ---------------- Documents tab ---------------- */

function DocumentsTab() {
  const store = useTeacherSettingsStore()
  const f = store.flags

  const toggle = (k: keyof typeof f) => {
    store.updateFlags({ [k]: !f[k] } as any)
    toast.success(`${DOC_LABELS[k]} ${f[k] ? 'disabled' : 'enabled'}`)
  }

  return (
    <SettingsCard>
      <SettingsCardSection title="Identity" icon={IdCard} defaultOpen>
        <ToggleRow label="Photo Upload" checked={f.enablePhotoUpload} onCheckedChange={() => toggle('enablePhotoUpload')} />
        <ToggleRow label="Signature Upload" checked={f.enableSignatureUpload} onCheckedChange={() => toggle('enableSignatureUpload')} />
        <ToggleRow label="Aadhaar" checked={f.enableAadhaar} onCheckedChange={() => toggle('enableAadhaar')} />
        <ToggleRow label="PAN Card" checked={f.enablePanCard} onCheckedChange={() => toggle('enablePanCard')} />
      </SettingsCardSection>

      <SettingsCardSection title="Bank & Payroll" icon={Wallet}>
        <ToggleRow label="Bank Details" checked={f.enableBankDetails} onCheckedChange={() => toggle('enableBankDetails')} />
        <ToggleRow label="Payroll Integration" checked={f.enablePayrollIntegration} onCheckedChange={() => toggle('enablePayrollIntegration')} />
      </SettingsCardSection>

      <SettingsCardSection title="Credentials" icon={FileStack}>
        <ToggleRow label="Educational Certificates" checked={f.enableEducationalCertificates} onCheckedChange={() => toggle('enableEducationalCertificates')} />
        <ToggleRow label="Experience Letters" checked={f.enableExperienceLetters} onCheckedChange={() => toggle('enableExperienceLetters')} />
        <ToggleRow label="Medical Fitness Certificate" checked={f.enableMedicalFitness} onCheckedChange={() => toggle('enableMedicalFitness')} />
      </SettingsCardSection>
    </SettingsCard>
  )
}

/* ---------------- Integration tab ---------------- */

function IntegrationTab() {
  const store = useTeacherSettingsStore()
  const f = store.flags

  const toggle = (k: keyof typeof f) => {
    store.updateFlags({ [k]: !f[k] } as any)
    toast.success(`${INT_LABELS[k]} ${f[k] ? 'disabled' : 'enabled'}`)
  }

  return (
    <SettingsCard>
      <SettingsCardSection title="Attendance & Leave" icon={Calendar} defaultOpen>
        <ToggleRow label="Attendance Tracking" checked={f.enableAttendanceTracking} onCheckedChange={() => toggle('enableAttendanceTracking')} />
        <ToggleRow label="Leave Tracking" checked={f.enableLeaveTracking} onCheckedChange={() => toggle('enableLeaveTracking')} />
      </SettingsCardSection>

      <SettingsCardSection title="Advanced" icon={SlidersHorizontal}>
        <ToggleRow label="Custom Fields" checked={f.enableCustomFields} onCheckedChange={() => toggle('enableCustomFields')} />
      </SettingsCardSection>
    </SettingsCard>
  )
}

const DOC_LABELS: Record<string, string> = {
  enablePhotoUpload: 'Photo Upload',
  enableSignatureUpload: 'Signature Upload',
  enableAadhaar: 'Aadhaar',
  enablePanCard: 'PAN Card',
  enableBankDetails: 'Bank Details',
  enablePayrollIntegration: 'Payroll Integration',
  enableEducationalCertificates: 'Educational Certificates',
  enableExperienceLetters: 'Experience Letters',
  enableMedicalFitness: 'Medical Fitness Certificate',
}

const INT_LABELS: Record<string, string> = {
  enableAttendanceTracking: 'Attendance Tracking',
  enableLeaveTracking: 'Leave Tracking',
  enableCustomFields: 'Custom Fields',
}
