# Task ID: 2-c — Student Directory rebuild
Agent: full-stack-developer
Dir ownership: `src/components/teacher/modules/students/` + `src/app/api/teacher/students/`

## What shipped

**API — GET /api/teacher/students (extended, tenant-scoped via withUser + schoolScoped, roles: [TEACHER])**
- Authorization unchanged: classes = class-teacher-of ∪ teaches-a-subject-in (timetable teacherName), rosters = ACTIVE students of those classes, guardian name/phone exposure kept (server decision, documented in the route).
- NEW per-student `attendance`: `{ pct (null when no records), records, present, absent, late, leave, recent[≤8 newest-first] }` — PRESENT+LATE count as attended.
- NEW per-student `latestExam`: the latest exam (max startDate, fallback createdAt) that has entered marks for the student's CLASS — `{ examId, examName, subjects: [{ subjectId, subjectName, marks, maxMarks, pct }], averagePct }`. maxMarks from ExamSubjectConfig (fallback Subject.fullMarks ?? 100). DRAFT and SUBMITTED rows both count ("marks exist" = marksObtained != null); no exam ⇒ null.
- NEW per-student `classLabel` (server-derived via classLabelOf).
- curl-verified live: login rohan.mehta@greenwood.edu.in → 2 classes (Grade 9 - A · class teacher · 11 students, Grade 10 - A · subject teacher · 8 students); Aarav Sharma 95%/64 records + Periodic Assessment 1 avg 84% (Math 42/50); Ananya Gupta 73% ⇒ At Risk; Grade 10-A students ⇒ latestExam null.

**Frontend — 7 files in modules/students/ (all rewritten except deletions)**
- `types.ts` — pure client-safe DTO contract for the new payload.
- `hooks.ts` — ONE envelope fetch (`no-store`, same-origin, `{ok,data}`, 401 → signOut() once), selected-class state; default = class-teacher class.
- `shared.tsx` — DOCUMENTED THRESHOLDS (single source of truth): **At Risk = attendance < 75% OR latest exam avg < 40%** (each metric only when it exists; no data ⇒ NO status, never false "At Risk"); **Steady = ≥1 metric exists and neither rule trips**; **Top Attendance = attendance ≥ 95%**. Plus search/matchesFilter predicates, tone helpers, InfoRow, SectionLabel.
- `quick-stats.tsx` — 4 summary cards in the exact Marks-Entry StatStrip recipe (rounded-xl border p-3 sm:p-4, 500/5 tint, bare icon, uppercase label, font-display tabular-nums): Students (active-class roster count, context = class label) · Avg Attendance (mean of per-student pct over students WITH records; "—"/"No attendance recorded yet" otherwise) · Girls · Boys (gender split from Student.gender; unrecorded count surfaced when > 0) · Classes (ALL authorized classes, context = "class teacher of n"). Zero hardcoded numbers.
- `students-grid.tsx` — GlassCard roster: search (name/roll/admission, case-insensitive), filter chips All / At Risk / Top Attendance with LIVE counts, "Showing x of y" when scoped, grid 1→sm:2→lg:3 with max-h-[720px] + thin custom scrollbar. Card = GradientAvatar, name, "Roll n · classLabel", "Adm n", status chip (danger/success, dot), two metric tiles (Attendance % with records count, Latest Avg % with exam name or "No marks yet"), footer guardian name + "View profile →". Honest empty states via HubEmptyState (no students / search miss / filter miss, each naming its threshold).
- `student-profile-sheet.tsx` — right Sheet, w-full mobile / sm:max-w-lg, thin scrollbar, behavior-sheet pattern. Sections: **Overview** (class, roll, admission, school email, DOB+age, blood group, address — "Not recorded" when absent), **Attendance** (% tile + days tile + Present/Absent/Late/On-Leave count tiles + recent records with status chips, honest empty), **Academic Performance** (latest exam header + average + per-subject rows marks/max + pct chips, honest "No exam marks entered for this class yet"), **Parent / Guardian** (guardian name + phone as authorized by the server).
- `index.tsx` — composition: ModuleToolbar context = "Grade 9 - A · 11 students  ·  Grade 10 - A · 8 students" (real authorized classes) + Export CSV action (roll/admission/name/class/gender/guardian/phone/attendance%/latest-avg%); class selector chips (min-h-[40px], aria-pressed) with student-count chip and an explicit "Class Teacher" marker ONLY on isClassTeacher classes; loading = HubModuleSkeleton; error = HubEmptyState + Try again; no-classes empty state. PageTransition wrapper. No H1 (shell titles the page).

**Cleanup (verified zero importers via rg before deletion)**
- DELETED `data.tsx` (mock: progressData, scoreSequence, useClass2AStudents, @/lib/mock/students + students-store imports).
- DELETED `fee-collections.tsx` (331 lines, was NOT rendered from index.tsx — fee collections don't belong in a Student Directory; only reference was a comment inside data.tsx).
- DELETED `use-students-directory.ts` (orphaned older generation expecting a ?classId= API shape that never matched the route).

## Gates
- `bunx tsc --noEmit` → **0 errors** project-wide (one transient error in the parallel communication agent's in-flight file resolved by them before my final run).
- `bun run lint` → **0 problems** project-wide (one transient ENOENT race with the parallel analytics agent's file deletion, resolved on retry).
- dev.log: `GET / 200` and `GET /api/teacher/students 200` after final edits; no runtime errors from this module. Dev server was OOM-restarted twice by the platform mid-session (pre-existing pattern, not caused by this change — waited it out, re-verified after restart).

## Data derivations (for QA)
- Students card = ACTIVE roster count of selected class (Student.user.status ACTIVE).
- Avg Attendance = mean of per-student (present+late)/total, only over students with ≥1 Attendance row.
- Girls · Boys = Student.gender FEMALE/MALE counts (case-insensitive).
- Classes = all authorized classes (class-teacher ∪ subject-taught); "class teacher of n" from Class.classTeacherId.
- Card Attendance % / records = Attendance rows for the student; Latest Avg % = mean subject pct of the class's latest exam with entered marks.
- At Risk / Steady / Top Attendance per shared.tsx thresholds above (also restated in the filter empty-state hints on screen).
