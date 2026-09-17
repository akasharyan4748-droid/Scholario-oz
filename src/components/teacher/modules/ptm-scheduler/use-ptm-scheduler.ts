'use client'

/**
 * use-ptm-scheduler — the data layer for the PTM Scheduler module.
 *
 * Two read paths, both through /api/teacher/ptm:
 *   1. GET /api/teacher/ptm — today + the teacher's events + her authorized
 *      students (the booking targets);
 *   2. GET /api/teacher/ptm/[eventId] — the selected event's slots.
 *
 * Fetch discipline mirrors use-students-directory / useClassAttendance:
 *   · `{ cache: 'no-store', credentials: 'same-origin' }` + the
 *     `{ ok, data }` envelope;
 *   · a 401 routes through the shared signOut() exactly once;
 *   · ONE single-flight action lock for every mutation;
 *   · every mutation's POST response REPLACES the module state (the
 *     refreshed event detail + event summaries) — no re-GET after a write;
 *   · toasts only for REAL server outcomes, friendly error vocabulary.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { signOut } from '@/lib/signout'
import type {
  PtmBookSlotBody,
  PtmCreateEventBody,
  PtmEventDetailDTO,
  PtmMutationDTO,
  PtmOverviewDTO,
} from '@/lib/ptm-types'

// A dead server session cannot be retried — reset auth ONCE, land on login.
let sessionExpiredInFlight = false

function handleExpiredSession(): void {
  if (sessionExpiredInFlight) return
  sessionExpiredInFlight = true
  void signOut().finally(() => {
    window.setTimeout(() => {
      sessionExpiredInFlight = false
    }, 2000)
  })
}

async function ptmRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body
      ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
      : init?.headers,
  })
  if (r.status === 401) {
    handleExpiredSession()
    throw new Error('UNAUTHORIZED')
  }
  let json: unknown = null
  try {
    json = await r.json()
  } catch {
    /* non-JSON error body — fall through to the generic message */
  }
  const envelope = json as { ok?: unknown; error?: unknown; data?: T } | null
  if (!r.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// Server error codes → human sentences (lesson-planner vocabulary style).
const PTM_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  NO_TEACHER_RECORD: 'Your teacher profile could not be loaded.',
  NO_SCHOOL: 'Your school could not be resolved.',
  NOT_FOUND: 'That PTM event could not be found.',
  TITLE_REQUIRED: 'Give the event a title (at least 3 characters).',
  INVALID_TITLE: 'The title must be at most 120 characters.',
  INVALID_DATE: 'Please pick a valid meeting date.',
  PAST_DATE: 'The meeting date cannot be in the past.',
  INVALID_WINDOW: 'The window must end after it starts and fit at least one slot.',
  INVALID_SLOT_MINUTES: 'Slot length must be between 5 and 60 minutes.',
  INVALID_LOCATION: 'The location must be at least 2 characters.',
  TOO_MANY_SLOTS: 'That window is too long for this slot length — split it into two events.',
  UNKNOWN_ACTION: 'That action is not supported.',
  EVENT_NOT_ACTIVE: 'This event is no longer active.',
  SLOT_NOT_AVAILABLE: 'That slot was just taken — refreshing the schedule.',
  SLOT_NOT_BOOKED: 'Only a booked slot can be changed here.',
  SLOT_COMPLETED: 'A completed meeting cannot be released.',
  STUDENT_REQUIRED: 'Select a student for this booking.',
  STUDENT_NOT_AUTHORIZED: 'That student is not in your classes.',
  STUDENT_ALREADY_BOOKED: 'This student already has a booking in this event.',
  BOOKED_BY_REQUIRED: "Enter the guardian's name for this booking.",
  INVALID_BOOKED_BY: 'The guardian name must be at most 80 characters.',
  INVALID_PHONE: 'That phone number looks too long.',
  NOTES_TOO_LONG: 'Notes are limited to 2000 characters.',
}

function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : ''
  return PTM_ERROR_MESSAGES[raw] ?? 'The PTM scheduler could not load. Please try again.'
}

// ─── the data hook ────────────────────────────────────────────────────

export interface PtmSchedulerState {
  /** today + events + authorized students (null until loaded) */
  overview: PtmOverviewDTO | null
  loading: boolean
  errorMessage: string | null
  retry: () => void

  selectedEventId: string | null
  selectEvent: (eventId: string) => void
  detail: PtmEventDetailDTO | null
  detailLoading: boolean
  detailError: string | null
  retryDetail: () => void

  /** true while any mutation is in flight (single-flight lock) */
  actionInFlight: boolean

  createEvent: (input: PtmCreateEventBody) => Promise<boolean>
  cancelEvent: (eventId: string) => Promise<boolean>
  bookSlot: (slotId: string, input: PtmBookSlotBody) => Promise<boolean>
  releaseSlot: (slotId: string) => Promise<boolean>
  completeSlot: (slotId: string) => Promise<boolean>
  saveNotes: (slotId: string, notes: string) => Promise<boolean>
}

export function usePtmScheduler(): PtmSchedulerState {
  const [overview, setOverview] = useState<PtmOverviewDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [detail, setDetail] = useState<PtmEventDetailDTO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [actionInFlight, setActionInFlight] = useState(false)
  const [tick, setTick] = useState(0)
  const [detailTick, setDetailTick] = useState(0)

  const mounted = useRef(true)
  const actionRef = useRef(false)
  /** set when a mutation already delivered the detail for the next
   *  selection — the detail effect must not re-fetch it */
  const skipDetailFetchRef = useRef<string | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // ① the aggregate overview (mount + retry) — picks the default event.
  useEffect(() => {
    let cancelled = false
    ptmRequest<PtmOverviewDTO>('/api/teacher/ptm')
      .then((d) => {
        if (cancelled || !mounted.current) return
        setOverview(d)
        setErrorMessage(null)
        // keep the current selection when it still exists, otherwise the
        // first event (newest meetingDate) is the default view
        setSelectedEventId((cur) =>
          cur && d.events.some((e) => e.id === cur) ? cur : (d.events[0]?.id ?? null),
        )
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setErrorMessage(friendlyError(e))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  // ② the selected event's slots (selection change + retry).
  useEffect(() => {
    if (!selectedEventId) {
      setDetail(null)
      setDetailError(null)
      return
    }
    if (skipDetailFetchRef.current === selectedEventId) {
      skipDetailFetchRef.current = null
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    setDetail(null) // an event switch is a context switch — never show one
    // event's slots under another event's label, even dimmed.
    ptmRequest<PtmEventDetailDTO>(`/api/teacher/ptm/${encodeURIComponent(selectedEventId)}`)
      .then((d) => {
        if (!cancelled && mounted.current) setDetail(d)
      })
      .catch((e: unknown) => {
        if (!cancelled && mounted.current) setDetailError(friendlyError(e))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedEventId, detailTick])

  const retry = useCallback(() => setTick((t) => t + 1), [])
  const retryDetail = useCallback(() => setDetailTick((t) => t + 1), [])
  const selectEvent = useCallback((eventId: string) => {
    setSelectedEventId((cur) => (cur === eventId ? cur : eventId))
  }, [])

  /**
   * Apply a mutation payload: the summaries always refresh the grid; the
   * detail is replaced when it is (or becomes — `select`) the viewed event.
   */
  const applyMutation = useCallback((payload: PtmMutationDTO, select = false) => {
    setOverview((prev) => (prev ? { ...prev, events: payload.events } : prev))
    setDetail((prev) => (select || (prev && prev.id === payload.event.id) ? payload.event : prev))
    if (select) {
      skipDetailFetchRef.current = payload.event.id
      setSelectedEventId(payload.event.id)
      setDetailError(null)
      setDetailLoading(false)
    }
  }, [])

  /** The single-flight lock around every write. Returns null when an
   *  action is already running (the caller stays put, silently). */
  const runAction = useCallback(async (run: () => Promise<PtmMutationDTO>): Promise<PtmMutationDTO | null> => {
    if (actionRef.current) return null
    actionRef.current = true
    setActionInFlight(true)
    try {
      return await run()
    } finally {
      actionRef.current = false
      if (mounted.current) setActionInFlight(false)
    }
  }, [])

  const createEvent = useCallback(
    async (input: PtmCreateEventBody): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>('/api/teacher/ptm', {
            method: 'POST',
            body: JSON.stringify(input),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload, true)
      toast.success('PTM scheduled', {
        description: `“${payload.event.title}” — ${payload.event.totalSlots} slots opened for booking`,
      })
      return true
    },
    [runAction, applyMutation],
  )

  const cancelEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>(`/api/teacher/ptm/${encodeURIComponent(eventId)}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'cancel' }),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload)
      toast.success('Event cancelled', {
        description: `“${payload.event.title}” — bookings are kept for reference`,
      })
      return true
    },
    [runAction, applyMutation],
  )

  const bookSlot = useCallback(
    async (slotId: string, input: PtmBookSlotBody): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>(`/api/teacher/ptm/slot/${encodeURIComponent(slotId)}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'book', ...input }),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        // the slot may have been taken in another session — resync
        if (e instanceof Error && e.message === 'SLOT_NOT_AVAILABLE') setDetailTick((t) => t + 1)
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload)
      const slot = payload.event.slots.find((s) => s.id === slotId)
      toast.success('Slot booked', {
        description: slot?.student
          ? `${slot.startTime} · ${slot.student.name} (with ${slot.bookedByName ?? 'guardian'})`
          : `${slot?.startTime ?? 'Slot'} booked`,
      })
      return true
    },
    [runAction, applyMutation],
  )

  const releaseSlot = useCallback(
    async (slotId: string): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>(`/api/teacher/ptm/slot/${encodeURIComponent(slotId)}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'release' }),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload)
      toast.success('Booking released', { description: 'The slot is available again' })
      return true
    },
    [runAction, applyMutation],
  )

  const completeSlot = useCallback(
    async (slotId: string): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>(`/api/teacher/ptm/slot/${encodeURIComponent(slotId)}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'complete' }),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload)
      const slot = payload.event.slots.find((s) => s.id === slotId)
      toast.success('Meeting completed', {
        description: slot?.student ? `${slot.startTime} · ${slot.student.name}` : slot?.startTime,
      })
      return true
    },
    [runAction, applyMutation],
  )

  const saveNotes = useCallback(
    async (slotId: string, notes: string): Promise<boolean> => {
      let payload: PtmMutationDTO | null
      try {
        payload = await runAction(() =>
          ptmRequest<PtmMutationDTO>(`/api/teacher/ptm/slot/${encodeURIComponent(slotId)}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'notes', notes }),
          }),
        )
      } catch (e: unknown) {
        toast.error(friendlyError(e))
        return false
      }
      if (!payload) return false
      if (mounted.current) applyMutation(payload)
      toast.success('Notes saved', { description: 'Meeting notes stored for this booking' })
      return true
    },
    [runAction, applyMutation],
  )

  return {
    overview,
    loading,
    errorMessage,
    retry,
    selectedEventId,
    selectEvent,
    detail,
    detailLoading,
    detailError,
    retryDetail,
    actionInFlight,
    createEvent,
    cancelEvent,
    bookSlot,
    releaseSlot,
    completeSlot,
    saveNotes,
  }
}
