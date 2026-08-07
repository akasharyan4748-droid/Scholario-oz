'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Building2, BedDouble, UtensilsCrossed, Users, IndianRupee, Star, Plus,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { hostelBlocks, hostelRooms, hostelStats } from '@/lib/mock/hostel'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { type Tab } from './data'
import { BlocksTab } from './blocks-tab'
import { RoomsTab } from './rooms-tab'
import { MessTab } from './mess-tab'

import { SegmentedTabs } from '../shared/segmented-tabs'

export function HostelModule() {
  const [tab, setTab] = useState<Tab>('blocks')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Hostel Management"
        subtitle="Blocks, room allocation, mess & boarding operations"
        icon={<Building2 className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Room allocated', { description: 'New boarder assigned to room' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Allocate Room
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Boarders" value={hostelStats.totalBoarders} icon={<Users className="h-5 w-5" />} accent="emerald" trend={4.2} trendLabel={`${hostelStats.boysCount}B / ${hostelStats.girlsCount}G`} delay={0} />
        <KpiCard label="Occupancy Rate" value={hostelStats.occupancyRate} suffix="%" icon={<BedDouble className="h-5 w-5" />} accent="violet" trend={2.1} trendLabel={`${hostelStats.occupiedRooms}/${hostelStats.totalRooms} rooms`} delay={0.05} />
        <KpiCard label="Monthly Revenue" value={hostelStats.monthlyRevenue} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} accent="amber" trend={6.8} trendLabel="from boarding fees" delay={0.1} />
        <KpiCard label="Mess Rating" value={hostelStats.messRating} decimals={1} icon={<Star className="h-5 w-5" />} accent="cyan" trend={0.3} trendLabel={`${hostelStats.messServingsToday} today`} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Occupancy Trend" subtitle="Monthly rate (%)" className="lg:col-span-2">
          <AreaTrend data={hostelStats.monthlyTrend} xKey="month" yKey="occupancy" color="oklch(0.55 0.14 162)" height={240} gradientId="hostelGrad" />
        </ChartCard>
        <ChartCard title="Boarders by Block" subtitle="Distribution">
          <Donut data={hostelStats.blockDistribution} centerValue={`${hostelStats.totalBoarders}`} centerLabel="boarders" height={240} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <SegmentedTabs
      tabs={[
        { value: 'blocks', label: 'Hostel Blocks', icon: <Building2 className="h-3.5 w-3.5" />, badge: hostelBlocks.length },
        { value: 'rooms', label: 'Rooms', icon: <BedDouble className="h-3.5 w-3.5" />, badge: hostelRooms.length },
        { value: 'mess', label: 'Mess & Dining', icon: <UtensilsCrossed className="h-3.5 w-3.5" /> }
      ]}
      value={tab}
      onValueChange={setTab}
    />

      <AnimatePresence mode="wait">
        {tab === 'blocks' && <BlocksTab key="bl" />}
        {tab === 'rooms' && <RoomsTab key="rm" search={search} setSearch={setSearch} />}
        {tab === 'mess' && <MessTab key="ms" />}
      </AnimatePresence>
    </div>
  )
}
