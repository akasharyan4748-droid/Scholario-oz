'use client'

import { motion } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { sharedFolders } from '@/lib/mock/teacher-resources'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SharedFolders() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-primary" /> Shared Folders
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sharedFolders.map((f, i) => (
          <motion.button
            key={f.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            onClick={() => toast.info(`Opening ${f.name}`, { description: `${f.resources} resources · ${f.sharedWith} collaborators` })}
            className="text-left rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium transition-shadow"
          >
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md mb-3', f.color)}>
              <FolderOpen className="h-5 w-5" />
            </div>
            <p className="font-semibold text-sm leading-tight">{f.name}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{f.resources} resources · {f.sharedWith} shared</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Updated {formatDate(f.lastUpdated)}</p>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}
