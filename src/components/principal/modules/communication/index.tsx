'use client'

import { useState } from 'react'
import { Megaphone, Plus, FileText, MessageSquare, Mail, Smartphone } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnnouncementsTab } from './announcements-tab'
import { CircularsTab } from './circulars-tab'
import { SmsTab } from './sms-tab'
import { EmailTab } from './email-tab'
import { PushTab } from './push-tab'
import { CreateAnnouncementDialog, type AnnouncementForm } from './create-announcement-dialog'

export function CommunicationModule() {
  const [tab, setTab] = useState('announcements')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<AnnouncementForm>({ title: '', content: '', category: 'General', audience: 'All' })

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Communication Center"
        subtitle="Announcements, circulars, SMS, email & push notifications"
        icon={<Megaphone className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="announcements" className="gap-1.5"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
          <TabsTrigger value="circulars" className="gap-1.5"><FileText className="h-4 w-4" /> Circulars</TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5"><MessageSquare className="h-4 w-4" /> SMS Preview</TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5"><Mail className="h-4 w-4" /> Email Preview</TabsTrigger>
          <TabsTrigger value="push" className="gap-1.5"><Smartphone className="h-4 w-4" /> Push</TabsTrigger>
        </TabsList>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announcements">
          <AnnouncementsTab />
        </TabsContent>

        {/* CIRCULARS */}
        <TabsContent value="circulars">
          <CircularsTab />
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <SmsTab />
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email">
          <EmailTab />
        </TabsContent>

        {/* PUSH */}
        <TabsContent value="push">
          <PushTab />
        </TabsContent>
      </Tabs>

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setForm={setForm}
      />
    </div>
  )
}
