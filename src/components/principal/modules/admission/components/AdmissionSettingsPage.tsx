'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  PageHeader, SegmentedTabs,
} from '@/components/principal/modules/shared/settings-primitives'
import { ActionBar } from '@/components/principal/modules/shared/settings-primitives'
import {
  SettingsDirtyProvider, useSettingsDirty,
} from '@/components/principal/modules/shared/use-settings-dirty'
import { toast } from 'sonner'
import type { AdmissionSettingsPageProps } from './field-config/types'
import { GeneralTab } from './field-config/GeneralTab'
import { SeatCapacityTab } from './field-config/SeatCapacityTab'
import { FieldRulesTab } from './field-config/FieldRulesTab'

type TabId = 'general' | 'seats' | 'fields'

/**
 * AdmissionSettingsPage — full-page settings sub-route.
 *
 * Global dirty-state: any change on ANY tab (General, Seats, Fields)
 * triggers the sticky ActionBar at the bottom. Save commits all tabs;
 * Discard reverts all tabs.
 */
export function AdmissionSettingsPage({ onBack }: AdmissionSettingsPageProps) {
  return (
    <SettingsDirtyProvider>
      <AdmissionSettingsInner onBack={onBack} />
    </SettingsDirtyProvider>
  )
}

function AdmissionSettingsInner({ onBack }: AdmissionSettingsPageProps) {
  const [tab, setTab] = useState<TabId>('general')
  const { dirty, saveAll, discardAll } = useSettingsDirty()

  const handleSave = useCallback(async () => {
    try {
      await saveAll()
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }, [saveAll])

  const handleDiscard = useCallback(async () => {
    await discardAll()
    toast.info('Changes discarded')
  }, [discardAll])

  return (
    <div className="mx-auto max-w-4xl pb-24">
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

      {/* All tabs stay mounted so their dirty state persists across switches */}
      <div className={tab === 'general' ? '' : 'hidden'}><GeneralTab /></div>
      <div className={tab === 'seats' ? '' : 'hidden'}><SeatCapacityTab /></div>
      <div className={tab === 'fields' ? '' : 'hidden'}><FieldRulesTab /></div>

      <ActionBar
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  )
}
