'use client'

/**
 * Stepper Header — the horizontal scrollable wizard step nav.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 *
 * Auto-scrolls horizontally to keep the current step centered.
 */
import { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'

export interface WizardStep {
  id: number
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function StepperHeader({
  visibleSteps,
  step,
  currentVisibleIndex,
  stepperScrollRef,
  onSelect,
}: {
  visibleSteps: WizardStep[]
  step: number
  currentVisibleIndex: number
  stepperScrollRef: RefObject<HTMLDivElement | null>
  onSelect: (id: number) => void
}) {
  return (
    <GlassCard className="p-4 sm:p-6 pt-5 sm:pt-6 overflow-visible shadow-lg border-border/80">
      <div
        ref={stepperScrollRef}
        className="flex items-center overflow-x-auto pt-2 pb-3 gap-2 sm:gap-3 no-scrollbar overflow-y-visible scroll-smooth"
      >
        {visibleSteps.map((s, i) => {
          const StepIcon = s.icon
          const isCompleted = currentVisibleIndex > i
          const isCurrent = step === s.id
          const isFuture = currentVisibleIndex < i
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <motion.button
                type="button"
                data-step-idx={i}
                onClick={() => onSelect(s.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-1.5 px-2 sm:px-3 py-1 cursor-pointer"
              >
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30'
                      : isCurrent
                      ? 'bg-primary/10 border-primary text-primary shadow-md shadow-primary/20'
                      : isFuture
                      ? 'bg-muted/30 border-border text-muted-foreground/60'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span
                  className={`text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                    isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
                {isCurrent && (
                  <motion.span
                    layoutId="step-underline"
                    className="absolute -bottom-1 h-1 w-8 rounded-full bg-primary"
                  />
                )}
              </motion.button>
              {i < visibleSteps.length - 1 && (
                <div className={`w-2 sm:w-4 h-px mx-0.5 mb-5 transition-colors ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
