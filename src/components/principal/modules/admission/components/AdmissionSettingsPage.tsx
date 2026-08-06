'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, SegmentedTabs, SettingsCard, SettingsCardSection,
  ToggleRow, ValueRow, ActionBar,
} from '@/components/principal/modules/shared/settings-primitives'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Lock, SlidersHorizontal, Stethoscope, Bus, Award, FileStack, type LucideIcon,
} from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import type { AdmissionSettingsPageProps } from './field-config/types'
import { GeneralTab } from './field-config/GeneralTab'
import { SeatCapacityTab } from './field-config/SeatCapacityTab'
import { FieldRulesTab } from './field-config/FieldRulesTab'

type TabId = 'general' | 'seats' | 'fields'

/**
 * AdmissionSettingsPage — full-page settings sub-route for the Admissions module.
 * Settings auto-persist on toggle, but a sticky Discard/Save bar appears when
 * the user changes retention / privacy / duplicate detection (those are
 * "soft" settings that benefit from explicit Save semantics).
 */
export function AdmissionSettingsPage({ onBack }: AdmissionSettingsPageProps) {
  const [tab, setTab] = useState<TabId>('general')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Admission Settings"
        subtitle="Workflow, seats, and field visibility."
        onBack={onBack}
        actions={
          <SegmentedTabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: 'general', label: 'General' },
              { value: 'seats', label: 'Seats' },
              { value: 'fields', label: 'Fields' },
            ]}
          />
        }
      />

      {tab === 'general' && <GeneralTab />}
      {tab === 'seats' && <SeatCapacityTab />}
      {tab === 'fields' && <FieldRulesTab />}
    </div>
  )
}
