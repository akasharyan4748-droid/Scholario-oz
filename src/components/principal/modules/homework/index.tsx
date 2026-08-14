'use client'

/**
 * HomeworkModule — Principal Homework Oversight Dashboard.
 *
 * NOT a homework-creation tool. Principals monitor, set policy,
 * audit quality, and intervene. No "Assign Homework" button.
 *
 * Layout: left-nav with 4 sub-sections + main dashboard.
 *   Dashboard | Policy & Rules | Quality Control | Analytics | Feedback
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, BookOpen, BarChart3, MessageSquare, Gauge } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { HomeworkDashboard } from './dashboard'
import { PolicySection } from './sections/policy-section'
import { QualityControlSection } from './sections/quality-control-section'
import { AnalyticsSection } from './sections/analytics-section'
import { FeedbackSection } from './sections/feedback-section'

type Section = 'dashboard' | 'policy' | 'quality' | 'analytics' | 'feedback'

const SECTIONS = [
  { value: 'dashboard', label: 'Dashboard', icon: Gauge },
  { value: 'policy', label: 'Policy & Rules', icon: ShieldCheck },
  { value: 'quality', label: 'Quality Control', icon: BookOpen },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
] as const

export function HomeworkModule() {
  const [section, setSection] = useState<Section>('dashboard')

  return (
    <PageTransition className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Homework Oversight</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitor compliance, manage policy, audit quality, and ensure balanced homework load across the school.
        </p>
      </div>

      {/* Sub-section navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSection(s.value as Section)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              section === s.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
            )}
          >
            <s.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {section === 'dashboard' && <HomeworkDashboard onNavigate={setSection} />}
          {section === 'policy' && <PolicySection />}
          {section === 'quality' && <QualityControlSection />}
          {section === 'analytics' && <AnalyticsSection />}
          {section === 'feedback' && <FeedbackSection />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  )
}
