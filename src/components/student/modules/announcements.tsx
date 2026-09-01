'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Pin, Filter, Calendar, User, Sparkles, AlertCircle,
  PartyPopper, BookOpen, GraduationCap, ChevronRight,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { announcements, noticeBoard } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'

const categoryConfig: Record<string, { bg: string; text: string; gradient: string; icon: React.ReactNode; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' }> = {
  Event: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500', icon: <PartyPopper className="h-4 w-4" />, variant: 'success' },
  Academic: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500', icon: <BookOpen className="h-4 w-4" />, variant: 'primary' },
  Holiday: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', icon: <Sparkles className="h-4 w-4" />, variant: 'warning' },
  Urgent: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-pink-500', icon: <AlertCircle className="h-4 w-4" />, variant: 'danger' },
  General: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-400 to-sky-500', icon: <Megaphone className="h-4 w-4" />, variant: 'info' },
}

export function AnnouncementsModule() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? announcements
    : announcements.filter((a) => a.category.toLowerCase() === filter)

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Announcements"
        subtitle="Stay updated with the latest from school"
        icon={<Megaphone className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={`${announcements.length} notices`} variant="primary" dot />
          </div>
        }
      />

      {/* Notice board (pinned) */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Pin className="h-4 w-4 text-rose-500" /> Pinned Notice Board
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Important dates & upcoming activities</p>
          </div>
          <StatusBadge status="Live" variant="success" dot />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {noticeBoard.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium transition-all"
            >
              <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full opacity-20 blur-2xl`} style={{ background: n.color }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: n.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{n.tag}</span>
                </div>
                <p className="font-semibold text-sm leading-tight">{n.title}</p>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(n.date)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Filter tabs + announcements list */}
      <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-bold">All Announcements</h3>
          </div>
        </div>
        <TabsList className="bg-card/60 backdrop-blur w-full justify-start overflow-x-auto no-scrollbar h-auto flex-wrap">
          <TabsTrigger value="all">All ({announcements.length})</TabsTrigger>
          <TabsTrigger value="event">Events ({announcements.filter((a) => a.category === 'Event').length})</TabsTrigger>
          <TabsTrigger value="academic">Academic ({announcements.filter((a) => a.category === 'Academic').length})</TabsTrigger>
          <TabsTrigger value="holiday">Holidays ({announcements.filter((a) => a.category === 'Holiday').length})</TabsTrigger>
          <TabsTrigger value="general">General ({announcements.filter((a) => a.category === 'General').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((a, i) => {
                const c = categoryConfig[a.category] ?? categoryConfig.General
                return (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-md`}>
                          {c.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm leading-tight">{a.title}</p>
                            <StatusBadge status={a.category} variant={c.variant} />
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {formatDate(a.date)}</span>
                            <span className="text-border">·</span>
                            <span className="flex items-center gap-0.5"><User className="h-3 w-3" /> {a.postedBy}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <GradientAvatar name={a.postedBy} size="sm" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium truncate">{a.postedBy}</p>
                            <p className="text-[10px] text-muted-foreground">School Administration</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            For: {a.audience}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick categories */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Browse by Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(categoryConfig).map(([cat, c], i) => {
            const count = announcements.filter((a) => a.category === cat).length
            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => setFilter(cat.toLowerCase())}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  filter === cat.toLowerCase()
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card/40 hover:shadow-premium'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-md mb-2`}>
                  {c.icon}
                </div>
                <p className="font-semibold text-sm">{cat}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground">{count} notices</p>
                  <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
