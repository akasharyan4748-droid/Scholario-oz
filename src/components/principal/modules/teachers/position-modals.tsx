'use client'

import { useState } from 'react'
import { Shield, ShieldAlert } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  TeacherRecord,
  PositionDefinition,
} from '@/lib/store/teachers-store'
import { allPermissions } from './add-teacher-data'

interface CommonProps {
  open: boolean
  onClose: () => void
}

/* ---------- ASSIGN POSITION MODAL ---------- */
interface AssignPositionModalProps extends CommonProps {
  teachers: TeacherRecord[]
  positionsList: PositionDefinition[]
  targetTeacherIdForPos: string
  setTargetTeacherIdForPos: (v: string) => void
  selectedPosIdToAssign: string
  setSelectedPosIdToAssign: (v: string) => void
  onConfirm: () => void
}

export function AssignPositionModal({
  teachers, positionsList,
  targetTeacherIdForPos, setTargetTeacherIdForPos,
  selectedPosIdToAssign, setSelectedPosIdToAssign,
  open, onClose, onConfirm,
}: AssignPositionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Assign Position & Responsibility
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign an official responsibility to a teacher. Requires teacher acceptance before permissions activate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold">Select Teacher</Label>
            <Select value={targetTeacherIdForPos} onValueChange={setTargetTeacherIdForPos}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose faculty member" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.designation} · {t.department})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Select Position</Label>
            <Select value={selectedPosIdToAssign} onValueChange={setSelectedPosIdToAssign}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose position" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {positionsList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title} ({p.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-primary text-primary-foreground">
            Send Position Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- EMERGENCY OVERRIDE MODAL ---------- */
interface EmergencyOverrideModalProps extends CommonProps {
  overrideAuthCode: string
  setOverrideAuthCode: (v: string) => void
  overrideReason: string
  setOverrideReason: (v: string) => void
  onConfirm: () => void
}

export function EmergencyOverrideModal({
  overrideAuthCode, setOverrideAuthCode,
  overrideReason, setOverrideReason,
  open, onClose, onConfirm,
}: EmergencyOverrideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" /> Principal Emergency Override
          </DialogTitle>
          <DialogDescription className="text-xs">
            Bypass normal teacher acceptance workflow and activate permissions instantly. Requires Principal authentication code and mandatory reason for permanent audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs font-semibold">Authorization Code</Label>
            <Input
              type="password"
              placeholder="Enter Principal Auth Code (e.g. OVERRIDE-2025)"
              value={overrideAuthCode}
              onChange={(e) => setOverrideAuthCode(e.target.value)}
              className="mt-1 font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Default security override key: <code className="bg-muted px-1 rounded">OVERRIDE-2025</code></p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Reason for Emergency Override</Label>
            <Textarea
              placeholder="e.g. Urgent examination duty assignment due to sudden leave of previous coordinator..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm Emergency Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- CREATE CUSTOM POSITION MODAL ---------- */
interface CreateCustomPositionModalProps extends CommonProps {
  onCreate: (pos: Omit<PositionDefinition, 'id'>) => void
}

export function CreateCustomPositionModal({ open, onClose, onCreate }: CreateCustomPositionModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'Academic' | 'Administrative' | 'Co-Curricular' | 'Management' | 'Custom'>('Custom')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'view_assigned_classes', 'enter_subject_marks', 'take_class_attendance',
  ])

  const handleToggle = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter position title')
      return
    }
    onCreate({
      title,
      category,
      description,
      permissions: selectedPermissions,
      isCustom: true,
    })
    setTitle('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Create Custom School Position
          </DialogTitle>
          <DialogDescription className="text-xs">
            Define a custom responsibility and select permissions to carry into teacher accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div><Label className="text-xs font-semibold">Position Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Science Fair Convener" className="mt-1" /></div>
          <div>
            <Label className="text-xs font-semibold">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Administrative">Administrative</SelectItem>
                <SelectItem value="Co-Curricular">Co-Curricular</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-semibold">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Duties and scope of work..." className="mt-1 min-h-[60px]" /></div>

          <div>
            <Label className="text-xs font-semibold mb-2 block">Grant Permissions Matrix</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {allPermissions.map((p) => {
                const checked = selectedPermissions.includes(p.key)
                return (
                  <label key={p.key} className={cn('flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer', checked ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-card/40')}>
                    <Checkbox checked={checked} onCheckedChange={() => handleToggle(p.key)} />
                    <span className="truncate">{p.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Create Position</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
