'use client'

import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AccountLockedBannerProps {
  show: boolean
}

export function AccountLockedBanner({ show }: AccountLockedBannerProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-4 shadow-lg backdrop-blur-md flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">Portal Account Temporarily Locked</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
            Your portal login access is currently locked by School Administration. Please contact the Principal's Office for security review.
          </p>
        </div>
      </div>
      <Badge variant="destructive" className="shrink-0 font-bold">LOCKED</Badge>
    </motion.div>
  )
}
