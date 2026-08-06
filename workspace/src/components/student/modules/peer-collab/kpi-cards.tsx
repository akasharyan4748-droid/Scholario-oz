'use client'

import { Award, CheckCircle2, MessageCircle, Users } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { collaborationStats } from '@/lib/mock/peer-collab'

export function PeerKpis() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Study Groups" value={collaborationStats.myGroups} icon={<Users className="h-5 w-5" />} accent="violet" trendLabel={`${collaborationStats.totalMembers} classmates`} delay={0} />
      <KpiCard label="Questions Asked" value={collaborationStats.questionsAsked} icon={<MessageCircle className="h-5 w-5" />} accent="emerald" trend={4} trendLabel="this month" delay={0.05} />
      <KpiCard label="Answers Given" value={collaborationStats.questionsAnswered} icon={<CheckCircle2 className="h-5 w-5" />} accent="amber" trend={8} trendLabel="helping others" delay={0.1} />
      <KpiCard label="Helpfulness" value={collaborationStats.helpfulnessScore} suffix="/100" icon={<Award className="h-5 w-5" />} accent="rose" trend={6} trendLabel="peer rating" delay={0.15} />
    </div>
  )
}
