'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
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
import { EMAIL_TEMPLATES } from './data'

const AUDIENCES = ['All Parents', 'Class Teachers', 'Senior Section', 'Primary Section']

export function EmailTab() {
  const [template, setTemplate] = useState(EMAIL_TEMPLATES[0].id)
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject)
  const [body, setBody] = useState(EMAIL_TEMPLATES[0].body)
  const [audience, setAudience] = useState('All Parents')

  const onTemplate = (id: string) => {
    setTemplate(id)
    const t = EMAIL_TEMPLATES.find((x) => x.id === id)
    if (t) { setSubject(t.subject); setBody(t.body) }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email Composer</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">To (Audience)</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={template} onValueChange={onTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs" />
          </div>
          <Button className="w-full" onClick={() => toast.success('Email queued', { description: `Sent to ${audience} · Subject: ${subject.slice(0, 40)}...` })}>
            <Send className="h-4 w-4 mr-2" /> Send Email
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Rendered Preview</h3>
        <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur font-display font-bold text-lg">{school.logo}</div>
              <div>
                <p className="font-display font-bold text-sm">{school.name}</p>
                <p className="text-[10px] opacity-80">{school.tagline}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="border-b border-border pb-2">
              <p className="text-[10px] text-muted-foreground">From: info@greenwood.edu.in</p>
              <p className="text-[10px] text-muted-foreground">To: {audience}</p>
              <p className="font-semibold text-sm mt-1">{subject}</p>
            </div>
            <motion.div key={body} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/90">
              {body}
            </motion.div>
            <div className="border-t border-border pt-3 text-[10px] text-muted-foreground">
              <p>{school.address}</p>
              <p>{school.phone} · {school.email}</p>
              <p className="mt-1">© {new Date().getFullYear()} {school.name}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
