'use client'

import { RefreshCw, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import { gradientFor } from './shared'

interface Props {
  teachers: TeacherRecord[]
  onViewLetter: (t: TeacherRecord) => void
  onRegenerate: (id: string) => void
}

/**
 * Appointment Letters tab — clean list of faculty appointment letters
 * with regenerate + view actions. No outer GlassCard wrapper, no
 * descriptive paragraph.
 */
export function AppointmentLettersTab({ teachers, onViewLetter, onRegenerate }: Props) {
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
      {teachers.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 flex-wrap"
        >
          {/* Teacher identity — avatar + name + meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradientFor(t.id)} font-semibold text-white text-sm`}>
              {t.avatar}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {t.designation} · {t.department}
              </p>
            </div>
          </div>

          {/* Letter ref — muted mono */}
          <p className="text-[10px] text-muted-foreground font-mono hidden sm:block">
            Ref: {t.appointmentLetter?.id || 'Pending'}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onRegenerate(t.id)} className="text-xs h-8">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button size="sm" onClick={() => onViewLetter(t)} className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileCheck className="h-3.5 w-3.5" /> View
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
