'use client'

/**
 * InventoryModule — Principal Inventory workspace orchestrator.
 *
 * The global sidebar already says "Inventory", so the header here uses a
 * contextual title ("Inventory & Assets") — no duplicate "Inventory
 * Management" title.
 *
 * Layout:
 *   - Header: contextual title + Add Item button
 *   - Summary pill line: items · total value · low stock · out of stock · categories
 *   - Tab navigation: Items · Movements · Low Stock · Reports
 *   - KPI cards row (4 soft tinted cards — Total Items, Total Value, Low Stock, Categories)
 *   - Active tab panel:
 *       * items:    ItemsTable
 *       * movements: StockMovementLog (full)
 *       * lowstock:  LowStockAlerts
 *       * reports:   InventoryReports (CategoryValueDistribution + Movements by Type + Low Stock + Movement Log)
 *   - Add Item dialog
 *   - Item Action dialog (single dialog handling all 4 stock actions)
 *
 * State from inventory-store + useInventoryData.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, AlertTriangle, IndianRupee, Layers,
  FileBarChart2, History, PackageSearch, Boxes,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInventoryStore, useInventoryData } from '@/lib/store/inventory-store'
import type { InventoryItem } from '@/lib/store/inventory-store'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { INV_GLOBAL_STYLES, InvKpiCard, type InvTab } from './inventory-shared'
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

  // Tab badges (real counts)
  const tabBadges: Partial<Record<InvTab, number>> = {
    movements: movementsCount,
    lowstock: analytics.lowStockCount + analytics.outOfStockCount,
  }

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
    <div className="flex flex-col h-full inventory-shell">
      <style dangerouslySetInnerHTML={{ __html: INV_GLOBAL_STYLES }} />

      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                School Inventory
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Inventory & Assets</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setTab('reports')}
              >
                <FileBarChart2 className="h-3.5 w-3.5" /> Reports
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>
          </div>

          {/* Summary pill line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums inline-flex items-center gap-1">
              <Package className="h-2.5 w-2.5" /> Items <span className="font-bold text-foreground">{analytics.totalItems}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <IndianRupee className="h-2.5 w-2.5" /> Value <span className="font-bold text-emerald-600">{formatINR(analytics.totalValue, true)}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" /> Low <span className="font-bold text-amber-600">{analytics.lowStockCount}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <PackageSearch className="h-2.5 w-2.5" /> Out <span className="font-bold text-rose-600">{analytics.outOfStockCount}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Layers className="h-2.5 w-2.5" /> Categories <span className="font-bold text-violet-600">{analytics.categoryCount}</span>
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-fit">
            {TABS.map((t) => {
              const badge = tabBadges[t.value]
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  aria-current={tab === t.value ? 'page' : undefined}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                    tab === t.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      'inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold tabular-nums',
                      t.value === 'lowstock'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : tab === t.value
                          ? 'bg-muted/80 text-muted-foreground'
                          : 'bg-muted/60 text-muted-foreground',
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* KPI cards row — always visible */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <InvKpiCard
            icon={<Boxes className="h-4 w-4" />}
            label="Total Items"
            value={analytics.totalItems}
            sub={`${analytics.categoryCount} categories tracked`}
            accent="emerald"
            delay={0}
            onClick={() => setTab('items')}
          />
          <InvKpiCard
            icon={<IndianRupee className="h-4 w-4" />}
            label="Total Value"
            value={formatINR(analytics.totalValue, true)}
            sub="Current stock value"
            accent="amber"
            delay={0.05}
            onClick={() => setTab('reports')}
          />
          <InvKpiCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Low Stock"
            value={analytics.lowStockCount}
            sub={`${analytics.outOfStockCount} out of stock`}
            accent="rose"
            delay={0.1}
            onClick={() => setTab('lowstock')}
          />
          <InvKpiCard
            icon={<Layers className="h-4 w-4" />}
            label="Categories"
            value={analytics.categoryCount}
            sub="Across all locations"
            accent="violet"
            delay={0.15}
            onClick={() => setTab('reports')}
          />
        </div>

        {/* Active tab panel */}
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
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20">
                  <History className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{movementsCount}</span> recorded movements
                    ·{' '}
                    <span className="font-semibold text-emerald-600">Stock In · Returned</span>
                    ·{' '}
                    <span className="font-semibold text-amber-600">Issued</span>
                    ·{' '}
                    <span className="font-semibold text-rose-600">Stock Out · Damaged · Lost</span>
                    ·{' '}
                    <span className="font-semibold text-cyan-600">Adjustment</span>
                  </p>
                </div>
                <StockMovementLog />
              </>
            )}
            {tab === 'lowstock' && (
              <LowStockAlerts onAddStock={(it) => handleAction('add', it)} />
            )}
            {tab === 'reports' && (
              <InventoryReports onAddStock={(it) => handleAction('add', it)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
      <ItemActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        kind={actionKind}
        item={actionItem}
      />
    </div>
  )
}
