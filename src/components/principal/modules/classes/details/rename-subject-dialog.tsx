'use client'

/**
 * RenameSubjectDialog — minimal rename affordance (Spec §9 / TEST F).
 *
 * Renaming updates the canonical subject registry. Because Examination
 * resolves subject names by id lookup (Spec §28), the new name propagates
 * instantly to every consumer (Students & Classes cards, Examination
 * Create Exam subjects, archived subject snapshot names, etc.).
 *
 * The dialog does NOT touch the legacy `subjects: string[]` array on
 * each class — the store's `renameSubject` action re-derives that array
 * from `subjectIds` + the registry, so every class that has the subject
 * sees the new name automatically.
 */

import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useStudentsStore } from '@/lib/store/students-store'
import { toast } from 'sonner'

export function RenameSubjectDialog({
  subjectId,
  subjectName,
  trigger,
}: {
  subjectId: string
  subjectName: string
  trigger?: (open: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(subjectName)
  const renameSubject = useStudentsStore((s) => s.renameSubject)

  // Reset the input to the current name whenever the dialog opens.
  useEffect(() => {
    if (open) setValue(subjectName)
  }, [open, subjectName])

  const trimmed = value.trim()
  const canSave = trimmed.length > 0 && trimmed !== subjectName

  const handleSave = () => {
    if (!canSave) return
    renameSubject(subjectId, trimmed)
    toast.success(`Renamed "${subjectName}" → "${trimmed}"`, {
      description: 'Updated everywhere the shared academic data is consumed.',
    })
    setOpen(false)
  }

  return (
    <>
      {trigger ? trigger(() => setOpen(true)) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Rename Subject
            </DialogTitle>
            <DialogDescription className="text-xs">
              The new name will appear everywhere this subject is used
              (Students &amp; Classes, Examination, archived records).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-subject-input" className="text-xs">Subject name</Label>
            <Input
              id="rename-subject-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!canSave} onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
