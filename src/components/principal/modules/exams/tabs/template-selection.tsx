'use client'

/**
 * TemplateSelection — premium grid of examination templates.
 * The Principal picks a starting point, then customizes.
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXAM_TEMPLATES, type ExamTemplate } from './exam-templates'

interface Props {
  selectedTemplateId: string | null
  onSelect: (template: ExamTemplate) => void
  availableGradeLevels?: string[]
}

export function TemplateSelection({ selectedTemplateId, onSelect, availableGradeLevels }: Props) {
  const templates = availableGradeLevels && availableGradeLevels.length > 0
    ? EXAM_TEMPLATES.filter((t) => !t.boardOnly || ['10', '12'].some((g) => availableGradeLevels.includes(g)))
    : EXAM_TEMPLATES

  const accentClasses: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    sky:     { bg: 'bg-sky-500/5',     text: 'text-sky-600 dark:text-sky-400',     border: 'border-sky-500/30',     ring: 'ring-sky-500/20' },
    cyan:    { bg: 'bg-cyan-500/5',    text: 'text-cyan-600 dark:text-cyan-400',   border: 'border-cyan-500/30',    ring: 'ring-cyan-500/20' },
    violet:  { bg: 'bg-violet-500/5',  text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/20' },
    emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20' },
    amber:   { bg: 'bg-amber-500/5',   text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/30',  ring: 'ring-amber-500/20' },
    indigo:  { bg: 'bg-indigo-500/5',  text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30',  ring: 'ring-indigo-500/20' },
    rose:    { bg: 'bg-rose-500/5',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-500/30',    ring: 'ring-rose-500/20' },
    slate:   { bg: 'bg-slate-500/5',   text: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-500/30',  ring: 'ring-slate-500/20' },
  }

  return (
    <div>
      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {templates.map((template, i) => {
          const isSelected = selectedTemplateId === template.id
          const accent = accentClasses[template.accent] ?? accentClasses.slate

          return (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template)}
              className={cn(
                'relative text-left rounded-xl border p-3.5 transition-all',
                isSelected
                  ? cn(accent.bg, accent.border, 'ring-2', accent.ring)
                  : 'border-border bg-card hover:border-border hover:shadow-sm',
              )}
            >
              {/* Icon */}
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg mb-2.5',
                isSelected ? cn(accent.bg, accent.text) : 'bg-muted/50 text-muted-foreground'
              )}>
                {template.icon}
              </div>

              {/* Label */}
              <p className="text-xs font-semibold text-foreground leading-tight">{template.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{template.description}</p>

              {/* Selected indicator */}
              {isSelected && (
                <div className={cn(
                  'absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full',
                  accent.text
                )}>
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}

              {/* Board badge */}
              {template.boardOnly && (
                <span className="absolute bottom-2 right-2 text-[8px] font-medium text-muted-foreground/60">
                  Board
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* No templates available state (shouldn't normally happen) */}
      {templates.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          No examination templates available.
        </div>
      )}
    </div>
  )
}
