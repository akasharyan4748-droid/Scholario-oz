'use client'

// Teacher Students module entry point.
//
// `teacher-panel.tsx` imports the named `StudentsModule` export:
//   import { StudentsModule } from './modules/students'
//
// This index owns the page-level state (selected student for the profile
// sheet) and composes the presentational sub-components: FeeCollectionsPanel
// (REAL store-backed collection flow — PAY-REWORK-1), QuickStats,
// StudentsGrid, StudentProfileSheet. The directory grid's search/filter
// state lives inside `students-grid.tsx` since it is purely local UI state.

import { useState } from 'react'
import { Users, Download } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Student } from '@/lib/mock/students'
import { FeeCollectionsPanel } from './fee-collections'
import { QuickStats } from './quick-stats'
import { StudentsGrid } from './students-grid'
import { StudentProfileSheet } from './student-profile-sheet'

export function StudentsModule() {
  const [selected, setSelected] = useState<Student | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Students"
        subtitle="Class 2-A · Manage and view student profiles"
        icon={<Users className="h-5 w-5" />}
        action={
          <Button variant="outline" onClick={() => toast.success('Export started', { description: 'Class 2-A student list · CSV' })}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      {/* Fee collections — record + verification status (canonical ledger) */}
      <FeeCollectionsPanel />

      {/* Quick stats */}
      <QuickStats />

      {/* Filters + grid */}
      <StudentsGrid onSelect={setSelected} />

      {/* Student profile sheet */}
      <StudentProfileSheet student={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
