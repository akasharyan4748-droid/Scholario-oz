'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { Bell, Menu, Plus, Globe, Radio, Megaphone } from 'lucide-react'
import { useAuth } from '@/lib/store/auth-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { school } from '@/lib/mock/school'
// SaaS-STAGE-2A — the shell footer reflects the ACTIVE TENANT's school
// identity (falls back to the demo school profile for platform surfaces).
import { useActiveTenant } from '@/lib/tenant/store'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import { notifications as initialNotifications } from '@/lib/mock/operations'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { CommandPalette } from '@/components/shared/command-palette'
import type { ShellProps } from './app-shell/types'
import { SidebarAside } from './app-shell/sidebar-aside'
import { NotificationsDropdown, type NotificationItem } from './app-shell/notifications-dropdown'
import { ProfileDropdownTrigger, ProfileDropdown } from './app-shell/profile-dropdown'

export type { NavGroup, NavItem } from './app-shell/types'

// Relative time formatter for notification timestamps
function formatRelativeTime(input?: string): string {
  if (!input) return ''
  const then = new Date(input).getTime()
  if (Number.isNaN(then)) return input
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Human labels for payment channel codes (stream toasts)
const STREAM_METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI', CARD: 'Card', NETBANKING: 'Net Banking', CASH: 'Cash', CHEQUE: 'Cheque', WALLET: 'Wallet',
}

// Shape of a `school-event` frame emitted by mini-services/event-stream
interface StreamEvent {
  kind: 'payment' | 'announcement'
  schoolId: string
  title: string
  detail: string
  amount?: number
  method?: string
  at: string
}

export function AppShell({ groups, activeKey, onNavigate, role, roleLabel, children, quickAction }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [notifList, setNotifList] = useState<NotificationItem[]>(initialNotifications)
  // 'live' = fetched from /api/notifications-feed, 'demo' = static mock fallback
  const [notifSource, setNotifSource] = useState<'live' | 'demo'>('demo')
  // Real-time event stream status (socket.io mini-service :3003 via gateway)
  const [streamLive, setStreamLive] = useState(false)
  const { user, logout, switchTo } = useAuth()
  void roleLabel

  // Wire notification bell to the real DB-backed feed (unread messages + announcements).
  // Polls every 60s; falls back to demo mock data when the live feed is empty/unavailable.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch('/api/notifications-feed', { cache: 'no-store' })
        if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return
        const j = await r.json().catch(() => null)
        // API wraps payloads as { ok, data } — unwrap defensively
        const payload = j && typeof j === 'object' && 'data' in j ? (j as { data?: { feed?: unknown[] } }).data : j
        const feedArr = payload && Array.isArray(payload.feed) ? payload.feed : []
        if (cancelled || feedArr.length === 0) return
        const mapped: NotificationItem[] = feedArr.map((f: { id: string; type?: string; title?: string; description?: string; timestamp?: string; read?: boolean }) => ({
          id: f.id,
          type: f.type,
          title: f.title,
          description: f.description,
          time: formatRelativeTime(f.timestamp),
          unread: f.read === false, // respect persisted read state from the API
        }))
        setNotifList(mapped)
        setNotifSource('live')
      } catch {
        /* keep mock fallback */
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  // ─── Real-time event stream (socket.io mini-service :3003 via gateway) ───
  // Resolves the viewer's school scope from /api/auth/me first (the client
  // session profile doesn't carry schoolId), then subscribes. Super admins
  // (schoolId = null) receive the platform-wide stream; school-scoped roles
  // only see events for their own school.
  const streamScopeRef = useRef<string | null | undefined>(undefined) // undefined = resolving

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let socket: ReturnType<typeof io> | null = null

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const me = j && typeof j === 'object' && 'data' in j ? (j as { data?: { user?: { schoolId?: string | null } } }).data?.user : null
        return me?.schoolId ?? null
      })
      .catch(() => null)
      .then((schoolId) => {
        if (cancelled) return
        streamScopeRef.current = schoolId
        socket = io('/?XTransformPort=3003', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 8,
          reconnectionDelay: 1500,
          timeout: 10000,
        })
        socket.on('connect', () => setStreamLive(true))
        socket.on('disconnect', () => setStreamLive(false))
        socket.on('connect_error', () => setStreamLive(false))
        socket.on('school-event', (evt: StreamEvent) => {
          // Scope filter — super admins see the whole platform
          const scope = streamScopeRef.current
          if (scope && evt.schoolId && evt.schoolId !== scope) return

          const isPayment = evt.kind === 'payment'
          const item: NotificationItem = {
            id: `stream-${evt.kind}-${evt.at}-${Math.random().toString(36).slice(2, 7)}`,
            type: isPayment ? 'PAYMENT' : 'ANNOUNCEMENT',
            title: isPayment ? 'Fee payment received' : evt.title,
            description: isPayment && evt.amount
              ? `${evt.detail} · ${formatINR(evt.amount)} via ${STREAM_METHOD_LABELS[(evt.method || '').toUpperCase()] ?? evt.method ?? '—'}`
              : evt.detail,
            time: 'just now',
            timestamp: evt.at,
            unread: true,
          }
          setNotifList((prev) => [item, ...prev].slice(0, 30))

          // Premium live toast — accent stripe + icon chip + LIVE pill
          toast.custom(
            (t) => (
              <div
                className={cn(
                  'relative overflow-hidden w-[min(21rem,calc(100vw-2rem))] flex items-start gap-3 rounded-xl border bg-card/95 backdrop-blur p-3 pl-4 shadow-premium-lg transition-opacity',
                  isPayment ? 'border-emerald-500/30' : 'border-violet-500/30',
                  t ? 'opacity-100' : 'opacity-0'
                )}
              >
                <span className={cn('absolute left-0 top-0 bottom-0 w-1', isPayment ? 'bg-emerald-500' : 'bg-violet-500')} />
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isPayment ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                )}>
                  {isPayment ? <span className="font-bold text-xs">₹</span> : <Megaphone className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Radio className="h-2 w-2 animate-pulse" /> Live
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                </div>
              </div>
            ),
            { duration: 5000 }
          )
        })
      })

    return () => {
      cancelled = true
      socket?.close()
      socket = null
    }
  }, [user?.id])

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const activeItem = flatItems.find((i) => i.key === activeKey)
  const unreadCount = notifList.filter((n) => n.unread).length

  // For principal role, also count live alerts in the bell badge
  const liveAlertCount = useLiveAlerts((s) => s.alerts.length)
  const totalBadgeCount = role === 'principal' ? unreadCount + liveAlertCount : unreadCount

  // ⌘K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const persistRead = (id: string, type?: string) => {
    // Fire-and-forget persistence; mock/demo items simply get persisted=false
    fetch('/api/notifications-feed', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type }),
    }).catch(() => {})
  }

  const handleMarkAllRead = () => {
    if (notifSource === 'live') {
      notifList.filter((n) => n.unread).forEach((n) => persistRead(n.id, n.type))
    }
    setNotifList((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNotificationClick = (id: string) => {
    const target = notifList.find((n) => n.id === id)
    if (target && notifSource === 'live') persistRead(id, target.type)
    setNotifList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
    setNotifOpen(false)
    // Tour-application announcements deep-link students straight to the form
    // (Applications & Forms) instead of the generic Communication module.
    const isTourAnnouncement =
      !!target?.title && /— applications open$/i.test(target.title.trim())
    if (role === 'student' && isTourAnnouncement) {
      onNavigate('applications')
      return
    }
    onNavigate('communication')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <SidebarAside
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        cmdOpen={cmdOpen}
        setCmdOpen={setCmdOpen}
        groups={groups}
        activeKey={activeKey}
        onNavigate={onNavigate}
        role={role}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground truncate">
              {activeItem?.label ?? 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {quickAction && (
              <button
                onClick={quickAction.onClick}
                className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                {quickAction.icon ?? <Plus className="h-4 w-4" />}
                {quickAction.label}
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications${streamLive ? ' — live event stream connected' : ''}`}
                className="relative p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {/* realtime stream indicator — emerald pulsing dot bottom-right */}
                {streamLive && (
                  <span className="absolute bottom-0.5 right-0.5 flex h-2 w-2" title="Live event stream connected">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1 ring-card" />
                  </span>
                )}
                {totalBadgeCount > 0 && (
                  <span className={cn(
                    'absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white',
                    role === 'principal' && liveAlertCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-red-500'
                  )}>
                    {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifList={notifList}
                onMarkAllRead={handleMarkAllRead}
                onNotificationClick={handleNotificationClick}
                onNavigateDashboard={() => { setNotifOpen(false); onNavigate('dashboard') }}
                role={role}
                liveAlertCount={liveAlertCount}
                totalBadgeCount={totalBadgeCount}
                unreadCount={unreadCount}
                source={notifSource}
              >
                {/* realtime stream status — shown for every role when connected */}
                {streamLive && (
                  <div className="mx-1 mb-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-2">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live event stream connected
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {role === 'superadmin'
                        ? 'Platform-wide — payments & announcements from every tenant arrive instantly.'
                        : 'Payments & announcements from your school arrive instantly — no refresh needed.'}
                    </p>
                  </div>
                )}
                {role === 'superadmin' && notifSource === 'demo' && (
                  <div className="mx-1 mb-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-2">
                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Platform scope
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      Super admins manage tenants across schools — no personal school inbox. Showing demo feed.
                    </p>
                  </div>
                )}
              </NotificationsDropdown>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <ProfileDropdownTrigger
                user={user}
                open={profileOpen}
                onToggle={() => { setProfileOpen((o) => !o); setNotifOpen(false) }}
              />
              <ProfileDropdown
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                user={user}
                role={role}
                onNavigateSettings={() => { onNavigate('settings'); setProfileOpen(false) }}
                onSwitchToStudent={() => { switchTo('student'); setProfileOpen(false) }}
                // SaaS-STAGE-2A — super admins jump straight back to the control plane.
                onOpenPlatform={role === 'superadmin' ? () => onNavigate('overview') : undefined}
                onLogout={() => { setProfileOpen(false); logout() }}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
          {/* Sticky footer */}
          <footer className="mt-8 pt-6 border-t border-border text-center text-[11px] text-muted-foreground/80 font-medium tracking-wide">
            <p>
              &copy; {new Date().getFullYear()} SCHOLARIO-OS &middot; Enterprise School ERP &middot;
              <span className="text-primary/80 ml-1"><FooterSchoolName fallback={school.name} /></span>
              &middot; All systems operational
            </p>
          </footer>
        </div>
      </main>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNavigate={onNavigate} />
    </div>
  )
}

/**
 * SaaS-STAGE-2A — footer school identity: school panels show the ACTIVE
 * tenant's school name; the platform control plane shows its own label.
 */
function FooterSchoolName({ fallback }: { fallback: string }) {
  const role = useAuth((s) => s.user?.role)
  const tenant = useActiveTenant()
  if (role === 'superadmin') return 'Platform Control Plane'
  return tenant?.name ?? fallback
}
