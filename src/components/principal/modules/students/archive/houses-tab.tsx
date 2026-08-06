'use client'

import { motion } from 'framer-motion'
import { Home, Plus, Crown } from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { House, StudentRecord } from '@/lib/store/students-store'

export function HousesTab({ houses, students, onAddPoints }: { houses: House[]; students: StudentRecord[]; onAddPoints: (id: string, pts: number) => void }) {
  const sorted = [...houses].sort((a, b) => b.points - a.points)
  const houseColors = ['oklch(0.6 0.18 250)', 'oklch(0.6 0.18 25)', 'oklch(0.6 0.18 150)', 'oklch(0.6 0.18 75)']
  const donutData = houses.map((h, i) => ({ name: h.name, value: students.filter((s) => s.houseId === h.id).length, color: houseColors[i % houseColors.length] }))
  const totalStudents = students.length
  return (
    <div className="space-y-5">
      <SectionHeading title="House System" subtitle="Leadership · Competitions · Points · Student assignment" icon={<Home className="h-5 w-5" />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {sorted.map((h, i) => {
          const hs = students.filter((s) => s.houseId === h.id)
          const captain = h.captainId ? students.find((s) => s.id === h.captainId) : null
          const isLeader = i === 0
          const colorIdx = houses.findIndex((x) => x.id === h.id)
          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard className={cn('p-4 relative overflow-hidden', isLeader && 'ring-2 ring-amber-500/40')}>
                {isLeader && <div className="absolute top-2 right-2"><Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] gap-1"><Crown className="h-3 w-3" /> Leading</Badge></div>}
                <div className="flex items-center gap-2 mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-display font-bold" style={{ background: houseColors[colorIdx] }}>{h.name[0]}</div><div><h3 className="font-semibold text-sm">{h.name}</h3><p className="text-[10px] text-muted-foreground italic">"{h.motto}"</p></div></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Points</span><span className="font-display text-lg font-bold" style={{ color: houseColors[colorIdx] }}>{h.points}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Students</span><span className="font-medium">{hs.length}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Wins</span><span className="font-medium">{h.competitionWins}</span></div>
                </div>
                {captain && (<div className="mt-3 pt-3 border-t border-border"><p className="text-[10px] text-muted-foreground mb-1">House Captain</p><div className="flex items-center gap-2"><GradientAvatar name={captain.name} initials={captain.avatar} size="sm" className="h-6 w-6 text-[9px]" /><span className="text-xs font-medium truncate">{captain.name}</span></div></div>)}
                <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs" onClick={() => { onAddPoints(h.id, 10); toast.success(`+10 points to ${h.name}`) }}><Plus className="h-3 w-3" /> Award 10 Points</Button>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-4"><h3 className="font-semibold text-sm mb-3">House Distribution</h3><div className="flex items-center justify-center"><div className="relative w-40 h-40"><svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">{donutData.map((d, i) => { const offset = donutData.slice(0, i).reduce((a, x) => a + x.value, 0); const pct = (d.value / totalStudents) * 100; const circumference = 2 * Math.PI * 35; return <circle key={i} cx="50" cy="50" r="35" fill="none" stroke={d.color} strokeWidth="12" strokeDasharray={`${(pct / 100) * circumference} ${circumference}`} strokeDashoffset={-(offset / totalStudents) * circumference} /> })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-2xl font-bold">{totalStudents}</span><span className="text-xs text-muted-foreground">students</span></div></div></div><div className="flex items-center justify-center gap-3 mt-3 flex-wrap">{donutData.map((d, i) => <span key={i} className="flex items-center gap-1 text-xs"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name} ({d.value})</span>)}</div></GlassCard>
        <GlassCard className="p-4 lg:col-span-2"><h3 className="font-semibold text-sm mb-3">House Points Standings</h3><div className="space-y-3">{sorted.map((h, i) => { const max = sorted[0].points; const pct = Math.round((h.points / max) * 100); const c = houseColors[houses.findIndex((x) => x.id === h.id)]; return (<div key={h.id}><div className="flex items-center justify-between text-xs mb-1"><div className="flex items-center gap-2"><span className="font-bold w-5 text-muted-foreground">#{i + 1}</span><div className="h-3 w-3 rounded-full" style={{ background: c }} /><span className="font-medium">{h.name}</span></div><span className="font-semibold">{h.points} pts</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c }} /></div></div>) })}</div></GlassCard>
      </div>
    </div>
  )
}
