'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Users, BookOpen } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { ChartCard, Donut } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { examAnalytics } from '@/lib/mock/academics'

export function InsightsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <SectionHeading
          title="AI-Powered Insights"
          subtitle="Auto-generated observations for Class 2-A"
          icon={<Sparkles className="h-5 w-5 text-amber-500" />}
          className="mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { type: 'success', title: 'Strong Math Improvement', desc: 'Class average jumped from 78% to 88% in Mathematics over 5 months. Multiplication tables strategy is working.', color: 'emerald' },
            { type: 'warning', title: 'Reyansh K. needs attention', desc: 'Attendance dropped to 88% and Math score fell from 78% to 72%. Consider parent meeting.', color: 'amber' },
            { type: 'info', title: 'Best Submission Day: Monday', desc: '78% of homework submitted on Mondays vs 52% on Fridays. Schedule critical homework early in week.', color: 'cyan' },
            { type: 'success', title: 'Myra I. — Gifted Trajectory', desc: 'Achieving 96%+ consistently. Recommend enrichment materials & Math Olympiad preparation.', color: 'emerald' },
          ].map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                'rounded-xl border p-3',
                insight.color === 'emerald' && 'border-emerald-500/20 bg-emerald-500/5',
                insight.color === 'amber' && 'border-amber-500/20 bg-amber-500/5',
                insight.color === 'cyan' && 'border-cyan-500/20 bg-cyan-500/5',
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  insight.color === 'emerald' && 'bg-emerald-500/15 text-emerald-600',
                  insight.color === 'amber' && 'bg-amber-500/15 text-amber-600',
                  insight.color === 'cyan' && 'bg-cyan-500/15 text-cyan-600',
                )}>
                  {insight.type === 'success' ? <TrendingUp className="h-3.5 w-3.5" /> : insight.type === 'warning' ? <Users className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <ChartCard title="Grade Distribution" subtitle="Class 2-A · UT3">
        <Donut data={examAnalytics.gradeDistribution.map((g) => ({ name: g.grade, value: g.count, color: g.color }))} height={220} centerValue="18" centerLabel="students" />
        <div className="grid grid-cols-2 gap-2 mt-3">
          {examAnalytics.gradeDistribution.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
              <span className="font-medium">{g.grade}</span>
              <span className="text-muted-foreground">{g.count}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
