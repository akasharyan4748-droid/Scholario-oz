'use client'

// Assignments module — composition root.
//
// Owns the "selected assignment" reference (shared between the list and the
// details dialog) and the "create dialog open" boolean (toggled from the
// SectionHeading action). Composes the KPI row, analytics row, assignment
// list, and the two dialogs.

import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { type Assignment } from '@/lib/mock/academics'
import { AssignmentsKpiRow } from './kpi-row'
import { AssignmentsAnalyticsRow } from './analytics-row'
import { AssignmentList } from './assignment-list'
import { AssignmentDetailsDialog } from './details-dialog'
import { CreateAssignmentDialog } from './create-dialog'

export function AssignmentsModule() {
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="Assignments Oversight"
        subtitle="Create rubrics, track submissions & evaluate assignments school-wide"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        }
      />

      {/* KPI cards */}
      <AssignmentsKpiRow />

      {/* Evaluation analytics */}
      <AssignmentsAnalyticsRow />

      {/* Tabs + list */}
      <AssignmentList onSelect={setSelected} />

      {/* Assignment details / grading dialog */}
      <AssignmentDetailsDialog selected={selected} onClose={() => setSelected(null)} />

      {/* Create Assignment dialog with rubric builder */}
      <CreateAssignmentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageTransition>
  )
}

// Default export for safety / convenience alias.
export default AssignmentsModule
