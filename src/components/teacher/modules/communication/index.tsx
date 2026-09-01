'use client'

import { useState } from 'react'
import { Megaphone, Plus, MessageSquare } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'
import {
  sampleTemplates,
  type AnnouncementForm,
  type MsgChannel,
} from './data'
import { StatCards } from './stat-cards'
import { AnnouncementsList } from './announcements-list'
import { NoticeBoardSection } from './notice-board'
import { ParentDirectory } from './parent-directory'
import { CreateAnnouncementDialog } from './create-announcement-dialog'
import { MessageParentDialog } from './message-parent-dialog'

export function CommunicationModule() {
  const [createOpen, setCreateOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(students[0])
  const [search, setSearch] = useState('')

  const [form, setForm] = useState<AnnouncementForm>({
    title: '', content: '', category: 'General', audience: 'Parents', pin: false,
  })

  const [msgChannel, setMsgChannel] = useState<MsgChannel>('sms')
  const [msgText, setMsgText] = useState(sampleTemplates[0].text)
  const [msgTemplate, setMsgTemplate] = useState(sampleTemplates[0].id)

  const handleCreate = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Please fill title and content')
      return
    }
    toast.success('Announcement published', {
      description: `To: ${form.audience} · ${form.title}${form.pin ? ' · Pinned' : ''}`,
    })
    setCreateOpen(false)
    setForm({ title: '', content: '', category: 'General', audience: 'Parents', pin: false })
  }

  const applyTemplate = (id: string) => {
    setMsgTemplate(id)
    const t = sampleTemplates.find((t) => t.id === id)
    if (t) setMsgText(t.text.replace('{student_name}', selectedStudent.name))
  }

  const handleSendMessage = () => {
    const channelLabel = msgChannel === 'sms' ? 'SMS' : msgChannel === 'email' ? 'Email' : 'Push Notification'
    toast.success(`${channelLabel} sent`, {
      description: `To: ${selectedStudent.fatherName} · ${selectedStudent.guardianPhone}`,
    })
    setMessageOpen(false)
  }

  const openMessage = (studentId?: string) => {
    const s = studentId ? students.find((st) => st.id === studentId) ?? students[0] : students[0]
    setSelectedStudent(s)
    setMsgText(sampleTemplates[0].text.replace('{student_name}', s.name))
    setMsgTemplate(sampleTemplates[0].id)
    setMessageOpen(true)
  }

  const handleSelectStudent = (id: string) => {
    const s = students.find((st) => st.id === id)
    if (s) setSelectedStudent(s)
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Communication"
        subtitle="Announcements, parent messaging & notice board"
        icon={<Megaphone className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openMessage()}>
              <MessageSquare className="h-4 w-4" /> Message Parent
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          </div>
        }
      />

      <StatCards />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <AnnouncementsList onNew={() => setCreateOpen(true)} />
        <NoticeBoardSection onOpenMessage={() => openMessage()} />
      </div>

      <ParentDirectory
        search={search}
        onSearchChange={setSearch}
        onOpenMessage={(id) => openMessage(id)}
      />

      <CreateAnnouncementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        onFormChange={setForm}
        onCreate={handleCreate}
      />

      <MessageParentDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        selectedStudent={selectedStudent}
        onSelectStudent={handleSelectStudent}
        msgChannel={msgChannel}
        onChannelChange={setMsgChannel}
        msgText={msgText}
        onMsgTextChange={setMsgText}
        msgTemplate={msgTemplate}
        onApplyTemplate={applyTemplate}
        onSend={handleSendMessage}
      />
    </div>
  )
}
