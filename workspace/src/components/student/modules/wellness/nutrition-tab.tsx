'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { todayNutrition } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function NutritionTab() {
  return (
    <motion.div key="nu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Today's Nutrition Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Total: {todayNutrition.reduce((a, b) => a + b.calories, 0)} cal</p>
          </div>
          <button onClick={() => toast.success('Meal logged', { description: '+5 XP for tracking' })} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Log Meal
          </button>
        </div>
        <div className="space-y-2.5">
          {todayNutrition.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('flex items-start gap-3 rounded-xl border p-3', n.healthy ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5')}
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', n.healthy ? 'bg-emerald-500/15' : 'bg-amber-500/15')}>
                {n.meal === 'Breakfast' ? '🌅' : n.meal === 'Lunch' ? '☀️' : n.meal === 'Dinner' ? '🌙' : '🍵'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{n.meal}</p>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  <StatusBadge status={n.healthy ? 'Healthy' : 'Treat'} variant={n.healthy ? 'success' : 'warning'} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.items.join(' · ')}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-sm font-bold">{n.calories}</p>
                <p className="text-[9px] text-muted-foreground">cal</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
