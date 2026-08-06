'use client'

import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { SlidersHorizontal, Users, CopyCheck, FileText } from 'lucide-react'
import type { FieldConfigModalProps } from './field-config/types'
import { GeneralTab } from './field-config/GeneralTab'
import { SeatCapacityTab } from './field-config/SeatCapacityTab'
import { DuplicateDetectionTab } from './field-config/DuplicateDetectionTab'
import { FieldRulesTab } from './field-config/FieldRulesTab'

export function FieldConfigModal({ open, onClose }: FieldConfigModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Minimal header — title + subtitle on one line */}
        <div className="px-6 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            Admission Settings
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Configure admission workflow, seats, duplicates and field visibility.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-3 pb-0">
            <TabsList className="bg-transparent h-9 p-0 gap-5 border-b border-border/60 w-full rounded-none justify-start">
              <TabsTrigger value="general" className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground">
                General
              </TabsTrigger>
              <TabsTrigger value="seats" className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground">
                <Users className="h-3.5 w-3.5" />
                Seats
              </TabsTrigger>
              <TabsTrigger value="duplicate" className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground">
                <CopyCheck className="h-3.5 w-3.5" />
                Duplicate Detection
              </TabsTrigger>
              <TabsTrigger value="fields" className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground">
                <FileText className="h-3.5 w-3.5" />
                Fields
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab content — scrollable */}
          <TabsContent value="general" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="seats" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <SeatCapacityTab />
          </TabsContent>
          <TabsContent value="duplicate" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <DuplicateDetectionTab />
          </TabsContent>
          <TabsContent value="fields" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <FieldRulesTab />
          </TabsContent>
        </Tabs>

        {/* Minimal footer */}
        <div className="px-6 py-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-4">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
