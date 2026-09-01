'use client'

import { motion } from 'framer-motion'
import {
  CalendarCheck, BookOpen, ClipboardList, FileText, Megaphone,
  TrendingUp, Sparkles, ArrowRight, Users, Calendar,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { announcements } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'
import { quickActions } from './data'

const actionIconMap: Record<string, React.ReactNode> = {
  CalendarCheck: <CalendarCheck className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Megaphone: <Megaphone className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
}

interface QuickActionsProps {
  onNavigate: (key: string) => void
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" /> Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(a.key)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card/50 p-3 text-left hover:shadow-premium transition-shadow"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${a.color} text-white shadow-md`}>
              {actionIconMap[a.icon]}
            </div>
            <span className="text-xs font-medium leading-tight">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}

export function NoticeBoard({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Notice Board &amp; Announcements</h3>
        <button
          onClick={() => onNavigate('communication')}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {announcements.slice(0, 4).map((a, i) => (
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
                <StatusBadge status={a.category} variant={a.category === 'Urgent' ? 'danger' : a.category === 'Event' ? 'success' : 'neutral'} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.content}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-2">
                <Users className="h-2.5 w-2.5 inline" /> {a.postedBy} · <Calendar className="h-2.5 w-2.5 inline" /> {formatDate(a.date)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
