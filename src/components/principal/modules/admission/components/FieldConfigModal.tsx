'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  SlidersHorizontal, CheckCircle2, Users, CopyCheck, FileText,
} from 'lucide-react'
import type { FieldConfigModalProps } from './field-config/types'
import { FeatureFlagsTab } from './field-config/FeatureFlagsTab'
import { SeatCapacityTab } from './field-config/SeatCapacityTab'
import { DuplicateDetectionTab } from './field-config/DuplicateDetectionTab'
import { FieldRulesTab } from './field-config/FieldRulesTab'

export function FieldConfigModal({ open, onClose }: FieldConfigModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
            Admission Settings
          </DialogTitle>
          <DialogDescription>
            Feature flags · seat capacity · duplicate detection · field rules · letter privacy
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="features" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="features" className="text-xs gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Features</TabsTrigger>
            <TabsTrigger value="seats" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Seats</TabsTrigger>
            <TabsTrigger value="duplicate" className="text-xs gap-1.5"><CopyCheck className="h-3.5 w-3.5" /> Duplicates</TabsTrigger>
            <TabsTrigger value="fields" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" /> Fields</TabsTrigger>
          </TabsList>

          {/* Tab 1: Feature Flags */}
          <TabsContent value="features" className="flex-1 overflow-y-auto pr-1 mt-3">
            <FeatureFlagsTab />
          </TabsContent>

          {/* Tab 2: Seat Capacity */}
          <TabsContent value="seats" className="flex-1 overflow-y-auto pr-1 mt-3">
            <SeatCapacityTab />
          </TabsContent>

          {/* Tab 3: Duplicate Detection */}
          <TabsContent value="duplicate" className="flex-1 overflow-y-auto pr-1 mt-3">
            <DuplicateDetectionTab />
          </TabsContent>

          {/* Tab 4: Field Rules */}
          <TabsContent value="fields" className="flex-1 overflow-y-auto pr-1 mt-3">
            <FieldRulesTab />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
