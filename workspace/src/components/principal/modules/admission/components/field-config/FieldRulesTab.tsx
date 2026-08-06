'use client'

import { Switch } from '@/components/ui/switch'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

// Tab 4: Field Rules
export function FieldRulesTab() {
  const store = useSchoolSettingsStore()
  const fieldRules = store.admissionSettings.fieldRules || []

  const handleToggleVisible = (fieldKey: string) => {
    const updatedRules = fieldRules.map((rule) =>
      rule.fieldKey === fieldKey ? { ...rule, visible: !rule.visible } : rule
    )
    store.updateAdmissionSettings({ fieldRules: updatedRules })
  }

  const handleToggleRequired = (fieldKey: string) => {
    const updatedRules = fieldRules.map((rule) =>
      rule.fieldKey === fieldKey ? { ...rule, required: !rule.required } : rule
    )
    store.updateAdmissionSettings({ fieldRules: updatedRules })
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-12 gap-2 p-2.5 font-bold bg-muted/50 text-muted-foreground uppercase text-[10px]">
        <div className="col-span-5">Field</div>
        <div className="col-span-3 text-center">Visible</div>
        <div className="col-span-4 text-center">Required</div>
      </div>
      {fieldRules.map((rule) => (
        <div key={rule.fieldKey} className="grid grid-cols-12 gap-2 p-2.5 items-center border-t border-border/50 hover:bg-muted/20">
          <div className="col-span-5">
            <span className="text-xs font-semibold block">{rule.label}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{rule.section}</span>
          </div>
          <div className="col-span-3 flex justify-center">
            <div className="flex items-center gap-1.5">
              <Switch checked={rule.visible} onCheckedChange={() => handleToggleVisible(rule.fieldKey)} />
              <span className="text-[10px]">{rule.visible ? 'On' : 'Off'}</span>
            </div>
          </div>
          <div className="col-span-4 flex justify-center">
            <div className="flex items-center gap-1.5">
              <Switch disabled={!rule.visible} checked={rule.required} onCheckedChange={() => handleToggleRequired(rule.fieldKey)} />
              <span className="text-[10px]">{rule.required ? 'Required' : 'Optional'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
