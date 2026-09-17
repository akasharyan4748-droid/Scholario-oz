'use client'

/**
 * CreateEventDialog — the REAL "Schedule PTM" flow: title, date (min
 * tomorrow), window start/end, slot length, optional location. The live
 * slot-count preview uses the same tiling rule as the server (slots fully
 * inside the window). On submit → POST /api/teacher/ptm; the server
 * generates the slots and the response replaces the module state.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PtmCreateEventBody } from '@/lib/ptm-types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 07:00 … 18:00 in 30-minute steps — a sane PTM window vocabulary. */
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = []
  for (let m = 7 * 60; m <= 18 * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return out
})()

const SLOT_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

function toMinutes(t: string): number {
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function CreateEventDialog({
  today,
  onClose,
  onCreate,
}: {
  /** the school's today (server-provided, YYYY-MM-DD) */
  today: string
  onClose: () => void
  onCreate: (input: PtmCreateEventBody) => Promise<boolean>
}) {
  const tomorrow = useMemo(() => (DATE_RE.test(today) ? addDays(today, 1) : ''), [today])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(tomorrow)
  const [windowStart, setWindowStart] = useState('10:00')
  const [windowEnd, setWindowEnd] = useState('12:00')
  const [slotMinutes, setSlotMinutes] = useState(15)
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Escape closes (never while a write is in flight).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  const endOptions = useMemo(() => TIME_OPTIONS.filter((t) => toMinutes(t) > toMinutes(windowStart)), [windowStart])

  const slotCount = useMemo(() => {
    const start = toMinutes(windowStart)
    const end = toMinutes(windowEnd)
    if (end <= start) return 0
    return Math.floor((end - start) / slotMinutes)
  }, [windowStart, windowEnd, slotMinutes])

  const valid = title.trim().length >= 3 && DATE_RE.test(date) && slotCount > 0 && !submitting

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    const ok = await onCreate({
      title: title.trim(),
      meetingDate: date,
      windowStart,
      windowEnd,
      slotMinutes,
      location: location.trim(),
    })
    if (ok) onClose()
    else setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={submitting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a PTM"
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            aria-label="Close"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition-colors hover:bg-white/25"
          >
            ✕
          </button>
          <p className="text-xs text-emerald-50/90 mb-1">New event</p>
          <h2 className="font-display text-lg font-bold">Schedule a PTM</h2>
          <p className="text-emerald-50/90 text-xs mt-0.5">
            Slots are generated automatically from your meeting window.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ptm-title" className="text-xs">
              Title
            </Label>
            <Input
              id="ptm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Term 1 PTM · Grade 9-A"
              maxLength={120}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ptm-date" className="text-xs">
              Meeting date
            </Label>
            <Input
              id="ptm-date"
              type="date"
              value={date}
              min={tomorrow || undefined}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Window start</Label>
              <Select value={windowStart} onValueChange={setWindowStart} disabled={submitting}>
                <SelectTrigger className="h-10 w-full" aria-label="Window start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Window end</Label>
              <Select value={windowEnd} onValueChange={setWindowEnd} disabled={submitting}>
                <SelectTrigger className="h-10 w-full" aria-label="Window end">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {endOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Slot length</Label>
            <Select
              value={String(slotMinutes)}
              onValueChange={(v) => setSlotMinutes(Number(v))}
              disabled={submitting}
            >
              <SelectTrigger className="h-10 w-full" aria-label="Slot length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ptm-location" className="text-xs">
              Location <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="ptm-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Classroom 9-A"
              maxLength={120}
              disabled={submitting}
            />
          </div>

          {/* Live slot preview — the server's exact tiling rule */}
          <div
            className={`rounded-xl border px-3 py-2.5 text-xs ${
              slotCount > 0
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                : 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400'
            }`}
            role="status"
          >
            {slotCount > 0 ? (
              <>
                Will create <span className="font-semibold">{slotCount}</span> × {slotMinutes}-min slots (
                {windowStart}–{windowEnd})
              </>
            ) : (
              <>The window is too short for {slotMinutes}-min slots — extend it or pick a shorter slot.</>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border p-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 flex-1 gap-1.5"
            onClick={() => void submit()}
            disabled={!valid}
          >
            {submitting ? (
              <>
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Scheduling…
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Create event
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
