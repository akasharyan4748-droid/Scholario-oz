'use client'

/**
 * comm-circulars — official circulars with View/Download/Archive.
 *
 * - Search + filter by status
 * - Circular cards with ref number, title, audience, date, category, status
 * - Actions: View PDF, Download, Share, Archive
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Share2, Archive, Eye, Search, RotateCcw, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommunicationStore, type Circular } from '@/lib/store/communication-store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CommPanel, CommEmptyState } from './comm-shared'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, string> = {
  'Examination': 'oklch(0.62 0.2 25)',
  'General': 'oklch(0.7 0.15 200)',
  'Transport': 'oklch(0.55 0.14 162)',
  'Event': 'oklch(0.65 0.16 75)',
  'Holiday': 'oklch(0.6 0.18 300)',
  'Parents': 'oklch(0.55 0.16 250)',
}

export function CircularsSection() {
  const circulars = useCommunicationStore((s) => s.circulars)
  const archiveCircular = useCommunicationStore((s) => s.archiveCircular)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [viewing, setViewing] = useState<Circular | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return circulars.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q) && !c.refNo.toLowerCase().includes(q)) return false
      if (filter === 'active' && c.status !== 'Active') return false
      if (filter === 'archived' && c.status !== 'Archived') return false
      return true
    })
  }, [circulars, search, filter])

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circular by title or reference number…"
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                filter === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Circulars grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c, i) => (
          <CircularCard
            key={c.id}
            circular={c}
            index={i}
            onView={() => setViewing(c)}
            onArchive={() => { archiveCircular(c.id); toast.success(c.status === 'Active' ? 'Circular archived' : 'Circular restored') }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <CommPanel>
              <CommEmptyState icon={<FileText className="h-6 w-6" />} title="No circulars found" description={search ? "Try a different search." : "No circulars match this filter."} />
            </CommPanel>
          </div>
        )}
      </div>

      {/* View modal */}
      {viewing && (
        <CircularViewModal circular={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}

function CircularCard({ circular, index, onView, onArchive }: {
  circular: Circular
  index: number
  onView: () => void
  onArchive: () => void
}) {
  const color = circular.color
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'rounded-xl border bg-card p-3.5 transition-all hover:shadow-md',
        circular.status === 'Archived' ? 'opacity-60 border-border' : 'border-border',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md text-white shadow-sm" style={{ background: color }}>
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{circular.refNo}</p>
          <h3 className="font-semibold text-sm leading-tight mt-0.5">{circular.title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-muted/60 text-muted-foreground">{circular.audience}</span>
            <span className="text-[9px] text-muted-foreground">{formatDate(circular.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
          circular.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground line-through')}>
          {circular.status}
        </span>
        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onView} title="View PDF">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success('Circular downloaded', { description: `${circular.refNo}.pdf` })} title="Download">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success('Share link copied', { description: circular.refNo })} title="Share">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600" onClick={onArchive} title={circular.status === 'Active' ? 'Archive' : 'Restore'}>
            {circular.status === 'Active' ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function CircularViewModal({ circular, onClose }: { circular: Circular; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-white" style={{ background: circular.color }}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{circular.title}</h3>
              <p className="font-mono text-[10px] text-muted-foreground">{circular.refNo}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF preview placeholder */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">{circular.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{circular.refNo} · {formatDate(circular.date)}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-3 max-w-md mx-auto">
              This is a demo circular. In production, the actual PDF document would render here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
            <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase font-semibold">Audience</p>
              <p className="font-medium">{circular.audience}</p>
            </div>
            <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase font-semibold">Category</p>
              <p className="font-medium">{circular.category}</p>
            </div>
            <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase font-semibold">Date</p>
              <p className="font-medium">{formatDate(circular.date)}</p>
            </div>
            <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase font-semibold">Status</p>
              <p className="font-medium">{circular.status}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-1">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => toast.success('Share link copied', { description: circular.refNo })}>
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => toast.success('Circular downloaded', { description: `${circular.refNo}.pdf` })}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
