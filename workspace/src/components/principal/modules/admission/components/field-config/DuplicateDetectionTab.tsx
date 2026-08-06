'use client'

import { CopyCheck } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

const MATCH_KEY_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Number',
  nameDob: 'Name + DOB',
  parentPhone: 'Parent Phone',
  parents: 'Parent Names',
  previousSchool: 'Previous School',
  address: 'Address',
}

// Tab 3: Duplicate Detection
export function DuplicateDetectionTab() {
  const store = useSchoolSettingsStore()
  const dupConfig = store.admissionSettings.duplicateDetection

  const handleDupKeyToggle = (key: keyof typeof dupConfig.checkKeys) => {
    store.updateDuplicateDetection({
      checkKeys: { ...dupConfig.checkKeys, [key]: !dupConfig.checkKeys[key] },
    })
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CopyCheck className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="font-semibold text-sm">Enable Live Duplicate Detection</p>
            <p className="text-[11px] text-muted-foreground">Checks while applicant fills the form</p>
          </div>
        </div>
        <Switch checked={dupConfig.enabled} onCheckedChange={(v) => store.updateDuplicateDetection({ enabled: v })} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <p className="text-xs font-semibold text-rose-600 mb-1">Block Threshold</p>
          <p className="text-[10px] text-muted-foreground mb-2">Block submission at this match score</p>
          <div className="flex items-center gap-2">
            <Input type="number" min={90} max={100} value={dupConfig.blockThreshold}
              onChange={(e) => store.updateDuplicateDetection({ blockThreshold: Math.min(100, Math.max(90, parseInt(e.target.value) || 99)) })}
              className="w-20 text-center font-bold h-8" />
            <span className="text-xs">%</span>
          </div>
        </div>
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-600 mb-1">Warn Threshold</p>
          <p className="text-[10px] text-muted-foreground mb-2">Show warning at this match score</p>
          <div className="flex items-center gap-2">
            <Input type="number" min={50} max={95} value={dupConfig.warnThreshold}
              onChange={(e) => store.updateDuplicateDetection({ warnThreshold: Math.min(95, Math.max(50, parseInt(e.target.value) || 70)) })}
              className="w-20 text-center font-bold h-8" />
            <span className="text-xs">%</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Match Keys</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {(Object.keys(dupConfig.checkKeys) as Array<keyof typeof dupConfig.checkKeys>).map((key) => {
            return (
              <div key={key} className="p-2.5 rounded-xl border bg-card flex items-center justify-between">
                <span className="text-xs font-medium">{MATCH_KEY_LABELS[key]}</span>
                <Switch checked={dupConfig.checkKeys[key]} onCheckedChange={() => handleDupKeyToggle(key)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
