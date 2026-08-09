'use client'

import { useState } from 'react'
import { ArrowLeft, Bus, Archive, RotateCcw, Home, Droplet, IdCard, Activity, GraduationCap, TrendingUp, IndianRupee } from 'lucide-react'
import { PageTransition, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric } from './shared'
import {
  OverviewTab, AcademicsTab, AttendanceTab, FeesTab,
  DocumentsTab, MedicalTab, ParentsTab, TransportTab,
  DisciplineTab, TimelineTab,
} from './profile-tabs'
import { StudentIdentityCodes } from './profile/identity-codes'

const TABS = ['overview', 'academics', 'attendance', 'fees', 'documents', 'medical', 'parents', 'transport', 'discipline', 'timeline'] as const
type TabName = typeof TABS[number]

interface Props {
  student: StudentRecord
  onBack: () => void
  onArchive?: (s: StudentRecord) => void
  onRestore?: (s: StudentRecord) => void
  onTransfer?: (s: StudentRecord) => void
  backLabel?: string
}

export function StudentProfilePage({ student, onBack, onArchive, onRestore, onTransfer, backLabel = 'Students & Classes' }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('overview')
  const isArchived = student.status === 'Archived'

  return (
    <PageTransition>
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{backLabel}</span>
      </div>

      {/* Profile header */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <GradientAvatar name={student.name} initials={student.avatar} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl font-bold truncate">{student.name}</h1>
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

      {/* Quick metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Attendance" value={`${student.attendance}%`} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<GraduationCap className="h-3.5 w-3.5" />} label="Grade" value={student.academics.overallGrade} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="Rank" value={`#${student.academics.rankInClass}`} color="text-amber-600 dark:text-amber-400" />
        <Metric icon={<IndianRupee className="h-3.5 w-3.5" />} label="Fee" value={student.feeStatus} color={student.feeStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border mb-4">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-white dark:bg-white/10 shadow-sm text-foreground rounded-full' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40')}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl">
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
    </PageTransition>
  )
}
