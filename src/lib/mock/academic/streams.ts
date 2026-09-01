/**
 * Stream definitions — Spec §4 / §14.
 *
 * Class 11 and Class 12 are stream-aware. The conceptual structure is:
 *
 *   Class 11
 *   ├── Science → PCM (Hindi, English, Physics, Chemistry, Maths)
 *   └── Science → PCB (Hindi, English, Physics, Chemistry, Biology)
 *
 *   Class 12 — same structure as Class 11.
 *
 * Streams distinguish which stream-specific subjects are offered:
 *   - PCM → Maths (not Biology)
 *   - PCB → Biology (not Maths)
 *
 * Common subjects (Hindi, English, Physics, Chemistry) belong to both
 * streams — they are not duplicated.
 *
 * For Nursery–Class 10 there is no stream concept (stream is null).
 */

export type StreamKey = 'PCM' | 'PCB' | 'PCMB' | 'Commerce' | 'Humanities' | 'General'

export interface StreamDef {
  /** Stable stream key — never changes. */
  key: StreamKey
  /** Conceptual group: Science / Commerce / Humanities / General. */
  group: 'Science' | 'Commerce' | 'Humanities' | 'General'
  /** Display label (e.g. "Science PCM"). Null for General. */
  label: string | null
}

export const STREAMS: Record<StreamKey, StreamDef> = {
  PCM:        { key: 'PCM',        group: 'Science',    label: 'Science PCM' },
  PCB:        { key: 'PCB',        group: 'Science',    label: 'Science PCB' },
  PCMB:       { key: 'PCMB',       group: 'Science',    label: 'Science PCMB' },
  Commerce:   { key: 'Commerce',  group: 'Commerce',   label: 'Commerce' },
  Humanities: { key: 'Humanities', group: 'Humanities', label: 'Humanities' },
  General:    { key: 'General',    group: 'General',    label: null },
}

/**
 * Returns the human-readable stream label for a given stream key.
 * Returns null for General / undefined / null (no stream suffix to show).
 *
 * Used to render Examination class chips like "Class 11 — Science PCM".
 */
export function streamLabel(key?: StreamKey | null): string | null {
  if (!key || key === 'General') return null
  return STREAMS[key]?.label ?? null
}

/** Returns true if the stream key is one of the Science streams. */
export function isScienceStream(key?: StreamKey | null): boolean {
  return key === 'PCM' || key === 'PCB' || key === 'PCMB'
}

/**
 * Examination uses a string field `Class.stream` from the DB / mock layer.
 * The DB values are 'Science-PCM' / 'Science-PCB' / etc. (legacy format).
 * This helper converts the legacy DB value to our StreamKey.
 */
export function streamKeyFromDbValue(value?: string | null): StreamKey | null {
  if (!value) return null
  if (value === 'Science-PCM') return 'PCM'
  if (value === 'Science-PCB') return 'PCB'
  if (value === 'Science-PCMB') return 'PCMB'
  if (value === 'Commerce') return 'Commerce'
  if (value === 'Humanities') return 'Humanities'
  if (value === 'General') return 'General'
  // Tolerate raw stream keys too
  if (value in STREAMS) return value as StreamKey
  return null
}

/** Convert our StreamKey back to the DB-format string. */
export function dbValueFromStreamKey(key?: StreamKey | null): string | null {
  if (!key || key === 'General') return null
  if (key === 'PCM' || key === 'PCB' || key === 'PCMB') return `Science-${key}`
  return key
}
