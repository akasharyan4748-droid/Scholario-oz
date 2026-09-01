'use client'

import { motion } from 'framer-motion'
import { Medal, Lock } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { badges } from '@/lib/mock/gamification'
import { cn } from '@/lib/utils'
import { rarityStyles } from './data'

interface Props {
  earnedBadges: typeof badges
}

export function BadgeCollection({ earnedBadges }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Medal className="h-4 w-4 text-violet-500" /> Badge Collection
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{earnedBadges.length} of {badges.length} unlocked</p>
        </div>
        <div className="flex gap-1.5">
          {['common', 'rare', 'epic', 'legendary'].map((r) => (
            <span key={r} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
              r === 'common' && 'bg-slate-400/15 text-slate-500',
              r === 'rare' && 'bg-sky-400/15 text-sky-600',
              r === 'epic' && 'bg-violet-400/15 text-violet-600',
              r === 'legendary' && 'bg-amber-400/15 text-amber-600',
            )}>{r}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {badges.map((badge, i) => {
          const rarity = rarityStyles[badge.rarity]
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.03 }}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all',
                badge.earned
                  ? cn('border-border bg-card/60 shadow-premium hover:shadow-premium-lg ring-1', rarity.ring)
                  : 'border-dashed border-border bg-muted/30'
              )}
            >
              {badge.earned && (
                <div className={cn('absolute -inset-0.5 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity blur', badge.color)} />
              )}
              <div className={cn(
                'relative flex h-14 w-14 items-center justify-center rounded-full text-2xl',
                badge.earned
                  ? cn('bg-gradient-to-br shadow-md', badge.color, rarity.glow)
                  : 'bg-muted text-muted-foreground/50 grayscale'
              )}>
                {badge.earned ? badge.icon : <Lock className="h-5 w-5" />}
              </div>
              <div className="relative">
                <p className={cn('text-xs font-semibold leading-tight', !badge.earned && 'text-muted-foreground')}>{badge.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{badge.description}</p>
              </div>
              <span className={cn('relative rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize',
                badge.earned
                  ? cn(rarity.ring.replace('ring-', 'bg-').replace('/50', '/15'), rarity.ring.replace('ring-', 'text-').replace('/50', ''))
                  : 'bg-muted text-muted-foreground/60'
              )}>{rarity.label}</span>
              {badge.earned && badge.earnedDate && (
                <p className="relative text-[9px] text-muted-foreground/70">{new Date(badge.earnedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
