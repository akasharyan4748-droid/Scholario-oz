'use client'

import { motion } from 'framer-motion'
import { Users, Calendar, Clock, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { mentorGroups } from '@/lib/mock/mentoring'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Mentor Groups tab — grid of group cards with gradient headers.
export function GroupsTab() {
  return (
    <motion.div key="gr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {mentorGroups.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-0 overflow-hidden h-full">
            <div className={cn('relative h-20 bg-gradient-to-br p-4 text-white', g.gradient)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{g.grade}</p>
                  <p className="font-semibold text-sm leading-tight mt-0.5">{g.name}</p>
                </div>
                <span className="flex items-center gap-1 rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">
                  <Users className="h-3 w-3" /> {g.students}
                </span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">{g.focus}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {g.meetingDay}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {g.meetingTime}</span>
              </div>
              <button
                onClick={() => toast.info(`Opening ${g.name}`)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                View Group <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
