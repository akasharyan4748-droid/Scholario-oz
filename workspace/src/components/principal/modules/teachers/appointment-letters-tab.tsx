'use client'

import { RefreshCw, FileCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import { gradientFor } from './shared'

interface Props {
  teachers: TeacherRecord[]
  onViewLetter: (t: TeacherRecord) => void
  onRegenerate: (id: string) => void
}

/**
 * Appointment Letters tab — repository of every faculty member's official
 * appointment letter with regenerate / view actions.
 */
export function AppointmentLettersTab({ teachers, onViewLetter, onRegenerate }: Props) {
  return (
    <GlassCard className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-base">Faculty Official Appointment Letters Repository</h3>
          <p className="text-xs text-muted-foreground">Official appointment letters with school logo, terms, Principal signature & seal.</p>
        </div>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {teachers.map((t) => (
          <div key={t.id} className="p-4 bg-card/40 hover:bg-card/70 transition-colors flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientFor(t.id)} font-bold text-white`}>
                {t.avatar}
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                <p className="text-xs text-muted-foreground">{t.designation} · {t.department}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Ref: {t.appointmentLetter?.id || 'Pending Generation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onRegenerate(t.id)} className="text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button size="sm" onClick={() => onViewLetter(t)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <FileCheck className="h-3.5 w-3.5" /> View / Download Letter
              </Button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
