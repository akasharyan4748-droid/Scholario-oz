'use client'

/**
 * ChangeIndicator — tiny temporary marker shown on timetable slots that
 * were affected by a recent publish.
 *
 * Brief section 20 + 22: "premium, cute, subtle, unique, clean, not childish."
 *   NOT a large red badge. NOT "UPDATED UPDATED UPDATED" everywhere.
 *   A tiny animated sparkle / pulse marker near the slot corner.
 *
 * Brief section 21: Remains visible for exactly 72 hours from the
 *   publish timestamp (data-driven via `isRecentlyUpdated`).
 *
 * Brief section 23: "subtle pulse every few seconds, then settle.
 *   Do not make the timetable look like a Christmas tree."
 *
 * Brief section 24 + 25: Only affected entries show the indicator —
 *   driven by the `publications` array in the store, NOT a CSS class
 *   applied to every slot.
 */
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  isRecentlyUpdated,
  getRecentChange,
  formatTimeAgo,
  type PublishedVersion,
} from './timetable-store'

export function ChangeIndicator({ slotId, publications }: {
  slotId: string
  publications: PublishedVersion[]
}) {
  if (!isRecentlyUpdated(slotId, publications)) return null

  const change = getRecentChange(slotId, publications)
  if (!change) return null

  const timeAgo = formatTimeAgo(change.publishedAt)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-1 right-1 z-10 group/indicator"
      title={`${change.summary} · ${timeAgo}`}
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [1, 0.85, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <Sparkles className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400" />
      </motion.div>
      {/* Hover tooltip */}
      <div className="absolute top-full right-0 mt-1 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-medium whitespace-nowrap opacity-0 group-hover/indicator:opacity-100 transition-opacity pointer-events-none z-20">
        {change.summary} · {timeAgo}
      </div>
    </motion.div>
  )
}
