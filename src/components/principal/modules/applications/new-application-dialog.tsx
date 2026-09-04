'use client'

/**
 * NewApplicationDialog — the entry point of the application workflow:
 *
 *   Step 1  ·  Choose the application (the catalog — today one built-in
 *               school form: Educational Tour / Trip — Parent Consent Form;
 *               future application types are added to this catalog).
 *   Step 2  ·  Choose the A4 document template (Classic Office /
 *               Scholario Modern — shown as miniature page previews).
 *   Continue → the session configuration screen with the chosen template.
 *
 * There is no form builder anywhere behind this dialog — the layouts are
 * fixed official documents. Only the session-specific particulars are
 * configured afterwards.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bus, CheckCircle2, ChevronRight, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  TOUR_DOC_TEMPLATES, TOUR_DOC_TEMPLATE_ORDER,
  type TourDocTemplate,
} from '@/lib/store/applications-store'

export interface NewApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the chosen document template when the user continues. */
  onContinue: (docTemplate: TourDocTemplate) => void
}

export function NewApplicationDialog({ open, onOpenChange, onContinue }: NewApplicationDialogProps) {
  const [step, setStep] = useState<'application' | 'template'>('application')
  const [picked, setPicked] = useState<TourDocTemplate>('classic')

  const reset = (next: boolean) => {
    if (!next) {
      setStep('application')
      setPicked('classic')
    }
  }

  const finish = () => {
    const chosen = picked
    onOpenChange(false)
    reset(false)
    onContinue(chosen)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { reset(o); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {step === 'application' ? 'New application' : 'Choose the A4 document template'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'application'
              ? 'Pick the school form to use — it is then configured for this session.'
              : 'Both are official one-page documents. The choice is used for the blank form, students\u2019 submitted forms, print and PDF.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          {step === 'application' ? (
            <button
              type="button"
              onClick={() => setStep('template')}
              className="w-full text-left rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Use Educational Tour and Trip Parent Consent Form"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Bus className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">Educational Tour / Trip — Parent Consent Form</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <ShieldCheck className="h-2.5 w-2.5" /> School form
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    Official parent consent for educational tours and trips. Each session sets its own
                    destination, dates, fee and circular details.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOUR_DOC_TEMPLATE_ORDER.map((key) => {
                const t = TOUR_DOC_TEMPLATES[key]
                const selected = picked === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPicked(key)}
                    aria-pressed={selected}
                    className={cn(
                      'relative rounded-xl border bg-card p-3.5 flex flex-col items-center text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary ring-1 ring-primary/30 shadow-sm'
                        : 'border-border hover:border-primary/25 hover:bg-muted/30',
                    )}
                  >
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <DocTemplateThumb which={key} />
                    <p className="mt-3 text-xs font-semibold">{t.label}</p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground leading-relaxed">{t.blurb}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3 shrink-0">
          {step === 'template' && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStep('application')}>
              Back
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'template' && (
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={finish}>
              Continue <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Miniature A4 page previews ──────────────────────────────────────

/**
 * DocTemplateThumb — a scaled-down A4 page that shows each document
 * template's visual character: the classic letterhead with heavy rules and
 * a boxed declaration, versus the modern airy layout with hairlines.
 * Pure CSS — a picture of the page, never a live render.
 */
export function DocTemplateThumb({ which, scale = 1, className }: { which: TourDocTemplate; scale?: number; className?: string }) {
  const classic = which === 'classic'
  const W = 92 * scale
  const H = 130 * scale
  return (
    <div
      aria-hidden
      className={cn('relative bg-white border border-border shadow-sm overflow-hidden', className)}
      style={{ width: W, height: H }}
    >
      <div style={{ width: 92, height: 130, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {classic ? (
        <motion.div className="flex h-full flex-col" initial={false}>
          {/* letterhead: name + double rule + circular row */}
          <div className="mx-auto mt-1.5 flex items-center gap-1">
            <span className="rounded-full border-[1.5px] border-neutral-500 h-2.5 w-2.5" />
            <span className="text-[5px] font-bold tracking-widest uppercase text-neutral-800 text-center leading-none">
              School Name
            </span>
            <span className="rounded-sm border border-dashed border-neutral-400 h-3.5 w-3" />
          </div>
          <div className="mt-1 mx-1.5 border-t-[1.5px] border-neutral-800" />
          <div className="mx-1.5 mt-0.5 flex justify-between items-center">
            <span className="h-[2px] w-6 bg-neutral-300 rounded-sm" />
            <span className="h-[2px] w-4 bg-neutral-300 rounded-sm" />
          </div>
          <div className="mx-1.5 mt-0.5 border-t-[2px] border-neutral-800" />
          {/* title underlined */}
          <div className="mt-1.5 flex justify-center">
            <span className="text-[5px] font-bold tracking-[0.18em] text-neutral-800 border-b border-neutral-700 pb-[1px] px-1 uppercase">
              Consent Form
            </span>
          </div>
          {/* ruled field rows */}
          <div className="mt-1.5 mx-1.5 space-y-[3px]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="h-[2.5px] w-3 bg-neutral-400 rounded-sm" />
                <span className="flex-1 border-t border-dotted border-neutral-500" />
              </div>
            ))}
          </div>
          {/* boxed declaration */}
          <div className="mt-1.5 mx-1.5 border border-neutral-600 p-[3px] space-y-[2px]">
            <div className="h-[2px] w-full bg-neutral-300 rounded-sm" />
            <div className="h-[2px] w-5/6 bg-neutral-300 rounded-sm" />
            <div className="h-[2px] w-4/6 bg-neutral-200 rounded-sm" />
          </div>
          {/* signature columns */}
          <div className="mt-auto mb-1.5 mx-1.5 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-dotted border-neutral-500 pt-[1px]">
                <div className="h-[2px] w-full bg-neutral-200 rounded-sm" />
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div className="flex h-full flex-col" initial={false}>
          {/* airy letterhead: small name + hairline */}
          <div className="mt-2.5 flex justify-center">
            <span className="text-[5px] font-semibold tracking-[0.22em] uppercase text-neutral-700">
              School Name
            </span>
          </div>
          <div className="mt-1.5 mx-2 border-t border-neutral-300" />
          {/* airy title */}
          <div className="mt-3 flex justify-center">
            <span className="text-[5px] font-semibold tracking-[0.3em] uppercase text-neutral-600">
              Consent Form
            </span>
          </div>
          {/* section + hairline rows with generous spacing */}
          <div className="mt-2.5 mx-2 space-y-[4px]">
            {[0, 1, 2].map((i) => (
              <div key={`s${i}`} className="space-y-[2.5px]">
                <span className="block h-[2px] w-4 bg-neutral-300 rounded-sm" />
                <span className="block border-t border-neutral-300" />
                <span className="block border-t border-neutral-300" />
              </div>
            ))}
          </div>
          {/* open declaration */}
          <div className="mt-2.5 mx-2 space-y-[2px]">
            <div className="h-[2px] w-full bg-neutral-200 rounded-sm" />
            <div className="h-[2px] w-4/6 bg-neutral-200 rounded-sm" />
          </div>
          {/* signature columns — hairlines */}
          <div className="mt-auto mb-2.5 mx-2 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-neutral-300 pt-[1.5px]">
                <div className="h-[2px] w-full bg-neutral-200 rounded-sm" />
              </div>
            ))}
          </div>
        </motion.div>
        )}
      </div>
    </div>
  )
}
