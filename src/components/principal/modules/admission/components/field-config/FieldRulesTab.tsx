'use client'

import { useState, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { FIELD_SECTIONS } from './types'

/* ------------------------------------------------------------------ */
/*  Section wrapper (local to this tab so it can be styled standalone) */
/* ------------------------------------------------------------------ */

function Section({
  defaultOpen = false,
  icon: Icon,
  title,
  children,
}: {
  defaultOpen?: boolean
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/40 last:border-b-0">
      <CollapsibleTrigger asChild>
        <button type="button" className="w-full flex items-center gap-3 py-3 text-left">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium text-foreground flex-1">{title}</p>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-2 pl-7 pr-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/*  Field row — name on left, Visible + Required toggles on right      */
/* ------------------------------------------------------------------ */

function FieldRow({
  label,
  visible,
  required,
  onToggleVisible,
  onToggleRequired,
}: {
  label: string
  visible: boolean
  required: boolean
  onToggleVisible: () => void
  onToggleRequired: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-t border-border/30 first:border-t-0">
      <p className="text-sm text-foreground flex-1 min-w-0 truncate">{label}</p>
      <div className="flex items-center gap-5 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Switch checked={visible} onCheckedChange={onToggleVisible} />
          <span className={cn('text-[11px]', visible ? 'text-foreground' : 'text-muted-foreground')}>
            Visible
          </span>
        </label>
        <label className={cn('flex items-center gap-1.5', required ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}>
          <Switch disabled={!visible} checked={required} onCheckedChange={onToggleRequired} />
          <span className={cn('text-[11px]', required ? 'text-foreground' : 'text-muted-foreground')}>
            Required
          </span>
        </label>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main FieldRulesTab                                                 */
/* ------------------------------------------------------------------ */

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

  // Group rules by section, in FIELD_SECTIONS order; any unmatched section goes last.
  const grouped = useMemo(() => {
    const map: Record<string, typeof fieldRules> = {}
    for (const rule of fieldRules) {
      const k = rule.section || 'Other'
      ;(map[k] = map[k] || []).push(rule)
    }
    return map
  }, [fieldRules])

  // Render known sections first (in declared order), then any extras.
  const knownIds = FIELD_SECTIONS.map((s) => s.id)
  const extras = Object.keys(grouped).filter((k) => !knownIds.includes(k))

  return (
    <div className="divide-y divide-border/40">
      {FIELD_SECTIONS.map((meta, idx) => {
        const rules = grouped[meta.id] || []
        if (rules.length === 0) return null
        return (
          <Section
            key={meta.id}
            defaultOpen={idx === 0}
            icon={meta.icon}
            title={meta.title}
          >
            {rules.map((rule) => (
              <FieldRow
                key={rule.fieldKey}
                label={rule.label}
                visible={rule.visible}
                required={rule.required}
                onToggleVisible={() => handleToggleVisible(rule.fieldKey)}
                onToggleRequired={() => handleToggleRequired(rule.fieldKey)}
              />
            ))}
          </Section>
        )
      })}

      {extras.map((sectionId) => {
        const rules = grouped[sectionId] || []
        if (rules.length === 0) return null
        return (
          <Section key={sectionId} defaultOpen={false} icon={FIELD_SECTIONS[0].icon} title={sectionId}>
            {rules.map((rule) => (
              <FieldRow
                key={rule.fieldKey}
                label={rule.label}
                visible={rule.visible}
                required={rule.required}
                onToggleVisible={() => handleToggleVisible(rule.fieldKey)}
                onToggleRequired={() => handleToggleRequired(rule.fieldKey)}
              />
            ))}
          </Section>
        )
      })}
    </div>
  )
}
