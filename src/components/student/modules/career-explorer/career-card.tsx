'use client'

/**
 * CareerCard — one catalog career in the Explore grid. Everything on
 * the card comes from the CareerEntry seed content (title, field,
 * whatTheyDo, skills); the Save state comes from the persisted career
 * store. Language stays exploratory — "Save", "View" — never
 * "you should become".
 */

import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Eye } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useStudentCareerStore, type CareerEntry } from '@/lib/store/student-career-store'
import { FieldChip, FieldTile, SkillChip, BTN_OUTLINE } from './shared'

interface CareerCardProps {
  career: CareerEntry
  saved: boolean
  onOpen: (career: CareerEntry) => void
  /** Stagger index (capped by the parent grid). */
  index?: number
}

export function CareerCard({ career, saved, onOpen, index = 0 }: CareerCardProps) {
  const saveCareer = useStudentCareerStore((s) => s.saveCareer)
  const removeSaved = useStudentCareerStore((s) => s.removeSaved)

  function handleSaveToggle() {
    if (saved) {
      removeSaved(career.id)
      toast(`${career.title} removed from saved`, {
        description: 'You can save it again any time.',
      })
    } else {
      saveCareer(career.id)
      toast.success(`${career.title} saved`, {
        description: 'Find it under Saved to add a note or compare it later.',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.24) }}
      className="h-full"
    >
      <GlassCard className="on-card flex h-full flex-col p-4">
        <div className="flex items-start gap-3">
          <FieldTile field={career.field} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug text-foreground">{career.title}</h3>
            <div className="mt-1.5">
              <FieldChip field={career.field} />
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{career.whatTheyDo}</p>

        {career.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {career.skills.slice(0, 2).map((skill) => (
              <SkillChip key={skill}>{skill}</SkillChip>
            ))}
            {career.skills.length > 2 && (
              <span className="text-[11px] font-medium text-muted-foreground/70">
                +{career.skills.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSaveToggle}
            aria-pressed={saved}
            aria-label={`${saved ? 'Remove' : 'Save'} ${career.title}`}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9',
              saved
                ? 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 hover:bg-amber-500/[0.12] dark:text-amber-300'
                : 'border-border bg-background text-foreground hover:bg-accent',
            )}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => onOpen(career)}
            aria-label={`View ${career.title} details`}
            className={cn(BTN_OUTLINE, 'sm:ml-auto sm:w-auto')}
          >
            <Eye className="h-4 w-4" aria-hidden />
            View
          </button>
        </div>
      </GlassCard>
    </motion.div>
  )
}
