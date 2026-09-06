# STU-F — Z.ai Code (student module data-driven consistency pass)

## Task
Student role data-driven consistency pass: attendance calendar re-key to STU-58's 96%, attendance module 2025 layout, dashboard live fee KPI + dead-button sweep, REAL report card download, timetable 2025–26 + teacher roster alignment, persisted homework submissions, bus-tracking fake removal.

## Files changed (17)
- src/lib/mock/attendance.ts — studentAttendanceCalendar re-keyed: 25 weekday records 2025-11-06 → 2025-12-10 (17 Nov + 8 Dec), absent 2025-11-18, late 2025-12-04, rest present → (23+1)/25 = 96% = STU-58.attendance. Comment references STU-58. Export name + record shape preserved ('holiday' variant kept valid, unused).
- src/components/student/modules/attendance.tsx — subtitle + calendar card title derived from records ("November – December 2025"); two month grids (Nov + Dec 2025) derived from actual record dates (first-weekday + days-in-month computed, no hardcoded offsets); trendData inline [Jul 94, Aug 92, Sep 95, Oct 93, Nov 94, Dec 96] (last = attendancePct = 96, mirrors dashboard derivation); delta line derived (+2% vs Nov 94%); 'Overall this period' caption; KPI/gauge/counts all derive (23/1/1/25 → 96). No restyle.
- src/components/student/modules/dashboard/data.tsx — attendanceTrend now DERIVED: per-month aggregation of the calendar ('YYYY-MM' → percent), inline-history fallback for no-record months (keyed by month index — immune to the en-IN 'Sept' label quirk), LATEST month pinned to the live overall rate (attendancePct) so the endpoint can never disagree with the gauge. New attendanceWindowLabel export. Counts verified 23/1/1/25 → 96.
- src/components/student/modules/dashboard/index.tsx — KpiGrid feePending now derives LIVE from the ONE fee ledger (useFeeStore, STU-58 Success transactions → ₹4,750 paid → pending ₹9,500−₹4,750 = ₹4,750); AnnouncementsTransport receives onNavigate.
- src/components/student/modules/dashboard/announcements-transport.tsx — 'Track My Bus' (was lying toast "unavailable in demo mode") → WIRED to onNavigate('bus'); 'View all' (was handler-less) → WIRED to onNavigate('announcements').
- src/components/student/modules/dashboard/today-classes.tsx — 'November 2024' gauge caption → derived attendanceWindowLabel.
- src/components/student/modules/dashboard/homework-section.tsx — library card now reads the ONE library-store (STU-58's real overdue issue: Mathematics for Class 2, fine ₹10) instead of mock/operations with the stale admissionNo 'DSO2025018' (which rendered NOTHING since STU-B's re-key); toast-only 'Return Book' button REMOVED (students don't control returns — My Library is read-only by design).
- src/components/student/modules/dashboard/smart-up-next.tsx — toast-only 'Optimize My Day' REMOVED (not implementable); task cards keep their real onNavigate wiring.
- src/components/student/modules/dashboard/study-streak.tsx — toast-only 'Claim Today' REMOVED (playerStats is static mock; no claim action exists).
- src/components/student/modules/results.tsx — 'Download Report Card' is now REAL: buildReportCardHTML() produces a standalone printable HTML document (school letterhead from mock/school — Demo School of Scholario + CBSE affiliation + address; identity from the canonical roster STU-58: Aarav Sharma / DSO2024058 / Class 2-A / Roll 18; Unit Test 3 · Nov 2024; subject-wise table with marks/percentages/grades from examResults; total 274/300, 91.3%, A+, Rank 3/18; teacher remarks; signature lines Rohan Mehta — Class Teacher + Dr. Ananya Iyer — Principal) downloaded via downloadHTMLFile + safeFileName → Report_Card_UT3_DSO2024058.html, toast carries the real filename.
- src/components/student/modules/timetable.tsx — subtitle 'Class 2-A · Academic Year 2025–2026'; My Teachers English 'Deepa Menon' → 'Priya Nair' (real C05 English teacher).
- src/lib/mock/academics.ts — English teacher 'Deepa Menon' → 'Priya Nair' (5 weeklyTimetable slots + HW002 assignedBy) so the timetable grid / today's classes / homework match the students-store C05 subject-teacher map (T-002) and the My Teachers list.
- src/components/student/modules/homework/index.tsx + active-homework-list.tsx + data.ts — submission state moved to the NEW persisted store.
- src/lib/store/student-homework-store.ts (NEW) — zustand persist 'scholario-student-homework-v1' v1, createTenantScopedStorage; submitted: Record<homeworkId, {submittedOn}>; markSubmitted/resetSubmissions. Submit flow keeps its simulated delay, final state writes to the store; 'Done · {date}' timestamp derives from the store; closed HW004 teacher-feedback ("Reviewed"/Graded) display unchanged.
- src/components/student/modules/bus-tracking/index.tsx — toast-only fake 'Notify Parent' button REMOVED cleanly (no restyle; imports pruned).

## Deviations (documented)
1. Calendar start 2025-11-06, not the literal 2025-11-10: weekday-only records in the literal Nov 10→Dec 10 window number 23, not the mandated 25; the start moved 2 school days earlier to hit the 25-record / 23+1+1 / exact-96% invariants while ending on the pinned "today" (Wed 2025-12-10) and keeping every record in the past.
2. Trend series Jul 94 · Aug 92 · Sep 95 · Oct 93 · Nov 94 · Dec 96 (6 points ending Dec 2025, last = 96) instead of the task's literal example (Jun 95 … Nov 96) — chosen so the attendance module's inline chart and the dashboard's derived chart render the IDENTICAL series (values only; dashboard's Sep label renders 'Sept' via en-IN ICU). Nov 94 is the calendar's true per-month aggregate (16/17); Dec carries the live overall 96.
3. mock/academics English-teacher re-map is a small scope extension beyond the timetable My Teachers list — done to keep the module internally consistent and match the documented C05 subject-teacher map.
4. Homework 'Submitted' count now counts ACTIVE submissions only (closed/graded homework is counted under Closed) — the old local map double-counted HW004.

## Verification
- bunx tsc --noEmit → CLEAN (exit 0).
- bunx eslint on all 17 changed files → CLEAN (exit 0).
- dev.log: GET / 200 after full recompile, no compile errors.
- Node simulation of the derivations: present 23 / late 1 / absent 1 / total 25 / pct 96; trend [Jul 94, Aug 92, Sept 95, Oct 93, Nov 94, Dec 96]; Nov grid first weekday = Saturday (6 blanks), Dec = Monday (1 blank); window label "November – December 2025".
- Stale-string grep (₹86,000|₹64,000|₹22,000|86,000|64,000|22,000|2024–2025|2024-25|November 2024) over student modules + touched mocks: only the intentional historical exam labels in results.tsx remain (kept per spec).
