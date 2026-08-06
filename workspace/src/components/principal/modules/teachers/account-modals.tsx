'use client'

import { Lock, Key, Coins, ShieldCheck, ShieldAlert, Copy } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatINR } from '@/lib/format'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import type { TeacherCredentials } from './use-teachers-state'

interface CommonProps {
  open: boolean
  onClose: () => void
}

/* ---------- LOCK / UNLOCK ACCOUNT MODAL ---------- */
interface LockModalProps extends CommonProps {
  teacher: TeacherRecord | null
  lockConfirmText: string
  setLockConfirmText: (v: string) => void
  onConfirm: () => void
}

export function LockAccountModal({ teacher, lockConfirmText, setLockConfirmText, open, onClose, onConfirm }: LockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Lock className="h-5 w-5" /> {teacher?.isLocked ? 'Unlock Teacher Account' : 'Lock Teacher Account'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {teacher?.isLocked
              ? `Restore portal login access for ${teacher?.name}.`
              : `Temporarily lock portal login access for ${teacher?.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <p className="text-muted-foreground">
            Type <strong className="text-foreground font-mono">{teacher?.isLocked ? 'UNLOCK' : 'LOCK'}</strong> to confirm:
          </p>
          <Input
            value={lockConfirmText}
            onChange={(e) => setLockConfirmText(e.target.value)}
            placeholder={teacher?.isLocked ? 'Type UNLOCK' : 'Type LOCK'}
            className="font-mono text-xs uppercase"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={teacher?.isLocked ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={lockConfirmText.trim().toUpperCase() !== (teacher?.isLocked ? 'UNLOCK' : 'LOCK')}
          >
            {teacher?.isLocked ? 'Unlock Account' : 'Lock Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- CREDENTIALS SLIP MODAL ---------- */
interface CredentialsModalProps extends CommonProps {
  credentials: TeacherCredentials | null
}

export function CredentialsSlipModal({ credentials, open, onClose }: CredentialsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Key className="h-5 w-5" /> Teacher Portal Account Slip
          </DialogTitle>
          <DialogDescription className="text-xs">
            Portal identification and credentials for {credentials?.name}.
          </DialogDescription>
        </DialogHeader>

        {credentials && (
          <div className="py-2">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Teacher Name:</span>
                <strong className="text-foreground font-sans font-bold">{credentials.name}</strong>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Employee ID:</span>
                <strong className="text-foreground">{credentials.empId}</strong>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Username:</span>
                <strong className="text-foreground font-bold">{credentials.username}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temp Passcode:</span>
                <strong className="text-primary font-bold">{credentials.tempPassword}</strong>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="text-xs">Close</Button>
          <Button
            variant="default"
            onClick={() => {
              navigator.clipboard.writeText(`Employee ID: ${credentials?.empId}\nUsername: ${credentials?.username}\nTemp Passcode: ${credentials?.tempPassword}`)
              toast.success('Login details copied to clipboard!')
            }}
            className="text-xs"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- PAYROLL REVISION PROPOSAL MODAL ---------- */
interface PayrollModalProps extends CommonProps {
  teacher: TeacherRecord | null
  proposedSalaryInput: number
  setProposedSalaryInput: (v: number) => void
  onConfirm: () => void
}

export function PayrollRevisionModal({ teacher, proposedSalaryInput, setProposedSalaryInput, open, onClose, onConfirm }: PayrollModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <Coins className="h-5 w-5" /> Request Payroll Revision
          </DialogTitle>
          <DialogDescription className="text-xs">
            Propose salary revision for {teacher?.name}. A 6-digit confirmation code will be issued to the teacher's portal for explicit acceptance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-muted/40 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Gross Salary:</span>
              <span className="font-bold text-foreground">{teacher ? formatINR(teacher.salary) : '₹0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teacher Name & ID:</span>
              <span className="font-semibold">{teacher?.name} ({teacher?.employeeId})</span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1 block">New Monthly Gross Salary (₹ INR)</Label>
            <Input
              type="number"
              value={proposedSalaryInput}
              onChange={(e) => setProposedSalaryInput(Number(e.target.value))}
              className="font-mono text-base font-bold"
              placeholder="e.g. 68000"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Basic Pay, HRA, DA, and PF deductions will automatically recalculate.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-700" /> Two-Way Confirmation Security
            </p>
            <p className="text-[10px] leading-relaxed text-emerald-800">
              Salary changes require mutual consent. Upon submitting, a unique code (PAY-XXXXXX) is dispatched to the teacher's panel. The salary updates live once the teacher enters the code.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            Dispatch Proposal & Generate Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- STAFF RELIEVE / TERMINATION MODAL ---------- */
interface TerminationModalProps extends CommonProps {
  teacher: TeacherRecord | null
  terminationReason: string
  setTerminationReason: (v: string) => void
  confirmTerminateText: string
  setConfirmTerminateText: (v: string) => void
  lockLoginOnTerminate: boolean
  setLockLoginOnTerminate: (v: boolean) => void
  onConfirm: () => void
}

export function TerminationModal({
  teacher, terminationReason, setTerminationReason,
  confirmTerminateText, setConfirmTerminateText,
  lockLoginOnTerminate, setLockLoginOnTerminate,
  open, onClose, onConfirm,
}: TerminationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" /> Relieve / Terminate Faculty Staff
          </DialogTitle>
          <DialogDescription className="text-xs">
            Initiate official faculty relieving process for {teacher?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-semibold mb-1 block">Relieving Reason</Label>
            <Select value={terminationReason} onValueChange={setTerminationReason}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Resignation / End of Tenure">Resignation / End of Tenure</SelectItem>
                <SelectItem value="Contract Expiry">Contract Expiry</SelectItem>
                <SelectItem value="Disciplinary Relieving">Disciplinary Relieving</SelectItem>
                <SelectItem value="Performance & Policy Non-compliance">Performance & Policy Non-compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/30">
            <input
              type="checkbox"
              id="lockLoginCheck"
              checked={lockLoginOnTerminate}
              onChange={(e) => setLockLoginOnTerminate(e.target.checked)}
              className="h-4 w-4 text-rose-600 rounded border-border"
            />
            <label htmlFor="lockLoginCheck" className="text-xs cursor-pointer font-medium text-foreground">
              Immediately lock teacher portal login access
            </label>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1 block">Confirmation Security Check</Label>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              Type <strong className="text-rose-600 font-mono">TERMINATE</strong> below to confirm staff relieving:
            </p>
            <Input
              value={confirmTerminateText}
              onChange={(e) => setConfirmTerminateText(e.target.value)}
              placeholder="Type TERMINATE"
              className="font-mono text-xs uppercase"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={confirmTerminateText.trim().toUpperCase() !== 'TERMINATE'}
          >
            Relieve & Terminate Staff Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
