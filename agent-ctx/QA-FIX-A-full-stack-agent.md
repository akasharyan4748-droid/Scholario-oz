# QA-FIX-A — full-stack agent (exports & actions)

## Scope
Implement REAL behavior for fake/dead (toast-only) buttons across the Principal
workspace. Found an earlier partial QA-FIX-A run had already landed most edits
in the working tree (uncommitted, no worklog record) — this session audited
every item end-to-end, verified each in the browser, fixed nothing further
(all 7 items were code-complete and correct), and produced the verification +
worklog record.

## Changed / relevant files
- `src/lib/csv.ts` (new shared helper) — `csvEscape` / `toCsvRow` / `toCsv`
  (RFC-4180 quote-wrapping for commas/quotes/newlines). Used by every CSV
  export below.
- `src/components/principal/modules/attendance/index.tsx` +
  `student-workspace.tsx` — Overview "Export" button (re-added where the
  handler existed but the button had been removed): REAL CSV of the
  ClassReport summary table (Class, Total, Present, Absent, Late, Leave,
  Rate %, Status), respects the class filter, mirrors the exact row
  derivation of `class-report.tsx` (`classTotalForIndex`, present/late/
  absent/leave math). `downloadCSVFile` + `safeFileName('attendance-overview
  [-<class>]','csv')`; toast shows real filename + row count + scope.
- `src/components/principal/modules/finance-dashboard/finance-shell.tsx` —
  header "Export" → REAL CSV of the KPI summary (period, revenue, expenses,
  surplus, margin, cash, reserve coverage, fees collected/outstanding,
  collection rate, payroll, assets/liabilities/net worth, cash change) —
  plain numbers, no ₹ in cells.
- `.../finance-statements.tsx` — "Export" → REAL CSV of the ACTIVE statement
  tab (p&L / balance sheet / cash flow) incl. summary rows; plain numbers.
- `.../finance-reports.tsx` — "Export CSV" → REAL CSV of the active report
  (summary / fee-revenue / payroll / budget / expense / income /
  receivables / payables / tax), a `buildReportCsv` twin of the ReportBody
  tables.
- `src/components/principal/modules/OfficialAdmissionLetter.tsx` +
  `OfficialAdmissionLetter/letter-html.ts` (new) — "Download PDF" now
  downloads a standalone branded HTML letter built by
  `buildAdmissionLetterHTML(data, useSchoolProfile())`: letterhead, ref/
  date/session, Student Profile Overview grid, fee summary table w/ subtotal/
  discount/final payable, digital verification ids, statutory declaration,
  parent + principal signature blocks — mirrors the React preview. Filename
  `safeFileName('admission-letter-<student>','html')`, toast w/ filename.
- `src/lib/store/live-alerts-store.ts` — added `snoozedUntil:
  Record<string, number>` (alertId → epoch ms, persisted), action
  `snoozeAlerts(ids, durationMs)` (canonical path; legacy `snooze`/
  `snoozeAll` minutes actions delegate with ×60 000), and
  `unsnoozeExpired(now?)` compute-on-read sweeper that auto-returns expired
  snoozes and cleans the map. `unsnooze`/`reset` maintain the map; persist
  partialize includes `snoozedUntil`.
- `src/components/principal/modules/dashboard/live-alerts.tsx` — mounts a
  30s interval + on-mount call to `unsnoozeExpired()`. Snoozed alerts leave
  the active list (they show in the pre-existing "SNOOZED (N)" row with
  Restore). Snooze menu options (15m / 1h / 4h / 24h) are all real ms
  durations now.
- `src/components/principal/modules/students/class-workspace-teachers-panel.tsx`
  — removed the dead "Replace" / "Temporary" toast-only buttons (panel
  itself kept; note: this component is not currently imported by any route —
  proper assignment flows live in Class details → Teachers tab).
- `src/components/principal/modules/communication/comm-circulars.tsx` —
  Download: `downloadCircular` builds a branded HTML memo (getSchoolProfile
  letterhead, CIRCULAR title, ref/date, audience/category/status meta,
  principal signature) → `downloadHTMLFile` +
  `safeFileName('circular-<refNo>','html')`. Share: `shareCircular` via
  `shareText(title, "<title> — <school>")` → toast 'Copied to clipboard'
  when copied, 'Circular shared' when shared, silent on cancel. Both wired
  on the card row (Download/Share) AND in the view modal (Share / Download
  PDF).
- `src/components/principal/modules/exams/admit-cards-section.tsx` —
  "Publish" button REMOVED (plus the local `published` state, "Published"
  summary card and published banner): the exams data layer (ExamDTO status ∈
  Draft/Scheduled/Ongoing/Completed/Cancelled) has no admit-card publish
  field, so it was a dead action. Generate/Preview/Download remain.

## Verification (agent-browser, login → Principal)
- Attendance Overview → Export (All Classes): toast
  "attendance-overview.csv · 10 class summaries · All Classes"; captured the
  real text/csv Blob — header + 10 rows (Nursery 48/46/0/2/0/96.8/Excellent …).
  With Class 2-A filter: `attendance-overview-class-2-a.csv`, 1 row
  (Class 2-A,18,15,2,1,0,83.3,Needs Attention).
- Finance Dashboard → Overview header Export: real CSV
  `financial-summary-fy25-26.csv` (Metric,Value … plain numbers, no ₹).
  Statements → Export on P&L: `pnl-statement-fy25-26.csv` with quoted
  escaped cells ("Library, Exam, Activity") ✔; Balance Sheet tab:
  `balance-statement-fy25-26.csv`. Reports → Export CSV on Financial
  Summary + Budget: `summary-report-fy25-26.csv` / `budget-report-fy25-26.csv`.
- Dashboard Live Alerts: single snooze "1 hour" → toast "Snoozed for 1
  hour", alert left the active list (store: 5 active, 1 snoozed w/
  snoozedUntil epoch); Snooze All "1 hour" → 0 active / 6 snoozed, toast
  "6 alerts snoozed for 1 hour". Auto-unsnooze: set snoozedUntil in the
  past + reload → alert returned to active list (on-mount sweep; same
  action runs on a 30s interval).
- Communication → Circulars: Download (card) → real HTML memo blob
  (`circular-DSOCIR2025042.html`, letterhead "Demo School"); Share →
  clipboard fallback → toast "Copied to clipboard · Pre-Board Exam
  Circular · Demo School"; modal "Download PDF" → same real HTML download.
- Admissions → Devansh Verma (Approved) → Issue Admission → Letter tab →
  Download PDF: real 7.3 KB branded HTML letter
  `admission-letter-Devansh_Verma.html` containing student name, Class 3,
  session, profile grid, fee summary ("Final Payable Amount Paid"),
  DOC-ADM-2026 verification id, statutory declaration, Principal Signature.
- Examinations → Mid-Term Examination → Admit Cards: no "Publish" button
  anywhere (body text scan = none); Preview + Download Generate actions
  remain; summary grid is 3 cards (Total/Classes/Papers).
- Class workspace teachers panel: "Replace"/"Temporary" gone (code-level —
  the component is not imported by any route, so no UI surface to verify).
- `bunx tsc --noEmit` clean; `bunx eslint` on all changed files clean;
  zero page errors / zero console errors across all flows; dev.log 200s
  only. No console.log debugging in any changed file.

## Deviations / notes
- Snooze durations: the existing UI menu offers 15m / 1h / 4h / 24h (not
  1h/8h/24h as the brief guessed). All are wired to real ms durations
  (1h=3 600 000, 24h=86 400 000) via the same canonical path; visuals kept
  untouched per the "no redesign" rule.
- Live alerts "filter out snoozed" is implemented as store array move
  (alerts → snoozed) with the pre-existing "SNOOZED (N)" summary row +
  Restore action retained.
- Admission letter download is HTML (per task instruction to use
  downloadHTMLFile), even though the button label reads "Download PDF".
- Circular memo body: the Circular data model has no description field —
  the memo renders title + audience/category/status meta, per available data.
- Dev server had died (port 3000 refused); restarted ONE detached instance
  (`bun run dev`, setsid/nohup) for verification.
