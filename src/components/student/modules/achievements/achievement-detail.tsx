'use client'

/**
 * AchievementDetail — the accessible detail dialog (spec §10).
 *
 * Conventions follow the Student workspace shells: role=dialog +
 * aria-modal, Escape closes (useDismissOnEscape), backdrop click
 * closes, bottom sheet on mobile / centered from sm up.
 *
 * Honesty rules:
 *   · "From {assessment}" chip renders ONLY when relatedAssessmentId
 *     resolves to a real assessment in student-results-store — it is
 *     an informational chip (this surface cannot navigate to Results),
 *     never a dead button.
 *   · The certificate block renders ONLY when certificateId resolves
 *     to a real document in certificates-store, and points the student
 *     to My Certificates for the preview/download (no duplicated doc
 *     renderer here).
 *   · Self-reported records carry the neutral "You added this" tag.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { X, FileText, GraduationCap, Plus, Minus } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentGrowthStore, type GrowthAchievement } from '@/lib/store/student-growth-store'
import { useStudentResultsStore } from '@/lib/store/student-results-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { awardedByLabel, BTN_OUTLINE, BTN_SOFT, CATEGORY_META, CategoryChip, ScopeChip, SelfTag } from './shared'

interface AchievementDetailProps {
  achievementId: string | null
  onClose: () => void
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold">{value}</dd>
    </div>
  )
}

export function AchievementDetail({ achievementId, onClose }: AchievementDetailProps) {
  // Hooks first — never conditional (achievementId gates the render).
  const achievement = useStudentGrowthStore((s) =>
    achievementId ? s.achievements.find((a) => a.id === achievementId) ?? null : null,
  )
  const toggleInPortfolio = useStudentGrowthStore((s) => s.toggleInPortfolio)
  const assessments = useStudentResultsStore((s) => s.assessments)
  const documents = useCertificatesStore((s) => s.documents)
  useDismissOnEscape(onClose, achievementId != null)

  const related = achievement?.relatedAssessmentId
    ? assessments.find((a) => a.id === achievement.relatedAssessmentId) ?? null
    : null
  const certificate = achievement?.certificateId
    ? documents.find((d) => d.id === achievement.certificateId) ?? null
    : null

  function handleTogglePortfolio(a: GrowthAchievement) {
    toggleInPortfolio(a.id)
    if (a.inPortfolio) {
      toast('Removed from portfolio', { description: a.title })
    } else {
      toast.success('Added to portfolio', {
        description: `“${a.title}” now appears in your portfolio`,
      })
    }
  }

  const meta = achievement ? CATEGORY_META[achievement.category] : null
  const Glyph = achievement && achievement.source === 'self' ? GraduationCap : meta?.icon

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={achievement.title}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-lg sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <CategoryChip category={achievement.category} />
                  <ScopeChip scope={achievement.scope} />
                  {achievement.source === 'self' && <SelfTag />}
                </div>
                <h2 className="text-base font-semibold leading-snug">{achievement.title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close achievement details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                {Glyph && (
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                      achievement.source === 'self' ? 'bg-muted/50 text-muted-foreground' : meta?.tile,
                    )}
                    aria-hidden
                  >
                    <Glyph className="h-5 w-5" />
                  </span>
                )}
                <p className="text-sm leading-relaxed text-foreground/90">{achievement.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                <Meta label="Date" value={formatDate(achievement.dateISO)} />
                <Meta label="Awarded by" value={awardedByLabel(achievement)} />
                {achievement.subject && <Meta label="Subject" value={achievement.subject} />}
                <Meta label="Level" value={achievement.scope === 'inter-school' ? 'Inter-school' : achievement.scope === 'school' ? 'School' : 'Class'} />
              </dl>

              {achievement.evidence.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Evidence</p>
                  <ul className="space-y-1.5">
                    {achievement.evidence.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-[13px] text-foreground/85">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {achievement.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {achievement.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {related && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-3 py-2.5">
                  <GraduationCap className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
                  <p className="text-xs text-muted-foreground">
                    From the <span className="font-semibold text-foreground">{related.name}</span> — see My Results for the full breakdown
                  </p>
                </div>
              )}

              {certificate && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                    <p className="text-xs font-semibold text-foreground">
                      {certificate.docType} · {certificate.docNumber}
                    </p>
                    <span className="ml-auto inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                      {certificate.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Issued {formatDate(certificate.generatedAt.slice(0, 10))} — open My Certificates to view and download it.
                  </p>
                </div>
              )}
            </div>

            {/* Footer — portfolio toggle */}
            <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={() => handleTogglePortfolio(achievement)}
                className={achievement.inPortfolio ? BTN_OUTLINE : BTN_SOFT}
              >
                {achievement.inPortfolio ? (
                  <>
                    <Minus className="h-4 w-4" aria-hidden />
                    Remove from portfolio
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden />
                    Add to portfolio
                  </>
                )}
              </button>
              <button type="button" onClick={onClose} className={BTN_OUTLINE}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
