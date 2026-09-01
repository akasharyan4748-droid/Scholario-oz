'use client'

/**
 * fees-catalogue-shared — shared catalogue UI helpers (Phase 6 feature).
 *
 * Extracted from fees-master-catalogue.tsx so that:
 *   - the Master Catalogue drawer,
 *   - the new FeeHeadCataloguePicker (used inside the Add-Head form in
 *     fees-structures-detail.tsx),
 *   - the new Normalize Heads drawer (used in fees-structures.tsx)
 *   - and any future surface that wants to render catalogue heads
 *
 * …all share the SAME category-color system, frequency badge, GST badge,
 * amount badge, and catalogue-aware frequency normalizer.
 *
 * Why a shared module (not just copy-paste):
 *   - The brief (section 24) explicitly calls out "Remove duplication not
 *     functionality" as a principle. Three near-identical CATEGORY_CHIPS
 *     maps across three components is exactly the duplication the brief
 *     warns against.
 *   - The category→color mapping is a single source of truth: changing
 *     the emerald Tuition chip to teal (e.g. for a school that wants a
 *     different palette) requires touching ONE file.
 *
 * All exports are pure (no side effects, no store reads). Components that
 * use them are responsible for their own data fetching.
 */

import * as React from 'react'
import {
  Layers, BookOpen, Truck, FlaskConical, GraduationCap, Trophy,
  Activity, FileText, Building2, type LucideIcon, IndianRupee,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import type { FeeHead, FeeHeadCategory } from '@/lib/store/fee-store'

// ─── Category → icon mapping ────────────────────────────────────────────
// Same 10 categories as school-settings-store/types.ts::FeeHeadConfig.type
// and fee-store.ts::FeeHeadCategory. Re-exported here so consumers can
// render category icons in any context (picker, drawer, banner, table).

export const CATEGORY_ICONS: Record<FeeHeadCategory, LucideIcon> = {
  Tuition: GraduationCap,
  Admission: FileText,
  Annual: Activity,
  Transport: Truck,
  Lab: FlaskConical,
  Library: BookOpen,
  Exam: FileText,
  Activity: Trophy,
  Board: Layers,
  Other: Building2,
}

// ─── Category → tailwind chip mapping ───────────────────────────────────
// Same 10 color schemes as in the original fees-master-catalogue.tsx.
// Deliberately AVOIDS indigo/blue (per project rule) except for Transport,
// which is fine since it's a contextual/semantic match (transport = blue
// sky / road convention). All others use the established palette
// (emerald / cyan / amber / violet / rose / orange / pink / fuchsia /
// slate).

export const CATEGORY_CHIPS: Record<FeeHeadCategory, string> = {
  Tuition:    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
  Admission: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20',
  Annual:     'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  Transport:  'bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20',
  Lab:        'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20',
  Library:    'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20',
  Exam:       'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20',
  Activity:   'bg-pink-500/10 text-pink-700 dark:text-pink-300 ring-pink-500/20',
  Board:      'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/20',
  Other:      'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20',
}

// Category list as a stable ordered array — used by the picker's filter
// dropdown and by the Master Catalogue drawer's filter chip row.
export const CATEGORY_ORDER: FeeHeadCategory[] = [
  'Tuition', 'Admission', 'Annual', 'Transport', 'Lab',
  'Library', 'Exam', 'Activity', 'Board', 'Other',
]

// ─── Frequency normalization ───────────────────────────────────────────
// The master catalogue (school-settings-store::FeeHeadConfig.frequency)
// uses 'Term' as a value, but the per-structure FeeHead type uses 'Per Term'.
// This normalizer is the single place that bridges the two vocabularies.
// If a new frequency ever lands in either type, add the mapping HERE so
// every picker / prefill site stays consistent.

/** Catalogue frequency vocabulary. */
export type CatalogueFrequency =
  | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Per Term' | 'Term' | 'Annual' | 'One-Time'

/** Per-structure FeeHead frequency vocabulary (the target type). */
export type FeeHeadFrequency =
  FeeHead['frequency'] // 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly' | 'Per Term' | 'One-Time'

/**
 * Normalize a master-catalogue frequency value into a value the
 * per-structure FeeHead type accepts.
 *
 * - 'Term' → 'Per Term' (the master catalogue uses 'Term' but the
 *   per-structure type uses 'Per Term')
 * - everything else passes through unchanged
 *
 * If the input is unknown/undefined, returns 'Annual' (a safe default —
 * the most common school-fee frequency).
 */
export function normalizeCatalogueFrequency(
  freq: CatalogueFrequency | string | undefined,
): FeeHeadFrequency {
  if (!freq) return 'Annual'
  if (freq === 'Term') return 'Per Term'
  // Runtime guard — only allow the canonical FeeHead frequencies.
  const allowed: FeeHeadFrequency[] = ['Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Per Term', 'One-Time']
  return (allowed as string[]).includes(freq) ? (freq as FeeHeadFrequency) : 'Annual'
}

// ─── Predicate helpers ──────────────────────────────────────────────────

/** True when a per-structure FeeHead is bound to a master catalogue entry. */
export function isCatalogued(head: FeeHead | { catalogueId?: string }): boolean {
  return !!head?.catalogueId
}

/**
 * Derive the effective category for a per-structure FeeHead.
 *
 * Priority:
 *   1. explicit `head.category` if set
 *   2. (caller can pass the matching catalogue entry's `type` if it's
 *      available — see FeesNormalizeHeadsDrawer for that use case)
 *   3. 'Other' as the safe fallback (matches the brief's stance on
 *      "no silent indigo/blue accents")
 */
export function deriveHeadCategory(
  head: FeeHead,
  catalogueType?: string,
): FeeHeadCategory {
  if (head.category) return head.category
  if (catalogueType && (CATEGORY_ORDER as string[]).includes(catalogueType)) {
    return catalogueType as FeeHeadCategory
  }
  return 'Other'
}

// ─── Visual primitives ──────────────────────────────────────────────────

/** Colored category chip with optional icon. */
export function CategoryBadge({
  category,
  withIcon = true,
  className,
}: {
  category: FeeHeadCategory
  withIcon?: boolean
  className?: string
}) {
  const Icon = CATEGORY_ICONS[category] ?? Layers
  const chip = CATEGORY_CHIPS[category] ?? CATEGORY_CHIPS.Other
  return (
    <Badge
      variant="outline"
      className={cn('text-[8px] py-0 px-1 h-3.5 gap-0.5 font-medium', chip, className)}
    >
      {withIcon && <Icon className="h-2.5 w-2.5" />}
      {category}
    </Badge>
  )
}

/** Subtle outline frequency badge. */
export function FrequencyBadge({
  frequency,
  className,
}: {
  frequency: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn('text-[8px] py-0 px-1 h-3.5 font-medium', className)}
    >
      {frequency}
    </Badge>
  )
}

/** Amber GST badge — only rendered when isTaxable=true. */
export function GstBadge({
  isTaxable,
  taxRate,
  className,
}: {
  isTaxable?: boolean
  taxRate?: number
  className?: string
}) {
  if (!isTaxable) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[8px] py-0 px-1 h-3.5 font-medium',
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        className,
      )}
    >
      GST {taxRate ?? 18}%
    </Badge>
  )
}

/** Emerald amount badge (₹ + formatted value). */
export function AmountBadge({
  amount,
  compact = true,
  className,
}: {
  amount: number
  compact?: boolean
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] py-0 px-1 h-3.5 font-mono tabular-nums font-semibold',
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        className,
      )}
    >
      <IndianRupee className="h-2 w-2" /> {formatINR(amount, compact)}
    </Badge>
  )
}

// ─── Financial kind badge (Core / Examination / Additional) ───────────
// The coarse financial classification shown on catalogue rows + the New
// Fee Head form. Uses the established palette (emerald / orange / violet).

export type CatalogueKind = 'CORE' | 'EXAMINATION' | 'ADDITIONAL'

const KIND_META: Record<CatalogueKind, { label: string; chip: string; hint: string }> = {
  CORE: {
    label: 'Core Fee',
    chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
    hint: 'Part of the standard annual class fee structure (Tuition, Transport, Library…).',
  },
  EXAMINATION: {
    label: 'Exam Fee',
    chip: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20',
    hint: 'Examination charges tied to the exam definitions in the Examination module.',
  },
  ADDITIONAL: {
    label: 'Additional',
    chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20',
    hint: 'Template for event-based collections (tours, workshops). Create an Additional Charge when the event occurs — never add to the annual structure.',
  },
}

/** Small kind pill (Core Fee / Exam Fee / Additional). */
export function KindBadge({ kind, className }: { kind: CatalogueKind; className?: string }) {
  const meta = KIND_META[kind] ?? KIND_META.CORE
  return (
    <Badge
      variant="outline"
      className={cn('text-[8px] py-0 px-1 h-3.5 font-medium', meta.chip, className)}
      title={meta.hint}
    >
      {meta.label}
    </Badge>
  )
}

export function kindMeta(kind: CatalogueKind) {
  return KIND_META[kind] ?? KIND_META.CORE
}

// ─── Small inline indicator: "linked to catalogue" vs "custom head" ──────

/** Small pill that signals a per-structure head is bound to the catalogue. */
export function CatalogueBoundPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[8px] font-medium px-1 py-0.5 rounded-full',
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20',
        className,
      )}
      title="This head is linked to the master fee-head catalogue. Editing the catalogue entry's defaults will affect future structures only — this structure keeps its snapshot."
    >
      <Layers className="h-2 w-2" /> Catalogue
    </span>
  )
}

/** Small pill that signals a per-structure head was typed manually. */
export function CustomHeadPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[8px] font-medium px-1 py-0.5 rounded-full',
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20',
        className,
      )}
      title="This head is not linked to the master fee-head catalogue. Consider normalizing it via the Normalize Uncatalogued Heads tool."
    >
      <FileText className="h-2 w-2" /> Custom
    </span>
  )
}
