'use client'

import { ArrowRight } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import type { TransferRecord } from '@/lib/store/students-store'

export function TransfersTab({ transfers }: { transfers: TransferRecord[] }) {
  return (
    <div className="space-y-5">
      <SectionHeading title="Student Transfers" subtitle="Section change · Class change · School transfer · Graduation" icon={<ArrowRight className="h-5 w-5" />} />
      {transfers.length === 0 ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3"><ArrowRight className="h-6 w-6" /></div><h3 className="font-semibold text-sm">No transfers yet</h3><p className="text-xs text-muted-foreground mt-1">Transfer records will appear here when students are moved between classes or sections.</p></GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden"><Table><TableHeader><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs hidden sm:table-cell">From → To</TableHead><TableHead className="text-xs hidden md:table-cell">Reason</TableHead><TableHead className="text-xs hidden lg:table-cell">Date</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader><TableBody>{transfers.map((t) => (<TableRow key={t.id}><TableCell className="py-2"><div className="flex items-center gap-2"><GradientAvatar name={t.studentName} initials={t.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')} size="sm" className="h-7 w-7 text-[10px]" /><span className="text-xs font-medium">{t.studentName}</span></div></TableCell><TableCell className="py-2"><Badge variant="secondary" className="text-[10px]">{t.type}</Badge></TableCell><TableCell className="text-xs hidden sm:table-cell py-2"><span className="text-muted-foreground">{t.fromClass}</span><ArrowRight className="h-3 w-3 inline mx-1" /><span className="font-medium">{t.toClass}</span></TableCell><TableCell className="text-xs hidden md:table-cell py-2 text-muted-foreground">{t.reason}</TableCell><TableCell className="text-xs hidden lg:table-cell py-2 text-muted-foreground">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell><TableCell className="py-2"><StatusBadge status={t.status} variant={t.status === 'Completed' ? 'success' : 'warning'} dot /></TableCell></TableRow>))}</TableBody></Table></GlassCard>
      )}
    </div>
  )
}
