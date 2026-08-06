'use client'

import { motion } from 'framer-motion'
import { Bus, MapPin } from 'lucide-react'
import { myBusRoute } from '@/lib/mock/bus-tracking'

export function LiveMap() {
  return (
    <div className="relative h-72 sm:h-80 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950 overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Decorative roads */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M 0 180 Q 200 120 400 160 T 800 140" stroke="oklch(0.8 0.01 160)" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M 0 180 Q 200 120 400 160 T 800 140" stroke="oklch(0.9 0.01 160)" strokeWidth="2" strokeDasharray="8 8" fill="none" strokeLinecap="round" />
        <path d="M 100 0 Q 120 150 200 300" stroke="oklch(0.8 0.01 160)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.4" />
        <path d="M 600 0 L 580 300" stroke="oklch(0.8 0.01 160)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.4" />
      </svg>

      {/* School marker (start) */}
      <div className="absolute top-4 left-4 flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg ring-2 ring-white">
          <span className="font-display font-bold text-xs">G</span>
        </div>
        <span className="mt-1 rounded-md bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-semibold shadow-sm">School</span>
      </div>

      {/* My stop marker (destination) */}
      <div className="absolute bottom-8 right-12 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-md scale-150" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg ring-2 ring-white">
            <MapPin className="h-5 w-5" />
          </div>
        </motion.div>
        <span className="mt-1 rounded-md bg-violet-600 text-white px-1.5 py-0.5 text-[9px] font-semibold shadow-sm">Your Stop</span>
      </div>

      {/* Animated bus */}
      <motion.div
        className="absolute"
        initial={{ left: '8%', top: '42%' }}
        animate={{
          left: ['8%', '28%', '48%', '62%'],
          top: ['42%', '38%', '45%', '52%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          animate={{ rotate: [0, -2, 2, 0], y: [0, -2, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="relative"
        >
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-emerald-500/40"
          />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg ring-2 ring-white">
            <Bus className="h-6 w-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Live badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 shadow-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
        <span className="text-[10px] text-muted-foreground">· {myBusRoute.lastUpdate}</span>
      </div>

      {/* Trip progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
          animate={{ width: `${(myBusRoute.distanceCovered / myBusRoute.totalDistance) * 100}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  )
}
