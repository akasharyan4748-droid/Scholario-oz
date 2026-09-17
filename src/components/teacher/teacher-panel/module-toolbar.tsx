'use client'

/**
 * ModuleToolbar — the shared top-of-module furniture for the Teacher
 * Workspace (Teacher Workspace cleanup pass §3/§4/§5).
 *
 * RULE (non-negotiable):
 *   TOP BAR = module identity  ("Exam Duties", "Marks Entry", "Lesson Planner"…)
 *   CONTENT = module content   — begins immediately, no giant H1 repeat.
 *
 * The toolbar therefore NEVER renders the module name. It renders only
 * what is real and useful:
 *   · `context` — one quiet scope line ("Class 2-A · Mid-Term Examination",
 *     "Mark daily attendance · Wednesday, 5 March") — muted, one line,
 *     never the module name, never explanatory prose.
 *   · `action`  — the module's primary control(s) (Create / class selector
 *     / status chip), right-aligned on the same row.
 *
 * Modules with neither context nor action render nothing at all — their
 * content simply begins, which is the intended premium behaviour.
 */

import { cn } from '@/lib/utils'

interface ModuleToolbarProps {
  /** Quiet one-line scope context — factual, never the module name. */
  context?: React.ReactNode
  /** Primary action(s) / scope controls, right-aligned. */
  action?: React.ReactNode
  className?: string
}

export function ModuleToolbar({ context, action, className }: ModuleToolbarProps) {
  const hasContext = context != null && context !== false
  const hasAction = action != null && action !== false
  if (!hasContext && !hasAction) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5',
        className,
      )}
    >
      {hasContext ? (
        <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">
          {context}
        </p>
      ) : (
        <span aria-hidden="true" className="min-w-0 flex-1" />
      )}
      {hasAction && (
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">{action}</div>
      )}
    </div>
  )
}
