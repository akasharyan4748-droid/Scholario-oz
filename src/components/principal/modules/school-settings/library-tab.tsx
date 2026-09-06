'use client'

// Library tab — issue limits, lending period, and overdue fine inputs.
// Persisted through the REAL `updateLibrary` action (tenant-scoped store).

import { BookMarked } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function LibraryTab() {
  const library = useSchoolSettingsStore((s) => s.library)
  const updateLibrary = useSchoolSettingsStore((s) => s.updateLibrary)

  return (
    <SettingsTab
      icon={BookMarked}
      title="Library Rules"
      description="Issue limits, lending period, and overdue fine calculations."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Max Books Per Student</Label>
          <Input
            type="number"
            value={library.maxBooksPerStudent}
            onChange={(e) => updateLibrary({ maxBooksPerStudent: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Issue Duration (Days)</Label>
          <Input
            type="number"
            value={library.issueDays}
            onChange={(e) => updateLibrary({ issueDays: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Late Fine Per Day (₹)</Label>
          <Input
            type="number"
            value={library.lateFinePerDay}
            onChange={(e) => updateLibrary({ lateFinePerDay: Number(e.target.value) })}
          />
        </div>
      </div>
    </SettingsTab>
  )
}
