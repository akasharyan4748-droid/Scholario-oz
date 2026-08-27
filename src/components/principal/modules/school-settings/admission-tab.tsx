'use client'

// Admission Config tab — facilities (hostel toggle), ID/roll-number format
// inputs, and the required-application-documents list. Backed by
// store.facilities + store.admissionSettings.

import { FileText, Building2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { toast } from 'sonner'
import { SettingsTab } from './shared'

export function AdmissionTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={FileText}
      title="Admission Workflow & Document Requirements"
      description="Default ID formats, roll number generation rules, and required submission documents."
    >
      {/* Facilities Config (Hostel Toggle) */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
        <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-500" /> School Facilities Configuration
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-xs text-foreground">Hostel Boarding Facility Enabled</p>
            <p className="text-[11px] text-muted-foreground">
              When disabled, Hostel options will be completely hidden from student admission forms and validation.
            </p>
          </div>
          <Switch
            checked={store.facilities?.hasHostelFacility ?? true}
            onCheckedChange={(checked) => {
              store.updateFacilities({ hasHostelFacility: checked })
              toast.success(checked ? 'Hostel Facility Enabled for Admissions' : 'Hostel Facility Disabled for Admissions')
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Default Student ID Pattern</Label>
          <Input
            value={store.admissionSettings.studentIdFormat}
            onChange={(e) => store.updateAdmissionSettings({ studentIdFormat: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Roll Number Format</Label>
          <Input
            value={store.admissionSettings.rollNumberFormat}
            onChange={(e) => store.updateAdmissionSettings({ rollNumberFormat: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <Label className="text-xs font-semibold block">Required Application Documents</Label>
        <div className="flex flex-wrap gap-2">
          {store.admissionSettings.requiredDocs.map((doc) => (
            <Badge key={doc} variant="secondary" className="px-3 py-1 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> {doc}
            </Badge>
          ))}
        </div>
      </div>
    </SettingsTab>
  )
}
