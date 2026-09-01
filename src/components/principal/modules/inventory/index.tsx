'use client'

/**
 * InventoryModule — Principal Inventory workspace orchestrator.
 *
 * Visual shell follows the Academics (Examinations + Attendance) canonical
 * pattern:
 *   <PageTransition className="space-y-4">
 *     <div className="flex items-center justify-between gap-3 flex-wrap">
 *       <SegmentedTabs ... />          ← left
 *       <Button>Add Item</Button>      ← right (primary, solid emerald)
 *     </div>
 *     <AnimatePresence mode="wait">
 *       {tab === 'items' && <motion.div key="items" ...><ItemsTable /></motion.div>}
 *       ...
 *     </AnimatePresence>
 *   </PageTransition>
 *
 * NO sticky header, NO eyebrow, NO h1, NO summary pill line — the sidebar
 * already names the module, and the per-tab content (panel subtitles, tab
 * badges) is the single home for each metric.
 *
 * Layout:
 *   - Tab row: Items · Movements · Low Stock · Reports (left)
 *              + Add Item button (right)
 *   - Active tab panel:
 *       * items:    ItemsTable
 *       * movements: StockMovementLog (full)
 *       * lowstock:  LowStockAlerts
 *       * reports:   InventoryReports (CategoryValueDistribution + Movements by Type)
 *   - Add Item dialog
 *   - Item Action dialog (single dialog handling all 4 stock actions)
 *
 * State from inventory-store + useInventoryData. Keyboard shortcuts 1-4.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, AlertTriangle, FileBarChart2, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { useInventoryStore, useInventoryData } from '@/lib/store/inventory-store'
import type { InventoryItem } from '@/lib/store/inventory-store'
import { INV_GLOBAL_STYLES, type InvTab } from './inventory-shared'
import { ItemsTable } from './items-table'
import { AddItemDialog } from './add-item-dialog'
import { ItemActionDialog, type ActionKind } from './item-action-dialog'
import { StockMovementLog, LowStockAlerts, InventoryReports } from './movement-panels'

const TABS: Array<{ value: InvTab; label: string; icon: React.ReactNode; badge?: number }> = [
  { value: 'items', label: 'Items', icon: <Package className="h-3.5 w-3.5" /> },
  { value: 'movements', label: 'Movements', icon: <History className="h-3.5 w-3.5" /> },
  { value: 'lowstock', label: 'Low Stock', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
]

export function InventoryModule() {
  const [tab, setTab] = useState<InvTab>('items')
  const [addOpen, setAddOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [actionKind, setActionKind] = useState<ActionKind>('add')
  const [actionItem, setActionItem] = useState<InventoryItem | null>(null)

  const data = useInventoryData()
  const { analytics } = data
  const movementsCount = useInventoryStore((s) => s.movements.length)

  // Tab badges (real counts). SegmentedTabs suppresses rendering when 0.
  const tabsWithBadges = TABS.map((t) => {
    const badgeMap: Partial<Record<InvTab, number>> = {
      movements: movementsCount,
      lowstock: analytics.lowStockCount + analytics.outOfStockCount,
    }
    return { ...t, badge: badgeMap[t.value] }
  })

  // Keyboard shortcuts: 1-4 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1
        if (idx < TABS.length) {
          e.preventDefault()
          setTab(TABS[idx].value)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleAction = (kind: ActionKind, item: InventoryItem) => {
    setActionKind(kind)
    setActionItem(item)
    setActionOpen(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INV_GLOBAL_STYLES }} />
      <PageTransition className="space-y-4 inventory-shell">
      {/* Tab row + Add Item action on the right */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          tabs={tabsWithBadges}
          value={tab}
          onValueChange={(v) => setTab(v as InvTab)}
        />
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      </div>

      {/* Active tab content with AnimatePresence transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {tab === 'items' && (
            <ItemsTable onAction={handleAction} />
          )}
          {tab === 'movements' && (
            <StockMovementLog />
          )}
          {tab === 'lowstock' && (
            <LowStockAlerts onAddStock={(it) => handleAction('add', it)} />
          )}
          {tab === 'reports' && (
            <InventoryReports />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dialogs */}
      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
      <ItemActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        kind={actionKind}
        item={actionItem}
      />
      </PageTransition>
    </>
  )
}
