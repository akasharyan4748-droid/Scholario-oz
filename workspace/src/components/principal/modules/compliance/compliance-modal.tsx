'use client'

import { motion } from 'framer-motion'
import {
  X, Clock, Calendar, Download,
} from 'lucide-react'
import { type ComplianceItem } from '@/lib/mock/compliance'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { categoryIcons } from './data'

export function ComplianceModal({
  selected,
  onClose,
}: {
  selected: ComplianceItem | null
  onClose: () => void
}) {
  if (!selected) return null

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
        <div className={cn('bg-gradient-to-br p-5 text-white', selected.gradient)}>
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">{categoryIcons[selected.category]}</div>
            <div>
              <p className="text-[10px] text-white/80 font-medium uppercase">{selected.category}</p>
              <h2 className="font-display text-lg font-bold leading-tight">{selected.title}</h2>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed">{selected.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Authority</p>
              <p className="text-sm font-semibold">{selected.authority}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Priority</p>
              <p className="text-sm font-semibold capitalize">{selected.priority}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Last Audit</p>
              <p className="text-sm font-semibold">{formatDate(selected.lastAudit)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground">Next Audit</p>
              <p className="text-sm font-semibold text-primary">{formatDate(selected.nextAudit)}</p>
            </div>
          </div>
          {selected.expiryDate !== '—' && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-700 dark:text-amber-300">Expires on: <strong>{formatDate(selected.expiryDate)}</strong></span>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { toast.success('Audit scheduled', { description: selected.title }); onClose() }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md">
              <Calendar className="h-4 w-4" /> Schedule Audit
            </button>
            <button onClick={() => toast.success('Report downloaded')} className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 hover:bg-accent transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
