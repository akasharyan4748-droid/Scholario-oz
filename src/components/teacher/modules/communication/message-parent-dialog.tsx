'use client'

import {
  Bell, Mail, Smartphone, Send, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { GradientAvatar } from '@/components/shared/ui'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'
import type { MsgChannel } from './data'
import { sampleTemplates } from './data'
import { GraduationCap } from './shared'

interface MessageParentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudent: typeof students[number]
  onSelectStudent: (id: string) => void
  msgChannel: MsgChannel
  onChannelChange: (channel: MsgChannel) => void
  msgText: string
  onMsgTextChange: (text: string) => void
  msgTemplate: string
  onApplyTemplate: (id: string) => void
  onSend: () => void
}

export function MessageParentDialog({
  open, onOpenChange, selectedStudent, onSelectStudent,
  msgChannel, onChannelChange, msgText, onMsgTextChange,
  msgTemplate, onApplyTemplate, onSend,
}: MessageParentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message Parent</DialogTitle>
          <DialogDescription>
            Send a message to <span className="font-semibold text-foreground">{selectedStudent.fatherName}</span> (parent of {selectedStudent.name})
          </DialogDescription>
        </DialogHeader>

        <RecipientSelector
          selectedStudent={selectedStudent}
          onSelectStudent={onSelectStudent}
          msgText={msgText}
          onMsgTextChange={onMsgTextChange}
        />

        <ChannelTabs
          msgChannel={msgChannel}
          onChannelChange={onChannelChange}
          msgText={msgText}
          selectedStudent={selectedStudent}
        />

        <TemplateSelector msgTemplate={msgTemplate} onApplyTemplate={onApplyTemplate} />

        <div className="space-y-1.5">
          <Label htmlFor="msg-text">Message</Label>
          <Textarea
            id="msg-text"
            value={msgText}
            onChange={(e) => onMsgTextChange(e.target.value)}
            className="min-h-20 text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => toast.success('Saved as draft')}>
            <Eye className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={onSend} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Send className="h-4 w-4" /> Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecipientSelector({
  selectedStudent, onSelectStudent, msgText, onMsgTextChange,
}: {
  selectedStudent: typeof students[number]
  onSelectStudent: (id: string) => void
  msgText: string
  onMsgTextChange: (text: string) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 flex items-center gap-2.5">
      <GradientAvatar name={selectedStudent.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{selectedStudent.fatherName}</p>
        <p className="text-[11px] text-muted-foreground">{selectedStudent.guardianPhone} · {selectedStudent.email}</p>
      </div>
      <Select
        value={selectedStudent.id}
        onValueChange={(v) => {
          const s = students.find((s) => s.id === v)
          if (s) {
            onSelectStudent(v)
            onMsgTextChange(msgText.replace(selectedStudent.name, s.name))
          }
        }}
      >
        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {students.slice(0, 8).map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ChannelTabs({
  msgChannel, onChannelChange, msgText, selectedStudent,
}: {
  msgChannel: MsgChannel
  onChannelChange: (c: MsgChannel) => void
  msgText: string
  selectedStudent: typeof students[number]
}) {
  return (
    <Tabs value={msgChannel} onValueChange={(v) => onChannelChange(v as MsgChannel)}>
      <TabsList className="w-full grid grid-cols-3 h-9">
        <TabsTrigger value="sms" className="text-xs"><Smartphone className="h-3.5 w-3.5" /> SMS</TabsTrigger>
        <TabsTrigger value="email" className="text-xs"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
        <TabsTrigger value="push" className="text-xs"><Bell className="h-3.5 w-3.5" /> Push</TabsTrigger>
      </TabsList>

      <TabsContent value="sms" className="mt-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">SMS Preview</span>
            <span className="text-[10px] text-muted-foreground">{msgText.length}/160</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
            <p className="font-mono leading-relaxed">{msgText}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">From: GW-EDU · To: {selectedStudent.guardianPhone}</p>
        </div>
      </TabsContent>

      <TabsContent value="email" className="mt-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="border-b border-border pb-2 mb-2">
            <p className="text-[10px] text-muted-foreground">From: rohan.mehta@greenwood.edu.in</p>
            <p className="text-[10px] text-muted-foreground">To: {selectedStudent.email}</p>
            <p className="text-xs font-semibold mt-1">Subject: Update regarding {selectedStudent.name}</p>
          </div>
          <div className="text-xs leading-relaxed space-y-2">
            <p>Dear {selectedStudent.fatherName},</p>
            <p>{msgText}</p>
            <p>Warm regards,<br />Rohan Mehta<br />Class Teacher, 2-A<br />Demo School of Scholario</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="push" className="mt-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">SCHOLARIO ERP</p>
                <span className="text-[10px] text-muted-foreground">now</span>
              </div>
              <p className="text-xs font-medium mt-0.5">Message from Class Teacher</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{msgText}</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function TemplateSelector({
  msgTemplate, onApplyTemplate,
}: {
  msgTemplate: string
  onApplyTemplate: (id: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider">Quick Template</Label>
      <Select value={msgTemplate} onValueChange={onApplyTemplate}>
        <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {sampleTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
