'use client'

import { motion } from 'framer-motion'
import {
  Briefcase, Clock, Users, Calendar, ChevronRight,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { jobPostings } from '@/lib/mock/recruitment'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PostingsTab() {
  return (
    <motion.div key="jp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {jobPostings.map((j, i) => (
        <motion.div key={j.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
            <div className={cn('relative h-20 bg-gradient-to-br p-4 text-white', j.gradient)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{j.department}</p>
                  <p className="font-semibold text-sm leading-tight mt-0.5">{j.title}</p>
                </div>
                <StatusBadge status={j.status} variant={j.status === 'Open' ? 'success' : j.status === 'Closed' ? 'neutral' : 'warning'} />
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{j.description}</p>
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="h-3 w-3" /> {j.type}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> {j.experience}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3 w-3" /> {j.vacancies} vacancy</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> {formatDate(j.closingDate)}</div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Applicants · Shortlisted</span>
                  <span className="font-semibold">{j.applicants} · {j.shortlisted}</span>
                </div>
                <ProgressBar value={j.shortlisted} max={j.applicants} color="oklch(0.55 0.14 162)" height={5} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs font-semibold text-emerald-600">{j.salary}</span>
                <button onClick={() => toast.info(`View ${j.title}`)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:gap-1.5 transition-all">
                  View <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
