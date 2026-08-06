'use client'

import { motion } from 'framer-motion'
import { Upload, FileText, Download } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { complianceDocuments } from '@/lib/mock/compliance'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

export function DocumentsTab() {
  return (
    <motion.div key="dc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Compliance Documents</h3>
          <button onClick={() => toast.success('Upload started')} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {complianceDocuments.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                  <FileText className="h-5 w-5" />
                </div>
                <StatusBadge status={d.status} variant={d.status === 'Verified' ? 'success' : d.status === 'Expiring Soon' ? 'warning' : 'info'} />
              </div>
              <p className="font-semibold text-sm leading-tight">{d.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{d.category} · {d.version}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
                <span>{d.type} · {d.size}</span>
                <span>{formatDate(d.uploadedOn)}</span>
              </div>
              <button onClick={() => toast.success('Downloaded', { description: d.name })} className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-muted/50 py-1.5 text-[11px] font-medium hover:bg-accent transition-colors">
                <Download className="h-3 w-3" /> Download
              </button>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
