'use client'

import { motion } from 'framer-motion'
import { Users, RotateCcw } from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StudentRecord } from '@/lib/store/students-store'

export function ArchivedTab({ students, onRestore, onView }: { students: StudentRecord[]; onRestore: (s: StudentRecord) => void; onView: (s: StudentRecord) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeading title="Archived Students" subtitle={`${students.length} archived · Records preserved permanently`} icon={<RotateCcw className="h-5 w-5" />} />
      {students.length === 0 ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3"><Users className="h-6 w-6" /></div><h3 className="font-semibold text-sm">No archived students</h3><p className="text-xs text-muted-foreground mt-1 max-w-sm">When students graduate, transfer to another school, or are archived, their complete records are preserved here permanently.</p></GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
              <GlassCard className="p-4"><div className="flex items-start gap-3"><GradientAvatar name={s.name} initials={s.avatar} size="md" /><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm truncate">{s.name}</h3><p className="text-[11px] text-muted-foreground font-mono">{s.admissionNo}</p><p className="text-[11px] text-muted-foreground">{s.className} · Sec {s.section}</p></div></div><div className="mt-3 space-y-1.5 text-xs"><div className="flex items-center justify-between"><span className="text-muted-foreground">Reason</span><Badge variant="secondary" className="text-[10px]">{s.archiveReason ?? '—'}</Badge></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Archived</span><span className="font-medium">{s.archiveDate ? new Date(s.archiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div></div><div className="flex items-center gap-2 mt-3"><Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => onView(s)}>View Record</Button><Button size="sm" variant="default" className="h-8 text-xs flex-1" onClick={() => onRestore(s)}><RotateCcw className="h-3 w-3" /> Restore</Button></div></GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
