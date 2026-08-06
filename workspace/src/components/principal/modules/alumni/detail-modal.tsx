'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Mail, Phone, Linkedin, Award, Briefcase, MapPin, Star, Send, Trophy,
} from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Alumni } from '@/lib/mock/alumni'

export function AlumniDetailModal({ alumni, onClose }: { alumni: Alumni | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {alumni && (
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
            <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors">✕</button>
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <GradientAvatar name={alumni.name} initials={alumni.avatar} size="xl" />
                  {alumni.status === 'Lifetime Member' && (
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white">
                      <Trophy className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">{alumni.name}</h2>
                  <p className="text-emerald-50/90 text-sm">Batch {alumni.batch} · {alumni.passingYear}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">{alumni.course}</span>
                    <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">{alumni.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Position</p>
                  <p className="text-sm font-semibold">{alumni.currentRole}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {alumni.company} · {alumni.location}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                  <Award className="h-3 w-3 text-amber-500" /> Achievements
                </p>
                <div className="flex flex-wrap gap-2">
                  {alumni.achievements.map((ach, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" /> {ach}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <a href={`mailto:${alumni.email}`} onClick={(e) => { e.preventDefault(); toast.info('Email client would open') }} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 hover:bg-accent transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{alumni.email}</span>
                </a>
                <a href={`tel:${alumni.phone}`} onClick={(e) => { e.preventDefault(); toast.info('Dialer would open') }} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 hover:bg-accent transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{alumni.phone}</span>
                </a>
                <button onClick={() => toast.info('LinkedIn profile')} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 hover:bg-accent transition-colors">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">linkedin.com/{alumni.linkedin}</span>
                </button>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-400" /> Total Contributions
                  </span>
                  <span className="font-display text-lg font-bold text-emerald-600">{formatINR(alumni.totalDonation)}</span>
                </div>
                {alumni.lastDonation && (
                  <p className="text-[11px] text-muted-foreground">
                    Last donation: {formatINR(alumni.lastDonation)} on {formatDate(alumni.lastDonationDate!)}
                  </p>
                )}
              </div>

              <button
                onClick={() => { toast.success('Message sent', { description: `Invitation emailed to ${alumni.name}` }); onClose() }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                <Send className="h-4 w-4" /> Send Reunion Invitation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
