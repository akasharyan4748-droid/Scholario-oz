'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Clock } from 'lucide-react'
import { useAuth, type Role } from '@/lib/store/auth-store'
import { useTheme } from '@/lib/store/theme-store'
import { school } from '@/lib/mock/school'
import { Background } from './background'
import { Particles } from './particles'
import { BrandingPanel } from './branding-panel'
import { LoginForm } from './login-form'
import { LoadingPhase } from './loading-phase'
import type { CredentialCard } from './data'

export function LoginPage({ onBackToWebsite }: { onBackToWebsite?: () => void }) {
  const { startAuth, login } = useAuth()
  const { toggle: toggleTheme, theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [phase, setPhase] = useState<'form' | 'loading'>('form')
  const [now, setNow] = useState<Date | null>(null)

  // Live clock (client-only to avoid hydration mismatch)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fillCredential = (cred: CredentialCard) => {
    setSelectedRole(cred.role)
    setEmail(cred.email)
    setPassword(cred.password)
  }

  const handleLogin = async (role?: Role) => {
    const r = role ?? selectedRole ?? 'principal'
    startAuth()
    setPhase('loading')
    // Attempt real server-side authentication so privileged API endpoints
    // (e.g. /api/schools for Super Admin) work end-to-end. The client-side
    // role profile is always applied afterwards to keep the demo deterministic.
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      // Network/JSON errors are non-fatal — we still fall through to the
      // client-side demo login so the showcase always works.
    }
    setTimeout(() => {
      login(r)
    }, 1100)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden mesh-bg flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <Background />
      <Particles />

      <AnimatePresence mode="wait">
        {phase === 'form' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-6"
          >
            <BrandingPanel />

            <LoginForm
              email={email}
              password={password}
              selectedRole={selectedRole}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSelectCredential={fillCredential}
              onLogin={() => handleLogin()}
            />
          </motion.div>
        ) : (
          <LoadingPhase selectedRole={selectedRole} />
        )}
      </AnimatePresence>

      {/* Top-right controls: theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl glass border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </button>

      {/* Footer with live clock */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1.5 text-xs text-muted-foreground/70 pointer-events-none">
        <div className="flex items-center gap-2">
          {now && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          )}
          <span className="text-muted-foreground/40">·</span>
          <span>All systems operational</span>
        </div>
        <p>© {new Date().getFullYear()} SCHOLARIO-OS · {school.name} · Secure demo environment</p>
      </div>
    </div>
  )
}
