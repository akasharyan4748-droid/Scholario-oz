'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, User, Sparkles, ChevronDown } from 'lucide-react'

interface ProfileUser {
  name?: string
  email?: string
}

interface ProfileDropdownProps {
  open: boolean
  onClose: () => void
  user: ProfileUser | null
  role: ShellRole
  onNavigateSettings: () => void
  onSwitchToStudent: () => void
  onLogout: () => void
}

type ShellRole = 'principal' | 'teacher' | 'student' | 'superadmin'

export function ProfileDropdownTrigger({
  user,
  open,
  onToggle,
}: {
  user: ProfileUser | null
  open: boolean
  onToggle: () => void
}) {
  void open
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-90 transition-opacity cursor-pointer group"
      title="User Menu"
    >
      <div className="text-right hidden sm:block">
        <p className="text-xs font-semibold text-foreground leading-none group-hover:text-primary transition-colors">{user?.name || 'Dr. Ramesh Varma'}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{user?.email || 'principal@scholario.edu'}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted text-foreground font-bold border border-border flex items-center justify-center text-xs shrink-0 group-hover:border-primary transition-colors">
        {(user?.name || 'Dr. Ramesh Varma').split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  )
}

export function ProfileDropdown({
  open,
  onClose,
  user,
  role,
  onNavigateSettings,
  onSwitchToStudent,
  onLogout,
}: ProfileDropdownProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl p-2 z-50 text-card-foreground"
          >
            <div className="p-3 border-b border-border bg-muted/40 rounded-lg mb-1">
              <p className="font-bold text-xs text-foreground">{user?.name || 'Dr. Ramesh Varma'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'principal@scholario.edu'}</p>
              <span className="inline-block mt-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded bg-primary/15 text-primary uppercase tracking-wider">
                {role}
              </span>
            </div>

            {role === 'principal' && (
              <div className="py-1 border-b border-border space-y-0.5">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Switch Role View
                </p>
                <button
                  onClick={onSwitchToStudent}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                >
                  <User className="h-3.5 w-3.5 text-violet-500" />
                  Login as Student
                </button>
              </div>
            )}

            <div className="py-1 space-y-0.5">
              <button
                onClick={onNavigateSettings}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-foreground hover:bg-muted rounded-md transition-colors font-medium text-left"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Account Settings
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors font-medium text-left"
              >
                <LogOut className="h-3.5 w-3.5 text-destructive" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
