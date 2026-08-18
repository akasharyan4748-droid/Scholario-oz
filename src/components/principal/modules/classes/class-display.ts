/**
 * Class display label helpers — Spec §4 / §6 / §21.
 *
 * Single source of truth for how a class name + stream renders in the UI.
 * Used by Students & Classes (class card, class details header) so that
 * Class 11 PCM and Class 11 PCB cards are visually distinguishable.
 *
 * The `name` field on a ClassRecord is shared across stream variants
 * (e.g. "Class 11" for both C14-PCM and C14-PCB). The stream field
 * distinguishes them. This helper combines them into a display string
 * that matches Examination's label format ("Class 11 — Science PCM").
 */

import { streamLabel, type StreamKey } from '@/lib/mock/academic/streams'
import type { ClassRecord } from '@/lib/store/students-store/types'

/**
 * Returns the human-readable stream label for a class (e.g. "Science PCM"),
 * or null if the class has no stream (Nursery–Class 10).
 */
export function classStreamLabel(cls: { stream?: StreamKey | null }): string | null {
  return streamLabel(cls.stream ?? null)
}

/**
 * Returns the full display name for a class card / header.
 *
 * Examples:
 *   Class 6           → "Class 6"
 *   Class 11 (PCM)    → "Class 11 — Science PCM"
 *   Class 12 (PCB)    → "Class 12 — Science PCB"
 *   Pre-Nursery       → "Pre-Nursery"
 */
export function classDisplayName(cls: ClassRecord): string {
  const lbl = classStreamLabel(cls)
  return lbl ? `${cls.name} — ${lbl}` : cls.name
}

/**
 * Returns a SHORT stream badge label for compact UI contexts (e.g. the
 * small badge on a class card). "Science PCM" → "PCM", "Science PCB" → "PCB".
 * Returns null for non-stream classes.
 */
export function classStreamBadge(cls: { stream?: StreamKey | null }): string | null {
  if (!cls.stream) return null
  if (cls.stream === 'PCM' || cls.stream === 'PCB' || cls.stream === 'PCMB') return cls.stream
  if (cls.stream === 'Commerce') return 'Commerce'
  if (cls.stream === 'Humanities') return 'Humanities'
  return null
}
