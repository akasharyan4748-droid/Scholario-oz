'use client'

import { motion } from 'framer-motion'
import {
  Megaphone, Plus, Pin, Users, Calendar,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { announcements } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { categoryColor } from './data'

interface AnnouncementsListProps {
  onNew: () => void
}

export function AnnouncementsList({ onNew }: AnnouncementsListProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Recent Announcements</h3>
          <p className="text-xs text-muted-foreground mt-0.5">School-wide notices · sorted by date</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onNew} className="h-8">
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </div>
      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 -mr-1">
        {announcements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', categoryColor[a.category])}>
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{a.title}</p>
                <StatusBadge status={a.category} variant={a.category === 'Urgent' ? 'danger' : a.category === 'Event' ? 'success' : a.category === 'Holiday' ? 'warning' : 'neutral'} />
                <StatusBadge status={`To: ${a.audience}`} variant="info" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {a.postedBy}</span>
                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(a.date)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => toast.success('Announcement pinned to notice board')}>
              <Pin className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
