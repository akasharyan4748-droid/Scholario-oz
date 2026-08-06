'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Play, Pause, Star, Pin, Plus, Download, ChevronRight,
  TrendingUp, Zap, Clock, X, Grid3x3, Volume2, Palette, BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { smartboardApps, mediaResources, teachingTools, classroomStats, type SmartboardApp } from '@/lib/mock/classroom'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'apps' | 'media' | 'tools'

const mediaTypeConfig = {
  Video: { icon: <Play className="h-3.5 w-3.5" />, color: 'bg-violet-500/15 text-violet-600' },
  Audio: { icon: <Volume2 className="h-3.5 w-3.5" />, color: 'bg-emerald-500/15 text-emerald-600' },
  Image: { icon: <Palette className="h-3.5 w-3.5" />, color: 'bg-rose-500/15 text-rose-600' },
  Presentation: { icon: <BookOpen className="h-3.5 w-3.5" />, color: 'bg-amber-500/15 text-amber-600' },
  Interactive: { icon: <Grid3x3 className="h-3.5 w-3.5" />, color: 'bg-cyan-500/15 text-cyan-600' },
}

export function ClassroomResourcesModule() {
  const [tab, setTab] = useState<Tab>('apps')
  const [selectedApp, setSelectedApp] = useState<SmartboardApp | null>(null)
  const [noiseMeterOn, setNoiseMeterOn] = useState(true)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Classroom Resources"
        subtitle="Smartboard apps, media library & teaching tools"
        icon={<Monitor className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('App launched', { description: 'Opening on smartboard' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resource
          </button>
        }
      />

      {/* Smartboard status strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-premium"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Smartboard — Room 2A</p>
              <p className="text-amber-50/80 text-xs">{classroomStats.smartboardStatus} · {classroomStats.smartboardTemp} · Uptime {classroomStats.smartboardUptime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/15 backdrop-blur px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Smartboard Apps" value={classroomStats.totalApps} icon={<Grid3x3 className="h-5 w-5" />} accent="amber" trendLabel={`${classroomStats.pinnedApps} pinned`} delay={0} />
        <KpiCard label="Media Library" value={classroomStats.totalMedia} icon={<Play className="h-5 w-5" />} accent="violet" trendLabel={`${classroomStats.mediaPlayedToday} played today`} delay={0.05} />
        <KpiCard label="Teaching Tools" value={classroomStats.toolsAvailable} icon={<Zap className="h-5 w-5" />} accent="emerald" trendLabel={`${classroomStats.toolsInUse} in use`} delay={0.1} />
        <KpiCard label="Sessions This Week" value={57} icon={<TrendingUp className="h-5 w-5" />} accent="cyan" trend={8} trendLabel="vs last week" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Weekly Usage" subtitle="Smartboard sessions per day" className="lg:col-span-2">
          <BarTrend data={classroomStats.weeklyUsage} xKey="day" yKey="sessions" color="oklch(0.65 0.16 75)" height={220} />
        </ChartCard>
        <ChartCard title="Usage by Subject" subtitle="App launches">
          <Donut data={classroomStats.usageBySubject} centerValue={`${classroomStats.usageBySubject.reduce((a, b) => a + b.value, 0)}`} centerLabel="launches" height={220} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'apps' as Tab, label: 'Smartboard Apps', icon: <Grid3x3 className="h-3.5 w-3.5" />, count: smartboardApps.length },
          { id: 'media' as Tab, label: 'Media Library', icon: <Play className="h-3.5 w-3.5" />, count: mediaResources.length },
          { id: 'tools' as Tab, label: 'Teaching Tools', icon: <Zap className="h-3.5 w-3.5" />, count: teachingTools.length },
        ].map((t) => (
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
        {tab === 'apps' && (
          <motion.div key="ap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {smartboardApps.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => setSelectedApp(a)}
              >
                <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
                  <div className={cn('relative h-20 bg-gradient-to-br flex items-center justify-center', a.gradient)}>
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    {a.pinned && <Pin className="absolute top-2 right-2 h-3.5 w-3.5 text-white/80 fill-white/40" />}
                    <span className="relative text-3xl">{a.icon}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold">{a.category}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500"><Star className="h-2.5 w-2.5 fill-amber-400" /> {a.rating}</span>
                    </div>
                    <p className="font-semibold text-sm leading-tight">{a.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{a.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
                      <span>Used {a.usageCount}× · {a.lastUsed}</span>
                      <span className="flex items-center gap-0.5 text-primary font-medium">Launch <ChevronRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'media' && (
          <motion.div key="md" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {mediaResources.map((m, i) => {
              const cfg = mediaTypeConfig[m.type]
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }}>
                  <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow cursor-pointer" >
                    <div className={cn('relative h-28 bg-gradient-to-br flex items-center justify-center', m.thumbnailColor)} onClick={() => toast.success('Playing', { description: m.title })}>
                      <div className="absolute inset-0 bg-grid opacity-20" />
                      <motion.div whileHover={{ scale: 1.1 }} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-2 ring-white/40">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                      </motion.div>
                      <span className={cn('absolute top-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur bg-white/85', cfg.color.split(' ')[1])}>
                        {cfg.icon} {m.type}
                      </span>
                      {m.duration && <span className="absolute bottom-2 right-2 rounded bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] font-medium text-white">{m.duration}</span>}
                    </div>
                    <div className="p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground">{m.subject}</span>
                      <p className="font-semibold text-sm leading-tight mt-0.5 line-clamp-1">{m.title}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                        <span>{m.fileSize} · {m.plays} plays</span>
                        <span>{m.lastUsed}</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {tab === 'tools' && (
          <motion.div key="tl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {teachingTools.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-3 sm:p-4 lg:p-5 h-full hover:shadow-premium-lg transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl', t.gradient)}>
                      {t.icon}
                    </div>
                    <StatusBadge status={t.status} variant={t.status === 'In Use' ? 'success' : t.status === 'Disabled' ? 'danger' : 'neutral'} dot={t.status === 'In Use'} />
                  </div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  <span className="inline-block mt-2 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase">{t.category}</span>
                  <button
                    onClick={() => {
                      if (t.id === 'TT04') {
                        setNoiseMeterOn((n) => !n)
                        toast.success(noiseMeterOn ? 'Noise meter stopped' : 'Noise meter started')
                      } else {
                        toast.success(`${t.name} activated`, { description: 'Tool is now active' })
                      }
                    }}
                    className={cn('w-full mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
                      t.status === 'In Use' ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {t.status === 'In Use' ? <><Pause className="h-3 w-3" /> Stop</> : <><Play className="h-3 w-3" /> Launch</>}
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* App detail modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedApp(null)}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
            >
              <div className={cn('bg-gradient-to-br p-5 text-white', selectedApp.gradient)}>
                <button onClick={() => setSelectedApp(null)} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-3xl">{selectedApp.icon}</div>
                  <div>
                    <p className="text-[10px] text-white/80 font-medium uppercase">{selectedApp.category}</p>
                    <h2 className="font-display text-lg font-bold">{selectedApp.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-xs"><Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {selectedApp.rating}</span>
                      <span className="rounded bg-white/15 px-1.5 py-0 text-[9px]">{selectedApp.usageCount} uses</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed">{selectedApp.description}</p>
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Last Used</p>
                    <p className="text-sm font-semibold">{selectedApp.lastUsed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Uses</p>
                    <p className="text-sm font-semibold">{selectedApp.usageCount}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { toast.success('App launched on smartboard', { description: selectedApp.name }); setSelectedApp(null) }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md">
                    <Play className="h-4 w-4" /> Launch on Smartboard
                  </button>
                  <button onClick={() => toast.info('Pin toggled')} className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 hover:bg-accent transition-colors">
                    <Pin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
