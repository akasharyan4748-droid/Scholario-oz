'use client'

import { motion } from 'framer-motion'
import { FileText, Users } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CIRCULARS } from './data'
import { formatDateMonthDay } from './shared'

export function CircularsTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {CIRCULARS.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted-foreground">{c.ref}</span>
              <div className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            </div>
            <h3 className="font-semibold text-sm leading-tight mb-2">{c.title}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.audience}</span>
              <span>{formatDateMonthDay(c.date)}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => toast.success('Circular downloaded', { description: `${c.title} (${c.ref})` })}>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> View PDF
            </Button>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
