'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, Lock, CalendarClock, Building2 } from 'lucide-react'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import {
  FEATURE_TOGGLES,
  GENERAL_SECTIONS,
  PRIVACY_SAFEGUARD_FIELDS,
  type GeneralSectionId,
} from './types'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toggleMeta(key: string) {
  return FEATURE_TOGGLES.find((t) => t.key === key)
}

/* ------------------------------------------------------------------ */
/*  Section wrapper — collapsible, icon+title+hint, chevron rotates    */
/* ------------------------------------------------------------------ */

function Section({
  id,
  defaultOpen = false,
  icon: Icon,
  title,
  hint,
  children,
}: {
  id: string
  defaultOpen?: boolean
  icon: React.ElementType
  title: string
  hint?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} id={id} className="border-b border-border/40 last:border-b-0">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 py-3 text-left group"
        >
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{hint}</p>}
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              open && 'rotate-90'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-2 pl-7 pr-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/*  Setting row — name on left, control on right                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main GeneralTab                                                    */
/* ------------------------------------------------------------------ */

export function GeneralTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags
  const retentionDays = settings.rejectionRetentionDays || 60

  const [skipClasses, setSkipClasses] = useState(flags.previousSchoolSkipClasses.join(', '))

  // Build a quick lookup for each section's toggles.
  const togglesBySection = useMemo(() => {
    const map: Record<string, typeof FEATURE_TOGGLES> = {}
    for (const sec of GENERAL_SECTIONS) {
      map[sec.id] = sec.keys
        .map((k) => toggleMeta(k))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
    }
    return map
  }, [])

  const handleToggleFlag = (key: keyof typeof flags) => {
    store.updateAdmissionFeatureFlags({ [key]: !flags[key] } as any)
    const meta = toggleMeta(key as string)
    toast.success(`${meta?.label ?? 'Setting'} ${flags[key] ? 'disabled' : 'enabled'}`)
  }

  const handleRetentionDaysChange = (days: number) => {
    const validDays = Math.max(30, Math.min(90, days))
    store.updateAdmissionSettings({ rejectionRetentionDays: validDays })
  }

  const handleSkipClassesSave = () => {
    const list = skipClasses.split(',').map((s) => s.trim()).filter(Boolean)
    store.updateAdmissionFeatureFlags({ previousSchoolSkipClasses: list })
    toast.success('Skip classes updated')
  }

  // Build the rendered section list — Privacy is always first and special.
  const renderSection = (id: GeneralSectionId, defaultOpen = false) => {
    const meta = GENERAL_SECTIONS.find((s) => s.id === id)!
    const toggles = togglesBySection[id] || []
    if (toggles.length === 0) return null

    return (
      <Section
        key={id}
        id={`section-${id}`}
        defaultOpen={defaultOpen}
        icon={meta.icon}
        title={meta.title}
        hint={meta.hint}
      >
        {toggles.map((t) => (
          <SettingRow key={t.key} label={t.label} helper={t.desc}>
            <Switch
              checked={flags[t.key]}
              onCheckedChange={() => handleToggleFlag(t.key)}
            />
          </SettingRow>
        ))}

        {id === 'advanced' && (
          <>
            <SettingRow label="Rejection Retention" helper="Days before rejected apps auto-archive">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={30}
                  max={90}
                  value={retentionDays}
                  onChange={(e) => handleRetentionDaysChange(parseInt(e.target.value) || 60)}
                  className="w-16 h-7 text-center text-xs"
                />
                <span className="text-[11px] text-muted-foreground">days</span>
              </div>
            </SettingRow>

            <SettingRow
              label="Skip Previous School for Fresh Admission"
              helper="Classes where previous school is auto-skipped (comma-separated)"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={skipClasses}
                  onChange={(e) => setSkipClasses(e.target.value)}
                  placeholder="Nursery, LKG, UKG"
                  className="w-44 h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSkipClassesSave}
                  className="h-7 px-2 text-[11px]"
                >
                  Save
                </Button>
              </div>
            </SettingRow>
          </>
        )}
      </Section>
    )
  }

  // Privacy section is always rendered first and is an info banner (no toggles).
  const renderPrivacySection = () => (
    <Section
      key="privacy"
      id="section-privacy"
      defaultOpen
      icon={Lock}
      title="Privacy"
      hint="Sensitive fields automatically hidden from printable Admission Letter"
    >
      <div className="flex flex-wrap gap-1.5 py-1.5">
        {PRIVACY_SAFEGUARD_FIELDS.map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-500/20"
          >
            <Lock className="h-2.5 w-2.5" />
            {f}
          </span>
        ))}
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
          always excluded
        </span>
      </div>
    </Section>
  )

  // Render order: privacy, workflow, medical, transportHostel, financial, documents, personalFields, advanced
  const orderedIds: GeneralSectionId[] = [
    'workflow',
    'medical',
    'transportHostel',
    'financial',
    'documents',
    'personalFields',
    'advanced',
  ]

  return (
    <div className="divide-y divide-border/40">
      {renderPrivacySection()}
      {orderedIds.map((id, i) => renderSection(id, i === 0))}
    </div>
  )
}
