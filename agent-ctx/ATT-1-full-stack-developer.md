# ATT-1 — Class Attendance (CT baseline + ST prefill workflow)

Agent: full-stack-developer · Status: COMPLETE · All gates green.

## What was found on resume
This task RESUMED an interrupted prior attempt. All target files were already
on disk with no worklog entry:
- `prisma/schema.prisma` — SubjectSessionAttendance model (+ back-relations), already pushed
- `prisma/seed-class-attendance.ts` — complete, already run
- `package.json` — `db:seed-class-attendance` script present
- `src/lib/class-attendance-types.ts`, `src/lib/class-attendance.ts` — complete
- `src/app/api/teacher/class-attendance/route.ts` — complete
- `src/components/teacher/modules/attendance.tsx` — rewritten (AttendanceModule, zero props)

I audited every file against the spec (auth chain, ClassSubjectAssignment
isActive semantics, classLabelOf, auditTeacherAction signature, envelope
convention, fetch discipline, prefill UX rules) — **no code changes were
needed**. This session performed: DB-state confirmation, full curl QA,
browser QA, test-row cleanup, and the worklog/agent-ctx records.

## Files (boundaries respected — nothing else touched)
| File | State |
|---|---|
| prisma/schema.prisma | SubjectSessionAttendance + relations (already on disk, verified) |
| prisma/seed-class-attendance.ts | idempotent seed (already on disk, verified) |
| package.json | only `db:seed-class-attendance` script added |
| src/lib/class-attendance-types.ts | DTO contract (client-safe) |
| src/lib/class-attendance.ts | scopes + read-only view + submit engine |
| src/app/api/teacher/class-attendance/route.ts | GET/POST, withUser TEACHER |
| src/components/teacher/modules/attendance.tsx | full module rewrite |

## API contract
- `GET /api/teacher/class-attendance` → `{scopes:[{classId,classLabel,isClassTeacher,subjects:[…]}], today}`
- `GET ?classId&date[&subjectId]` → view (READ-ONLY — viewing creates NOTHING)
- `POST {classId, subjectId?, date, entries:[{studentId,status}]}` → refreshed view
  - SUBJECT mode → SubjectSessionAttendance upserts; submitter is CT → ALSO baseline upserts
- Errors: UNAUTHORIZED/FORBIDDEN/NOT_FOUND/CLASS_REQUIRED/SUBJECT_REQUIRED/INVALID_DATE/FUTURE_DATE/BAD_STATUS/BAD_ENTRIES/ROSTER_MISMATCH

## Key semantics
- Scope = ACTIVE ClassSubjectAssignment (teacherId = Teacher-table id) ∪ classTeacherId (userId)
- draft = sessionStatus ?? baselineStatus ?? 'present' (the prefill rule)
- Statuses: present/absent/late/leave only; no future dates; entries must cover exactly the roster
- Baseline writes use day-range lookup-then-write (legacy non-midnight rows tolerated)

## Verification evidence
- `bunx tsc --noEmit` → 0 errors; `bun run lint` → 0 problems
- Curl: Rohan scopes/GET/POST/persist/upsert/CT_DAILY ✓; Arjun prefill on seeded day with SSA count UNCHANGED by GET (22→22) ✓; 7 negative cases ✓
- Browser (Rohan): CT note → mark → Save → toast + "Submitted ✓ 4:36 pm" → edit → "Update Submission"; seeded day renders submitted state; ZERO console/page errors; screenshot verify/att-1-submitted.png
- Cleanup: ALL live TODAY (2026-09-16) test rows deleted — today is pristine for the live demo

## Demo login notes
- rohan.mehta@greenwood.edu.in / **teacher123** (brief's "n123" no longer valid)
- teacher2/teacher3@demoschool.edu / **password123**

## Seed state (final)
- Grade 9-A baseline: 2026-09-14 (9 PRESENT, 1 ABSENT, 1 LATE), 2026-09-15 (9 PRESENT, 1 ABSENT, 1 LEAVE) — marked by CT Rohan
- One subject session: Rohan · Mathematics · 9-A · 2026-09-15 (one LATE exception vs baseline)
