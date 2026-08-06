'use client'

import { useState } from 'react'
import { Building2, CalendarClock, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { FEATURE_TOGGLES, type FeatureToggle } from './types'

export function FeatureFlagsTab() {
  const store = useSchoolSettingsStore()
  const settings = store.admissionSettings
  const flags = settings.featureFlags
  const retentionDays = settings.rejectionRetentionDays || 60

  const [skipClasses, setSkipClasses] = useState(flags.previousSchoolSkipClasses.join(', '))

  const groupedToggles = FEATURE_TOGGLES.reduce<Record<string, FeatureToggle[]>>((acc, t) => {
    ;(acc[t.section] = acc[t.section] || []).push(t)
    return acc
  }, {})

  const handleToggleFlag = (key: FeatureToggle['key']) => {
    store.updateAdmissionFeatureFlags({ [key]: !flags[key] } as any)
    toast.success(`${FEATURE_TOGGLES.find((t) => t.key === key)?.label} ${flags[key] ? 'disabled' : 'enabled'}`)
  }

  const handleRetentionDaysChange = (days: number) => {
    const validDays = Math.max(30, Math.min(90, days))
    store.updateAdmissionSettings({ rejectionRetentionDays: validDays })
  }

  const handleSkipClassesSave = () => {
    const list = skipClasses.split(',').map((s) => s.trim()).filter(Boolean)
    store.updateAdmissionFeatureFlags({ previousSchoolSkipClasses: list })
    toast.success('Previous school skip classes updated')
  }

  return (
    <div className="space-y-5">
      {/* Letter Privacy — always active */}
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Letter Privacy Safeguard — Active</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Religion, Category, Blood Group, Gender, Aadhaar always excluded from printable Admission Letter.</p>
        </div>
      </div>

      {/* Rejection retention */}
      <div className="p-3 rounded-xl border bg-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarClock className="h-4 w-4 text-amber-600" />
          <div>
            <p className="font-semibold text-sm">Rejection Retention</p>
            <p className="text-[11px] text-muted-foreground">Days before rejected apps auto-archive</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input type="number" min={30} max={90} value={retentionDays}
            onChange={(e) => handleRetentionDaysChange(parseInt(e.target.value) || 60)}
            className="w-20 text-center font-bold h-8" />
          <span className="text-xs text-muted-foreground">days</span>
        </div>
      </div>

      {/* Previous school skip classes */}
      <div className="p-3 rounded-xl border bg-card">
        <div className="flex items-center gap-2.5 mb-2">
          <Building2 className="h-4 w-4 text-violet-600" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Skip Previous School for Fresh Admission</p>
            <p className="text-[11px] text-muted-foreground">Comma-separated classes where previous school is auto-skipped</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={skipClasses} onChange={(e) => setSkipClasses(e.target.value)} placeholder="Nursery, LKG, UKG, Class 1" className="text-xs h-8 flex-1" />
          <Button size="sm" variant="outline" onClick={handleSkipClassesSave} className="h-8 text-xs">Save</Button>
        </div>
      </div>

      {/* Feature toggles grouped by section */}
      {Object.entries(groupedToggles).map(([section, toggles]) => (
        <div key={section}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{section}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {toggles.map((t) => {
              const Icon = t.icon
              const enabled = flags[t.key]
              return (
                <div key={t.key} className={cn('p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors', enabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card')}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.desc}</p>
                    </div>
                  </div>
                  <Switch checked={enabled} onCheckedChange={() => handleToggleFlag(t.key)} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
