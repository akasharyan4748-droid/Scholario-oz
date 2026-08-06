'use client'

import {
  Calendar, Activity, MapPin, Stethoscope, ShieldCheck, Users, Phone, Mail,
  TrendingUp, BookOpen, MessageSquare,
} from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { AreaTrend } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Student } from '@/lib/mock/students'
import { InfoRow } from './shared'
import { progressData } from './data'

// Slide-out Sheet showing the full selected-student profile: quick stats,
// personal info, parent/guardian, performance trend chart, recent activity,
// and the "Message Parent" footer button.
export function StudentProfileSheet({
  student,
  onClose,
}: {
  student: Student | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md overflow-y-auto">
        {student && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <GradientAvatar name={student.name} size="xl" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg">{student.name}</SheetTitle>
                  <SheetDescription className="text-xs">
                    Roll #{student.rollNo} · {student.admissionNo}
                  </SheetDescription>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusBadge status={student.gender} variant="neutral" />
                    <StatusBadge status={student.attendance >= 95 ? 'Excellent' : student.attendance >= 90 ? 'Good' : 'At Risk'} variant={student.attendance >= 95 ? 'success' : student.attendance >= 90 ? 'info' : 'warning'} dot />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="px-4 py-4 space-y-5">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-center">
                  <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{student.attendance}%</p>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-center">
                  <p className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">A+</p>
                  <p className="text-[10px] text-muted-foreground">Avg Grade</p>
                </div>
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-center">
                  <p className="font-display text-xl font-bold text-violet-600 dark:text-violet-400">3</p>
                  <p className="text-[10px] text-muted-foreground">Class Rank</p>
                </div>
              </div>

              {/* Personal info */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Personal Information
                </p>
                <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 text-xs">
                  <InfoRow icon={<Calendar className="h-3 w-3" />} label="Date of Birth" value={`${formatDate(student.dob)} (${new Date().getFullYear() - new Date(student.dob).getFullYear() - 1} yrs)`} />
                  <InfoRow icon={<Activity className="h-3 w-3" />} label="Blood Group" value={student.bloodGroup} />
                  <InfoRow icon={<Stethoscope className="h-3 w-3" />} label="Medical" value={student.medical} />
                  <InfoRow icon={<MapPin className="h-3 w-3" />} label="Address" value={student.address} />
                </div>
              </div>

              {/* Parent / Guardian */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Parent / Guardian
                </p>
                <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2 text-xs">
                  <InfoRow icon={<Users className="h-3 w-3" />} label="Father" value={student.fatherName} />
                  <InfoRow icon={<Users className="h-3 w-3" />} label="Mother" value={student.motherName} />
                  <InfoRow icon={<Phone className="h-3 w-3" />} label="Phone" value={student.guardianPhone} />
                  <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={student.email} />
                </div>
              </div>

              {/* Recent results */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Performance Trend
                </p>
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <AreaTrend data={progressData} xKey="name" yKey="v" color="oklch(0.55 0.14 162)" height={120} gradientId="studentPerf" />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">UT3</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">88%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Improvement</p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">+10%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Rank</p>
                      <p className="text-sm font-bold text-violet-600 dark:text-violet-400">#3/18</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Recent Activity
                </p>
                <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2">
                  {[
                    { date: '28 Nov', action: 'Submitted: Addition Worksheet 4', icon: '📝' },
                    { date: '27 Nov', action: 'Attended: All periods present', icon: '✓' },
                    { date: '26 Nov', action: 'Maths oral test — scored 9/10', icon: '🎯' },
                    { date: '25 Nov', action: 'Library: Issued "Panchatantra Tales"', icon: '📚' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{a.icon}</span>
                      <span className="text-muted-foreground font-mono text-[10px] w-12">{a.date}</span>
                      <span className="text-foreground flex-1">{a.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-border pt-4">
              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                onClick={() => toast.success('Message sent to parent', {
                  description: `SMS dispatched to ${student.fatherName} · ${student.guardianPhone}`,
                })}
              >
                <MessageSquare className="h-4 w-4" /> Message Parent
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
