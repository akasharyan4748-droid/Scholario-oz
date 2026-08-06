'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users, BookOpen, ShieldCheck, Sparkles } from 'lucide-react'
import { school } from '@/lib/mock/school'

// Left-side branding panel (visible on large screens)
export function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between glass-strong rounded-3xl p-8 shadow-premium-lg overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="relative">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30"
        >
          <GraduationCap className="h-8 w-8 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 font-display text-4xl font-extrabold tracking-tight"
        >
          SCHOLARIO<span className="text-gradient">-OS</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-muted-foreground text-lg"
        >
          The operating system for modern schools.
        </motion.p>
      </div>

      <div className="relative space-y-4 mt-8">
        {[
          { icon: Users, label: '1,842 students managed seamlessly' },
          { icon: BookOpen, label: 'Complete academics — admissions to results' },
          { icon: ShieldCheck, label: 'Role-based access for every stakeholder' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-sm text-foreground/80">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="relative flex items-center gap-2 mt-8 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>{school.name} · CBSE · Estd. {school.established}</span>
      </div>
    </div>
  )
}
