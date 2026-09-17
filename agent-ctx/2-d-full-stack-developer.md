# Task 2-d — Performance Analytics rebuild (full-stack-developer)

## Scope owned
- `src/components/teacher/modules/analytics/` (all files)
- `src/app/api/teacher/analytics/route.ts`
- One-line exception in `src/components/teacher/teacher-panel/module-router.tsx` (pass `onNavigate` to `<TeacherAnalyticsModule />`) — already present at line 37.

## State found on arrival
A prior run of this same task had already landed the full rebuild on disk (files + router
exception) but hit its context deadline before writing any records — the same failure mode
the worklog documents for TWC-FE-1/3. This run verified everything end-to-end, hardened the
environment story, and wrote the records. No mock files remain (`data.tsx` and the 7 mock
sub-components were already deleted; folder = exactly 7 real files).

## What ships (all values from GET /api/teacher/analytics, zero mock)

API route (single GET, `withUser` + `schoolScoped` + roles ['TEACHER'] — multi-tenant
preserved; classes = timetable cells with the teacher's name ∪ class-teacher classes):

| Field | Derivation |
|---|---|
| `classes[]` | teacher's classes, class-teacher first, `isClassTeacher` flag |
| `classAnalytics[].classAveragePct` | mean of per-student normalized averages, latest graded exam (per-subject maxMarks from ExamSubjectConfig — marks without a config are excluded, never /100) |
| `attendance` | canonical Attendance rows: present/late/absent totals + `(P+L)/total` rate + `weeklyTrend` (last 8 weeks, each label = the REAL Monday of that week) |
| `assessmentCompletion` | latest CONFIGURED exam: entered ExamMark rows vs expected (configured subjects × enrolled students) |
| `examTrend[]` | one point per graded exam, chronological by real startDate, mean of normalized marks; only exams with ≥1 config-normalizable mark |
| `subjectAverages[]` | latest graded exam, per-subject raw avg + maxMarks + pct |
| `topPerformers[]` | top 5 of the latest graded exam by normalized average |
| `needingAttention[]` | documented thresholds: latest-assessment average ≥ **15 pts below class average** (PERF_GAP_THRESHOLD) OR attendance **< 75%** with ≥ **5 records** (ATTENDANCE_MIN_PCT / ATTENDANCE_MIN_RECORDS); each entry carries concrete reason strings |

Module (7 files, all 'use client'):
- `index.tsx` — ModuleToolbar (context = `label · N students · latest graded: X`, class
  Select only when >1 class, class-teacher chip, defaults to first = class-teacher class) →
  KpiRow → PerformanceTrend (lg:span-2) + AttendanceTrend → SubjectAverages (lg:span-2) +
  TopPerformers → AttentionList. Stale-refresh keeps the last payload behind a quiet amber
  strip; first-load error = HubSectionError; loading = HubModuleSkeleton; no-classes =
  HubEmptyState.
- `kpi-row.tsx` — 4 KpiCards: Class Average / Attendance Rate / Assessment Completion /
  Needing Attention; null metrics render "—" via the `format` fallback (the NaN-safe
  pattern); context lines state the derivation (e.g. "3 of 11 students graded · PA1").
- `trend-charts.tsx` — the only 3 charts, each with an honest in-card empty state instead of
  a zero-filled chart: Performance Trend (AreaTrend, needs ≥2 graded exams; 1 exam → shows
  the single real value + why no line yet), Subject Averages (horizontal BarTrend, card
  height sized to the real list), Attendance Trend (AreaTrend, ≥2 weeks; 1 week → shows the
  overall rate + how many entries exist).
- `attention-list.tsx` — the actionable LIST (not a chart): avatar, name, Roll # · class,
  concrete reason lines (rose performance / amber attendance icons), attendance %, and a
  View Student button → `onNavigate('students')` (hidden when onNavigate absent).
- `top-performers.tsx` — compact real rankings from the latest graded exam, no growth
  badges / no fabricated deltas.
- `hooks.ts` — one no-store same-origin fetch, `{ok,data}` envelope, 401 → `signOut()`,
  quiet-reload contract (staleError keeps data on screen).
- `types.ts` — pure client-safe DTO contract.

Dates: every label derives from real DB dates (exam startDates formatted day-month via
UTC Intl; the year is appended ONLY when a trend spans multiple calendar years; weekly
labels = real Mondays). Zero hardcoded years in the module (rg-verified `202[0-9]` → no
matches). Removed per spec: donuts, animated rings, fake "+10% growth" badges,
student-growth mock section, subject-table, insights-row.

## Verification (this run)
- **API (curl, rohan.mehta@greenwood.edu.in):** 200 with `classes: [Grade 9 - A (CT), Grade 10 - A]`.
  9-A: classAvg **83.3%** (3 graded / 11, PA1 Math 42/38/45 of 50), attendance **93.4%**
  (167 rows), completion **3/77 = 3.9%**, attention **1** (Ananya Gupta — attendance flag),
  examTrend 1 point ("Periodic Assessment 1 · 9 Sept"), top 3 (Vivaan 90 / Aarav 84 /
  Diya 76), weeklyTrend 8 real-Monday points (27 Jul…14 Sept).
  10-A: classAvg **null**, attendance 92.9% (56 rows), completion 0/56, empty arrays —
  honest empty states fire, no zero charts.
- **`bunx tsc --noEmit`:** 0 errors in both owned dirs (rg-verified zero analytics lines in
  the output). Project-wide: 2 transient errors live in the PARALLEL agent's in-flight
  probe scripts (`tmp-scripts/2e-revert.ts`, `2e-verify-send.ts`, TS18047 possibly-null —
  communication agent 2-e, not app code; src/ is 100% clean).
- **`bun run lint`:** 0 problems (exit 0). eslint scoped to both owned dirs: 0 problems.
- **dev.log:** clean compiles, `GET / 200`, `GET /api/teacher/analytics 200`, zero module
  errors.
- **Browser:** partial — the module's loading/error state paths were observed rendering
  correctly, but the full data-state QA could not complete: the dev server was OOM-killed
  5× during this session (next-server ~2.9GB RSS on the 4GB box while a sibling agent's
  chrome holds ~1.6GB). Restarted and left healthy at the end. The data state itself is
  guaranteed by the type-checked DTO + the curl-verified payload + the same
  ChartCard/AreaTrend/BarTrend components browser-verified in sibling modules.

## Follow-ups for the orchestrator
1. Full browser data-state QA of the module once the box is quiet (login → Performance
   Analytics → class switch to Grade 10 - A for empty states → View Student deep-link).
2. The 2 tsc errors in `tmp-scripts/2e-*` belong to the parallel communication agent.
3. No Prisma schema change needed by this task.
4. Optional future: per-subject lines in the Performance Trend once multiple exams carry
   marks for more than one subject (the API's per-exam aggregation already keys by
   examId; adding subjectId to the trend points is a small extension).
