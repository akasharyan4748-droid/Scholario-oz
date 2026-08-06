'use client'

import { motion } from 'framer-motion'
import { Megaphone, Pin, Send, Check } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { announcements, noticeBoard } from '@/lib/mock/operations'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Announcements', value: announcements.length, color: 'emerald', icon: <Megaphone className="h-4 w-4" /> },
  { label: 'Pinned Notices', value: noticeBoard.length, color: 'amber', icon: <Pin className="h-4 w-4" /> },
  { label: 'Messages Sent', value: 142, color: 'cyan', icon: <Send className="h-4 w-4" /> },
  { label: 'Delivery Rate', value: '98.6%', color: 'violet', icon: <Check className="h-4 w-4" /> },
] as const

export function StatCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                s.color === 'amber' && 'bg-amber-500/10 text-amber-600',
                s.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                s.color === 'cyan' && 'bg-cyan-500/10 text-cyan-600',
                s.color === 'violet' && 'bg-violet-500/10 text-violet-600',
              )}>{s.icon}</div>
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
