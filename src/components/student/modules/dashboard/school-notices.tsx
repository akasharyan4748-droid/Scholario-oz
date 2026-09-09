'use client'

/**
 * SchoolNotices — the dashboard's notice strip (spec §9: "important
 * school/class notice"). The transport card was REMOVED from the
 * dashboard — transport lives in the Transport module (no repetition,
 * no hardcoded route/pickup duplicates).
 */

import { motion } from 'framer-motion'
import { Megaphone, ArrowUpRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { announcements } from '@/lib/mock/operations'

export function SchoolNotices({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> School Notices
        </h3>
        <button
          onClick={() => onNavigate('announcements')}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {announcements.slice(0, 3).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              a.category === 'Urgent' ? 'bg-rose-500/10 text-rose-600' :
              a.category === 'Event' ? 'bg-emerald-500/10 text-emerald-600' :
              a.category === 'Holiday' ? 'bg-amber-500/10 text-amber-600' :
              a.category === 'Academic' ? 'bg-violet-500/10 text-violet-600' :
              'bg-cyan-500/10 text-cyan-600'
            }`}>
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{a.title}</p>
                <StatusBadge status={a.category} variant={a.category === 'Urgent' ? 'danger' : a.category === 'Event' ? 'success' : a.category === 'Holiday' ? 'warning' : 'neutral'} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.content}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{a.postedBy} · {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
