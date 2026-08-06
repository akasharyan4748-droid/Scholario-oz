'use client'

import { motion } from 'framer-motion'
import { Star, Download, Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { messMenu, messFeedback, hostelStats } from '@/lib/mock/hostel'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function MessTab() {
  return (
    <motion.div key="ms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Weekly menu */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Weekly Mess Menu</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Freshly prepared · nutritionist-approved</p>
          </div>
          <button onClick={() => toast.success('Menu exported', { description: 'Weekly menu downloaded' })} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {messMenu.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <p className="text-xs font-semibold mb-2 text-primary">{m.day}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { label: '🌅 Breakfast', val: m.breakfast },
                  { label: '☀️ Lunch', val: m.lunch },
                  { label: '🍵 Snacks', val: m.snacks },
                  { label: '🌙 Dinner', val: m.dinner },
                ].map((meal, idx) => (
                  <div key={idx} className="rounded-lg bg-muted/40 p-2">
                    <p className="text-[10px] font-medium text-muted-foreground">{meal.label}</p>
                    <p className="text-xs mt-0.5">{meal.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Feedback + stats */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Mess Feedback
          </h3>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {messFeedback.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border border-border bg-card/40 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold">{f.student}</p>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={cn('h-3 w-3', idx < f.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">"{f.comment}"</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">{formatDate(f.date)}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Mess Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Today's servings</span>
              <span className="font-display font-bold">{hostelStats.messServingsToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg rating</span>
              <span className="font-display font-bold text-amber-600">{hostelStats.messRating}/5 ⭐</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Meals/day</span>
              <span className="font-display font-bold">4 meals</span>
            </div>
            <div className="pt-3 border-t border-border">
              <button
                onClick={() => toast.success('Menu updated', { description: 'Next week\'s menu published' })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2 text-xs font-semibold text-white shadow-md"
              >
                <Plus className="h-3.5 w-3.5" /> Update Menu
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
