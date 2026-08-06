'use client'

import { motion } from 'framer-motion'
import { Users, Search, MessageSquare, Mail, Smartphone } from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'

interface ParentDirectoryProps {
  search: string
  onSearchChange: (value: string) => void
  onOpenMessage: (id: string) => void
}

export function ParentDirectory({ search, onSearchChange, onOpenMessage }: ParentDirectoryProps) {
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search)
  )

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <SectionHeading
        title="Parent Directory"
        subtitle="Class 2-A · Reach out to guardians directly"
        icon={<Users className="h-5 w-5" />}
        action={
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search student…" className="pl-8 h-9" />
          </div>
        }
        className="mb-4"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStudents.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card/40 p-3 hover:shadow-premium hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-3 mb-2">
              <GradientAvatar name={s.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">Roll #{s.rollNo} · {s.fatherName}</p>
              </div>
            </div>
            <div className="space-y-1 mb-2.5">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> {s.guardianPhone}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" /> {s.email}</p>
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="h-7 flex-1 text-[11px]" onClick={() => onOpenMessage(s.id)}>
                <MessageSquare className="h-3 w-3" /> Message
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success('Call initiated', { description: `Dialing ${s.guardianPhone}` })}>
                <Smartphone className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success('Email draft opened', { description: `To: ${s.email}` })}>
                <Mail className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
