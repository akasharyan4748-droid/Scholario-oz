'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import type { AdmissionSettingsPageProps } from './field-config/types'
import { GeneralTab } from './field-config/GeneralTab'
import { SeatCapacityTab } from './field-config/SeatCapacityTab'
import { FieldRulesTab } from './field-config/FieldRulesTab'

/**
 * AdmissionSettingsPage — full-page settings screen for the Admissions module.
 *
 * Replaces the old FieldConfigModal dialog. Opens via navigation
 * (Admissions → Settings) instead of a popup. Uses a segmented control
 * for tab switching (Apple/Linear style).
 */
export function AdmissionSettingsPage({ onBack }: AdmissionSettingsPageProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Page header — back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="h-5 w-px bg-border" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground leading-tight">
            Admission Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure admissions workflow, seats, and field visibility.
          </p>
        </div>
      </div>

      {/* Segmented tab control — soft pill style */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/60 h-9 p-1 gap-1 rounded-full inline-flex">
          <TabsTrigger
            value="general"
            className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="seats"
            className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground transition-all"
          >
            Seats
          </TabsTrigger>
          <TabsTrigger
            value="fields"
            className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground transition-all"
          >
            Fields
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="seats" className="mt-0">
          <SeatCapacityTab />
        </TabsContent>
        <TabsContent value="fields" className="mt-0">
          <FieldRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
