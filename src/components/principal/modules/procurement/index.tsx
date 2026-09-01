'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Truck, FileText, Package, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { vendors, type Vendor } from '@/lib/mock/procurement'
import { purchaseOrders, goodsReceipts } from '@/lib/mock/procurement'
import { toast } from 'sonner'
import { type Tab } from './data'
import { KpiRow } from './kpi-row'
import { ChartsRow } from './charts-row'
import { VendorsTab } from './vendors-tab'
import { OrdersTab } from './orders-tab'
import { ReceiptsTab } from './receipts-tab'
import { VendorModal } from './vendor-modal'

import { SegmentedTabs } from '../shared/segmented-tabs'

export function ProcurementModule() {
  const [tab, setTab] = useState<Tab>('vendors')
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const filteredVendors = vendors.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Vendor & Procurement"
        subtitle="Suppliers, purchase orders & goods receipt management"
        icon={<Truck className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('PO created', { description: 'Draft purchase order saved' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Create PO
          </button>
        }
      />

      <KpiRow />

      <ChartsRow />

      {/* Tabs */}
      <SegmentedTabs
      tabs={[
        { value: 'vendors', label: 'Vendors', icon: <Truck className="h-3.5 w-3.5" />, badge: vendors.length },
        { value: 'orders', label: 'Purchase Orders', icon: <FileText className="h-3.5 w-3.5" />, badge: purchaseOrders.length },
        { value: 'receipts', label: 'Goods Receipts', icon: <Package className="h-3.5 w-3.5" />, badge: goodsReceipts.length }
      ]}
      value={tab}
      onValueChange={setTab}
    />

      <AnimatePresence mode="wait">
        {tab === 'vendors' && (
          <VendorsTab
            search={search}
            setSearch={setSearch}
            filteredVendors={filteredVendors}
            onSelectVendor={setSelectedVendor}
          />
        )}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'receipts' && <ReceiptsTab />}
      </AnimatePresence>

      {/* Vendor detail modal */}
      <AnimatePresence>
        {selectedVendor && (
          <VendorModal
            selectedVendor={selectedVendor}
            onClose={() => setSelectedVendor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
