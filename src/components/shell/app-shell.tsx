'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, Plus } from 'lucide-react'
import { useAuth } from '@/lib/store/auth-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { school } from '@/lib/mock/school'
import { cn } from '@/lib/utils'
import { notifications as initialNotifications } from '@/lib/mock/operations'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { CommandPalette } from '@/components/shared/command-palette'
import type { ShellProps } from './app-shell/types'
import { SidebarAside } from './app-shell/sidebar-aside'
import { NotificationsDropdown } from './app-shell/notifications-dropdown'
import { ProfileDropdownTrigger, ProfileDropdown } from './app-shell/profile-dropdown'

export type { NavGroup, NavItem } from './app-shell/types'

export function AppShell({ groups, activeKey, onNavigate, role, roleLabel, children, quickAction }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [notifList, setNotifList] = useState(initialNotifications)
  const { user, logout, switchTo } = useAuth()
  void roleLabel

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

  const handleMarkAllRead = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNotificationClick = (id: string) => {
    setNotifList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
    setNotifOpen(false)
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
                className="relative p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
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
              />
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
              <span className="text-primary/80 ml-1">{school.name}</span>
              &middot; All systems operational
            </p>
          </footer>
        </div>
      </main>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNavigate={onNavigate} />
    </div>
  )
}
