'use client'

/**
 * QuickActions + NoticeBoard (TWC-FE-4).
 *
 * QuickActions — unchanged navigation surface (all six module keys exist in
 * the reduced Teacher Workspace: attendance, lesson-planner, marks,
 * communication, analytics, students).
 *
 * NoticeBoard — rebuilt on REAL Notification rows from the dashboard
 * aggregate (audience-scoped, latest three). The old
 * `lib/mock/operations` announcements are gone: title + sender + relative
 * date, an Important badge for HIGH/URGENT priority, an honest "No notices"
 * empty state, and "View all" into the Communication module.
 */

import { motion } from 'framer-motion'
import {
  CalendarCheck, BookMarked, FileText, Megaphone,
  TrendingUp, Sparkles, ArrowRight, Users,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { relativeTime } from './hooks/use-teacher-dashboard'
import type { TeacherNotice } from './types'

const quickActions = [
  { label: 'Mark Attendance', icon: 'CalendarCheck', color: 'from-amber-500 to-orange-600', key: 'attendance' },
  { label: "Today's Lesson", icon: 'BookMarked', color: 'from-emerald-500 to-teal-600', key: 'lesson-planner' },
  { label: 'Enter Marks', icon: 'FileText', color: 'from-rose-500 to-pink-600', key: 'marks' },
  { label: 'Message Parents', icon: 'Megaphone', color: 'from-cyan-500 to-sky-600', key: 'communication' },
  { label: 'View Analytics', icon: 'TrendingUp', color: 'from-lime-500 to-green-600', key: 'analytics' },
  { label: 'Student Directory', icon: 'Users', color: 'from-violet-500 to-purple-600', key: 'students' },
] as const

const actionIconMap: Record<string, React.ReactNode> = {
  CalendarCheck: <CalendarCheck className="h-4 w-4" />,
  BookMarked: <BookMarked className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Megaphone: <Megaphone className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
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

interface NoticeBoardProps {
  notices: TeacherNotice[]
  onNavigate: (key: string) => void
}

export function NoticeBoard({ notices, onNavigate }: NoticeBoardProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Notice Board</h3>
        <button
          type="button"
          onClick={() => onNavigate('communication')}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="py-8 text-center">
          <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">No notices</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            School announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {notices.map((n, i) => {
            const important = n.priority === 'HIGH' || n.priority === 'URGENT'
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  important
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-muted/60 text-muted-foreground'
                }`}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{n.title}</p>
                    {important && (
                      <StatusBadge status="Important" variant="danger" className="px-2 py-0 text-[10px]" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-2">
                    <Users className="h-2.5 w-2.5 inline" aria-hidden /> {n.sender}
                    <span aria-hidden>·</span> {relativeTime(n.createdAt)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
