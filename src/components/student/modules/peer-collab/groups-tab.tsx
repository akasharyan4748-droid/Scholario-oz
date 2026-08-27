'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Star, Users } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { studyGroups } from '@/lib/mock/peer-collab'
import { cn } from '@/lib/utils'

export function GroupsTab() {
  return (
    <motion.div key="gr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {studyGroups.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow cursor-pointer">
            <div className={cn('relative h-20 bg-gradient-to-br p-4 text-white', g.gradient)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{g.subject}</p>
                  <p className="font-semibold text-sm leading-tight mt-0.5">{g.name}</p>
                </div>
                {g.unreadMessages > 0 && (
                  <span className="flex items-center gap-1 rounded-md bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-bold">
                    <MessageCircle className="h-2.5 w-2.5" /> {g.unreadMessages}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{g.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {g.members} members</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Led by {g.leader}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">Active {g.lastActive}</span>
                {g.nextSession && <span className="text-[10px] font-medium text-primary">📅 {g.nextSession}</span>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
