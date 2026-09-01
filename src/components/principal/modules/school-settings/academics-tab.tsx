'use client'

// Academics tab — current session selector, educational board, and the
// configured subjects master list. Backed by store.academics.

import { BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function AcademicsTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={BookOpen}
      title="Academic Master Setup"
      description="Configure classes, streams, subjects, and examination structures."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Current Academic Session</Label>
          <Select
            value={store.academics.currentSession}
            onValueChange={(val) => store.updateAcademics({ currentSession: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {store.academics.academicSessions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Educational Board</Label>
          <Input
            value={store.academics.board}
            onChange={(e) => store.updateAcademics({ board: e.target.value })}
          />
        </div>
      </div>

      {/* Configured Subjects List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Configured Subjects Master ({store.academics.subjects.length})</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {store.academics.subjects.map((sub) => (
            <div key={sub.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-2 shadow-2xs">
              <div>
                <p className="font-bold text-foreground">{sub.name}</p>
                <p className="text-[10px] text-muted-foreground">{sub.code} · {sub.category}</p>
              </div>
              <Badge variant="outline" className="text-[9px]" style={{ borderColor: sub.color, color: sub.color }}>
                {sub.category}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </SettingsTab>
  )
}
