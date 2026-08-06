'use client'

import { motion } from 'framer-motion'
import {
  X, Mail, Phone, Download,
} from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { type Candidate } from '@/lib/mock/recruitment'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { candidateStatusConfig } from './data'

export function CandidateModal({
  selectedCandidate,
  onClose,
}: {
  selectedCandidate: Candidate | null
  onClose: () => void
}) {
  if (!selectedCandidate) return null

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
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-4">
            <GradientAvatar name={selectedCandidate.name} initials={selectedCandidate.avatar} size="xl" />
            <div>
              <h2 className="font-display text-lg font-bold">{selectedCandidate.name}</h2>
              <p className="text-emerald-50/90 text-sm">{selectedCandidate.appliedFor}</p>
              <span className={cn('mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold', candidateStatusConfig[selectedCandidate.status].color)}>
                {selectedCandidate.status}
              </span>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Experience</p>
              <p className="text-sm font-semibold">{selectedCandidate.experience} years</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Qualification</p>
              <p className="text-sm font-semibold">{selectedCandidate.qualification}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Expected Salary</p>
              <p className="text-sm font-semibold">{selectedCandidate.expectedSalary}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Notice Period</p>
              <p className="text-sm font-semibold">{selectedCandidate.noticePeriod}</p>
            </div>
          </div>
          {selectedCandidate.currentCompany && (
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Current Company</p>
              <p className="text-sm font-semibold">{selectedCandidate.currentCompany}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Resume Score</p>
            <div className="flex items-center gap-2">
              <ProgressBar value={selectedCandidate.resumeScore} color={selectedCandidate.resumeScore >= 80 ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={8} />
              <span className="font-display text-lg font-bold">{selectedCandidate.resumeScore}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { toast.success('Email drafted', { description: `Interview invitation to ${selectedCandidate.name}` }); onClose() }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md">
              <Mail className="h-4 w-4" /> Schedule Interview
            </button>
            <button onClick={() => toast.info('Calling')} className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 hover:bg-accent transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button onClick={() => toast.success('Resume downloaded')} className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 hover:bg-accent transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
