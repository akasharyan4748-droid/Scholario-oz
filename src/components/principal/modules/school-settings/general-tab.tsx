'use client'

// General Profile tab — school branding & identity fields rendered on
// marksheets, fee receipts, and certificates. Backed by store.general.

import { School } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormattedInput } from '@/components/shared/formatted-input'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function GeneralTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={School}
      title="School Branding & Identity"
      description="Official details displayed on marksheets, fee receipts, and certificates."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">School Full Name</Label>
          <Input
            value={store.general.schoolName}
            onChange={(e) => store.updateGeneral({ schoolName: e.target.value })}
            placeholder="Demo School of Scholario"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Short Name / Abbreviation</Label>
          <Input
            value={store.general.shortName}
            onChange={(e) => store.updateGeneral({ shortName: e.target.value })}
            placeholder="Demo School"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Tagline / Motto</Label>
          <Input
            value={store.general.tagline}
            onChange={(e) => store.updateGeneral({ tagline: e.target.value })}
            placeholder="Excellence in Education"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Board Affiliation No.</Label>
          <Input
            value={store.general.affiliation}
            onChange={(e) => store.updateGeneral({ affiliation: e.target.value })}
            placeholder="CBSE — Affiliation No. 1730456"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Official Phone (Visual Format)</Label>
          <FormattedInput
            formatType="mobile"
            value={store.general.phone}
            onChangeRaw={(raw) => store.updateGeneral({ phone: raw })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Official Email Address</Label>
          <Input
            value={store.general.email}
            onChange={(e) => store.updateGeneral({ email: e.target.value })}
            placeholder="info@demoschool.edu"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Official Website</Label>
          <Input
            value={store.general.website}
            onChange={(e) => store.updateGeneral({ website: e.target.value })}
            placeholder="www.demoschool.edu"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Principal Name</Label>
          <Input
            value={store.general.principalName}
            onChange={(e) => store.updateGeneral({ principalName: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Vice Principal Name</Label>
          <Input
            value={store.general.vicePrincipalName}
            onChange={(e) => store.updateGeneral({ vicePrincipalName: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <Label className="text-xs font-semibold mb-1 block">Official Campus Address</Label>
          <Textarea
            rows={2}
            value={store.general.address}
            onChange={(e) => store.updateGeneral({ address: e.target.value })}
          />
        </div>
      </div>
    </SettingsTab>
  )
}
