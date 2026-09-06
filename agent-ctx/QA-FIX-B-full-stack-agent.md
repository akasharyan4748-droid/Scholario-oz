# Task ID: QA-FIX-B — persistence & library actions & dead module removal

Agent: full-stack agent (persistence & library)
Status: COMPLETE (tsc + eslint clean, full browser verification passed)

## Stores persisted (tenant-scoped, version 1, all additive)
| Store | Key | partialize includes |
|---|---|---|
| inventory-store.ts | scholario-inventory-v1 | items, movements |
| library-store.ts | scholario-library-v1 | books, issues, reservations |
| transport-store.ts | scholario-transport-v1 | vehicles, routes, drivers, assignments, maintenance |
| calendar-store.ts | scholario-calendar-v1 | userEvents ONLY (derived school/holiday/exam events excluded) |
| messaging-store.ts | scholario-messaging-v1 | conversations, messages, drafts, groups |

Pattern used: `migrateLegacyScopedStore(key, DEFAULT_TENANT_ID)` + curried `create<T>()(persist(..., { name: key, storage: createTenantScopedStorage(key), version: 1, partialize }))`.

## Library real actions
1. `sendReminder(loanId)` on library-store — sets `reminderSentAt?: string` (ISO) on IssueRecord; wired to the Overdue/Issued "Remind" button with toast "Reminder sent to <borrowerName>".
2. Fines report — real CSV via `downloadCSVFile` + `safeFileName('library-fines-report','csv')` (Student, Admission No, Book, Issue Date, Due Date, Days Overdue, Fine Amount, Status).
3. New `add-book-dialog.tsx` — Title/Author/ISBN/Category/Copies (+optional Publisher) → `addBook`; "Add Book" (BookPlus) outline button beside "Issue Book" in the module header.

## Procurement removal
- Removed import + moduleRegistry entry + commented nav line (+ unused Truck icon) in principal-panel.tsx.
- Deleted `src/components/principal/modules/procurement/` (8 files) and orphaned `src/lib/mock/procurement.ts`.

## Verification highlights (browser, login → Principal)
- Library Add Book → appears in Catalogue (16 rows) → reload → STILL present under `scholario-library-v1::t:t-dsg-gur-01`.
- Reminder → reminderSentAt persisted on ISS102; Fines CSV Blob captured with correct rows.
- Transport: removed assignment → reload → still removed, seed renders. Calendar: user event persisted, derived events still render. Messages: read state persisted. Inventory: qty 6→11 → reload → 11.
- Zero console/page errors. Procurement absent from nav.

Full log: see worklog.md "Task ID: QA-FIX-B" section.
