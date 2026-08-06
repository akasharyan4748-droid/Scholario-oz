'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, CalendarDays, TrendingUp, GraduationCap, Send } from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { alumni, alumniStats, type Alumni } from '@/lib/mock/alumni'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DirectoryTab } from './directory-tab'
import { DonationsTab } from './donations-tab'
import { ReunionsTab } from './reunions-tab'
import { AlumniDetailModal } from './detail-modal'

type Tab = 'directory' | 'donations' | 'reunions'

export function AlumniModule() {
  const [tab, setTab] = useState<Tab>('directory')
  const [search, setSearch] = useState('')
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null)

  const tabs = [
    { id: 'directory' as Tab, label: 'Alumni Directory', icon: <Users className="h-3.5 w-3.5" />, count: alumni.length },
    { id: 'donations' as Tab, label: 'Donations', icon: <Heart className="h-3.5 w-3.5" />, count: alumni.length },
    { id: 'reunions' as Tab, label: 'Reunions', icon: <CalendarDays className="h-3.5 w-3.5" />, count: alumni.length },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Alumni & Donations"
        subtitle="Manage alumni network, track contributions & plan reunions"
        icon={<Users className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Invite sent', { description: 'Alumni invite emailed to selected contacts' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Send className="h-3.5 w-3.5" /> Invite Alumni
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Alumni" value={alumniStats.totalAlumni} icon={<Users className="h-5 w-5" />} accent="emerald" trend={4.2} trendLabel="across 4 decades" delay={0} />
        <KpiCard label="Active Members" value={alumniStats.activeMembers} icon={<Heart className="h-5 w-5" />} accent="rose" trend={8.4} trendLabel="64% engagement" delay={0.05} />
        <KpiCard label="Total Donations" value={alumniStats.totalDonations} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} accent="amber" trend={34} trendLabel="this year +34%" delay={0.1} />
        <KpiCard label="Scholarships" value={alumniStats.scholarshipBeneficiaries} suffix=" students" icon={<GraduationCap className="h-5 w-5" />} accent="violet" trendLabel="funded by alumni" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Donations Trend" subtitle="Monthly contributions (₹)" className="lg:col-span-2" action={<StatusBadge status="+34% YoY" variant="success" dot />}>
          <AreaTrend data={alumniStats.monthlyDonations} xKey="month" yKey="amount" color="oklch(0.65 0.16 75)" height={260} gradientId="donGrad" />
        </ChartCard>
        <ChartCard title="Donation Purpose" subtitle="Fund allocation">
          <Donut data={alumniStats.donationPurpose} centerValue={formatINR(alumniStats.totalDonations, true)} centerLabel="total" height={260} />
        </ChartCard>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{t.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'directory' && <DirectoryTab alumni={alumni} search={search} setSearch={setSearch} onSelect={setSelectedAlumni} />}
        {tab === 'donations' && <DonationsTab />}
        {tab === 'reunions' && <ReunionsTab />}
      </AnimatePresence>

      <AlumniDetailModal alumni={selectedAlumni} onClose={() => setSelectedAlumni(null)} />
    </div>
  )
}
