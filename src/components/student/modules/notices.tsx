'use client'

/**
 * NoticesModule — Notifications + Announcements + Calendar consolidated
 * into ONE "Notices" destination. The notification feed keeps its
 * deep-links (View → the relevant module) via the forwarded onNavigate.
 */

import { StudentNotificationsModule } from './notifications'
import { AnnouncementsModule } from './announcements'
import { CalendarModule } from './calendar'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'notifications', label: 'My Feed' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'calendar', label: 'Calendar' },
]

export function NoticesModule({ initialTab, onTabChange, onNavigate }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
  onNavigate?: (key: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'notifications', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Notices sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'notifications' && <StudentNotificationsModule onNavigate={onNavigate} />}
        {tab === 'announcements' && <AnnouncementsModule />}
        {tab === 'calendar' && <CalendarModule />}
      </ModuleTabPanel>
    </div>
  )
}
