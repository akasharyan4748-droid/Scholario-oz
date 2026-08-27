'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  SettingsCard, SettingsCardSection,
} from '@/components/principal/modules/shared/settings-primitives'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useDirtyState } from '@/components/principal/modules/shared/use-settings-dirty'
import { FIELD_SECTIONS } from './types'

function FieldRow({
  label, visible, required, onToggleVisible, onToggleRequired,
}: {
  label: string
  visible: boolean
  required: boolean
  onToggleVisible: () => void
  onToggleRequired: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-border/40 first:border-t-0">
      <p className="text-sm text-foreground flex-1 min-w-0 truncate">{label}</p>
      <div className="flex items-center gap-5 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Switch checked={visible} onCheckedChange={onToggleVisible} />
          <span className={cn('text-[11px]', visible ? 'text-foreground' : 'text-muted-foreground')}>Visible</span>
        </label>
        <label className={cn('flex items-center gap-1.5', required ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}>
          <Switch disabled={!visible} checked={required} onCheckedChange={onToggleRequired} />
          <span className={cn('text-[11px]', required ? 'text-foreground' : 'text-muted-foreground')}>Required</span>
        </label>
      </div>
    </div>
  )
}

export function FieldRulesTab() {
  const store = useSchoolSettingsStore()
  const fieldRules = store.admissionSettings.fieldRules || []

  const fieldRulesKey = JSON.stringify(fieldRules)
  const initial = useMemo(() => fieldRules.map((r) => ({ ...r })), [fieldRulesKey])
  const [draft, setDraft] = useState(initial)
  useEffect(() => { setDraft(initial) }, [initial])

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  )

  const save = useCallback(async () => {
    store.updateAdmissionSettings({ fieldRules: draft })
  }, [draft, store])

  const discard = useCallback(() => { setDraft(initial) }, [initial])

  useDirtyState('admission-fields', dirty, save, discard)

  const toggleVisible = (fieldKey: string) => {
    setDraft((prev) => prev.map((r) =>
      r.fieldKey === fieldKey ? { ...r, visible: !r.visible } : r
    ))
  }
  const toggleRequired = (fieldKey: string) => {
    setDraft((prev) => prev.map((r) =>
      r.fieldKey === fieldKey ? { ...r, required: !r.required } : r
    ))
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof draft> = {}
    for (const rule of draft) {
      const k = rule.section || 'Other'
      ;(map[k] = map[k] || []).push(rule)
    }
    return map
  }, [draft])

  const knownIds = FIELD_SECTIONS.map((s) => s.id)
  const extras = Object.keys(grouped).filter((k) => !knownIds.includes(k))

  return (
    <SettingsCard>
      {FIELD_SECTIONS.map((meta, idx) => {
        const rules = grouped[meta.id] || []
        if (rules.length === 0) return null
        return (
          <SettingsCardSection key={meta.id} defaultOpen={idx === 0} icon={meta.icon} title={meta.title}>
            {rules.map((rule) => (
              <FieldRow
                key={rule.fieldKey}
                label={rule.label}
                visible={rule.visible}
                required={rule.required}
                onToggleVisible={() => toggleVisible(rule.fieldKey)}
                onToggleRequired={() => toggleRequired(rule.fieldKey)}
              />
            ))}
          </SettingsCardSection>
        )
      })}

      {extras.map((sectionId) => {
        const rules = grouped[sectionId] || []
        if (rules.length === 0) return null
        return (
          <SettingsCardSection key={sectionId} defaultOpen={false} icon={FIELD_SECTIONS[0].icon} title={sectionId}>
            {rules.map((rule) => (
              <FieldRow
                key={rule.fieldKey}
                label={rule.label}
                visible={rule.visible}
                required={rule.required}
                onToggleVisible={() => toggleVisible(rule.fieldKey)}
                onToggleRequired={() => toggleRequired(rule.fieldKey)}
              />
            ))}
          </SettingsCardSection>
        )
      })}
    </SettingsCard>
  )
}
