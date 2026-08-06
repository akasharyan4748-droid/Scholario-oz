'use client'

// Add / Edit Timetable Slot modal.
//
// Presentational component: the parent owns the form state, the conflict
// detection memo, and the save handler. This keeps the "sticky form" behavior
// of the original module intact (form values persist across modal opens when
// adding a new slot — only the day/period/class fields are overridden via
// the open-modal callbacks).

import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { school, subjects } from '@/lib/mock/school'
import { teachers } from '@/lib/mock/teachers'
import {
  CLASSES, DAYS, PERIODS, ROOMS,
  type DayType,
  type TimetableConflictInfo,
  type TimetableFormState,
} from './data'

interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  editingSlot: { id: string } | null
  form: TimetableFormState
  setForm: React.Dispatch<React.SetStateAction<TimetableFormState>>
  conflictInfo: TimetableConflictInfo
  onSubmit: () => void
}

export function SlotModal({
  isOpen,
  onClose,
  editingSlot,
  form,
  setForm,
  conflictInfo,
  onSubmit,
}: SlotModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {editingSlot ? 'Edit Timetable Slot' : 'Assign New Timetable Period'}
                  </h3>
                  <p className="text-xs text-muted-foreground">{school.name} · Academic Schedule</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONFLICT WARNING DISPLAY */}
            {conflictInfo.hasConflict && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Scheduling Conflict Detected!</p>
                  {conflictInfo.teacherConflict && (
                    <p>
                      • Teacher is already assigned to{' '}
                      <span className="font-semibold">{conflictInfo.teacherConflict.className}</span> in{' '}
                      {conflictInfo.teacherConflict.room} during this period.
                    </p>
                  )}
                  {conflictInfo.roomConflict && (
                    <p>
                      • Room <span className="font-semibold">{conflictInfo.roomConflict.room}</span> is already
                      occupied by {conflictInfo.roomConflict.className}.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value as DayType }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Period Number</label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm((prev) => ({ ...prev, period: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PERIODS.filter((p) => !p.isBreak).map((p) => (
                      <option key={p.number} value={p.number}>
                        {p.name} ({p.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Target Class & Section</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm((prev) => ({ ...prev, className: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                    ))}
                    <option value="Hindi">Hindi</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Art & Craft">Art & Craft</option>
                    <option value="Physical Education">Physical Education</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Assigned Faculty</label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Room / Lab Allocation</label>
                  <select
                    value={form.room}
                    onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {ROOMS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={conflictInfo.hasConflict}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {editingSlot ? 'Update Period' : 'Assign Slot'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
