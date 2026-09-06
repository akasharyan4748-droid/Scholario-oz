'use client'

// School Settings module — modular composition root.
//
// The original monolithic `school-settings.tsx` (957 lines) has been split
// across focused files inside this directory. This `index.tsx` is the entry
// point that re-exports the public `SchoolSettingsModule` symbol used by
// `principal-panel.tsx` and composes the settings tabs.
//
// CLEANUP (production pass):
//   · Removed the fake top-level "Save Configuration" button — every field
//     already persists LIVE to the tenant-scoped store. A button that only
//     shows a spinner + toast was misleading.
//   · Removed dead/duplicate tabs: Payroll (read-only duplicate of the
//     Salary & Payroll module's own structures), Book Store (no consumers —
//     admissions reads the legacy catalogue), Transport (read-only duplicate
//     of the Transport module's live store), House System (duplicate of the
//     roster's house definitions). Module-specific config lives in the
//     module that owns the workflow — Settings keeps school-wide masters.
//   · Fixed the Library tab to persist through the real `updateLibrary`
//     action (previously corrupted `general` via an `as any` cast).
//
// Live tabs: General Profile · Academics · Timetable · Fees Structure ·
// Uniforms · Library · Admission Config. Each edit writes to the
// tenant-scoped school-settings store immediately.

import { useState } from 'react'
import {
  Settings as SettingsIcon, School, BookOpen, Clock, IndianRupee,
  Shirt, BookMarked, FileText,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'

import { GeneralTab } from './general-tab'
import { AcademicsTab } from './academics-tab'
import { TimetableTab } from './timetable-tab'
import { FeesTab } from './fees-tab'
import { UniformsTab } from './uniforms-tab'
import { LibraryTab } from './library-tab'
import { AdmissionTab } from './admission-tab'

export function SchoolSettingsModule() {
  const [tab, setTab] = useState('general')

  return (
    <div className="space-y-6">
      <SectionHeading
        title="School Settings"
        subtitle="School-wide configuration · saved automatically on every change"
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1.5 rounded-xl border border-border">
          <TabsTrigger value="general" className="gap-1.5 text-xs"><School className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="academics" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" /> Academics</TabsTrigger>
          <TabsTrigger value="timetable" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Timetable</TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5 text-xs"><IndianRupee className="h-3.5 w-3.5" /> Fees</TabsTrigger>
          <TabsTrigger value="uniforms" className="gap-1.5 text-xs"><Shirt className="h-3.5 w-3.5" /> Uniforms</TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs"><BookMarked className="h-3.5 w-3.5" /> Library</TabsTrigger>
          <TabsTrigger value="admission" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Admission</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="academics"><AcademicsTab /></TabsContent>
        <TabsContent value="timetable"><TimetableTab /></TabsContent>
        <TabsContent value="fees"><FeesTab /></TabsContent>
        <TabsContent value="uniforms"><UniformsTab /></TabsContent>
        <TabsContent value="library"><LibraryTab /></TabsContent>
        <TabsContent value="admission"><AdmissionTab /></TabsContent>
      </Tabs>
    </div>
  )
}

export default SchoolSettingsModule
