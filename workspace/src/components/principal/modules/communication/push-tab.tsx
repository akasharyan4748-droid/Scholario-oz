'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { school } from '@/lib/mock/school'
import { toast } from 'sonner'
import { PUSH_AUDIENCES } from './data'

export function PushTab() {
  const [title, setTitle] = useState('Sports Day Postponed')
  const [message, setMessage] = useState('Due to weather conditions, Annual Sports Day is rescheduled to 17th December. Please check your email for details.')
  const [audience, setAudience] = useState(PUSH_AUDIENCES[0])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notification Composer</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} />
            <p className="text-[11px] text-muted-foreground mt-1">{title.length}/50</p>
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={150} />
            <p className="text-[11px] text-muted-foreground mt-1">{message.length}/150</p>
          </div>
          <div>
            <Label className="text-xs">Target Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PUSH_AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => toast.success('Push notification sent', { description: `Delivered to ${audience}` })}>
            <Bell className="h-4 w-4 mr-2" /> Send Notification
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Mobile Preview</h3>
        <div className="mx-auto max-w-[280px] rounded-[2rem] border-4 border-slate-800 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-3 shadow-premium">
          <div className="flex justify-center mb-2">
            <div className="h-1.5 w-16 rounded-full bg-slate-800 dark:bg-slate-600" />
          </div>
          <div className="relative h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between px-4 py-2 text-[10px] text-slate-600 dark:text-slate-300">
              <span>9:41</span>
              <span>📶 🔋</span>
            </div>
            <div className="px-3 text-center mt-1">
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { weekday: 'long' })}</p>
              <p className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
            </div>
            <motion.div
              key={title + message}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="absolute top-12 left-2 right-2 rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-3 flex gap-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-display font-bold text-sm">
                {school.logo}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[11px]">{school.shortName}</p>
                  <span className="text-[9px] text-muted-foreground">now</span>
                </div>
                <p className="text-[11px] font-semibold leading-tight mt-0.5 truncate">{title}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">{message}</p>
              </div>
            </motion.div>
            <div className="absolute bottom-3 left-3 right-3 grid grid-cols-4 gap-2">
              {['🏠', '📅', '✉️', '👤'].map((e, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur flex items-center justify-center text-lg">{e}</div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
