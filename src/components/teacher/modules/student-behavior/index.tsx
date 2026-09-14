'use client'

/**
 * Student Behavior — module composition.
 *
 * Structure (top → bottom): quiet context toolbar → 4 summary cards
 * (the shared HubStatCards recipe) → the records list (primary view) →
 * the follow-ups strip (only when open follow-ups exist). The module
 * name is NEVER repeated as a heading — the top application bar already
 * carries it.
 *
 * State contract:
 *   · loading  → HubModuleSkeleton
 *   · error    → quiet inline error card with retry (never a full-page failure)
 *   · zero records → HubEmptyState with the Record Observation action
 *   · everything comes from /api/teacher/behavior* — the httpOnly
 *     erp_session cookie resolves the teacher, her school and her scope;
 *     no ids are ever read from the client.
 *
 * Command-palette focus deep-links (useFocusStore) are consumed once on
 * mount: `beh-<recordId>` opens the owning student's profile sheet once
 * the aggregate has loaded; `fup-…` simply lands here (the follow-ups
 * strip is visible whenever follow-ups exist); the focus request is then
 * cleared. Nothing is published to the teacher-hub store — Parent
 * Connect owns the shared hub state.
 */

import { useEffect, useRef, useState } from 'react'
import { AlarmClock, AlertTriangle, Plus, Sparkles, Users } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '@/components/teacher/teacher-panel/module-toolbar'
import {
  HubModuleSkeleton,
  HubSectionError,
  HubStatCards,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import { useFocusStore } from '@/lib/store/focus-store'
import type { StudentRef } from '@/lib/teacher-hub-types'
import { useBehavior } from './hooks'
import { RecordsList, FollowUpsStrip } from './records-list'
import { PRIMARY_ACTION_CLASS } from './shared'
import { RecordDialog } from './record-dialog'
import { StudentProfileDialog } from './student-profile-dialog'

export function StudentBehaviorModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, loading, error, reload } = useBehavior()

  const [recordOpen, setRecordOpen] = useState(false)
  const [prefillStudent, setPrefillStudent] = useState<StudentRef | null>(null)
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null)

  // ── focus deep-links (consumed exactly once, on mount) ──
  const pendingRecordId = useRef<string | null>(null)
  useEffect(() => {
    const focus = useFocusStore.getState().focus
    if (!focus || focus.moduleKey !== 'behavior') return
    useFocusStore.getState().clearFocus()
    if (focus.type !== 'behavior') return
    if (focus.id.startsWith('beh-')) {
      // resolved below, once the aggregate payload has loaded
      pendingRecordId.current = focus.id.slice(4)
    }
    // 'fup-…' → the module itself is the destination (the open
    // follow-ups strip is visible whenever follow-ups exist).
  }, [])

  // Resolve a pending record deep-link against the loaded aggregate.
  useEffect(() => {
    const recordId = pendingRecordId.current
    if (!data || !recordId) return
    pendingRecordId.current = null
    const record = data.records.find((r) => r.id === recordId)
    if (record) setProfileStudentId(record.student.id)
    // record beyond the 100 most recent → honest fallback: the module
    // itself is open; nothing else can be resolved client-side.
  }, [data])

  const openRecordDialog = (student?: StudentRef | null) => {
    setPrefillStudent(student ?? null)
    setRecordOpen(true)
  }

  if (loading) {
    return (
      <PageTransition>
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-4">
      {error && !data ? (
        <GlassCard className="p-4" hover={false}>
          <HubSectionError message={error} onRetry={reload} />
        </GlassCard>
      ) : data ? (
        <>
          <ModuleToolbar
            context={`${data.scopeLabel} · ${data.stats.studentsObserved} students observed · ${data.stats.total} records`}
            action={
              <button type="button" onClick={() => openRecordDialog()} className={PRIMARY_ACTION_CLASS}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Record Observation
              </button>
            }
          />

          <HubStatCards
            stats={[
              {
                key: 'observed',
                label: 'Students Observed',
                value: data.stats.studentsObserved,
                context: data.scopeLabel,
                icon: Users,
                tone: 'sky',
              },
              {
                key: 'positive',
                label: 'Positive Records',
                value: data.stats.positive,
                context: `${data.stats.total} total records`,
                icon: Sparkles,
                tone: 'emerald',
              },
              {
                key: 'follow-ups',
                label: 'Follow-ups Due',
                value: data.stats.followUpsOpen,
                context: `${data.stats.followUpsDue} overdue`,
                icon: AlarmClock,
                tone: 'amber',
              },
              {
                key: 'concerns',
                label: 'Open Concerns',
                value: data.stats.openConcerns,
                context: data.stats.openConcerns > 0 ? 'needs resolution' : 'none open',
                icon: AlertTriangle,
                tone: 'rose',
              },
            ]}
          />

          <RecordsList
            records={data.records}
            categories={data.categories}
            onOpenProfile={setProfileStudentId}
            onReload={reload}
            onRecord={() => openRecordDialog()}
          />

          {data.followUps.length > 0 && (
            <FollowUpsStrip
              followUps={data.followUps}
              onOpenProfile={setProfileStudentId}
              onChanged={reload}
            />
          )}
        </>
      ) : null}

      <RecordDialog
        open={recordOpen}
        onOpenChange={(o) => {
          setRecordOpen(o)
          if (!o) setPrefillStudent(null)
        }}
        students={data?.students ?? []}
        categories={data?.categories ?? []}
        prefillStudent={prefillStudent}
        onCreated={() => reload()}
      />

      <StudentProfileDialog
        studentId={profileStudentId}
        onOpenChange={(o) => {
          if (!o) setProfileStudentId(null)
        }}
        onNavigate={onNavigate}
        onRecordObservation={(student) => {
          setProfileStudentId(null)
          openRecordDialog(student)
        }}
        onChanged={reload}
        categories={data?.categories ?? []}
      />
    </PageTransition>
  )
}
