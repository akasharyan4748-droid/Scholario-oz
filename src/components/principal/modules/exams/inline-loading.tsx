'use client'

/**
 * InlineLoading — small inline loading indicator with a label.
 * Used throughout the exams module for inline loading states.
 * Respects prefers-reduced-motion via the useReducedMotion hook.
 */

import { motion, useReducedMotion } from 'framer-motion'

export function InlineLoading({ label = 'Loading…' }: { label?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
      <motion.div
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
        className="h-3.5 w-3.5 rounded-full border-2 border-primary/30 border-t-primary"
      />
      <span>{label}</span>
    </div>
  )
}
