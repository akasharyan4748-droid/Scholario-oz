'use client'

import { motion } from 'framer-motion'
import {
  Bus, Navigation, Phone, MapPin, Gauge, Fuel, Activity,
} from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { TransportRoute } from './data'

type Props = { route: TransportRoute }

export function TrackingScreen({ route }: Props) {
  // Mock stops list
  const stops = Array.from({ length: route.stops }).map((_, i) => ({
    id: i + 1,
    name: [
      'DLF Phase 1', 'Sector 14', 'Sushant Lok', 'Sector 56', 'Palam Vihar',
      'Sector 23', 'Sohna Road', 'Sector 49', 'Sector 40', 'School Campus',
    ][i] ?? `Stop ${i + 1}`,
    time: ['07:15', '07:22', '07:30', '07:38', '07:45', '07:52', '07:58', '08:05', '08:12', '08:20'][i] ?? '—',
    visited: i < Math.floor(route.stops / 2),
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">Live Tracking</span>
          </div>
          <h2 className="font-display text-lg font-bold leading-tight">{route.routeName}</h2>
          <p className="text-[11px] opacity-80 mt-0.5">{route.vehicleNo} · {route.driver}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] opacity-80">ETA to School</p>
          <motion.p
            key={route.eta}
            initial={{ scale: 1.2, color: '#fde68a' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="font-display text-2xl font-bold"
          >
            {route.eta}
          </motion.p>
          <p className="text-[10px] opacity-80">{route.students} students on board</p>
        </div>
      </div>

      {/* MAP SHOWCASE */}
      <div className="relative h-[340px] overflow-hidden bg-emerald-950/30">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, oklch(0.96 0.02 162) 0%, oklch(0.94 0.04 200) 50%, oklch(0.92 0.06 162) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(oklch(0.5 0.05 162 / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.5 0.05 162 / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-8 left-10 h-20 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="absolute bottom-12 right-16 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 h-16 w-40 rounded-full bg-amber-400/10 blur-2xl" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 340" preserveAspectRatio="none">
          <path
            d="M 50 280 Q 130 220 180 240 T 320 180 Q 380 140 430 160 T 560 60"
            stroke="oklch(0.5 0.05 162 / 0.2)"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <motion.path
            d="M 50 280 Q 130 220 180 240 T 320 180 Q 380 140 430 160 T 560 60"
            stroke="oklch(0.55 0.14 162)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 6"
            initial={{ strokeDashoffset: 200 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
          {[
            { x: 50, y: 280, label: 'Start' },
            { x: 180, y: 240, label: 'S1' },
            { x: 320, y: 180, label: 'S2' },
            { x: 430, y: 160, label: 'S3' },
            { x: 560, y: 60, label: 'School' },
          ].map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r="8" fill="white" stroke="oklch(0.55 0.14 162)" strokeWidth="3" />
              <text x={s.x} y={s.y - 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="oklch(0.4 0.05 162)">{s.label}</text>
            </g>
          ))}
          <g>
            <circle cx="560" cy="60" r="12" fill="oklch(0.55 0.14 162)" opacity="0.3">
              <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="560" y="64" textAnchor="middle" fontSize="14">🏫</text>
          </g>
        </svg>

        <motion.div
          className="absolute"
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            offsetPath: "path('M 50 280 Q 130 220 180 240 T 320 180 Q 380 140 430 160 T 560 60')",
            width: 0,
            height: 0,
          }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative -ml-5 -mt-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg ring-4 ring-white/80">
              <Bus className="h-5 w-5" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-emerald-500/40 animate-ping" />
          </motion.div>
        </motion.div>

        <div className="absolute top-3 left-3 flex gap-2">
          <div className="rounded-lg bg-white/90 backdrop-blur px-2.5 py-1.5 shadow-md flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-700">LIVE</span>
          </div>
          <div className="rounded-lg bg-white/90 backdrop-blur px-2.5 py-1.5 shadow-md flex items-center gap-1.5 text-[10px] text-slate-600">
            <Gauge className="h-3 w-3" /> 42 km/h
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2">
          <div className="rounded-lg bg-white/90 backdrop-blur px-2.5 py-1.5 shadow-md text-[10px] text-slate-700">
            <span className="font-semibold">Next stop:</span> Sector 14 · 2 min
          </div>
        </div>
      </div>

      {/* Driver + Vehicle info */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Driver</p>
          <div className="flex items-center gap-2 mt-1.5">
            <GradientAvatar name={route.driver} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{route.driver}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {route.driverPhone}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Vehicle</p>
          <p className="font-mono text-sm font-semibold mt-1.5">{route.vehicleNo}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> 78%</span>
            <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> GPS Active</span>
          </div>
        </div>
      </div>

      {/* Stops list */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Route Stops · {stops.length}</h3>
          <StatusBadge status={`${stops.filter((s) => s.visited).length} visited`} variant="success" dot />
        </div>
        <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
          {stops.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 relative"
            >
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  s.visited ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600' :
                  i === stops.filter((x) => x.visited).length ? 'border-amber-500 bg-amber-500/20 text-amber-600 animate-pulse' :
                  'border-border bg-card text-muted-foreground'
                }`}>
                  {s.visited ? <span className="text-xs">✓</span> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                {i < stops.length - 1 && (
                  <div className={`w-0.5 h-8 ${s.visited ? 'bg-emerald-500/40' : 'bg-border'}`} />
                )}
              </div>
              <div className="flex-1 pb-2 -mt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${s.visited ? 'text-muted-foreground line-through' : ''}`}>{s.name}</p>
                  <span className="text-xs text-muted-foreground font-mono">{s.time}</span>
                </div>
                {i === stops.filter((x) => x.visited).length && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Approaching now · 2 min</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.success('Driver called', { description: `${route.driver} · ${route.driverPhone}` })}>
          <Phone className="h-4 w-4" /> Call Driver
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.success('SOS Alert sent', { description: 'School admin and parents notified' })}>
          <MapPin className="h-4 w-4" /> Send SOS
        </Button>
      </div>
    </div>
  )
}
