/**
 * Curriculum presets for Indian school boards (CBSE / UP Board).
 * Used to seed subjects per class+stream when creating exams.
 */

export type Board = 'CBSE' | 'UP_BOARD' | 'ICSE' | 'STATE' | 'CUSTOM'
export type Stream = 'General' | 'Science-PCM' | 'Science-PCB' | 'Science-PCMB' | 'Commerce' | 'Humanities'

export interface SubjectPreset {
  name: string
  code: string
  fullMarks: number
  passMarks: number
  hasPractical: boolean
  practicalMarks?: number
}

// ─── Class 6–8 (Middle School) — common across CBSE/UP ─────────────────
export const MIDDLE_SCHOOL_SUBJECTS: SubjectPreset[] = [
  { name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'English', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Science', code: 'SCI', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Social Science', code: 'SST', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Sanskrit', code: 'SAN', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Computer Science', code: 'CMP', fullMarks: 50, passMarks: 17, hasPractical: true, practicalMarks: 20 },
  { name: 'Arts & Drawing', code: 'ART', fullMarks: 50, passMarks: 17, hasPractical: true, practicalMarks: 50 },
  { name: 'Physical Education', code: 'PED', fullMarks: 50, passMarks: 17, hasPractical: true, practicalMarks: 50 },
]

// ─── Class 9–10 (Secondary) — CBSE/UP Board pattern ────────────────────
export const SECONDARY_SUBJECTS: SubjectPreset[] = [
  { name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'English', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Science', code: 'SCI', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 20 },
  { name: 'Social Science', code: 'SST', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Sanskrit', code: 'SAN', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Computer Applications', code: 'CMP', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 50 },
  { name: 'Arts & Drawing', code: 'ART', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 100 },
  { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 100 },
]

// ─── Class 11–12 — Science PCM (Physics, Chemistry, Maths) ─────────────
export const SCIENCE_PCM_SUBJECTS: SubjectPreset[] = [
  { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
]

// ─── Class 11–12 — Science PCB (Physics, Chemistry, Biology) ────────────
export const SCIENCE_PCB_SUBJECTS: SubjectPreset[] = [
  { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Biology', code: 'BIO', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
]

// ─── Class 11–12 — Science PCMB (Physics, Chemistry, Maths, Biology) ─────
export const SCIENCE_PCMB_SUBJECTS: SubjectPreset[] = [
  { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Biology', code: 'BIO', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
]

// ─── Class 11–12 — Commerce ──────────────────────────────────────────────
export const COMMERCE_SUBJECTS: SubjectPreset[] = [
  { name: 'Accountancy', code: 'ACC', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Business Studies', code: 'BST', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Economics', code: 'ECO', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Entrepreneurship', code: 'ENT', fullMarks: 100, passMarks: 33, hasPractical: false },
]

// ─── Class 11–12 — Humanities ─────────────────────────────────────────────
export const HUMANITIES_SUBJECTS: SubjectPreset[] = [
  { name: 'History', code: 'HIS', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Political Science', code: 'POL', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Geography', code: 'GEO', fullMarks: 100, passMarks: 33, hasPractical: true, practicalMarks: 30 },
  { name: 'Economics', code: 'ECO', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Sociology', code: 'SOC', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33, hasPractical: false },
  { name: 'Hindi Elective', code: 'HIN', fullMarks: 100, passMarks: 33, hasPractical: false },
]

export const STREAM_PRESETS: Record<Stream, SubjectPreset[]> = {
  'General': [],
  'Science-PCM': SCIENCE_PCM_SUBJECTS,
  'Science-PCB': SCIENCE_PCB_SUBJECTS,
  'Science-PCMB': SCIENCE_PCMB_SUBJECTS,
  'Commerce': COMMERCE_SUBJECTS,
  'Humanities': HUMANITIES_SUBJECTS,
}

export const STREAM_LABELS: Record<Stream, string> = {
  'General': 'General (Class 6–10)',
  'Science-PCM': 'Science — PCM (Physics/Chemistry/Maths)',
  'Science-PCB': 'Science — PCB (Physics/Chemistry/Biology)',
  'Science-PCMB': 'Science — PCMB (Physics/Chemistry/Maths/Biology)',
  'Commerce': 'Commerce (Accountancy/Business/Economics)',
  'Humanities': 'Humanities (History/Pol Science/Geography)',
}

/**
 * Suggest subjects for a class based on its gradeLevel and stream.
 * Returns the recommended preset list — the caller (principal) can still edit.
 */
export function suggestSubjectsForClass(gradeLevel: string | null, stream: string | null): SubjectPreset[] {
  const grade = parseInt(gradeLevel ?? '0', 10)
  if (grade >= 11) {
    const streamKey = (stream as Stream) ?? 'Science-PCM'
    return STREAM_PRESETS[streamKey] ?? SCIENCE_PCM_SUBJECTS
  }
  if (grade >= 9) return SECONDARY_SUBJECTS
  if (grade >= 6) return MIDDLE_SCHOOL_SUBJECTS
  // Below class 6 — use middle school as a sensible default
  return MIDDLE_SCHOOL_SUBJECTS
}
