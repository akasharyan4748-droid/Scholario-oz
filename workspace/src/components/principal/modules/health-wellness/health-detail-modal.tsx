'use client'

import { motion } from 'framer-motion'
import { Eye, Ear, Smile, Phone, X } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { StudentHealth } from '@/lib/mock/health'

// Full-screen modal showing the selected student's complete health record:
// vitals, screenings (vision/dental/hearing), allergies, chronic conditions,
// and emergency contact. Wrapped in <AnimatePresence> by the parent index.
export function HealthDetailModal({
  student,
  onClose,
}: {
  student: StudentHealth
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-4">
            <GradientAvatar name={student.studentName} initials={student.avatar} size="xl" />
            <div>
              <h2 className="font-display text-lg font-bold">{student.studentName}</h2>
              <p className="text-rose-50/90 text-sm">{student.className} · {student.admissionNo}</p>
              <span className="mt-1 inline-flex rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">{student.status}</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Vitals */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Vitals</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                <p className="font-display text-sm font-bold">{student.bloodGroup}</p>
                <p className="text-[9px] text-muted-foreground">Blood</p>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                <p className="font-display text-sm font-bold">{student.height}</p>
                <p className="text-[9px] text-muted-foreground">Height</p>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                <p className="font-display text-sm font-bold">{student.weight}</p>
                <p className="text-[9px] text-muted-foreground">Weight</p>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                <p className="font-display text-sm font-bold">{student.bmi}</p>
                <p className="text-[9px] text-muted-foreground">BMI</p>
              </div>
            </div>
          </div>

          {/* Screenings */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Health Screenings</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5">
                <span className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4 text-sky-500" /> Vision</span>
                <span className="text-sm font-medium">{student.vision}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5">
                <span className="flex items-center gap-2 text-sm"><Smile className="h-4 w-4 text-amber-500" /> Dental</span>
                <span className="text-sm font-medium">{student.dental}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5">
                <span className="flex items-center gap-2 text-sm"><Ear className="h-4 w-4 text-violet-500" /> Hearing</span>
                <span className="text-sm font-medium">{student.hearing}</span>
              </div>
            </div>
          </div>

          {/* Allergies & conditions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Allergies</p>
              {student.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {student.allergies.map((a) => (
                    <span key={a} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">⚠ {a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No known allergies</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Chronic Conditions</p>
              {student.chronicConditions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {student.chronicConditions.map((c) => (
                    <span key={c} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">None reported</p>
              )}
            </div>
          </div>

          {/* Emergency contact */}
          <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Emergency Contact</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{student.emergencyContact}</p>
                <p className="text-xs text-muted-foreground">{student.emergencyPhone}</p>
              </div>
              <button onClick={() => toast.info('Calling emergency contact')} className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 transition-colors">
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">Last checkup: {formatDate(student.lastCheckup)}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
