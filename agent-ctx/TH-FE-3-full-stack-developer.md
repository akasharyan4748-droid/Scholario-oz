# TH-FE-3 — Student Mentoring frontend module

Agent: full-stack-developer
Task: Rewrite `src/components/teacher/modules/mentoring/` from mock placeholder to the real, server-backed Student Mentoring module (Teacher Workspace).

## What was done

Deleted all seven mock files (index.tsx, data.tsx, mentees-tab.tsx, groups-tab.tsx, sessions-tab.tsx, mentee-detail-dialog.tsx, log-session-dialog.tsx) and wrote eleven fresh files:

- `shared.ts` — status/type/goal config maps (badge + chip tones), button recipes (PRIMARY_ACTION / GHOST_ACTION / *_SM), `sessionTypeMeta` with graceful fallback for legacy free-string session types (seed contains `social` which is NOT in the SessionType union), `supportTypeLabel`, `priorityMeta`, `dueMeta` (Overdue by N days / Due today / date), `isPastDate`, `toInputDate`/`todayInputDate`.
- `hooks.ts` — `useMentoring()`: ONE fetch to `/api/teacher/mentoring` (`cache: 'no-store'`, `credentials: 'same-origin'`), 401 → `void signOut()`, loading/error/retry (mirrors student dashboard data.ts). Mutation helpers (addMentee / updateMentee / logSession / addGoal / updateGoalStatus / updateFollowUp) POST/PATCH the real routes then `reload()`. After each aggregate load publishes `followUpsOpen` to `useTeacherHubStore` — passing the CURRENT `parentUnread` through explicitly because the store's `setCounts` defaults unspecified keys to 0 (passing only `followUpsOpen` would clobber the Parent Connect badge).
- `index.tsx` — `MentoringModule({ onNavigate? })`: ModuleToolbar (context `name · Mentor · N mentees · N sessions this month`; "+ Add Mentee" ghost + "+ Log Session" primary, exact recipes) → 4 HubStatCards (Active Mentees emerald/Users, Sessions This Month sky/CalendarCheck, Follow-ups Due amber/AlarmClock, Needing Support rose/HeartHandshake) → pill tab strip with counts + rose dot when overdue > 0 (horizontal scroll @390px) → AnimatePresence mode="wait" tab bodies. Focus deep-link: consumes `useFocusStore` focus (moduleKey mentoring, type mentee, id `mnt-<studentId>`) → opens mentee sheet → clearFocus(). First load → HubModuleSkeleton; error → HubSectionError retry.
- `mentees-tab.tsx` — calm enterprise list rows (avatar, name, roll·class, status badge w/ dot, support type, last session relative, follow-up due chip, `N goals · M achieved` w/ emerald achieved; archived rows opacity-60 + chip) → click opens mentee sheet. HubEmptyState with Add Mentee action.
- `sessions-tab.tsx` — one GlassCard list: date rail (w-16, tabular-nums), student + session type chip (tone per type, fallback for unknown), discussion line-clamp-2, meta row (duration · expandable action items as CheckCircle2 rows · follow-up chip). Exports `SessionTypeChip`.
- `goals-tab.tsx` — flat list: student, title, target, review date (rose when past & not achieved), status badge (Achieved = filled emerald), inline "Update" → compact Select → PATCH with optimistic override map + revert on error + toast. "New Goal" primary-sm in tab header + count line. Exports `GoalStatusBadge`.
- `follow-ups-tab.tsx` — dedicated view: student + reason + note, due chip (Overdue by N days rose / Due today amber / date muted), priority (High rose dot), source hint "Mentoring", actions Complete (emerald text button → PATCH done → toast.success('Follow-up completed')), Reschedule (Popover w/ date input → PATCH dueDate), Open Student (→ mentee sheet). Overdue rows sort first.
- `mentee-detail-dialog.tsx` — right Sheet (w-full, sm:max-w-lg): GradientAvatar lg header + status badge + support type + notes; quick actions (Log Session primary-sm prefilled, Add Goal ghost-sm prefilled, View Behavior → onNavigate('behavior') + close, Message Parent → onNavigate('parent-connect') + close); status updater Select + Archive/Reactivate; Goals block (inline update select, achieved → quiet emerald check); Timeline (sessions + this student's follow-ups merged desc — derived from the payload only); hydrating skeleton when payload still loading; graceful "not a mentee yet" / "no longer in scope" states.
- `log-session-dialog.tsx` — student select (prefill via defaultStudentId), date (default today), type select, discussion (required), action items textarea (one per line → string[]), duration, follow-up date → POST → toast 'Session logged'.
- `goal-dialog.tsx` — student (prefill), title (required), target, review date, status (default in-progress) → POST.
- `add-mentee-dialog.tsx` — student select with "Mentee" tag on already-active mentees (still selectable — upsert updates), status, support type, notes → POST.

## Verification

- `bunx tsc --noEmit` → 0 errors.
- `bunx eslint src/components/teacher/modules/mentoring --ext .ts,.tsx` → 0 problems.
- Dev server was DOWN at finish time (parallel-agent compile storms / OOM history); transient "Module not found ../modules/mentoring" lines in dev.log are from the delete→rewrite window and are resolved by the new index.tsx. Runtime QA belongs to the orchestrator per task spec.

## Key decisions / deviations

1. **teacher-hub-store setCounts**: spec said "only pass followUpsOpen", but the store implementation defaults unspecified keys to 0 — passing only followUpsOpen would reset `parentUnread`. I read the current `parentUnread` from the store and pass BOTH keys so the Parent Connect badge is never clobbered. (Store file is outside my write scope.)
2. **Timeline "completed+open follow-ups"**: the GET aggregate returns OPEN follow-ups only; completed ones are not in the payload. The sheet timeline therefore shows sessions + this student's open follow-ups (the scheduling session also shows its follow-up date). No fabricated completed entries.
3. **Session type fallback**: seed data contains `type: 'social'` sessions which are outside the `SessionType` union/labels. `sessionTypeMeta()` prettifies unknown keys ("Social") on the calm general tone instead of crashing or showing a blank chip.
4. **Sheet stays open** when prefilling Log Session / Add Goal from the mentee sheet (dialog stacks above); only the cross-module navigations close the sheet.
5. Mentees tab count = assignments.length (all rows incl. archived are listed); Active Mentees stat card uses stats.activeMentees.
