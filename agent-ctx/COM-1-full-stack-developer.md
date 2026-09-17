# Task COM-1 — Communication Hub (Teacher role, honest real-data rebuild)

Agent: full-stack-developer · Status: COMPLETE · All gates green (tsc 0 / lint 0 / curl + browser QA).

## What was done
Rewrote `src/components/teacher/modules/communication/**` from mock → real data. Deleted all 9 old files
(data.ts, stat-cards.tsx, announcements-list.tsx, notice-board.tsx, parent-directory.tsx,
create-announcement-dialog.tsx, message-parent-dialog.tsx, shared.tsx, index.tsx). Created 7 new files:
types.ts, use-communication-hub.ts, shared.ts, announcements-tab.tsx, notice-board.tsx,
parent-messaging-tab.tsx, index.tsx. Edited exactly ONE line in module-router.tsx
(`<CommunicationModule onNavigate={onNavigate} />`).

## Real data sources (no new APIs — read-only)
- GET /api/announcements → announcements list + notice board + "Recent notices" stat.
  ACTUAL shape (differs from task brief!): `{announcements:[{id,title,message,audience,priority,
  sender:string,createdAt,acknowledgedBy:number,estimatedRecipients:number|null}]}`.
  sender is a plain name string (no role); there is no readCount/deliveryRate field —
  delivery rate is derived client-side as ack÷est (capped 100), hidden when est is null/0.
- GET /api/teacher/parent-connect → Parent Messaging tab + 3 stats (unread, follow-ups, reply rate).
  Types reused from '@/lib/teacher-hub-types' (ParentConnectPayload).

## Permission honesty (spec §22)
- NO school-wide composer: POST /api/announcements is principal-only; curl as Rohan → 403 FORBIDDEN (verified).
- Quiet note in Announcements tab: "School-wide announcements are published by the school administration…".
- Parent messaging = SUMMARY ONLY (no duplicate thread UI, §28): rows + "Open Parent Connect" button
  navigate via onNavigate('parent-connect'); footer states replying happens in Parent Connect.
- No fake pin/call/email/SMS/draft buttons, no fake toasts, no mock labels.

## Verification evidence
- `bunx tsc --noEmit` exit 0 · `bun run lint` 0 problems.
- curl (Rohan): login 200 · announcements 200 (20 rows, e.g. "Science fair — registration closes Friday"
  CLASS:Grade 9 - A est 11; "Grade 10 - A: Field Trip" ack 6/8) · parent-connect 200 (7 conversations,
  stats total 7 / unread 1 / followUpsOpen 3 / replyRate 100, 10 linkable students) · teacher POST → 403.
- agent-browser as Rohan: real announcements + stat strip + notice board render; Parent Messaging tab shows
  real conversations (unread badge, follow-up chips, "You:" previews); "Message Parents" switches tab;
  conversation click → navigates to Parent Connect (h1 verified); Refresh works; 390px no horizontal
  overflow; ZERO console/page errors. Screenshots: verify/com-1-announcements.png, verify/com-1-mobile.png.
- Dev server died twice during QA from sandbox memory pressure (~250MB available) — restarted with the
  documented setsid pattern each time; crashes were environmental (no code errors in log).

## Notes for sibling/next agents
- module-router.tsx communication line now passes onNavigate — do not revert.
- 'communication' folder exports `CommunicationModule` (named) with optional `onNavigate?: (key:string)=>void`.
- Full worklog entry appended to /home/z/my-project/worklog.md under "Task ID: COM-1".
