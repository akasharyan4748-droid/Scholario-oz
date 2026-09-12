'use client'

/**
 * student-results-store — the canonical published result set for the
 * Student role ("My Results").
 *
 * ONE source of truth connecting the PUBLISHING side (Teacher /
 * Principal exam workflows, future) to the READING side (Student
 * Results, Dashboard academic tiles, Profile academic line):
 *
 *   Staff publishes an assessment result  →  row lands here
 *                                          →  Student Results, Dashboard
 *                                             KPIs and the Report Card
 *                                             all re-derive live.
 *
 * Every number the Student sees is computed from these records —
 * percentages, grades (School Settings scale), ranks (the SAME class
 * standings set), the trend, the snapshot and the printable report
 * card. No UI component carries its own marks.
 *
 * Academic coherence (§37/§49): all seeded assessments belong to the
 * demo school's ACTIVE session — AY 2026–2027 (Apr 2026 – Mar 2027),
 * anchored around the real clock. The latest published assessment is
 * the Mid Term Examination (published 11 Sep 2026).
 *
 * Class standings (§15/§16/§35): derived from the CANONICAL Class 2-A
 * roster (students-store) — each classmate's per-assessment percentage
 * is their roster performance with a deterministic per-assessment
 * offset (stable hash, same input → same output), while the demo
 * student's percentage ALWAYS comes from their own subject marks.
 * Rank, class size and the privacy-gated Class Top 5 therefore derive
 * from the same published result set everywhere they appear.
 */

import { create } from 'zustand'
import { useMemo } from 'react'
import { useStudentsStore } from '@/lib/store/students-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

/* ─── Types ────────────────────────────────────────────────────────── */

export type AssessmentType = 'Unit Test' | 'Mid Term' | 'Final'

/**
 * Student-visible lifecycle only (§4): an assessment is either
 * PUBLISHED (result available) or UPCOMING (conducted/awaiting
 * results — phrased for students, never exposing staff workflow).
 */
export interface AssessmentDef {
  id: string
  name: string
  type: AssessmentType
  term: 'Term 1' | 'Term 2'
  /** ISO date — first exam day. */
  conductedFrom: string
  /** ISO date — last exam day. */
  conductedTo: string
  /** ISO date the result was published, or null while upcoming. */
  publishDate: string | null
  /** For upcoming assessments: the student-facing expectation line. */
  expectedBy?: string
}

/** One component of a subject's assessment (only when the school's
 *  structure uses it — e.g. Mid Term English = Written + Oral). */
export interface MarkComponent {
  name: string
  max: number
  obtained: number
}

export interface SubjectMark {
  subject: string
  maxMarks: number
  obtained: number
  /** Dynamic component breakdown (§8/§9) — absent for single-paper
   *  assessments. When present, components sum to the subject total. */
  components?: MarkComponent[]
}

export interface ResultRemark {
  text: string
  by: string
  role: string
}

/** The published result row for one student in one assessment. */
export interface AssessmentResult {
  assessmentId: string
  studentId: string
  subjects: SubjectMark[]
  remark?: ResultRemark
}

export interface StudentResultsState {
  assessments: AssessmentDef[]
  results: AssessmentResult[]
  /**
   * Staff-side publish hook (future Teacher/Principal workflow): moves
   * an assessment to PUBLISHED and stores its result row. Students only
   * ever read — the Student role performs no writes anywhere.
   */
  publishResult: (assessment: AssessmentDef, result: Omit<AssessmentResult, 'assessmentId' | 'studentId'>, studentId: string) => void
  /** Reset to the canonical seed (dev/QA helper). */
  resetToSeed: () => void
}

/* ─── Seed — AY 2026–2027, Class 2-A (demo student STU-58) ─────────── */

const STUDENT_ID = 'STU-58'

/**
 * Marks are internally coherent by construction:
 *   UT1   126/150 = 84.0%   (21+22+20+20+21+22)
 *   UT2   132/150 = 88.0%   (22+23+22+21+22+22)
 *   Mid   274/300 = 91.33%  (46+48+44+42+45+49)
 * Components sum to their subject totals (English 38+8=46, Science
 * 34+10=44, Hindi 36+9=45, Computer Science 29+20=49).
 */
const SEED_ASSESSMENTS: AssessmentDef[] = [
  {
    id: 'UT1-2026',
    name: 'Unit Test 1',
    type: 'Unit Test',
    term: 'Term 1',
    conductedFrom: '2026-04-20',
    conductedTo: '2026-04-24',
    publishDate: '2026-05-08',
  },
  {
    id: 'UT2-2026',
    name: 'Unit Test 2',
    type: 'Unit Test',
    term: 'Term 1',
    conductedFrom: '2026-07-13',
    conductedTo: '2026-07-17',
    publishDate: '2026-07-29',
  },
  {
    id: 'MID-2026',
    name: 'Mid Term Examination',
    type: 'Mid Term',
    term: 'Term 1',
    conductedFrom: '2026-08-17',
    conductedTo: '2026-08-28',
    publishDate: '2026-09-11',
  },
  {
    id: 'UT3-2026',
    name: 'Unit Test 3',
    type: 'Unit Test',
    term: 'Term 2',
    conductedFrom: '2026-11-23',
    conductedTo: '2026-11-27',
    publishDate: null,
    expectedBy: '08 December 2026',
  },
  {
    id: 'FINAL-2027',
    name: 'Final Examination',
    type: 'Final',
    term: 'Term 2',
    conductedFrom: '2027-02-22',
    conductedTo: '2027-03-12',
    publishDate: null,
    expectedBy: '20 March 2027',
  },
]

const SEED_RESULTS: AssessmentResult[] = [
  {
    assessmentId: 'UT1-2026',
    studentId: STUDENT_ID,
    subjects: [
      { subject: 'English', maxMarks: 25, obtained: 21 },
      { subject: 'Mathematics', maxMarks: 25, obtained: 22 },
      { subject: 'Science', maxMarks: 25, obtained: 20 },
      { subject: 'Social Studies', maxMarks: 25, obtained: 20 },
      { subject: 'Hindi', maxMarks: 25, obtained: 21 },
      { subject: 'Computer Science', maxMarks: 25, obtained: 22 },
    ],
    remark: {
      text: 'A steady start to the year. Focus on reading each question carefully before answering.',
      by: 'Rohan Mehta',
      role: 'Class Teacher · 2-A',
    },
  },
  {
    assessmentId: 'UT2-2026',
    studentId: STUDENT_ID,
    subjects: [
      { subject: 'English', maxMarks: 25, obtained: 22 },
      { subject: 'Mathematics', maxMarks: 25, obtained: 23 },
      { subject: 'Science', maxMarks: 25, obtained: 22 },
      { subject: 'Social Studies', maxMarks: 25, obtained: 21 },
      { subject: 'Hindi', maxMarks: 25, obtained: 22 },
      { subject: 'Computer Science', maxMarks: 25, obtained: 22 },
    ],
    remark: {
      text: 'Clear improvement this term. Keep practising word problems in Mathematics.',
      by: 'Rohan Mehta',
      role: 'Class Teacher · 2-A',
    },
  },
  {
    assessmentId: 'MID-2026',
    studentId: STUDENT_ID,
    subjects: [
      {
        subject: 'English',
        maxMarks: 50,
        obtained: 46,
        components: [
          { name: 'Written', max: 40, obtained: 38 },
          { name: 'Oral', max: 10, obtained: 8 },
        ],
      },
      { subject: 'Mathematics', maxMarks: 50, obtained: 48 },
      {
        subject: 'Science',
        maxMarks: 50,
        obtained: 44,
        components: [
          { name: 'Written', max: 40, obtained: 34 },
          { name: 'Activity', max: 10, obtained: 10 },
        ],
      },
      { subject: 'Social Studies', maxMarks: 50, obtained: 42 },
      {
        subject: 'Hindi',
        maxMarks: 50,
        obtained: 45,
        components: [
          { name: 'Written', max: 40, obtained: 36 },
          { name: 'Oral', max: 10, obtained: 9 },
        ],
      },
      {
        subject: 'Computer Science',
        maxMarks: 50,
        obtained: 49,
        components: [
          { name: 'Written', max: 30, obtained: 29 },
          { name: 'Practical', max: 20, obtained: 20 },
        ],
      },
    ],
    remark: {
      text: 'Excellent performance. Consistent across all subjects. Keep it up!',
      by: 'Rohan Mehta',
      role: 'Class Teacher · 2-A',
    },
  },
]

export const useStudentResultsStore = create<StudentResultsState>()((set) => ({
  assessments: SEED_ASSESSMENTS,
  results: SEED_RESULTS,

  publishResult: (assessment, result, studentId) =>
    set((s) => ({
      assessments: s.assessments.map((a) =>
        a.id === assessment.id ? { ...a, publishDate: assessment.publishDate ?? new Date().toISOString().slice(0, 10) } : a
      ),
      results: [...s.results.filter((r) => !(r.assessmentId === assessment.id && r.studentId === studentId)), { ...result, assessmentId: assessment.id, studentId }],
    })),

  resetToSeed: () => set({ assessments: SEED_ASSESSMENTS, results: SEED_RESULTS }),
}))

/* ─── Derived helpers — the ONLY place numbers are computed ────────── */

export const RESULTS_STUDENT_ID = STUDENT_ID

export interface GradeBand {
  threshold: number
  grade: string
}

/** Fallback scale (defensive) — the live one lives in School Settings. */
export const DEFAULT_GRADE_SCALE: GradeBand[] = [
  { threshold: 90, grade: 'A+' },
  { threshold: 80, grade: 'A' },
  { threshold: 70, grade: 'B' },
  { threshold: 60, grade: 'C' },
  { threshold: 50, grade: 'D' },
  { threshold: 0, grade: 'E' },
]

/** Grade for a percentage, from the SCHOOL's configured scale (§11). */
export function gradeFor(pct: number, scale: GradeBand[]): string {
  const bands = scale.length > 0 ? scale : DEFAULT_GRADE_SCALE
  for (const band of bands) {
    if (pct >= band.threshold) return band.grade
  }
  return bands[bands.length - 1]?.grade ?? '—'
}

/** Raw percentage — every displayed value formats via fmtPct (§36). */
export function pctOf(obtained: number, max: number): number {
  if (max <= 0) return 0
  return (obtained / max) * 100
}

/** Centralized academic rounding — ONE rule everywhere (UI + PDF). */
export function fmtPct(pct: number): string {
  return pct.toFixed(1)
}

export interface AssessmentTotals {
  obtained: number
  max: number
  pct: number
}

/** Totals of one published result row (subject marks sum). */
export function totalsOf(result: AssessmentResult): AssessmentTotals {
  const obtained = result.subjects.reduce((sum, s) => sum + s.obtained, 0)
  const max = result.subjects.reduce((sum, s) => sum + s.maxMarks, 0)
  return { obtained, max, pct: pctOf(obtained, max) }
}

/** The student's result row for one assessment (or null). */
export function resultFor(results: AssessmentResult[], assessmentId: string, studentId: string = STUDENT_ID): AssessmentResult | null {
  return results.find((r) => r.assessmentId === assessmentId && r.studentId === studentId) ?? null
}

/** Published assessments, oldest → newest (the trend/history order). */
export function publishedAssessments(assessments: AssessmentDef[]): AssessmentDef[] {
  return assessments
    .filter((a) => a.publishDate != null)
    .sort((a, b) => (a.publishDate! < b.publishDate! ? -1 : a.publishDate! > b.publishDate! ? 1 : 0))
}

/** Upcoming assessments, next conducted first. */
export function upcomingAssessments(assessments: AssessmentDef[]): AssessmentDef[] {
  return assessments
    .filter((a) => a.publishDate == null)
    .sort((a, b) => (a.conductedFrom < b.conductedFrom ? -1 : 1))
}

/* ─── Class standings — derived from the canonical roster (§15/§16) ── */

export interface ClassStanding {
  studentId: string
  name: string
  rollNo: string
  percentage: number
  rank: number
  isMe: boolean
}

/** Stable string hash → small deterministic offset (-2.0 … +2.0). */
function assessmentOffset(seed: string): number {
  let h = 0
  const key = seed.toLowerCase()
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return ((h % 21) - 10) / 10
}

function clampPct(p: number): number {
  return Math.min(99.5, Math.max(35, p))
}

/**
 * Standings of one PUBLISHED assessment for the class, derived from the
 * canonical roster. The demo student's percentage is replaced by the
 * value computed from their own marks — rank, class size and the Top 5
 * all come from this single list (§35: same set everywhere).
 */
export function classStandingsOf(
  assessmentId: string,
  roster: { id: string; name: string; rollNo: string; overallPercent: number }[],
  myPercentage: number,
  myStudentId: string = STUDENT_ID,
): ClassStanding[] {
  const entries = roster.map((st) => ({
    studentId: st.id,
    name: st.name,
    rollNo: st.rollNo,
    percentage:
      st.id === myStudentId ? myPercentage : clampPct(st.overallPercent + assessmentOffset(`${assessmentId}:${st.id}`)),
    isMe: st.id === myStudentId,
  }))
  entries.sort((a, b) => b.percentage - a.percentage || (a.rollNo < b.rollNo ? -1 : 1))
  return entries.map((e, i) => ({ ...e, rank: i + 1 }))
}

/* ─── Trend, insights & snapshot — real derivations only (§12–§14) ─── */

export interface TrendPoint {
  assessmentId: string
  label: string
  fullLabel: string
  pct: number
  grade: string
}

/** Published-assessment trend for the student (oldest → newest). */
export function trendOf(
  assessments: AssessmentDef[],
  results: AssessmentResult[],
  scale: GradeBand[],
  studentId: string = STUDENT_ID,
): TrendPoint[] {
  return publishedAssessments(assessments).flatMap((a) => {
    const r = resultFor(results, a.id, studentId)
    if (!r) return []
    const t = totalsOf(r)
    return [{
      assessmentId: a.id,
      label: a.type === 'Unit Test' ? a.name.replace('Unit Test', 'UT') : a.type,
      fullLabel: a.name,
      pct: t.pct,
      grade: gradeFor(t.pct, scale),
    }]
  })
}

/**
 * Data-derived insight (§13) — a factual statement about the student's
 * own trajectory, or null when there isn't enough history.
 */
export function insightOf(trend: TrendPoint[]): string | null {
  if (trend.length < 2) return null
  const last = trend[trend.length - 1]
  const prev = trend[trend.length - 2]
  const delta = last.pct - prev.pct
  if (delta >= 0.5) {
    return `Your overall performance improved by ${fmtPct(delta)}% compared with ${prev.fullLabel}.`
  }
  if (delta <= -0.5) {
    return `Your overall performance dipped by ${fmtPct(Math.abs(delta))}% compared with ${prev.fullLabel} — a fresh assessment is a fresh chance.`
  }
  return 'Your overall performance has remained stable across the last two assessments.'
}

export interface SubjectSnapshotEntry {
  subject: string
  pct: number
  delta?: number
}

export interface SubjectSnapshot {
  strongest: SubjectSnapshotEntry | null
  needsAttention: SubjectSnapshotEntry | null
  mostImproved: (SubjectSnapshotEntry & { delta: number }) | null
}

/**
 * Subject snapshot (§14) — computed ONLY when at least one published
 * result exists (strongest / needs attention) and two exist (most
 * improved). Respectful academic language, never judgemental.
 */
export function subjectSnapshotOf(
  assessments: AssessmentDef[],
  results: AssessmentResult[],
  studentId: string = STUDENT_ID,
): SubjectSnapshot {
  const order = new Map(publishedAssessments(assessments).map((a) => [a.id, a.publishDate]))
  const byPublishOrder = (a: AssessmentResult, b: AssessmentResult) => {
    const pa = order.get(a.assessmentId) ?? ''
    const pb = order.get(b.assessmentId) ?? ''
    return pa < pb ? -1 : pa > pb ? 1 : 0
  }
  const published = results.filter((r) => r.studentId === studentId).sort(byPublishOrder)
  if (published.length === 0) return { strongest: null, needsAttention: null, mostImproved: null }

  const latest = published[published.length - 1]
  const rows = latest.subjects.map((s) => ({ subject: s.subject, pct: pctOf(s.obtained, s.maxMarks) }))
  const sorted = [...rows].sort((a, b) => b.pct - a.pct)
  const strongest = sorted[0] ? { ...sorted[0] } : null
  const needsAttention = sorted.length > 1 ? { ...sorted[sorted.length - 1] } : null

  // Most improved: latest vs previous, per subject (same subject set).
  let mostImproved: (SubjectSnapshotEntry & { delta: number }) | null = null
  if (published.length >= 2) {
    const previous = published[published.length - 2]
    const prevBy = new Map(previous.subjects.map((s) => [s.subject, s]))
    let best: { subject: string; pct: number; delta: number } | null = null
    for (const row of rows) {
      const p = prevBy.get(row.subject)
      if (!p) continue
      const delta = row.pct - pctOf(p.obtained, p.maxMarks)
      if (!best || delta > best.delta) best = { subject: row.subject, pct: row.pct, delta }
    }
    mostImproved = best && best.delta > 0 ? best : null
  }

  return { strongest, needsAttention, mostImproved }
}

/* ─── Composite reader — everything a Results surface needs ─────────── */

/** The student's class roster (for standings), from the canonical store. */
function useClassRoster(className: string, section: string) {
  const students = useStudentsStore((s) => s.students)
  return useMemo(
    () =>
      students
        .filter((st) => st.className === className && st.section === section && st.status === 'Active')
        .map((st) => ({
          id: st.id,
          name: st.name,
          rollNo: st.rollNo,
          overallPercent: st.academics?.overallPercent ?? 0,
        })),
    [students, className, section],
  )
}

export interface LatestResultSnapshot {
  assessment: AssessmentDef
  result: AssessmentResult
  totals: AssessmentTotals
  grade: string
  /** Derived from the SAME class standings set (null when rank hidden). */
  rank: number | null
  classSize: number
}

/**
 * useMyResults — the ONE composite reader for Student Results surfaces
 * (module, Dashboard academic tiles, Profile academic line). Resolves:
 * authenticated demo student → enrollment → active session results →
 * school-configured grading + privacy policy. External consumers get
 * the latest published result snapshot WITHOUT duplicating any
 * derivation logic (§34: one result source).
 */
export function useMyResults(studentId: string = STUDENT_ID) {
  const assessments = useStudentResultsStore((s) => s.assessments)
  const results = useStudentResultsStore((s) => s.results)
  const student = useStudentsStore((s) => s.students.find((x) => x.id === studentId))
  const className = student?.className ?? 'Class 2'
  const section = student?.section ?? 'A'
  const roster = useClassRoster(className, section)

  const resultsConfig = useSchoolSettingsStore((s) => s.results)
  const gradeScale: GradeBand[] = resultsConfig?.gradeScale?.length ? resultsConfig.gradeScale : DEFAULT_GRADE_SCALE
  const showRank = resultsConfig?.showRank ?? true
  const showClassTop = resultsConfig?.showClassTop ?? true
  const showComparison = resultsConfig?.showComparison ?? true
  const reportCard = resultsConfig?.reportCard ?? { includeAttendance: true, includePrincipalRemark: true, includeSealNote: true }

  const published = useMemo(() => publishedAssessments(assessments), [assessments])
  const upcoming = useMemo(() => upcomingAssessments(assessments), [assessments])
  const trend = useMemo(() => trendOf(assessments, results, gradeScale, studentId), [assessments, results, gradeScale, studentId])
  const insight = useMemo(() => insightOf(trend), [trend])
  const snapshot = useMemo(() => subjectSnapshotOf(assessments, results, studentId), [assessments, results, studentId])

  /** Standings per published assessment — ONE derivation each (§35). */
  const standings = useMemo(() => {
    const map = new Map<string, ClassStanding[]>()
    for (const a of published) {
      const r = resultFor(results, a.id, studentId)
      const mine = r ? totalsOf(r).pct : 0
      map.set(a.id, classStandingsOf(a.id, roster, mine, studentId))
    }
    return map
  }, [published, results, roster, studentId])

  const latest: LatestResultSnapshot | null = useMemo(() => {
    if (published.length === 0) return null
    const assessment = published[published.length - 1]
    const result = resultFor(results, assessment.id, studentId)
    if (!result) return null
    const totals = totalsOf(result)
    const list = standings.get(assessment.id) ?? []
    const mine = list.find((s) => s.isMe)
    return {
      assessment,
      result,
      totals,
      grade: gradeFor(totals.pct, gradeScale),
      rank: showRank ? (mine?.rank ?? null) : null,
      classSize: list.length,
    }
  }, [published, results, studentId, standings, gradeScale, showRank])

  return {
    student: student ?? null,
    className,
    section,
    published,
    upcoming,
    trend,
    insight,
    snapshot,
    latest,
    standings,
    gradeScale,
    gradeFor: (pct: number) => gradeFor(pct, gradeScale),
    showRank,
    showClassTop,
    showComparison,
    reportCard,
  }
}
