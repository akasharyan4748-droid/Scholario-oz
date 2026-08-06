'use client'

import { useState } from 'react'
import { TrendingUp, Users, ShieldCheck, ArrowRight, Plus } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'
import type { StudentsState } from '@/lib/store/students-store'

export function PromotionsTab({ store }: { store: StudentsState }) {
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const eligible = fromClass ? store.students.filter((s) => s.classId === fromClass && s.status === 'Active') : []
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const handleCreate = () => {
    if (!fromClass || !toClass || selected.length === 0) { toast.error('Select class and students'); return }
    store.createPromotion(selected, store.classes.find((c) => c.id === fromClass)?.name ?? fromClass, store.classes.find((c) => c.id === toClass)?.name ?? toClass, '2025-2026', 'Dr. Ananya Iyer')
    toast.success(`${selected.length} promotions created`); setSelected([])
  }
  const pending = store.promotions.filter((p) => p.status === 'Pending')
  const approved = store.promotions.filter((p) => p.status === 'Approved')
  return (
    <div className="space-y-5">
      <SectionHeading title="Student Promotions" subtitle="Academic year close · Eligibility · Fee & result verification · Promotion" icon={<TrendingUp className="h-5 w-5" />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><KpiCard label="Pending" value={pending.length} icon={<Users className="h-5 w-5" />} accent="amber" delay={0} /><KpiCard label="Approved" value={approved.length} icon={<ShieldCheck className="h-5 w-5" />} accent="emerald" delay={0.05} /><KpiCard label="Completed" value={store.promotions.filter((p) => p.status === 'Completed').length} icon={<TrendingUp className="h-5 w-5" />} accent="violet" delay={0.1} /></div>
      <GlassCard className="p-4 sm:p-5"><h3 className="font-semibold text-sm mb-4">Create Promotion Batch</h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div><Label className="text-xs font-medium mb-1.5 block">From Class</Label><Select value={fromClass} onValueChange={setFromClass}><SelectTrigger className="w-full"><SelectValue placeholder="Select class…" /></SelectTrigger><SelectContent className="max-h-72">{store.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs font-medium mb-1.5 block">Promote To</Label><Select value={toClass} onValueChange={setToClass}><SelectTrigger className="w-full"><SelectValue placeholder="Select target class…" /></SelectTrigger><SelectContent className="max-h-72">{store.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {fromClass && (<><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">{selected.length} of {eligible.length} selected</p><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(selected.length === eligible.length ? [] : eligible.map((s) => s.id))}>{selected.length === eligible.length ? 'Deselect All' : 'Select All'}</Button></div>
          <div className="rounded-lg border border-border max-h-72 overflow-y-auto"><Table><TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs hidden sm:table-cell">Attendance</TableHead><TableHead className="text-xs hidden md:table-cell">Fee</TableHead><TableHead className="text-xs hidden lg:table-cell">Grade</TableHead><TableHead className="text-xs">Eligible</TableHead></TableRow></TableHeader><TableBody>{eligible.map((s) => { const allOk = s.attendance >= 75 && s.feeStatus === 'Paid' && s.academics.overallPercent >= 40; return (<TableRow key={s.id} className="cursor-pointer hover:bg-accent/30" onClick={() => toggle(s.id)}><TableCell><input type="checkbox" checked={selected.includes(s.id)} readOnly className="h-4 w-4" /></TableCell><TableCell className="py-2"><div className="flex items-center gap-2"><GradientAvatar name={s.name} initials={s.avatar} size="sm" className="h-7 w-7 text-[10px]" /><div><p className="text-xs font-medium">{s.name}</p><p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p></div></div></TableCell><TableCell className="text-xs hidden sm:table-cell py-2"><span className={s.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}>{s.attendance}%</span></TableCell><TableCell className="text-xs hidden md:table-cell py-2">{s.feeStatus === 'Paid' ? '✓' : '✗'}</TableCell><TableCell className="text-xs hidden lg:table-cell py-2">{s.academics.overallGrade}</TableCell><TableCell className="py-2">{allOk ? <StatusBadge status="Eligible" variant="success" dot /> : <StatusBadge status="Check" variant="warning" dot />}</TableCell></TableRow>) })}</TableBody></Table></div>
          <div className="flex justify-end mt-3"><Button onClick={handleCreate} disabled={selected.length === 0}><Plus className="h-4 w-4" /> Create {selected.length > 0 && `${selected.length} `}Promotion{selected.length !== 1 ? 's' : ''}</Button></div></>)}
      </GlassCard>
      {pending.length > 0 && (<GlassCard className="p-4 sm:p-5"><h3 className="font-semibold text-sm mb-3">Pending Approvals</h3><div className="space-y-2">{pending.map((p) => (<div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/40"><GradientAvatar name={p.studentName} initials={p.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')} size="sm" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.studentName}</p><p className="text-[11px] text-muted-foreground">{p.fromClass} <ArrowRight className="h-3 w-3 inline" /> {p.toClass} · AY {p.academicYear}</p></div><div className="hidden sm:flex items-center gap-2"><StatusBadge status={p.feeCleared ? 'Fee OK' : 'Fee Due'} variant={p.feeCleared ? 'success' : 'danger'} dot /><StatusBadge status={p.attendanceCleared ? 'Att OK' : 'Low Att'} variant={p.attendanceCleared ? 'success' : 'danger'} dot /></div><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { store.approvePromotion(p.id, 'Dr. Ananya Iyer'); toast.success('Approved') }}>Approve</Button></div>))}</div></GlassCard>)}
      {approved.length > 0 && (<GlassCard className="p-4 sm:p-5"><h3 className="font-semibold text-sm mb-3">Ready to Execute</h3><div className="space-y-2">{approved.map((p) => (<div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5"><GradientAvatar name={p.studentName} initials={p.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')} size="sm" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.studentName}</p><p className="text-[11px] text-muted-foreground">{p.fromClass} <ArrowRight className="h-3 w-3 inline" /> {p.toClass}</p></div><Button size="sm" className="h-8 text-xs" onClick={() => { store.executePromotion(p.id, 'Dr. Ananya Iyer'); toast.success('Promotion executed') }}>Execute</Button></div>))}</div></GlassCard>)}
    </div>
  )
}
