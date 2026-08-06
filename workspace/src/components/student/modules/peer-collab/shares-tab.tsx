'use client'

import { motion } from 'framer-motion'
import { Download, ThumbsUp } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { sharedResources } from '@/lib/mock/peer-collab'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { typeConfig } from './data'

export function SharesTab() {
  return (
    <motion.div key="sh" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {sharedResources.map((r, i) => {
        const cfg = typeConfig[r.type]
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }}>
            <GlassCard className="p-3 sm:p-4 h-full hover:shadow-premium-lg transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold', cfg.color)}>
                  {cfg.icon} {r.type}
                </span>
                <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">{r.subject}</span>
              </div>
              <p className="font-semibold text-sm leading-tight">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <GradientAvatar name={r.sharedBy} initials={r.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate">{r.sharedBy}</p>
                  <p className="text-[9px] text-muted-foreground">{r.sharedOn}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <button onClick={() => toast.success('Liked!', { description: '+1 to your friend' })} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp className="h-3 w-3" /> {r.likes}
                </button>
                <button onClick={() => toast.success('Downloaded', { description: `${r.title} saved` })} className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline">
                  <Download className="h-3 w-3" /> {r.downloads}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
