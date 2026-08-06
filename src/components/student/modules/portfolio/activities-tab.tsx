'use client'

import { motion } from 'framer-motion'
import { Palette, Calendar, Medal } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { extracurriculars } from '@/lib/mock/portfolio'

export function ActivitiesTab() {
  return (
    <motion.div key="ac" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {extracurriculars.map((e, i) => (
        <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                <Palette className="h-5 w-5" />
              </div>
              <StatusBadge status={e.status === 'active' ? 'Active' : 'Completed'} variant={e.status === 'active' ? 'success' : 'neutral'} dot />
            </div>
            <p className="font-semibold text-sm">{e.activity}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{e.role}</p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {e.duration}</p>
            {e.achievement && (
              <div className="mt-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-0.5 flex items-center gap-1">
                  <Medal className="h-3 w-3" /> Achievement
                </p>
                <p className="text-xs">{e.achievement}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
