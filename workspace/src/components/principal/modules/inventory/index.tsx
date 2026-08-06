'use client'

import { useState, useMemo } from 'react'
import {
  Package, Plus, AlertTriangle, IndianRupee, Layers,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { SectionHeading } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { inventoryStats, inventoryItems } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { stockMovements, VALUE_BY_CAT } from './data'
import { ItemsTable } from './items-table'
import { LowStockAlerts, StockMovementLog } from './movement-panels'
import { AddItemDialog } from './add-item-dialog'

export function InventoryModule() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [addOpen, setAddOpen] = useState(false)

  const categories = useMemo(() => ['All', ...Array.from(new Set(inventoryItems.map((i) => i.category)))], [])
  const filtered = useMemo(() => inventoryItems.filter((i) => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase())
    const mc = category === 'All' || i.category === category
    return ms && mc
  }), [search, category])

  const lowStockItems = inventoryItems.filter((i) => i.status === 'Low Stock')

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Inventory Management"
        subtitle={`${inventoryStats.totalAssets} assets · ${inventoryStats.categories.length} categories`}
        icon={<Package className="h-5 w-5" />}
        action={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Assets" value={inventoryStats.totalAssets} icon={<Package className="h-5 w-5" />} trend={2.1} accent="emerald" delay={0} />
        <KpiCard label="Total Value" value={inventoryStats.totalValue} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trend={4.8} accent="amber" delay={0.05} />
        <KpiCard label="Low Stock Alerts" value={inventoryStats.lowStock} icon={<AlertTriangle className="h-5 w-5" />} trendLabel="Needs reorder" accent="rose" delay={0.1} />
        <KpiCard label="Categories" value={inventoryStats.categories.length} icon={<Layers className="h-5 w-5" />} trendLabel="Furniture dominant" accent="violet" delay={0.15} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Value by Category" subtitle="Asset value distribution" height={300}>
          <BarTrend data={VALUE_BY_CAT.map((c) => ({ name: c.name, value: c.value / 100000 }))} xKey="name" yKey="value" color="oklch(0.55 0.14 162)" height={300} />
        </ChartCard>

        <ChartCard title="Items by Category" subtitle="Count per category" height={300}>
          <Donut data={inventoryStats.categories.map((c) => ({ name: c.name, value: c.count, color: c.color }))} centerValue={`${inventoryStats.totalAssets}`} centerLabel="Items" height={300} />
        </ChartCard>
      </div>

      {/* Items table */}
      <ItemsTable
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        categories={categories}
        filtered={filtered}
      />

      {/* Low stock + Movement log */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <LowStockAlerts lowStockItems={lowStockItems} />
        <StockMovementLog movements={stockMovements} />
      </div>

      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
