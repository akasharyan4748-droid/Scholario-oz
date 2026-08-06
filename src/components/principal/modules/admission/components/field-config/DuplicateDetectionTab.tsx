'use client'

import { useState } from 'react'
import { ChevronRight, CopyCheck, SlidersHorizontal } from 'lucide-react'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { DUPLICATE_MATCH_KEY_LABELS } from './types'

function Section({
  defaultOpen = false,
  icon: Icon,
  title,
  hint,
  children,
}: {
  defaultOpen?: boolean
  icon: React.ElementType
  title: string
  hint?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/40 last:border-b-0">
      <CollapsibleTrigger asChild>
        <button type="button" className="w-full flex items-center gap-3 py-3 text-left">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{hint}</p>}
          </div>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-2 pl-7 pr-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SettingRow({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-t border-border/30 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground leading-tight">{label}</p>
        {helper && <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{helper}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function DuplicateDetectionTab() {
  const store = useSchoolSettingsStore()
  const dupConfig = store.admissionSettings.duplicateDetection

  const handleDupKeyToggle = (key: keyof typeof dupConfig.checkKeys) => {
    store.updateDuplicateDetection({
      checkKeys: { ...dupConfig.checkKeys, [key]: !dupConfig.checkKeys[key] },
    })
  }

  const matchKeys = Object.keys(dupConfig.checkKeys) as Array<keyof typeof dupConfig.checkKeys>

  return (
    <div className="divide-y divide-border/40">
      {/* Detection — top-level toggle */}
      <Section defaultOpen icon={CopyCheck} title="Detection" hint="Live duplicate checks while the applicant fills the form">
        <SettingRow label="Enable Live Duplicate Detection" helper="Checks while applicant fills the form">
          <Switch
            checked={dupConfig.enabled}
            onCheckedChange={(v) => store.updateDuplicateDetection({ enabled: v })}
          />
        </SettingRow>
      </Section>

      {/* Match Keys */}
      <Section defaultOpen icon={SlidersHorizontal} title="Match Keys" hint="Fields compared when detecting duplicates">
        {matchKeys.map((key) => (
          <SettingRow key={key} label={DUPLICATE_MATCH_KEY_LABELS[key] || key}>
            <Switch
              checked={dupConfig.checkKeys[key]}
              onCheckedChange={() => handleDupKeyToggle(key)}
            />
          </SettingRow>
        ))}
      </Section>

      {/* Thresholds — advanced */}
      <Section defaultOpen={false} icon={SlidersHorizontal} title="Thresholds" hint="Match score cutoffs for block and warn">
        <SettingRow label="Block Threshold" helper="Block submission at this match score">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={90}
              max={100}
              value={dupConfig.blockThreshold}
              onChange={(e) => store.updateDuplicateDetection({ blockThreshold: Math.min(100, Math.max(90, parseInt(e.target.value) || 99)) })}
              className="w-16 text-center h-7 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">%</span>
          </div>
        </SettingRow>
        <SettingRow label="Warn Threshold" helper="Show warning at this match score">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={50}
              max={95}
              value={dupConfig.warnThreshold}
              onChange={(e) => store.updateDuplicateDetection({ warnThreshold: Math.min(95, Math.max(50, parseInt(e.target.value) || 70)) })}
              className="w-16 text-center h-7 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">%</span>
          </div>
        </SettingRow>
      </Section>
    </div>
  )
}
