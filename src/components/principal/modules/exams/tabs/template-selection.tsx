'use client'

/**
 * TemplateSelection — compact examination-type selector.
 *
 * Standard examinations appear as compact pills/cards in academic order:
 *   UT 1 · UT 2 · Half-Yearly · UT 3 · UT 4 · Annual
 *
 * Custom is a small secondary affordance shown below ("+ Custom") — not
 * a primary card. Selecting it lets the principal build freely.
 */

import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STANDARD_TEMPLATES, CUSTOM_TEMPLATE, type ExamTemplate } from './exam-templates'

interface Props {
  selectedTemplateId: string | null
  onSelect: (template: ExamTemplate) => void
}

const accentClasses: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  sky:     { bg: 'bg-sky-500/5',     text: 'text-sky-600 dark:text-sky-400',     border: 'border-sky-500/30',     ring: 'ring-sky-500/20' },
  cyan:    { bg: 'bg-cyan-500/5',    text: 'text-cyan-600 dark:text-cyan-400',   border: 'border-cyan-500/30',    ring: 'ring-cyan-500/20' },
  teal:    { bg: 'bg-teal-500/5',    text: 'text-teal-600 dark:text-teal-400',   border: 'border-teal-500/30',    ring: 'ring-teal-500/20' },
  indigo:  { bg: 'bg-indigo-500/5',  text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', ring: 'ring-indigo-500/20' },
  violet:  { bg: 'bg-violet-500/5',  text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/20' },
  emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20' },
  slate:   { bg: 'bg-slate-500/5',   text: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-500/30',  ring: 'ring-slate-500/20' },
}

export function TemplateSelection({ selectedTemplateId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {/* Compact grid of standard examination types — academic order */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {STANDARD_TEMPLATES.map((t, i) => (
          <TemplatePill key={t.id} template={t} isSelected={selectedTemplateId === t.id} onSelect={onSelect} delay={i} />
        ))}
      </div>

      {/* Custom — subtle secondary affordance */}
      <div className="pt-1">
        <CustomButton
          isSelected={selectedTemplateId === CUSTOM_TEMPLATE.id}
          onSelect={() => onSelect(CUSTOM_TEMPLATE)}
        />
      </div>
    </div>
  )
}

function TemplatePill({ template, isSelected, onSelect, delay }: {
  template: ExamTemplate
  isSelected: boolean
  onSelect: (t: ExamTemplate) => void
  delay: number
}) {
  const accent = accentClasses[template.accent] ?? accentClasses.slate
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.03, duration: 0.2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(template)}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all',
        isSelected
          ? cn(accent.bg, accent.border, 'ring-2', accent.ring)
          : 'border-border bg-card hover:border-border hover:bg-muted/30',
      )}
    >
      <span className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
        isSelected ? cn(accent.bg, accent.text) : 'bg-muted/40 text-muted-foreground',
      )}>
        {template.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight">{template.shortLabel}</p>
        <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">
          {template.description}
        </p>
      </div>
      {isSelected && (
        <span className={cn('flex h-4 w-4 items-center justify-center rounded-full shrink-0', accent.text)}>
          <Check className="h-3 w-3" />
        </span>
      )}
    </motion.button>
  )
}

function CustomButton({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors',
        isSelected
          ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent',
      )}
    >
      <Plus className="h-3 w-3" />
      Custom
    </button>
  )
}
