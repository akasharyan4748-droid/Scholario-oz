'use client'

import { useState, useMemo } from 'react'
import { Layers, Search, Users, AlertTriangle, Plus } from 'lucide-react'
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
import { toast } from 'sonner'

type Tab = 'overview' | 'directory'

export function ClassesModule() {
  const [tab, setTab] = useState<Tab>('overview')
  const store = useSchoolSettingsStore()
  const classes = store.academics.classes

  const totalCapacity = useMemo(
    () => classes.reduce((a, c) => a + c.sections.length * 40, 0),
    [classes],
  )
  const totalEnrolled = useMemo(
    () => classes.reduce(
      (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0),
      0,
    ),
    [classes],
  )
  const occupancyPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`${classes.length} classes`, `${classes.reduce((a, c) => a + c.sections.length, 0)} sections`]}
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

      {tab === 'overview' && (
        <OverviewTab
          classes={classes}
          totalCapacity={totalCapacity}
          totalEnrolled={totalEnrolled}
          occupancyPct={occupancyPct}
        />
      )}

      {tab === 'directory' && (
        <DirectoryTab classes={classes} />
      )}
    </PageTransition>
  )
}

/* ---------- Overview ---------- */

function OverviewTab({ classes, totalCapacity, totalEnrolled, occupancyPct }: {
  classes: any[]
  totalCapacity: number
  totalEnrolled: number
  occupancyPct: number
}) {
  const overloaded = classes.filter((c) => {
    const enrolled = c.sections.reduce((sa: number, s: any) => sa + getVirtualOccupied(s.id, s.capacity), 0)
    const cap = c.sections.length * 40
    return cap > 0 && enrolled / cap >= 0.9
  })

  return (
    <div className="space-y-4">
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Total Classes" value={classes.length} tone="amber" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Total Capacity" value={totalCapacity} tone="violet" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Total Enrolled" value={totalEnrolled} sub={`${occupancyPct}% capacity`} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="Over Capacity" value={overloaded.length} sub={overloaded.length > 0 ? 'needs attention' : 'within limits'} tone={overloaded.length > 0 ? 'rose' : 'cyan'} icon={<AlertTriangle className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      {/* Class cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((cls, i) => {
          const enrolled = cls.sections.reduce((sa: number, s: any) => sa + getVirtualOccupied(s.id, s.capacity), 0)
          const cap = cls.sections.length * 40
          const pct = cap > 0 ? Math.round((enrolled / cap) * 100) : 0
          const tight = pct >= 90
          return (
            <div key={cls.id} className="rounded-lg border border-border/60 bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cls.sections.length} sections {cls.stream ? `· ${cls.stream}` : ''}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={cn('text-[10px]', tight ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700')}>
                  {pct}% full
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Capacity</p>
                  <p className="font-medium text-foreground">{cap}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Enrolled</p>
                  <p className="font-medium text-foreground">{enrolled}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                  <p className={cn('font-medium', tight ? 'text-amber-600' : 'text-emerald-600')}>{Math.max(0, cap - enrolled)}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', tight ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Directory ---------- */

function DirectoryTab({ classes }: { classes: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return classes
    const q = search.toLowerCase()
    return classes.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.sections.join(' ').toLowerCase().includes(q) ||
      (c.stream || '').toLowerCase().includes(q)
    )
  }, [classes, search])

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search class name, section, or stream…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
        {filtered.map((cls) => {
          const enrolled = cls.sections.reduce((sa: number, s: any) => sa + getVirtualOccupied(s.id, s.capacity), 0)
          const cap = cls.sections.length * 40
          return (
            <div key={cls.id} className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cls.sections.map((s: any) => s.name).join(', ')} {cls.stream ? `· ${cls.stream}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-center">
                  <p className="font-medium text-foreground">{cap}</p>
                  <p className="text-[10px] text-muted-foreground">Cap</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{enrolled}</p>
                  <p className="text-[10px] text-muted-foreground">Enr</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-emerald-600">{Math.max(0, cap - enrolled)}</p>
                  <p className="text-[10px] text-muted-foreground">Avail</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
