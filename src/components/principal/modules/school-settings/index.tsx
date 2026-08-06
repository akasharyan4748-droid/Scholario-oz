'use client'

// School Settings module — modular composition root.
//
// The original monolithic `school-settings.tsx` (957 lines) has been split
// across focused files inside this directory. This `index.tsx` is the entry
// point that re-exports the public `SchoolSettingsModule` symbol used by
// `principal-panel.tsx` and composes the 11 settings tabs in their original
// visual order. No UI/UX was changed in the refactor — only the file layout.
//
// Each tab owns its own local state (modal open/close + new-item form fields).
// The top-level "Save Configuration" button + tab switching state lives here.

import { useState } from 'react'
import {
  Settings as SettingsIcon, School, BookOpen, Clock, IndianRupee, Wallet,
  ShoppingBag, Shirt, Bus, BookMarked, ShieldCheck, FileText, Save, Loader2,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import { toast } from 'sonner'

import { GeneralTab } from './general-tab'
import { AcademicsTab } from './academics-tab'
import { TimetableTab } from './timetable-tab'
import { FeesTab } from './fees-tab'
import { PayrollTab } from './payroll-tab'
import { BookstoreTab } from './bookstore-tab'
import { UniformsTab } from './uniforms-tab'
import { TransportTab } from './transport-tab'
import { LibraryTab } from './library-tab'
import { HousesTab } from './houses-tab'
import { AdmissionTab } from './admission-tab'

export function SchoolSettingsModule() {
  const [tab, setTab] = useState('general')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('School Settings Updated', {
        description: 'All system configurations are synced dynamically across all modules.',
      })
    }, 800)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="School Settings"
        subtitle="Central Configuration Hub · System Control & Universal Master Data"
        icon={<SettingsIcon className="h-5 w-5" />}
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1.5 rounded-xl border border-border">
          <TabsTrigger value="general" className="gap-1.5 text-xs"><School className="h-3.5 w-3.5" /> General Profile</TabsTrigger>
          <TabsTrigger value="academics" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" /> Academics</TabsTrigger>
          <TabsTrigger value="timetable" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Timetable</TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5 text-xs"><IndianRupee className="h-3.5 w-3.5" /> Fees Structure</TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5 text-xs"><Wallet className="h-3.5 w-3.5" /> Payroll & Grades</TabsTrigger>
          <TabsTrigger value="bookstore" className="gap-1.5 text-xs"><ShoppingBag className="h-3.5 w-3.5" /> Book Store</TabsTrigger>
          <TabsTrigger value="uniforms" className="gap-1.5 text-xs"><Shirt className="h-3.5 w-3.5" /> Uniforms</TabsTrigger>
          <TabsTrigger value="transport" className="gap-1.5 text-xs"><Bus className="h-3.5 w-3.5" /> Transport</TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs"><BookMarked className="h-3.5 w-3.5" /> Library</TabsTrigger>
          <TabsTrigger value="houses" className="gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> House System</TabsTrigger>
          <TabsTrigger value="admission" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Admission Config</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="academics"><AcademicsTab /></TabsContent>
        <TabsContent value="timetable"><TimetableTab /></TabsContent>
        <TabsContent value="fees"><FeesTab /></TabsContent>
        <TabsContent value="payroll"><PayrollTab /></TabsContent>
        <TabsContent value="bookstore"><BookstoreTab /></TabsContent>
        <TabsContent value="uniforms"><UniformsTab /></TabsContent>
        <TabsContent value="transport"><TransportTab /></TabsContent>
        <TabsContent value="library"><LibraryTab /></TabsContent>
        <TabsContent value="houses"><HousesTab /></TabsContent>
        <TabsContent value="admission"><AdmissionTab /></TabsContent>
      </Tabs>
    </div>
  )
}

export default SchoolSettingsModule
