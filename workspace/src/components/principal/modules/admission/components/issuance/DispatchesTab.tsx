'use client'

import { Mail, PhoneCall, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/shared/ui'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface DispatchesTabProps {
  app: AdmissionApplication
}

export function DispatchesTab({ app }: DispatchesTabProps) {
  const formData = app.formData

  return (
    <GlassCard className="p-6 max-w-lg mx-auto space-y-4 border">
      <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-emerald-600" />
        Automated Notification Dispatch Matrix
      </h3>

      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-lg border bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-emerald-600" />
            <div>
              <span className="font-bold block">Email Dispatch</span>
              <span className="text-[10px] text-muted-foreground">{formData.fatherEmail || 'parent@gmail.com'}</span>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Dispatched</Badge>
        </div>

        <div className="p-3 rounded-lg border bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PhoneCall className="h-4 w-4 text-emerald-600" />
            <div>
              <span className="font-bold block">SMS Notification</span>
              <span className="text-[10px] text-muted-foreground">{formData.fatherPhone}</span>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Dispatched</Badge>
        </div>

        <div className="p-3 rounded-lg border bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <div>
              <span className="font-bold block">WhatsApp Document Link</span>
              <span className="text-[10px] text-muted-foreground">{formData.fatherPhone}</span>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Delivered</Badge>
        </div>
      </div>
    </GlassCard>
  )
}
