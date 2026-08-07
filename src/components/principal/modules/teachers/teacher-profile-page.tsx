'use client'

import { Lock, Unlock, ShieldAlert, FileCheck, Key, Coins, Sparkles, ArrowLeft } from 'lucide-react'
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
import { getPermissionLabels } from './permission-labels'

interface Props {
  teacher: TeacherRecord
  positionsList: PositionDefinition[]
  onBack: () => void
  onResetPassword: () => void
  onViewAppointment: () => void
  onToggleLock: () => void
  onOpenTermination: () => void
  onOpenPayrollModal: () => void
}

/**
 * Teacher Profile Page — full-page workspace (not a drawer).
 *
 * Admissions-style architecture: header with Back button + teacher name
 * + actions, then tabbed content area with much more breathing room
 * than the previous right-side Sheet.
 */
export function TeacherProfilePage({
  teacher, positionsList, onBack,
  onResetPassword, onViewAppointment, onToggleLock, onOpenTermination,
  onOpenPayrollModal,
}: Props) {
  const activePermissions = getTeacherActivePermissions(teacher, positionsList)

  return (
    <div className="space-y-5">
      {/* Page header — Back + identity + actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white font-semibold', gradientFor(teacher.id))}>
            {teacher.avatar}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{teacher.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{teacher.designation} · {teacher.employeeId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onViewAppointment} className="text-xs h-8 gap-1.5">
            <FileCheck className="h-3.5 w-3.5" /> Joining Letter
          </Button>
          <Button variant="outline" size="sm" onClick={onResetPassword} className="text-xs h-8 gap-1.5">
            <Key className="h-3.5 w-3.5 text-amber-600" /> Account Slip
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleLock}
            className={cn('text-xs h-8 gap-1.5', teacher.isLocked && 'border-amber-500 text-amber-700 hover:bg-amber-50')}>
            {teacher.isLocked ? <Unlock className="h-3.5 w-3.5 text-amber-600" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
            {teacher.isLocked ? 'Unlock' : 'Lock'}
          </Button>
          <Button variant="destructive" size="sm" onClick={onOpenTermination} className="text-xs h-8 gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Relieve
          </Button>
        </div>
      </div>

      {/* Status strip — badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{teacher.department}</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{teacher.totalExperience} yrs exp</Badge>
        <StatusBadge status={teacher.status} variant={teacher.status === 'Active' ? 'success' : 'warning'} />
        {teacher.isLocked && (
          <Badge variant="destructive" className="text-[10px]">
            <Lock className="h-2.5 w-2.5 mr-1" /> Portal Locked
          </Badge>
        )}
      </div>

      {/* Tabbed content — much more space than the drawer */}
      <Tabs defaultValue="positions">
        <TabsList className="bg-muted/60 h-9 p-1 gap-1 rounded-full inline-flex">
          <TabsTrigger value="positions" className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">Positions & Allocation</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">Profile</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">Payroll</TabsTrigger>
        </TabsList>

        {/* POSITIONS & ALLOCATION — read-only display (managed centrally) */}
        <TabsContent value="positions" className="space-y-4 mt-4">
          {/* Current Positions */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary mb-3">Current Positions</h3>
            {teacher.positions.length > 0 ? (
              <div className="space-y-2">
                {teacher.positions.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/60 bg-card p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{p.positionTitle}</span>
                        <Badge variant="outline" className={cn('text-[9px]',
                          p.status === 'Active' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                            : 'border-amber-500/50 bg-amber-500/10 text-amber-700')}>
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Assigned by {p.assignedBy} on {p.assignedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No positions assigned. Manage from Settings → Staff Settings.</p>
            )}
          </div>

          {/* Subjects + Classes — display only */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1">
                {teacher.subjects.length > 0 ? (
                  teacher.subjects.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs bg-primary/10 text-primary">{s}</Badge>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground">Managed via Timetable</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Classes</p>
              <div className="flex flex-wrap gap-1">
                {teacher.classes.length > 0 ? (
                  teacher.classes.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700">{c}</Badge>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground">Managed via Class Settings</p>
                )}
              </div>
            </div>
          </div>

          {/* Granted Permissions — human-readable labels */}
          {activePermissions.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h4 className="font-bold text-xs text-foreground mb-2">Granted Permissions</h4>
              <div className="flex flex-wrap gap-1.5">
                {getPermissionLabels(activePermissions).map((label) => (
                  <span key={label} className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-medium">
                    ✓ {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info note about centralized management */}
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground italic">
              Positions, subjects, and class assignments are managed centrally from Settings → Staff Settings, Class Settings, and Timetable module respectively.
            </p>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <ProfileField label="Email" value={teacher.email} mono />
            <ProfileField label="Phone" value={teacher.phone} mono />
            <ProfileField label="Date of Birth" value={formatDate(teacher.dob)} />
            <ProfileField label="Blood Group" value={teacher.bloodGroup} />
            <ProfileField label="Qualifications" value={teacher.educationalQualifications.map((q) => `${q.degree} (${q.institution})`).join(', ')} />
            <ProfileField label="Address" value={teacher.currentAddress} />
          </div>
        </TabsContent>

        {/* PAYROLL */}
        <TabsContent value="payroll" className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Current Monthly Gross Salary</p>
              <p className="text-2xl font-bold text-emerald-600">{formatINR(teacher.salary)}</p>
            </div>
            <Button size="sm" onClick={onOpenPayrollModal} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5">
              <Coins className="h-3.5 w-3.5" /> Edit Salary
            </Button>
          </div>

          {teacher.pendingPayrollUpdate && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1 text-amber-800">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Pending Teacher Confirmation
                </span>
                <Badge variant="outline" className="font-mono text-[10px] border-amber-400 bg-amber-100 text-amber-900 font-bold">
                  Code: {teacher.pendingPayrollUpdate.code}
                </Badge>
              </div>
              <p className="text-[11px] text-amber-800">
                Proposed: <strong className="font-mono text-xs">{formatINR(teacher.pendingPayrollUpdate.proposedSalary)}</strong>
              </p>
              <p className="text-[10px] text-amber-700 italic">
                Confirmation code sent to {teacher.name}'s portal. Salary updates automatically once the teacher accepts.
              </p>
            </div>
          )}

          <div className="space-y-1.5 font-mono pt-2 text-xs">
            <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Basic Pay</span><span>{formatINR(teacher.salaryBreakdown.basic)}</span></div>
            <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">HRA</span><span>{formatINR(teacher.salaryBreakdown.hra)}</span></div>
            <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">DA</span><span>{formatINR(teacher.salaryBreakdown.da)}</span></div>
            <div className="flex justify-between border-b border-border/40 pb-1 text-rose-600"><span>PF Deduction</span><span>-{formatINR(teacher.salaryBreakdown.pfDeduction)}</span></div>
            <div className="flex justify-between font-bold text-sm pt-1"><span>Net Monthly Pay</span><span className="text-emerald-600">{formatINR(teacher.salaryBreakdown.netPay)}</span></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* Single-line profile field — label + value, no card background */
function ProfileField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{label}</p>
      <p className={cn('text-sm font-medium text-foreground mt-1', mono && 'font-mono')}>{value}</p>
    </div>
  )
}
