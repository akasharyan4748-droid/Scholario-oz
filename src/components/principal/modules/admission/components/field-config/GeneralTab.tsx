'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import {
  GENERAL_SECTIONS,
  FLAG_LABELS,
  type GeneralSectionId,
  type FlagKey,
} from './types'

/* ------------------------------------------------------------------ */
/*  Section wrapper — collapsible with rotating chevron                */
/* ------------------------------------------------------------------ */

function Section({
  id,
  defaultOpen = false,
  icon: Icon,
  title,
  children,
}: {
  id: string
  defaultOpen?: boolean
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} id={id}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 py-4 text-left group"
        >
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-base font-medium text-foreground flex-1">{title}</p>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              open && 'rotate-90'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-4 pl-7 pr-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/*  Setting row — just name + control, no description                  */
/* ------------------------------------------------------------------ */

function SettingRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-border/40 first:border-t-0">
      <p className="text-sm text-foreground">{label}</p>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main GeneralTab                                                    */
/* ------------------------------------------------------------------ */

export function GeneralTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags
  const retentionDays = settings.rejectionRetentionDays || 60

  const handleToggleFlag = (key: FlagKey) => {
    store.updateAdmissionFeatureFlags({ [key]: !flags[key] } as any)
    toast.success(`${FLAG_LABELS[key]} ${flags[key] ? 'disabled' : 'enabled'}`)
  }

  const handleRetentionDaysChange = (days: number) => {
    const validDays = Math.max(30, Math.min(90, days))
    store.updateAdmissionSettings({ rejectionRetentionDays: validDays })
  }

  const handlePrivacyToggle = (next: boolean) => {
    // ON = protection enabled → hide personal data on the admission letter.
    // OFF = show personal data on the letter (less protection).
    store.updateAdmissionSettings({ showPersonalDataOnLetter: !next })
    toast.success(`Sensitive data protection ${next ? 'enabled' : 'disabled'}`)
  }

  const handleDuplicateToggle = (next: boolean) => {
    store.updateDuplicateDetection({ enabled: next })
    toast.success(`Duplicate detection ${next ? 'enabled' : 'disabled'}`)
  }

  // Render the custom content for Privacy + Duplicate Detection sections.
  const renderCustom = (id: GeneralSectionId) => {
    if (id === 'privacy') {
      // Protection is ON when personal data is NOT shown on the letter.
      const protected_ = !settings.showPersonalDataOnLetter
      return (
        <SettingRow label="Sensitive Data Protection">
          <Switch checked={protected_} onCheckedChange={handlePrivacyToggle} />
        </SettingRow>
      )
    }
    if (id === 'duplicate') {
      return (
        <SettingRow label="Enable Duplicate Detection">
          <Switch
            checked={settings.duplicateDetection.enabled}
            onCheckedChange={handleDuplicateToggle}
          />
        </SettingRow>
      )
    }
    return null
  }

  // Render a section + its toggle rows. Privacy + duplicate use custom content;
  // the rest render one SettingRow per toggle.
  const renderSection = (meta: (typeof GENERAL_SECTIONS)[number], idx: number) => {
    const isCustom = meta.keys && meta.keys.length === 0
    const defaultOpen = idx === 0 // first section open by default
    const Icon = meta.icon
    return (
      <Section
        key={meta.id}
        id={`section-${meta.id}`}
        defaultOpen={defaultOpen}
        icon={Icon}
        title={meta.title}
      >
        {isCustom ? (
          renderCustom(meta.id)
        ) : (
          meta.keys!.map((k) => (
            <SettingRow key={k} label={FLAG_LABELS[k]}>
              <Switch checked={flags[k]} onCheckedChange={() => handleToggleFlag(k)} />
            </SettingRow>
          ))
        )}

        {/* Advanced: extra inputs after the toggles */}
        {meta.id === 'advanced' && (
          <SettingRow label="Rejection Retention">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={30}
                max={90}
                value={retentionDays}
                onChange={(e) => handleRetentionDaysChange(parseInt(e.target.value) || 60)}
                className="w-16 h-7 text-center text-xs"
              />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </SettingRow>
        )}
      </Section>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card px-6 divide-y divide-border/40">
      {GENERAL_SECTIONS.map((meta, idx) => renderSection(meta, idx))}
    </div>
  )
}
