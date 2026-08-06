'use client'

// Library tab — issue limits, lending period, and overdue fine inputs.
// NOTE: The original monolith wired these inputs through `store.updateGeneral`
// with a cast (`as any`). That behavior is intentionally preserved here for
// exact behavioral parity — do not "fix" without explicit product sign-off.

import { BookMarked } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function LibraryTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={BookMarked}
      title="Library Rules & Categories"
      description="Issue limits, lending period, and overdue fine calculations."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Max Books Per Student</Label>
          <Input
            type="number"
            value={store.library.maxBooksPerStudent}
            onChange={(e) => store.updateGeneral({ ...store.library, maxBooksPerStudent: Number(e.target.value) } as any)}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Issue Duration (Days)</Label>
          <Input
            type="number"
            value={store.library.issueDays}
            onChange={(e) => store.updateGeneral({ ...store.library, issueDays: Number(e.target.value) } as any)}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Late Fine Per Day (₹)</Label>
          <Input
            type="number"
            value={store.library.lateFinePerDay}
            onChange={(e) => store.updateGeneral({ ...store.library, lateFinePerDay: Number(e.target.value) } as any)}
          />
        </div>
      </div>
    </SettingsTab>
  )
}
