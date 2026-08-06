'use client'

import { useState, useMemo } from 'react'
import {
  FolderOpen, Search, Upload, Download, Star, HardDrive,
} from 'lucide-react'
import { SectionHeading, GlassCard } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { teachingResources, resourceLibraryStats, type TeachingResource } from '@/lib/mock/teacher-resources'
import { toast } from 'sonner'
import { SharedFolders } from './shared-folders'
import { FiltersBar } from './filters-bar'
import { ResourceCard } from './resource-card'
import { ResourceDetailModal } from './resource-detail-modal'

export function TeacherResourceLibraryModule() {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selected, setSelected] = useState<TeachingResource | null>(null)

  const filtered = useMemo(() => {
    return teachingResources.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.topic.toLowerCase().includes(search.toLowerCase())
      const matchSubject = subjectFilter === 'All' || r.subject === subjectFilter
      const matchType = typeFilter === 'All' || r.type === typeFilter
      return matchSearch && matchSubject && matchType
    })
  }, [search, subjectFilter, typeFilter])

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Resource Library"
        subtitle="Teaching materials, worksheets & presentations — shared & personal"
        icon={<FolderOpen className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Upload started', { description: 'Drag & drop files to upload' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Resources" value={resourceLibraryStats.totalResources} icon={<FolderOpen className="h-5 w-5" />} accent="amber" trendLabel={`${resourceLibraryStats.myUploads} my uploads`} delay={0} />
        <KpiCard label="Total Downloads" value={resourceLibraryStats.totalDownloads} icon={<Download className="h-5 w-5" />} accent="emerald" trend={18} trendLabel="this term" delay={0.05} />
        <KpiCard label="Avg Rating" value={resourceLibraryStats.avgRating} decimals={1} icon={<Star className="h-5 w-5" />} accent="violet" trendLabel="across all resources" delay={0.1} />
        <KpiCard label="Storage Used" value={resourceLibraryStats.storageUsed} suffix={`/${resourceLibraryStats.storageTotal} GB`} icon={<HardDrive className="h-5 w-5" />} accent="cyan" trendLabel="42% of quota" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Uploads Trend" subtitle="Monthly new resources" className="lg:col-span-2">
          <AreaTrend data={resourceLibraryStats.recentUploads} xKey="month" yKey="count" color="oklch(0.65 0.16 75)" height={240} gradientId="resGrad" />
        </ChartCard>
        <ChartCard title="Resources by Type" subtitle="Distribution">
          <Donut data={resourceLibraryStats.byType} centerValue={`${resourceLibraryStats.totalResources}`} centerLabel="resources" height={240} />
        </ChartCard>
      </div>

      {/* Shared folders */}
      <SharedFolders />

      {/* Search + filters */}
      <FiltersBar
        search={search}
        setSearch={setSearch}
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      {/* Resources grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((r, i) => (
          <ResourceCard key={r.id} r={r} i={i} onSelect={setSelected} />
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="p-12 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">No resources found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </GlassCard>
      )}

      {/* Resource detail modal */}
      <ResourceDetailModal selected={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
