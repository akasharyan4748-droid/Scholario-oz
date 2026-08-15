'use client'

/**
 * TemplateSelection — premium grid of examination templates.
 * 4 Unit Tests + Half-Yearly + Annual + Custom.
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXAM_TEMPLATES, type ExamTemplate } from './exam-templates'

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
  const templates = EXAM_TEMPLATES
  const standard = templates.filter((t) => !t.isCustom)
  const custom = templates.find((t) => t.isCustom)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {standard.map((t, i) => (
          <TemplateCard key={t.id} template={t} isSelected={selectedTemplateId === t.id} onSelect={onSelect} delay={i} />
        ))}
      </div>
      {custom && (
        <div className="pt-2 border-t border-border/40">
          <TemplateCard template={custom} isSelected={selectedTemplateId === custom.id} onSelect={onSelect} delay={standard.length} isFullWidth />
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, isSelected, onSelect, delay, isFullWidth }: {
  template: ExamTemplate; isSelected: boolean; onSelect: (t: ExamTemplate) => void; delay: number; isFullWidth?: boolean
}) {
  const accent = accentClasses[template.accent] ?? accentClasses.slate
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04, duration: 0.25 }}
      whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(template)}
      className={cn('relative text-left rounded-xl border p-3.5 transition-all', isFullWidth && 'w-full',
        isSelected ? cn(accent.bg, accent.border, 'ring-2', accent.ring) : 'border-border bg-card hover:border-border hover:shadow-sm')}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
          isSelected ? cn(accent.bg, accent.text) : 'bg-muted/50 text-muted-foreground')}>
          {template.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">{template.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{template.description}</p>
        </div>
        {isSelected && <div className={cn('flex h-5 w-5 items-center justify-center rounded-full shrink-0', accent.text)}><Check className="h-3.5 w-3.5" /></div>}
      </div>
    </motion.button>
  )
}
