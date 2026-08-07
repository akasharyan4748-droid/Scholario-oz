'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layers, Search, Users, AlertTriangle, Plus, MapPin, ChevronRight } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { getVirtualOccupied } from '@/lib/store/students-store'
import { ModuleHeader } from '../shared/module-header'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { SearchFilterBar, type FilterConfig } from '../shared/search-filter-bar'

type Tab = 'overview' | 'directory'

export function ClassesModule() {
  const [tab, setTab] = useState<Tab>('overview')
  const store = useSchoolSettingsStore()
  const classes = store.academics.classes

  const stats = useMemo(() => {
    const totalSections = classes.reduce((a, c) => a + c.sections.length, 0)
    const totalCapacity = classes.reduce(
      (a, c) => a + c.sections.reduce((sa, s) => sa + s.capacity, 0), 0,
    )
    const totalEnrolled = classes.reduce(
      (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0,
    )
    const vacant = Math.max(0, totalCapacity - totalEnrolled)
    const overloaded = classes.filter((c) => {
      const cap = c.sections.reduce((a, s) => a + s.capacity, 0)
      const enr = c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0)
      return cap > 0 && enr / cap >= 0.9
    })
    return { totalSections, totalCapacity, totalEnrolled, vacant, overloaded }
  }, [classes])

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`${classes.length} classes`, `${stats.totalSections} sections`]}
        actions={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Add Class
          </Button>
        }
      />

      <SegmentedTabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'directory', label: 'Directory' },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
      />

      {tab === 'overview' && <OverviewTab classes={classes} stats={stats} />}
      {tab === 'directory' && <DirectoryTab classes={classes} />}
    </PageTransition>
  )
}

/* ---------- Overview ---------- */

function OverviewTab({ classes, stats }: {
  classes: any[]
  stats: { totalSections: number; totalCapacity: number; totalEnrolled: number; vacant: number; overloaded: any[] }
}) {
  const occupancyPct = stats.totalCapacity > 0 ? Math.round((stats.totalEnrolled / stats.totalCapacity) * 100) : 0

  return (
    <div className="space-y-4">
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Total Classes" value={classes.length} sub={`${stats.totalSections} sections`} tone="amber" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Total Capacity" value={stats.totalCapacity} tone="violet" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Total Enrolled" value={stats.totalEnrolled} sub={`${occupancyPct}% capacity`} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="Vacant Seats" value={stats.vacant} sub={stats.overloaded.length > 0 ? `${stats.overloaded.length} near capacity` : 'within limits'} tone={stats.overloaded.length > 0 ? 'rose' : 'cyan'} icon={<AlertTriangle className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      {/* Class cards with section details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((cls, i) => {
          const cap = cls.sections.reduce((a: number, s: any) => a + s.capacity, 0)
          const enr = cls.sections.reduce((sa: number, s: any) => sa + getVirtualOccupied(s.id, s.capacity), 0)
          const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0
          const tight = pct >= 90
          const avail = Math.max(0, cap - enr)

          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className="rounded-lg border border-border/60 bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-xs">
                    {cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cls.sections.length} sections {cls.stream ? `· ${cls.stream}` : ''}
                    </p>
                  </div>
                </div>
                {cls.room && (
                  <Badge variant="secondary" className="text-[10px] gap-0.5 shrink-0">
                    <MapPin className="h-2.5 w-2.5" /> {cls.room}
                  </Badge>
                )}
              </div>

              {/* Section capacity badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {cls.sections.map((s: any) => {
                  const count = getVirtualOccupied(s.id, s.capacity)
                  const over = count > s.capacity
                  return (
                    <span
                      key={s.id}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border',
                        over
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      )}
                    >
                      Sec {s.name} · {count}/{s.capacity}
                    </span>
                  )
                })}
                {cls.subjects && (
                  <span className="text-[10px] text-muted-foreground">· {cls.subjects.length} subjects</span>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-border/40">
                <div>
                  <p className="text-[10px] text-muted-foreground">Capacity</p>
                  <p className="font-medium text-foreground">{cap}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Enrolled</p>
                  <p className="font-medium text-foreground">{enr}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                  <p className={cn('font-medium', tight ? 'text-amber-600' : 'text-emerald-600')}>{avail}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', tight ? 'bg-amber-500' : 'bg-emerald-500')}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{pct}% full</span>
                <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                  View <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Directory ---------- */

function DirectoryTab({ classes }: { classes: any[] }) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  // Extract unique levels from classes
  const levels = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((c) => { if (c.level) set.add(c.level) })
    return Array.from(set)
  }, [classes])

  const filterConfig: FilterConfig = {
    id: 'level',
    value: levelFilter,
    onChange: setLevelFilter,
    placeholder: 'All Levels',
    options: [
      { value: 'all', label: 'All Levels' },
      ...levels.map((l) => ({ value: l, label: l })),
    ],
  }

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch = !search.trim() ||
        c.name.toLowerCase().includes(q) ||
        c.sections.map((s: any) => s.name).join(' ').toLowerCase().includes(q) ||
        (c.stream || '').toLowerCase().includes(q) ||
        (c.room || '').toLowerCase().includes(q)
      const matchesLevel = levelFilter === 'all' || c.level === levelFilter
      return matchesSearch && matchesLevel
    })
  }, [classes, search, levelFilter])

  return (
    <div className="space-y-3">
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search class, section, or room…"
        filters={[filterConfig]}
      />

      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
        {filtered.map((cls) => {
          const cap = cls.sections.reduce((a: number, s: any) => a + s.capacity, 0)
          const enr = cls.sections.reduce((sa: number, s: any) => sa + getVirtualOccupied(s.id, s.capacity), 0)
          const avail = Math.max(0, cap - enr)
          const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0
          return (
            <div key={cls.id} className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cls.sections.map((s: any) => `Sec ${s.name}`).join(', ')}
                    {cls.stream ? ` · ${cls.stream}` : ''}
                    {cls.room ? ` · Room ${cls.room}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-center">
                  <p className="font-medium text-foreground">{cap}</p>
                  <p className="text-[10px] text-muted-foreground">Cap</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{enr}</p>
                  <p className="text-[10px] text-muted-foreground">Enr</p>
                </div>
                <div className="text-center">
                  <p className={cn('font-medium', avail === 0 ? 'text-rose-600' : 'text-emerald-600')}>{avail}</p>
                  <p className="text-[10px] text-muted-foreground">Avail</p>
                </div>
                <Badge variant="secondary" className={cn('text-[10px]', pct >= 90 ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700')}>
                  {pct}%
                </Badge>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No classes found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
