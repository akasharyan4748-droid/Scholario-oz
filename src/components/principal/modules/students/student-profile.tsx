'use client'

import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric } from './shared'
import {
  Activity, GraduationCap, TrendingUp, IndianRupee,
  Bus, Archive, RotateCcw, Home, Droplet, IdCard,
} from 'lucide-react'
import {
  OverviewTab, AcademicsTab, AttendanceTab, FeesTab,
  DocumentsTab, MedicalTab, ParentsTab, TransportTab,
  DisciplineTab, TimelineTab,
} from './profile-tabs'
import { StudentIdentityCodes } from './profile/identity-codes'

interface Props {
  student: StudentRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchive?: (s: StudentRecord) => void
  onRestore?: (s: StudentRecord) => void
  onTransfer?: (s: StudentRecord) => void
}

const TABS = ['overview', 'academics', 'attendance', 'fees', 'documents', 'medical', 'parents', 'transport', 'discipline', 'timeline'] as const
type TabName = typeof TABS[number]

export function StudentProfileSheet({ student, open, onOpenChange, onArchive, onRestore, onTransfer }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('overview')

  if (!student) return null
  const isArchived = student.status === 'Archived'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-start gap-4">
              <GradientAvatar name={student.name} initials={student.avatar} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg font-bold truncate">{student.name}</h2>
                  {isArchived ? <StatusBadge status="Archived" variant="neutral" dot /> : <StatusBadge status="Active" variant="success" dot />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                  <span className="font-mono">{student.admissionNo}</span><span>·</span>
                  <span>Roll {student.rollNo}</span><span>·</span>
                  <span>{student.className} · Sec {student.section}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {student.houseName && <Badge variant="secondary" className="text-[10px] gap-1"><Home className="h-2.5 w-2.5" /> {student.houseName}</Badge>}
                  <Badge variant="secondary" className="text-[10px] gap-1"><Droplet className="h-2.5 w-2.5" /> {student.bloodGroup}</Badge>
                  <Badge variant="secondary" className="text-[10px] gap-1"><IdCard className="h-2.5 w-2.5" /> {student.category}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {!isArchived ? (
                <>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onTransfer?.(student)}><Bus className="h-3.5 w-3.5" /> Transfer</Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs ml-auto" onClick={() => onArchive?.(student)}><Archive className="h-3.5 w-3.5" /> Archive</Button>
                </>
              ) : (
                <Button size="sm" variant="default" className="h-8 text-xs ml-auto" onClick={() => onRestore?.(student)}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Metrics */}
        <div className="grid grid-cols-4 gap-2 p-4 shrink-0">
          <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Attendance" value={`${student.attendance}%`} color="text-emerald-600 dark:text-emerald-400" />
          <Metric icon={<GraduationCap className="h-3.5 w-3.5" />} label="Grade" value={student.academics.overallGrade} color="text-violet-600 dark:text-violet-400" />
          <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="Rank" value={`#${student.academics.rankInClass}`} color="text-amber-600 dark:text-amber-400" />
          <Metric icon={<IndianRupee className="h-3.5 w-3.5" />} label="Fee" value={student.feeStatus} color={student.feeStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
        </div>

        <Separator />

        {/* Tab Navigation */}
        <div className="shrink-0 border-b px-4 pt-3 pb-2">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab ? 'bg-white dark:bg-white/10 shadow-sm text-foreground rounded-full' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content — proper React conditional rendering */}
        <div className="flex-1 overflow-y-auto p-4 pb-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <OverviewTab student={student} />
              <StudentIdentityCodes student={student} />
            </div>
          )}
          {activeTab === 'academics' && <AcademicsTab student={student} />}
          {activeTab === 'attendance' && <AttendanceTab student={student} />}
          {activeTab === 'fees' && <FeesTab student={student} />}
          {activeTab === 'documents' && <DocumentsTab student={student} />}
          {activeTab === 'medical' && <MedicalTab student={student} />}
          {activeTab === 'parents' && <ParentsTab student={student} />}
          {activeTab === 'transport' && <TransportTab student={student} />}
          {activeTab === 'discipline' && <DisciplineTab student={student} />}
          {activeTab === 'timeline' && <TimelineTab student={student} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
