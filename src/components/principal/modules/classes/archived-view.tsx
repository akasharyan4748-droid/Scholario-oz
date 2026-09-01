'use client'

import { useState, useMemo } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { StudentRecord } from '@/lib/store/students-store'

/**
 * ArchivedView — historical student records grouped by class.
 * Compact session selector at top. NO separate "Archived Classes" section.
 */
export function ArchivedView({
  archivedStudents, onRestoreStudent, onViewStudent,
}: {
  archivedStudents: StudentRecord[]
  onRestoreStudent: (s: StudentRecord) => void
  onViewStudent: (s: StudentRecord) => void
}) {
  const [session, setSession] = useState('2025-2026')

  // Group archived students by their historical class name
  const grouped = useMemo(() => {
    const map: Record<string, StudentRecord[]> = {}
    archivedStudents.forEach((s) => {
      const cls = s.className || 'Unknown Class'
      if (!map[cls]) map[cls] = []
      map[cls].push(s)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [archivedStudents])

  return (
    <div className="space-y-4">
      {/* Session selector — compact */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Academic Session:</span>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-2026">2025–2026</SelectItem>
            <SelectItem value="2024-2025">2024–2025</SelectItem>
            <SelectItem value="2023-2024">2023–2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Archived students grouped by class */}
      {archivedStudents.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No archived students for {session}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([className, students]) => (
            <div key={className}>
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                {className} <span className="text-muted-foreground font-normal">({students.length})</span>
              </p>
              <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
                {students.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-semibold">{s.avatar}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.admissionNo} · Sec {s.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onViewStudent(s)}>View</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onRestoreStudent(s)}>Restore</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
