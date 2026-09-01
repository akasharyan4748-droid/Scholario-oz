'use client'

/**
 * ApplicationsModule — Principal entry point for the Applications & Forms
 * system, registered as a dedicated module in the Finance group (connected
 * to Fee Management without adding top-level Fee tabs).
 *
 * Internal view state keeps everything inside ONE normal module surface —
 * dashboard ⇄ session-config ⇄ detail — no browser-level routes, exactly
 * like the Fees / Salary shells. Every action flows through
 * applications-store and (for money) fee-store pipelines.
 *
 * TOUR-CONSENT-1: the module has exactly ONE built-in form — the fixed
 * "Educational Tour — Parent Consent Form" template. The old generic
 * builder is gone; "Use / Configure for Session" opens TourSessionConfig.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useApplicationsStore, ensureApplicationSeedData,
} from '@/lib/store/applications-store'
import { PageTransition } from '@/components/shared/ui'
import { ApplicationsDashboard } from './applications-dashboard'
import { TourSessionConfig } from './tour-session-config'
import { ApplicationDetail } from './application-detail'

type View =
  | { name: 'dashboard' }
  | { name: 'config'; editingId?: string }
  | { name: 'detail'; appId: string }

export function ApplicationsModule() {
  const [view, setView] = useState<View>({ name: 'dashboard' })

  // Seed realistic submissions from the canonical roster on first paint.
  // Idempotent: only acts while both collections are empty.
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    if (!seeded) {
      ensureApplicationSeedData()
      setSeeded(true)
    }
  }, [seeded])

  return (
    <div data-testid="applications-module">
      <PageTransition className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.name + ('appId' in view ? view.appId : '')}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="max-w-7xl mx-auto"
          >
            {view.name === 'dashboard' && (
              <ApplicationsDashboard
                onOpenApplication={(id) => setView({ name: 'detail', appId: id })}
                onStartCreate={() => setView({ name: 'config' })}
                onStartEdit={(id) => setView({ name: 'config', editingId: id })}
              />
            )}
            {view.name === 'config' && (
              <TourSessionConfig
                key={view.editingId ?? 'new-session'}
                editingId={view.editingId}
                onClose={() => setView({ name: 'dashboard' })}
                onSaved={(id) => setView({ name: 'detail', appId: id })}
              />
            )}
            {view.name === 'detail' && (
              <ApplicationDetail
                app={useApplicationsStore.getState().applications.find((a) => a.id === view.appId)!}
                onBack={() => setView({ name: 'dashboard' })}
                onEdit={() => setView({ name: 'config', editingId: view.appId })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </div>
  )
}
