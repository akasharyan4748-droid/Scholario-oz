'use client'

import { motion } from 'framer-motion'
import { Download, Eye } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { FORMAT_STYLES, STAGGER, type Category } from './data'

export function CategorySection({ cat, ci }: { cat: Category; ci: number }) {
  const CatIcon = cat.icon
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ci * 0.05, ...STAGGER }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
            cat.gradient
          )}
        >
          <CatIcon className="h-4 w-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-sm font-bold tracking-tight">{cat.label}</h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {cat.docs.length} {cat.docs.length === 1 ? 'form' : 'forms'}
          </span>
        </div>
        <div className="ml-2 h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cat.docs.map((doc, di) => {
          const DocIcon = doc.icon
          return (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.05 + di * 0.04, ...STAGGER }}
            >
              <GlassCard
                className="group p-4 h-full flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all"
                hover
              >
                {/* Header row: icon + format badge */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                      cat.gradient
                    )}
                  >
                    <DocIcon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('font-semibold tracking-wide', FORMAT_STYLES[doc.format])}
                  >
                    {doc.format}
                  </Badge>
                </div>

                {/* Title + desc */}
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold leading-tight">{doc.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{doc.desc}</p>
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      toast.success('Download started', {
                        description: `${doc.name} · ${doc.format}`,
                      })
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      toast.info('Preview opened', {
                        description: doc.name,
                      })
                    }
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
