'use client'

import { motion } from 'framer-motion'
import { Image as ImageIcon } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { eventGallery } from '@/lib/mock/events'
import { formatDate } from '@/lib/format'

export function GalleryTab() {
  return (
    <motion.div key="gl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {eventGallery.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}>
          <GlassCard className="p-0 overflow-hidden cursor-pointer hover:shadow-premium-lg transition-shadow">
            <div className="relative h-36 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <ImageIcon className="h-10 w-10 text-white/80" />
              <span className="absolute bottom-2 right-2 rounded-md bg-black/40 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white">{g.photos} photos</span>
            </div>
            <div className="p-4">
              <p className="font-semibold text-sm">{g.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(g.date)}</p>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
