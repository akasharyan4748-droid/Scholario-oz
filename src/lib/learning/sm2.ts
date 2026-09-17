/**
 * learning/sm2 — the spaced-repetition scheduling engine (§17).
 *
 * A disciplined SM-2 variant (Anki-style four grades), implemented as PURE
 * functions so the algorithm stays abstracted from the store and can evolve
 * (or be replaced by a server-side scheduler) without touching any UI.
 *
 * Card state (persisted per card in the learning store):
 *   · ease         — ease factor (1.30–3.00, starts 2.50)
 *   · intervalDays — current review interval
 *   · reps         — successful consecutive reviews
 *   · lapses       — times the card was graded "Again" after being learned
 *   · due          — next review date (YYYY-MM-DD)
 *
 * Grade semantics (deterministic, no randomness):
 *   Again → relearn: interval 0 (still due today), ease −0.20, reps reset, lapses +1
 *   Hard  → interval × 1.2 (min 1 day), ease −0.15
 *   Good  → first review 1 day, then interval × ease
 *   Easy  → first review 3 days, then interval × ease × 1.3, ease +0.15
 *
 * A card counts as MASTERED while its interval is ≥ 21 days. "Learning" is
 * anything studied at least once but below mastery; "new" = never reviewed.
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export interface Sm2State {
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  due: string // YYYY-MM-DD
}

export const MASTERED_INTERVAL_DAYS = 21

const EASE_MIN = 1.3
const EASE_MAX = 3.0
const EASE_START = 2.5

/** Date math on plain YYYY-MM-DD strings (local-timezone safe). */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The initial SM-2 state for a brand-new card. */
export function newCardState(todayIso: string): Sm2State {
  return { ease: EASE_START, intervalDays: 0, reps: 0, lapses: 0, due: todayIso }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round1 = (v: number) => Math.round(v * 10) / 10

/**
 * Apply one review to a card's scheduling state.
 * Returns the next state — pure: no mutation, no clock reads except `todayIso`.
 */
export function scheduleReview(state: Sm2State, grade: ReviewGrade, todayIso: string): Sm2State {
  const s = { ...state }
  switch (grade) {
    case 'again':
      s.ease = round1(clamp(s.ease - 0.2, EASE_MIN, EASE_MAX))
      s.intervalDays = 0
      s.reps = 0
      s.lapses = s.lapses + 1
      s.due = todayIso // due again today
      return s
    case 'hard':
      s.ease = round1(clamp(s.ease - 0.15, EASE_MIN, EASE_MAX))
      s.intervalDays = Math.max(1, Math.round(s.intervalDays * 1.2))
      s.reps = s.reps + 1
      break
    case 'good':
      s.intervalDays = s.reps === 0 ? 1 : Math.max(1, Math.round(s.intervalDays * s.ease))
      s.reps = s.reps + 1
      break
    case 'easy':
      s.ease = round1(clamp(s.ease + 0.15, EASE_MIN, EASE_MAX))
      s.intervalDays = s.reps === 0 ? 3 : Math.max(1, Math.round(s.intervalDays * s.ease * 1.3))
      s.reps = s.reps + 1
      break
  }
  s.due = addDays(todayIso, s.intervalDays)
  return s
}

/** Card lifecycle buckets (deck + hub statistics). */
export type CardBucket = 'new' | 'learning' | 'mastered'

export function bucketOf(state: Sm2State): CardBucket {
  if (state.reps === 0) return 'new'
  return state.intervalDays >= MASTERED_INTERVAL_DAYS ? 'mastered' : 'learning'
}

/** A card is DUE when its due date is today or in the past. */
export function isDue(state: Sm2State, todayIso: string): boolean {
  return state.due <= todayIso
}
