'use client'

/**
 * ItemDetail — the accessible per-item dialog (spec §18/§12/§55).
 *
 * Conventions follow the Student workspace shells: role=dialog +
 * aria-modal, Escape closes (useDismissOnEscape), backdrop click closes,
 * bottom sheet on mobile / centered from sm up.
 *
 * Honesty rules:
 *   · "From your achievements" is an informational chip — it resolves the
 *     linked achievement LIVE from the growth store (title + award
 *     context), never a dead button.
 *   · The certificate block renders ONLY when certificateId resolves to a
 *     real document in certificates-store (the pathway exists; no seed
 *     item carries one — nothing is fabricated).
 *   · Visibility is school-controlled: Private / Class / School only — no
 *     public option, no link generation.
 *   · Self-origin items keep the neutral "Added by you" treatment; Edit is
 *     offered for them only.
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Star,
  Pencil,
  Trash2,
  FileText,
  Link2,
  ShieldCheck,
  Minus,
} from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useStudentGrowthStore,
  type PortfolioItem,
  type PortfolioVisibility,
} from '@/lib/store/student-growth-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import {
  BTN_OUTLINE,
  BTN_SOFT,
  FeaturedMark,
  KIND_META,
  KindChip,
  KindTile,
  OriginChip,
  VisibilityChip,
  visibilityLabel,
} from './shared'

interface ItemDetailProps {
  itemId: string | null
  onClose: () => void
  /** Opens the edit form (self-origin items only). */
  onEdit: (item: PortfolioItem) => void
}

const VISIBILITIES: PortfolioVisibility[] = ['private', 'class', 'school']

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold">{value}</dd>
    </div>
  )
}

export function ItemDetail({ itemId, onClose, onEdit }: ItemDetailProps) {
  // Hooks first — never conditional (itemId gates the render).
  const item = useStudentGrowthStore((s) =>
    itemId ? s.portfolioItems.find((p) => p.id === itemId) ?? null : null,
  )
  const achievements = useStudentGrowthStore((s) => s.achievements)
  const portfolioItems = useStudentGrowthStore((s) => s.portfolioItems)
  const toggleFeatured = useStudentGrowthStore((s) => s.toggleFeatured)
  const setVisibility = useStudentGrowthStore((s) => s.setVisibility)
  const removePortfolioItem = useStudentGrowthStore((s) => s.removePortfolioItem)
  const documents = useCertificatesStore((s) => s.documents)
  useDismissOnEscape(onClose, itemId != null)

  const [confirmRemove, setConfirmRemove] = useState(false)
  useEffect(() => {
    // New item (or dialog reopened) → reset the two-step confirm.
    setConfirmRemove(false)
  }, [itemId])

  const linkedAchievement = item?.achievementId
    ? achievements.find((a) => a.id === item.achievementId) ?? null
    : null
  const certificate = item?.certificateId
    ? documents.find((d) => d.id === item.certificateId) ?? null
    : null

  if (!item) return null

  function handleFeature(item: PortfolioItem, featuredCount: number) {
    if (item.featured) {
      toggleFeatured(item.id)
      toast('Removed from featured', { description: `“${item.title}” stays in My work` })
      return
    }
    toggleFeatured(item.id)
    if (featuredCount >= 2) {
      toast.success('Added to featured', {
        description: 'It replaces your oldest featured work — up to 2 stay featured',
      })
    } else {
      toast.success('Added to featured', {
        description: `“${item.title}” now shows at the top of your portfolio`,
      })
    }
  }

  function handleVisibility(item: PortfolioItem, v: PortfolioVisibility) {
    if (item.visibility === v) return
    setVisibility(item.id, v)
    toast('Visibility updated', {
      description: `“${item.title}” is now ${v === 'private' ? 'private — only you' : `visible to your ${visibilityLabel(v).toLowerCase()}`}`,
    })
  }

  function handleRemove(item: PortfolioItem) {
    removePortfolioItem(item.id)
    onClose()
    if (item.origin === 'from-achievement') {
      toast('Removed from portfolio', {
        description: `“${item.title}” — you can add it back anytime from Achievements`,
      })
    } else {
      toast('Removed from portfolio', { description: `“${item.title}” was removed` })
    }
  }

  const featuredCount = portfolioItems.filter((p) => p.featured).length

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
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
                  <KindChip kind={item.kind} />
                  {item.featured && <FeaturedMark />}
                  <OriginChip origin={item.origin} />
                </div>
                <h2 className="text-base font-semibold leading-snug">{item.title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close item details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <KindTile kind={item.kind} subject={item.subject} />
                <p className="text-sm leading-relaxed text-foreground/90">{item.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                <Meta label="Kind" value={KIND_META[item.kind].label} />
                {item.subject && <Meta label="Subject" value={item.subject} />}
                <Meta label="Date" value={formatDate(item.dateISO)} />
                <Meta label="Visibility" value={<VisibilityChip visibility={item.visibility} />} />
              </dl>

              {item.skills.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Skills</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {linkedAchievement && (
                <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <p className="text-xs text-muted-foreground">
                      From your achievements —{' '}
                      <span className="font-semibold text-foreground">{linkedAchievement.title}</span>
                    </p>
                  </div>
                  <p className="mt-1.5 pl-6 text-[11px] text-muted-foreground/80">
                    {linkedAchievement.source === 'teacher'
                      ? `Awarded by ${linkedAchievement.awardedByName} · ${formatDate(linkedAchievement.dateISO)}`
                      : linkedAchievement.source === 'school'
                        ? `Recognised by the school · ${formatDate(linkedAchievement.dateISO)}`
                        : linkedAchievement.source === 'self'
                          ? `You added this achievement · ${formatDate(linkedAchievement.dateISO)}`
                          : `School record · ${formatDate(linkedAchievement.dateISO)}`}
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
                    Issued {formatDate(certificate.generatedAt.slice(0, 10))} — open My Certificates to view and
                    download it.
                  </p>
                </div>
              )}

              {/* Visibility — school-controlled audience */}
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Who can see this
                </p>
                <div
                  role="radiogroup"
                  aria-label="Who can see this item"
                  className="flex flex-wrap gap-1.5"
                >
                  {VISIBILITIES.map((v) => {
                    const selected = item.visibility === v
                    return (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleVisibility(item, v)}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:py-1.5',
                          selected
                            ? 'border-primary/30 bg-primary/[0.08] text-primary'
                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        {visibilityLabel(v)}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
                  Visibility follows school policy — your teacher and class can see Class and School items.
                </p>
              </div>
            </div>

            {/* Footer — per-item actions */}
            <div className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
              {confirmRemove ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-foreground">
                    Remove <span className="text-muted-foreground">“{item.title}”</span> from your portfolio?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(false)}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/[0.08] px-3.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-rose-400 sm:h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button type="button" onClick={() => handleFeature(item, featuredCount)} className={item.featured ? BTN_OUTLINE : BTN_SOFT}>
                    {item.featured ? (
                      <>
                        <Minus className="h-4 w-4" aria-hidden />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4" aria-hidden />
                        Feature this work
                      </>
                    )}
                  </button>
                  {item.origin === 'self' && (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className={BTN_OUTLINE}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
