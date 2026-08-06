'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send } from 'lucide-react'
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
import { SMS_TEMPLATES } from './data'
import { SignalIcon } from './shared'

const RECIPIENTS = ['All Parents', 'Class 2-A Parents', 'Class 10 Parents', 'Teachers', 'Transport Users']

export function SmsTab() {
  const [recipient, setRecipient] = useState('All Parents')
  const [template, setTemplate] = useState(SMS_TEMPLATES[0].id)
  const [message, setMessage] = useState(SMS_TEMPLATES[0].text)
  const maxLen = 160

  const onTemplate = (id: string) => {
    setTemplate(id)
    const t = SMS_TEMPLATES.find((x) => x.id === id)
    if (t) setMessage(t.text)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> SMS Composer</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Recipient Group</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECIPIENTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={template} onValueChange={onTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SMS_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">SMS segments: {Math.ceil(message.length / maxLen)}</span>
              <span className={`text-[11px] font-medium ${message.length > 480 ? 'text-rose-600' : 'text-muted-foreground'}`}>{message.length} / 480 chars</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => toast.success('SMS queued for delivery', { description: `${recipient} · ${Math.ceil(message.length / maxLen)} segment(s)` })}>
            <Send className="h-4 w-4 mr-2" /> Send to {recipient}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Live Preview</h3>
        <div className="mx-auto max-w-[280px] rounded-3xl border-4 border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 shadow-premium">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 px-2">
            <span>9:41 AM</span>
            <span className="flex items-center gap-1"><SignalIcon /> 4G</span>
          </div>
          <div className="space-y-2">
            <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-2 text-[10px] text-slate-500 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> Messages
            </div>
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500 text-white rounded-2xl rounded-br-sm p-3 text-xs shadow-sm"
            >
              <p className="font-semibold text-[10px] mb-1 opacity-90">{school.shortName}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
              <p className="text-[9px] opacity-70 mt-1 text-right">9:41 AM · Delivered</p>
            </motion.div>
          </div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          {recipient} · ~{recipient === 'All Parents' ? '1,842' : '42'} recipients
        </p>
      </GlassCard>
    </div>
  )
}
