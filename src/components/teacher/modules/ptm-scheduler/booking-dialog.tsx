'use client'

/**
 * BookingDialog — book an AVAILABLE slot for one of the teacher's
 * authorized students (server-validated on every booking). Selecting a
 * student prefills the guardian name/phone from the student record;
 * both stay editable. On submit → POST slot action 'book'.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PtmBookSlotBody, PtmSlotDTO, PtmStudentOptionDTO } from '@/lib/ptm-types'

export function BookingDialog({
  slot,
  slotMinutes,
  students,
  onClose,
  onBook,
}: {
  slot: PtmSlotDTO
  slotMinutes: number
  students: PtmStudentOptionDTO[]
  onClose: () => void
  onBook: (slotId: string, input: PtmBookSlotBody) => Promise<boolean>
}) {
  const [studentId, setStudentId] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  const selectStudent = (id: string) => {
    setStudentId(id)
    const s = students.find((x) => x.studentId === id)
    setGuardianName(s?.guardianName ?? '')
    setPhone(s?.guardianPhone ?? '')
  }

  const valid = studentId && guardianName.trim().length >= 2 && !submitting

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    const ok = await onBook(slot.id, {
      studentId,
      bookedByName: guardianName.trim(),
      contactPhone: phone.trim(),
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
      aria-label="Book a slot"
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg sm:max-w-md"
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
          <p className="text-xs text-emerald-50/90 mb-1">
            {slot.startTime} – {slot.endTime} · {slotMinutes} min
          </p>
          <h2 className="font-display text-lg font-bold">Book this slot</h2>
          <p className="text-emerald-50/90 text-xs mt-0.5">
            Pick a student from your classes and confirm the guardian.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {students.length === 0 ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 mb-3">
                <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">No students available to book</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Students appear here once you teach them a subject or are their class teacher.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Student</Label>
                <Select value={studentId || undefined} onValueChange={selectStudent} disabled={submitting}>
                  <SelectTrigger className="h-10 w-full" aria-label="Select student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.studentId} value={s.studentId}>
                        {s.name} · {s.classLabel}
                        {s.rollNo ? ` · #${s.rollNo}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ptm-guardian" className="text-xs">
                  Guardian name
                </Label>
                <div className="relative">
                  <UserRound
                    className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="ptm-guardian"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    maxLength={80}
                    disabled={submitting}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ptm-phone" className="text-xs">
                  Contact phone <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ptm-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 …"
                  maxLength={20}
                  disabled={submitting}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" className="h-10 flex-1" onClick={onClose} disabled={submitting}>
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
                Booking…
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book slot
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
