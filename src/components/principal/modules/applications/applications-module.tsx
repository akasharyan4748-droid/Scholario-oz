'use client'

/**
 * ApplicationsModule — Principal entry point for the Applications & Forms
 * system, registered as a dedicated module in the Finance group (connected
 * to Fee Management without adding top-level Fee tabs).
 *
 * Internal view state keeps everything inside ONE normal module surface —
 * dashboard ⇄ builder ⇄ detail — no browser-level routes, exactly like the
 * Fees / Salary shells. Every action flows through applications-store and
 * (for money) fee-store pipelines.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useApplicationsStore, ensureApplicationSeedData,
} from '@/lib/store/applications-store'
import { PageTransition } from '@/components/shared/ui'
import { ApplicationsDashboard } from './applications-dashboard'
import { ApplicationBuilder } from './application-builder'
import { ApplicationDetail } from './application-detail'

type View =
  | { name: 'dashboard' }
  | { name: 'builder'; editingId?: string }
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
                onStartCreate={() => setView({ name: 'builder' })}
                onStartEdit={(id) => setView({ name: 'builder', editingId: id })}
              />
            )}
            {view.name === 'builder' && (
              <BuilderHost
                editingId={view.editingId}
                onClose={() => setView({ name: 'dashboard' })}
                onSaved={(id) => setView({ name: 'detail', appId: id })}
              />
            )}
            {view.name === 'detail' && (
              <ApplicationDetail
                app={useApplicationsStore.getState().applications.find((a) => a.id === view.appId)!}
                onBack={() => setView({ name: 'dashboard' })}
                onEdit={() => setView({ name: 'builder', editingId: view.appId })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </div>
  )
}

function BuilderHost({ editingId, onClose, onSaved }: {
  editingId?: string
  onClose: () => void
  onSaved: (appId: string) => void
}) {
  const editing = useApplicationsStore((s) => s.applications.find((a) => a.id === editingId))
  if (editingId && !editing) {
    onClose()
    return null
  }
  return (
    <ApplicationBuilder
      key={editing?.id ?? 'new'}
      editing={editing}
      onClose={onClose}
      onSaved={() => {
        if (editingId) onSaved(editingId)
        else onClose()
      }}
    />
  )
}
