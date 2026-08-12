'use client'

/**
 * InlineLoading — small inline loading indicator with a label.
 * Used throughout the exams module for inline loading states.
 */

import { motion } from 'framer-motion'

export function InlineLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="h-3.5 w-3.5 rounded-full border-2 border-primary/30 border-t-primary"
      />
      <span>{label}</span>
    </div>
  )
}
