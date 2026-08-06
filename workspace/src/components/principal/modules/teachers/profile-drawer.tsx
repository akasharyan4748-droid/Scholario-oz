'use client'

import { Lock, Unlock, ShieldAlert, FileCheck, Key, Coins, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { formatINR, formatDate } from '@/lib/format'
import {
  getTeacherActivePermissions,
  type TeacherRecord,
  type PositionDefinition,
} from '@/lib/store/teachers-store'
import { gradientFor } from './shared'

interface Props {
  teacher: TeacherRecord
  positionsList: PositionDefinition[]
  onResetPassword: () => void
  onViewAppointment: () => void
  onToggleLock: () => void
  onOpenTermination: () => void
  onOpenPayrollModal: () => void
  onOpenEmergencyOverride: (posId: string) => void
  onRemovePosition: (assignmentId: string) => void
  onOpenWorkload: () => void
}

/**
 * Right-side Sheet content for a teacher — banner header, action bar,
 * and three tabs (Positions & Allocation / Profile / Payroll).
 */
export function TeacherProfileDrawer({
  teacher, positionsList,
  onResetPassword, onViewAppointment, onToggleLock, onOpenTermination,
  onOpenPayrollModal, onOpenEmergencyOverride, onRemovePosition, onOpenWorkload,
}: Props) {
  const activePermissions = getTeacherActivePermissions(teacher, positionsList)

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className={`relative bg-gradient-to-br ${gradientFor(teacher.id)} p-6 rounded-2xl text-white shadow-lg`}>
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-2xl font-bold border border-white/30">
            {teacher.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-white">{teacher.name}</h2>
            <p className="text-white/80 text-xs mt-0.5">{teacher.designation} · {teacher.employeeId}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-[10px]">
                {teacher.department}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-[10px]">
                {teacher.totalExperience} yrs exp
              </Badge>
              <StatusBadge status={teacher.status} variant={teacher.status === 'Active' ? 'success' : 'warning'} className="bg-white/20 text-white border-white/30" />
              {teacher.isLocked && (
                <Badge variant="destructive" className="text-[10px] bg-rose-900/80 text-rose-100 border-rose-400/50">
                  <Lock className="h-2.5 w-2.5 mr-1" /> Portal Access Locked
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button size="sm" variant="outline" onClick={onViewAppointment} className="text-xs">
          <FileCheck className="h-3.5 w-3.5 text-primary" /> Joining Letter
        </Button>
        <Button size="sm" variant="outline" onClick={onResetPassword} className="text-xs">
          <Key className="h-3.5 w-3.5 text-amber-600" /> Account Slip
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleLock}
          className={cn('text-xs', teacher.isLocked ? 'border-amber-500 text-amber-700 hover:bg-amber-50' : 'text-slate-700')}
        >
          {teacher.isLocked ? <Unlock className="h-3.5 w-3.5 text-amber-600" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
          {teacher.isLocked ? 'Unlock Portal' : 'Lock Account'}
        </Button>
        <Button size="sm" variant="destructive" onClick={onOpenTermination} className="text-xs">
          <ShieldAlert className="h-3.5 w-3.5" /> Relieve Staff
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid grid-cols-3 w-full text-xs">
          <TabsTrigger value="positions">Positions & Allocation</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* TAB 1: POSITIONS & ALLOCATION */}
        <TabsContent value="positions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary">Assigned Positions</h3>
            <Button size="sm" variant="outline" onClick={onOpenWorkload} className="text-[11px] h-7">
              Manage Allocations (Max 2 Classes)
            </Button>
          </div>

          <div className="space-y-2">
            {teacher.positions.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card/40 p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{p.positionTitle}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px]',
                        p.status === 'Active'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                          : 'border-amber-500/50 bg-amber-500/10 text-amber-700'
                      )}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Assigned by {p.assignedBy} on {p.assignedDate}</p>
                </div>

                <div className="flex items-center gap-1">
                  {p.status === 'Pending Acceptance' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-[10px] h-7 px-2"
                      onClick={() => onOpenEmergencyOverride(p.positionId)}
                    >
                      Emergency Override
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[10px] text-rose-600 h-7 px-2"
                    onClick={() => onRemovePosition(p.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Assigned Subjects (2-3 max)</p>
              <div className="flex flex-wrap gap-1">
                {teacher.subjects.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs bg-primary/10 text-primary">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Assigned Classes (Max 2)</p>
              <div className="flex flex-wrap gap-1">
                {teacher.classes.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700">{c}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <h4 className="font-bold text-xs text-foreground mb-2">Granted Active System Permissions ({activePermissions.length})</h4>
            <div className="flex flex-wrap gap-1">
              {activePermissions.map((perm) => (
                <span key={perm} className="inline-flex items-center rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-mono">
                  ✓ {perm}
                </span>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PROFILE */}
        <TabsContent value="profile" className="space-y-3 mt-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Email</p><p className="font-semibold font-mono">{teacher.email}</p></div>
            <div className="p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Phone</p><p className="font-semibold font-mono">{teacher.phone}</p></div>
            <div className="p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Date of Birth</p><p className="font-semibold">{formatDate(teacher.dob)}</p></div>
            <div className="p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Blood Group</p><p className="font-semibold">{teacher.bloodGroup}</p></div>
            <div className="col-span-2 p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Qualifications</p><p className="font-semibold">{teacher.educationalQualifications.map((q) => `${q.degree} (${q.institution})`).join(', ')}</p></div>
            <div className="col-span-2 p-2.5 rounded-lg border bg-card/40"><p className="text-muted-foreground">Address</p><p className="font-semibold">{teacher.currentAddress}</p></div>
          </div>
        </TabsContent>

        {/* TAB 3: PAYROLL */}
        <TabsContent value="payroll" className="space-y-3 mt-4 text-xs">
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <p className="text-muted-foreground font-medium">Current Monthly Gross Salary</p>
              <p className="text-2xl font-bold text-emerald-600">{formatINR(teacher.salary)}</p>
            </div>
            <Button size="sm" onClick={onOpenPayrollModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Coins className="h-3.5 w-3.5" /> Edit / Request Salary Revision
            </Button>
          </div>

          {teacher.pendingPayrollUpdate && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1 text-amber-800">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Pending Teacher Confirmation
                </span>
                <Badge variant="outline" className="font-mono text-[10px] border-amber-400 bg-amber-100 text-amber-900 font-bold">
                  Code: {teacher.pendingPayrollUpdate.code}
                </Badge>
              </div>
              <p className="text-[11px] text-amber-800">
                Proposed Gross Salary: <strong className="font-mono text-xs">{formatINR(teacher.pendingPayrollUpdate.proposedSalary)}</strong>
              </p>
              <p className="text-[10px] text-amber-700 italic">
                Confirmation code sent to {teacher.name}'s portal. The salary update will automatically take effect once the teacher accepts with this confirmation code.
              </p>
            </div>
          )}

          <div className="space-y-1.5 font-mono pt-2">
            <div className="flex justify-between border-b pb-1"><span>Basic Pay</span><span>{formatINR(teacher.salaryBreakdown.basic)}</span></div>
            <div className="flex justify-between border-b pb-1"><span>HRA</span><span>{formatINR(teacher.salaryBreakdown.hra)}</span></div>
            <div className="flex justify-between border-b pb-1"><span>DA</span><span>{formatINR(teacher.salaryBreakdown.da)}</span></div>
            <div className="flex justify-between border-b pb-1 text-rose-600"><span>PF Deduction</span><span>-{formatINR(teacher.salaryBreakdown.pfDeduction)}</span></div>
            <div className="flex justify-between font-bold text-sm pt-1"><span>Net Monthly Pay</span><span className="text-emerald-600">{formatINR(teacher.salaryBreakdown.netPay)}</span></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
