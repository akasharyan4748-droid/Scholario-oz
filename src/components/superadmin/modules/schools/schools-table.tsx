'use client'

import { motion } from 'framer-motion'
import { Inbox, Plus, ChevronRight, Globe, ShieldCheck, Download } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { School } from './types'

export function SchoolsTable({
  schools, loading, showDemo, onOnboard, onSelect,
}: {
  schools: School[]
  loading: boolean
  showDemo: boolean
  onOnboard: () => void
  onSelect: (s: School) => void
}) {
  return (
    <GlassCard className="relative overflow-hidden p-3 sm:p-4 lg:p-5">
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">All Registered Tenants <span className="text-muted-foreground font-normal">({schools.length})</span></h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Tenant isolation enforced · row-level security
            </p>
          </div>
        </div>
        <button onClick={() => toast.success('Schools exported')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {loading ? (
        <SchoolsTableSkeleton />
      ) : schools.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Inbox className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm font-semibold mt-4">No schools matching filter</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {!showDemo
              ? 'The Demo School is currently hidden and no real schools match your search. Toggle "Show Demo School" above to view the demo tenant.'
              : 'Adjust your search or plan filter, or onboard a new real school tenant to get started.'}
          </p>
          <button
            onClick={onOnboard}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Onboard First School
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">School</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Students</th>
                <th className="px-3 py-2 font-medium">Teachers</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer group"
                  onClick={() => onSelect(s)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                        {s.code.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">{s.name}</p>
                          {s.isDemo && (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 uppercase">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{s.domain || `${s.slug}.scholario.app`}{s.city ? ` · ${s.city}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      'rounded-md px-2 py-0.5 text-[10px] font-semibold',
                      s.plan === 'ENTERPRISE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      s.plan === 'STANDARD' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-muted text-muted-foreground'
                    )}>{s.plan}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground font-medium tabular-nums">{s.counts?.students || 0}</td>
                  <td className="px-3 py-2.5 text-muted-foreground font-medium tabular-nums">{s.counts?.teachers || 0}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={s.status} variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} dot /></td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-3 py-2.5"><ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}

function SchoolsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
