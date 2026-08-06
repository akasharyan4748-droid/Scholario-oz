'use client'

import { motion } from 'framer-motion'
import { Megaphone, Bell, Mail, MessageSquare, Send, Clock } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { announcements, noticeBoard } from '@/lib/mock/operations'
import { ANNOUNCEMENT_STATS } from './data'
import { formatDateShort } from './shared'

const STAT_ICONS: Record<string, React.ReactNode> = {
  send: <Send className="h-4 w-4" />,
  mail: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
}

export function AnnouncementsTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          {ANNOUNCEMENT_STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-3 sm:p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>{STAT_ICONS[s.icon]}</div>
                <p className="font-display text-2xl font-bold mt-2">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label} · {s.sub}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <GlassCard className="p-3 sm:p-4">
                <div className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    a.category === 'Urgent' ? 'bg-rose-500/10 text-rose-600' :
                    a.category === 'Event' ? 'bg-emerald-500/10 text-emerald-600' :
                    a.category === 'Holiday' ? 'bg-amber-500/10 text-amber-600' :
                    a.category === 'Academic' ? 'bg-violet-500/10 text-violet-600' :
                    'bg-cyan-500/10 text-cyan-600'
                  }`}>
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <StatusBadge status={a.category} variant={a.category === 'Urgent' ? 'danger' : a.category === 'Event' ? 'success' : a.category === 'Holiday' ? 'warning' : a.category === 'Academic' ? 'primary' : 'neutral'} dot />
                      <StatusBadge status={a.audience} variant="info" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><GradientAvatar name={a.postedBy} size="sm" className="h-5 w-5 text-[9px]" /> {a.postedBy}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateShort(a.date)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notice board */}
      <div>
        <GlassCard className="p-3 sm:p-4 lg:p-5 sticky top-4">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notice Board
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Pinned notices</p>
          <div className="space-y-2.5">
            {noticeBoard.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                className="rounded-xl p-3 border-l-4 shadow-sm"
                style={{ borderColor: n.color, background: `color-mix(in oklch, ${n.color} 8%, var(--card))` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight">{n.title}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0" style={{ color: n.color, borderColor: n.color }}>{n.tag}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDateShort(n.date)}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
