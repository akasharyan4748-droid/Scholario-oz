'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { credentials, type CredentialCard } from './data'

interface LoginFormProps {
  email: string
  password: string
  selectedRole: string | null
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSelectCredential: (cred: CredentialCard) => void
  onLogin: () => void
}

// Right-side form panel — mobile logo, credential cards, form fields, submit button
export function LoginForm({
  email,
  password,
  selectedRole,
  onEmailChange,
  onPasswordChange,
  onSelectCredential,
  onLogin,
}: LoginFormProps) {
  return (
    <div className="glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-9 shadow-premium-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">SCHOLARIO<span className="text-gradient">-OS</span></h1>
            <p className="text-xs text-muted-foreground">School ERP</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your dashboard</p>
        </motion.div>

        {/* Credential cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-2.5 mt-6"
        >
          {credentials.map((cred) => (
            <motion.button
              key={cred.role}
              onClick={() => onSelectCredential(cred)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all overflow-hidden',
                selectedRole === cred.role
                  ? 'border-primary bg-primary/5 shadow-premium'
                  : 'border-border bg-card/50 hover:border-primary/40'
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity', cred.gradient)} />
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', cred.gradient)}>
                {cred.icon}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">{cred.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{cred.description}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Form */}
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@greenwood.edu.in"
                className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && onLogin()}
                className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border accent-primary" />
              Remember me
            </label>
            <button className="text-primary font-medium hover:underline">Forgot password?</button>
          </div>

          <motion.button
            onClick={onLogin}
            disabled={!selectedRole && !email}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Sign in to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Click a role card above to auto-fill credentials · Demo platform
        </p>
      </div>
    </div>
  )
}
