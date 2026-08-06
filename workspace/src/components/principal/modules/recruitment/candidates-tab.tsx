'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { candidates, type Candidate } from '@/lib/mock/recruitment'
import { cn } from '@/lib/utils'
import { candidateStatusConfig } from './data'

export function CandidatesTab({ onSelect }: { onSelect: (c: Candidate) => void }) {
  return (
    <motion.div key="cd" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Candidate Pipeline</h3>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Position</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Exp</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Resume</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const cfg = candidateStatusConfig[c.status]
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => onSelect(c)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <GradientAvatar name={c.name} initials={c.avatar} size="sm" />
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-muted-foreground">{c.appliedFor}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{c.experience} yrs</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={c.resumeScore} color={c.resumeScore >= 80 ? 'oklch(0.55 0.14 162)' : c.resumeScore >= 60 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={5} />
                        <span className="text-[10px] font-semibold tabular-nums w-8">{c.resumeScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{c.status}</span>
                    </td>
                    <td className="px-3 py-2.5"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  )
}
