'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, ShieldAlert, IndianRupee, UserPlus, Clock, BookOpen, Coins,
  Calendar, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  type?: string
  title?: string
  description?: string
  time?: string
  timestamp?: string
  message?: string
  unread: boolean
}

interface NotificationsDropdownProps {
  open: boolean
  onClose: () => void
  notifList: NotificationItem[]
  onMarkAllRead: () => void
  onNotificationClick: (id: string) => void
  onNavigateDashboard: () => void
  role: ShellRole
  liveAlertCount: number
  totalBadgeCount: number
  unreadCount: number
  /** 'live' = real DB feed, 'demo' = static demo data */
  source?: 'live' | 'demo'
  /** Optional banner content rendered above the list (e.g. platform-scope note) */
  children?: React.ReactNode
}

type ShellRole = 'principal' | 'teacher' | 'student' | 'superadmin'

export function NotificationsDropdown({
  open,
  notifList,
  onMarkAllRead,
  onNotificationClick,
  onNavigateDashboard,
  role,
  liveAlertCount,
  totalBadgeCount,
  unreadCount,
  source = 'demo',
  children,
}: NotificationsDropdownProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-card border border-border shadow-xl p-3 z-50 text-card-foreground"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-bold text-xs text-foreground">Notifications</span>
              {/* Feed source indicator */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                  source === 'live'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                )}
                title={source === 'live' ? 'Synced from database' : 'Showing demo data'}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', source === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
                {source === 'live' ? 'Live' : 'Demo'}
              </span>
              {totalBadgeCount > 0 && (
                <span className={cn(
                  'text-[10px] font-extrabold px-1.5 py-0.2 rounded-full',
                  role === 'principal' && liveAlertCount > 0 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-primary/15 text-primary'
                )}>
                  {totalBadgeCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[10px] text-primary hover:underline font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>
          {/* Live alerts summary for principal */}
          {role === 'principal' && liveAlertCount > 0 && (
            <button
              onClick={onNavigateDashboard}
              className="w-full mt-2 mb-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 hover:bg-rose-500/10 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Live Operations Alerts</p>
                    <p className="text-[10px] text-muted-foreground">{liveAlertCount} active alert{liveAlertCount > 1 ? 's' : ''} need attention</p>
                  </div>
                </div>
                <span className="font-display text-base font-bold text-rose-600 dark:text-rose-400">{liveAlertCount}</span>
              </div>
            </button>
          )}
          {children}
          <div className="divide-y divide-border max-h-72 overflow-y-auto mt-1 space-y-1 custom-scrollbar">
            {notifList.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground">You&rsquo;re all caught up</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No new notifications right now.</p>
              </div>
            ) : notifList.slice(0, 8).map((n) => {
              const notifType = (n.type || '').toLowerCase()
              const titleStr = (n.title || '').toLowerCase()

              let iconNode = <Bell className="h-3.5 w-3.5" />
              let iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

              if (notifType === 'fee' || titleStr.includes('fee') || titleStr.includes('payment') || titleStr.includes('received')) {
                iconNode = <IndianRupee className="h-3.5 w-3.5" />
                iconBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              } else if (notifType === 'admission' || titleStr.includes('admission') || titleStr.includes('student') || titleStr.includes('joined')) {
                iconNode = <UserPlus className="h-3.5 w-3.5" />
                iconBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              } else if (notifType === 'attendance' || titleStr.includes('attendance') || titleStr.includes('present') || titleStr.includes('alert')) {
                iconNode = <Clock className="h-3.5 w-3.5" />
                iconBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              } else if (notifType === 'library' || titleStr.includes('library') || titleStr.includes('book')) {
                iconNode = <BookOpen className="h-3.5 w-3.5" />
                iconBg = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              } else if (notifType === 'salary' || notifType === 'payroll' || titleStr.includes('salary') || titleStr.includes('payroll')) {
                iconNode = <Coins className="h-3.5 w-3.5" />
                iconBg = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
              } else if (notifType === 'event' || notifType === 'holiday' || titleStr.includes('ptm') || titleStr.includes('event') || titleStr.includes('meeting')) {
                iconNode = <Calendar className="h-3.5 w-3.5" />
                iconBg = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
              } else if (notifType === 'exam' || notifType === 'academic' || titleStr.includes('exam') || titleStr.includes('result')) {
                iconNode = <GraduationCap className="h-3.5 w-3.5" />
                iconBg = 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
              } else if (notifType === 'security' || notifType === 'lock' || titleStr.includes('warning') || titleStr.includes('lock')) {
                iconNode = <ShieldAlert className="h-3.5 w-3.5" />
                iconBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }

              return (
                <div
                  key={n.id}
                  onClick={() => onNotificationClick(n.id)}
                  className={cn(
                    'p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-all duration-150 flex items-start gap-2.5 group',
                    n.unread ? 'bg-primary/5 border-l-2 border-primary' : 'opacity-85 border-l-2 border-transparent'
                  )}
                >
                  <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5 shadow-xs transition-transform duration-150 group-hover:scale-110', iconBg)}>
                    {iconNode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                        {n.title}
                        {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-mono shrink-0">{n.time || n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.description || n.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
