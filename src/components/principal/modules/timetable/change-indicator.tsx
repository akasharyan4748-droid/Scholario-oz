'use client'

/**
 * ChangeIndicator — tiny temporary marker showing old → new on affected slots.
 *
 * Brief section 33 + 34: Uses a small icon + concise old → new representation.
 *   e.g. "✦ Rohan → Sunita" or "✦ Room 102 → Lab 1"
 *   NOT a large "UPDATED" pill badge.
 *
 * Brief section 36 + 37: 72-hour TTL (timestamp-based). Only affected entries
 *   show the indicator — data-driven from the `publications` array.
 *
 * Brief section 38: Multiple changes on same slot combine into one concise line.
 */
import { motion } from 'framer-motion'
import { getRecentChange, formatTimeAgo, type PublishedVersion, type ChangeType } from './timetable-store'
import { ArrowRight, Sparkles, Plus, Minus } from 'lucide-react'

export function ChangeIndicator({ slotId, publications }: {
  slotId: string
  publications: PublishedVersion[]
}) {
  const change = getRecentChange(slotId, publications)
  if (!change) return null

  const timeAgo = formatTimeAgo(change.publishedAt)
  const icon = getChangeIcon(change.type)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group/indicator relative"
    >
      {/* Compact old → new line */}
      {change.changeLabel ? (
        <div className="flex items-center gap-0.5 mt-1 px-1 py-0.5 rounded bg-emerald-500/10 text-[8px] font-medium text-emerald-700 dark:text-emerald-300">
          {icon}
          <span className="truncate max-w-[100px]">{change.changeLabel}</span>
        </div>
      ) : (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          className="absolute top-0.5 right-0.5"
        >
          <Sparkles className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400" />
        </motion.div>
      )}

      {/* Hover tooltip */}
      <div className="absolute top-full left-0 mt-1 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-medium whitespace-nowrap opacity-0 group-hover/indicator:opacity-100 transition-opacity pointer-events-none z-20">
        {change.summary} · {timeAgo}
      </div>
    </motion.div>
  )
}

function getChangeIcon(type: ChangeType) {
  switch (type) {
    case 'slot_added': return <Plus className="h-2 w-2 shrink-0" />
    case 'slot_removed': return <Minus className="h-2 w-2 shrink-0" />
    case 'teacher_changed':
    case 'room_changed':
    case 'subject_changed':
    case 'period_changed':
    case 'class_changed':
    default:
      return <ArrowRight className="h-2 w-2 shrink-0" />
  }
}
