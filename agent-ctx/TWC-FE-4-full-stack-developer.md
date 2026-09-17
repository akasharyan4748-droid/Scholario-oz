# TWC-FE-4 — Teacher Dashboard frontend rebuild (full-stack-developer)

Task: Rebuild `src/components/teacher/modules/dashboard/` on the real
`GET /api/teacher/dashboard` aggregate (TWC-2 backend), deleting every mock
surface. Reference quality bar: student dashboard v2
(`src/components/student/modules/dashboard/`).

## Files deleted (6 — all mock)
- `data.ts` (performanceTrend / subjectSplit / weeklyBars / quickInsights / quickActions / recentActivity constants)
- `quick-insights.tsx`
- `weekly-performance.tsx`
- `widgets.tsx` (CalendarWidget / AttendanceGauge / RecentActivity)
- `student-snapshot.tsx`
- `class-health-alerts.tsx`

## Files created (3)
- `types.ts` — full DTO contract for the aggregate (TeacherPeriod with
  nullable startTime/endTime/room mirroring the Timetable schema,
  AttendanceSnapshot, CurriculumAssignment w/ LessonTopicState union,
  TeacherHubCounts, TeacherNotice).
- `hooks/use-teacher-dashboard.ts` — single-fetch hook: `{ ok, data }`
  envelope, `cache: 'no-store'`, `credentials: 'same-origin'`, 401 → shared
  `signOut()` (in-flight guard, mirrors parent-connect/hooks.ts). Loading
  only while no data; reload failure KEEPS stale data + `staleError` (quiet
  strip) instead of a full-page error. Also exports client-clock helpers:
  `periodsWithState` (current/completed/upcoming), `formatTime(Range)`,
  `greeting`, `relativeTime` (notice dates).
- `attendance-card.tsx` — class-teacher attendance prompt: amber "not marked
  yet" card + primary "Mark now" → onNavigate('attendance'); calm emerald
  "marked" row with real counts + quiet "View". Renders null when the
  teacher has no class-teacher classes.

## Files rewritten (5)
- `index.tsx` — composition: stale-strip → WelcomeBanner → TeacherKpiCards →
  AttendanceCard → TodayClasses → QuickActions+NoticeBoard → PendingActions.
  Layout-matched `DashboardSkeleton`; full retry card on fatal error
  (student-v2 pattern). No more useAuth/mock identity wiring.
- `welcome-banner.tsx` — GlassCard hero with subtle emerald whisper (old
  orange gradient banner gone): greeting + real teacher name + "Class
  Teacher · {labels}" (classTeacherOf only) + server date + 2 live facts
  (periods today · unread parent messages) + per-assignment chips
  ("Grade 9 - A · Mathematics · 8/wk").
- `kpi-cards.tsx` — 4 KpiCards: Classes Today (real periods), Lessons
  Completed (avg curriculum pct, suffix %, "x of y topics this term"),
  Unread Messages (hub), Open Concerns (hub) → falls back to Open Follow-ups
  → both zero renders honest "All caught up — nothing needs attention".
- `today-classes.tsx` — real today's periods (time tile start/end, subject,
  class, room, P{n}; CURRENT period subtly highlighted via 30s device-clock
  tick; honest "No classes scheduled today") spanning 2 of 3 columns +
  **Today's Lessons** panel: one card per curriculum assignment (topic +
  unit + status chip via TOPIC_BADGES with `in`-guard, progress
  completed/total · pct, "Open Lesson Planner" → onNavigate('lesson-planner'),
  todayReason when topic null). Fake ClassPerformanceChart deleted.
- `quick-actions.tsx` — QuickActions kept byte-identical in behavior
  (quickActions const inlined after data.ts deletion; keys attendance /
  lesson-planner / marks / communication / analytics / students all valid).
  NoticeBoard rewired to a real `notices: TeacherNotice[]` prop: title,
  sender, relativeTime date, Important badge (HIGH/URGENT), "No notices"
  empty state, "View all" → communication. `@/lib/mock/operations` import
  removed.

## Kept unchanged
- `pending-actions.tsx` (already real — fetches parent-connect/behavior/
  mentoring aggregates itself; mtime verified untouched).

## Verification
- `bunx tsc --noEmit` → 0 errors.
- `bunx eslint src/components/teacher/modules/dashboard --ext .ts,.tsx` → 0 problems.
- Zero mock imports in the dashboard folder (grep: only doc comments mention
  the removed mocks). `src/lib/mock/academics` + `operations` untouched for
  other modules.
- Nothing outside the dashboard folder modified (git status + mtimes: all
  non-dashboard changes predate this session).
- dev.log: transient "Module not found ./widgets" errors only during the
  mid-rewrite window (delete-then-rewrite); final state recompiled clean
  ("✓ Compiled").

## Deviations
- None material. employeeId from the aggregate is not rendered (spec listed
  the hero line content without it); it remains available in the payload.
