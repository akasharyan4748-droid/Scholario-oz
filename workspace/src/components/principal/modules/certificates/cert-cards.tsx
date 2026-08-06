'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { CERTS, type CertType } from './data'

/**
 * The 6-tile grid of certificate templates on the module landing view.
 * Clicking "Generate" on any tile opens the generation dialog for that cert type.
 */
export function CertCardsGrid({ onGenerate }: { onGenerate: (type: CertType) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {CERTS.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard className="p-3 sm:p-4 lg:p-5 h-full flex flex-col" hover>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-md`}>
              {c.icon}
            </div>
            <h3 className="font-display text-base font-bold mt-3">{c.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{c.desc}</p>
            <Button className="w-full mt-4 gap-2" onClick={() => onGenerate(c.key)}>
              <Plus className="h-4 w-4" /> Generate
            </Button>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
