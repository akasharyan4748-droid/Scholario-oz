# library-rewrite — Library Module Rewrite

**Task ID**: library-rewrite
**Agent**: main (Super Z)
**Task**: Rewrite the Library module to use the new `library-store.ts`

## Pre-work audit
- Read 5 existing library files: index.tsx (89 LOC), books-tables.tsx (168 LOC), issue-book-dialog.tsx (76 LOC), fines-summary.tsx (45 LOC), data.tsx (10 LOC).
- All consumed deprecated mock data from `@/lib/mock/operations` (`libraryStats`, `libraryBooks`, `issuedBooks`) — the new store replaces all three with real, mutable state.
- Reviewed reference patterns: `fees-shared.tsx` (FeePanel / FeeKpiCard), `fees-shell.tsx` (header + summary pill line + tab navigation), `messaging/index.tsx` (compact shell).

## Files delivered

### `library-shared.tsx` (NEW, 188 LOC)
- `LibTab` type (catalogue · issues · overdue · fines · reports)
- `LibKpiCard` — soft tinted KPI card (emerald / rose / amber / cyan / violet), subtle blur glow, optional onClick → tab navigation
- `LibPanel` — rounded card container with optional header + action (FeePanel-style)
- `LibPill` — compact semantic pill
- `BookStatusBadge` — Available / Low Stock / Out of Stock (with dot)
- `IssueStatusBadge` — Issued / Overdue / Returned
- `FineStatusBadge` — Pending / Paid / Waived
- `BorrowerTypePill` — Student / Teacher
- `LibEmptyState`
- `LIB_GLOBAL_STYLES` for prefers-reduced-motion

### `books-tables.tsx` (REWRITE, 247 LOC)
- `BooksCatalogue`: search (title/author/ISBN) + filter (category + availability) using store selectors. Per-row Issue button (preselects the book for the dialog).
- `IssuedBooksTable` with `filter` prop (`all` / `overdue`):
  - Borrower + Book column with gradient avatar
  - BorrowerTypePill (Student/Teacher)
  - Issue Date + Due Date (rose for overdue)
  - Days Overdue chip (overdue filter only)
  - Status badge + fine (rose, INR-formatted)
  - Actions: Return (always) + Remind (overdue filter only)
- All state from `useLibraryStore` — no mock data.

### `issue-book-dialog.tsx` (REWRITE, 215 LOC)
- Uses shared `SearchableSelect` for borrower + book pickers.
- Borrower options come from `getBorrowerOptions()` — students (canonical `students-store`) + teachers (canonical `teachers` mock).
- Book options only show books with `available > 0`.
- Auto-computed Issue Date (today) + Due Date (today + 14 days) shown as info display — store enforces 14-day default loan period.
- Selected borrower shows BorrowerTypePill + meta (admission/section for students, designation/department for teachers).
- Selected book shows category + available count pills + author.
- Fine policy notice (₹5/day).
- Calls `issueBook(bookId, borrowerId, type)` — uses the store's return value (`{success, error?}`) to drive the toast (no fake success).
- Preselects book when triggered from the catalogue (preselectBook prop).
- Emerald → teal gradient Issue button (matches SCHOLARIO accent).

### `fines-summary.tsx` (REWRITE, 437 LOC)
- `FinesSummary`:
  - 4 FineStatCards (Outstanding / Collected / Waived / Pending Count) — soft tinted backgrounds matching LibKpiCard accents.
  - Fines Ledger table with All / Pending / Paid / Waived filter.
  - Per-row Pay (emerald) + Waive (outline) actions for Pending fines only.
  - Resolved fines show "Resolved" text (no dead buttons).
  - "Report" download button — generates a toast summary.
- `LibraryReports`:
  - Most Issued Books (top 5) — horizontal bars with gradient (emerald→teal), numbered rank chips.
  - Inventory Snapshot — Issued vs Available mini-cards + ratio bar (amber + emerald) + total/overdue stats.
  - Category Distribution — full-width horizontal bars colored per category (uses store's `byCategory[].color`).
- All numbers derived from `useLibraryData` analytics (no fake data).

### `index.tsx` (REWRITE, 267 LOC)
- `LibraryModule` orchestrator:
  - Header: contextual title "Library Workspace" (NO duplicate "Library Management" title since sidebar already says "Library"), "Central Library" eyebrow, Issue Book + Reports action buttons.
  - Summary pill line: Books · Issued · Available · Overdue · Fines (real counts from `useLibraryData`).
  - Tab navigation: Catalogue · Issued · Overdue · Fines · Reports with real badges (activeIssuesCount / overdueCount / pending fines).
  - KPI cards row (5 LibKpiCards) — always visible regardless of tab.
  - Active tab panel: AnimatePresence transitions, swap between BooksCatalogue / IssuedBooksTable / FinesSummary / LibraryReports.
  - Issue Book dialog (preselects book when triggered from catalogue).
  - Keyboard shortcuts 1-5 to switch tabs (power-user only, not advertised).
  - aria-current on active tab.
  - prefers-reduced-motion support via LIB_GLOBAL_STYLES.

### `data.tsx` (DELETED)
- Obsolete mock monthly issues data — replaced by store analytics.

## Mutations wired (every action works)
- `issueBook` — Issue Book dialog → toast with book + borrower + due date.
- `returnBook` — Return button on issued/overdue rows → toast with return confirmation + fine note for overdue.
- `payFine` — Pay button on Pending fine rows → toast with amount + borrower.
- `waiveFine` — Waive button on Pending fine rows → toast with amount + borrower.
- `addReservation` — available in store (not yet surfaced in UI; not in this task's scope).

## Verification
- ESLint: 0 errors, 0 warnings.
- TypeScript: 0 library-module errors (pre-existing errors in exams/salary/finance modules are unrelated).
- Dev server: HTTP 200, Turbopack compiled cleanly.

## Design language
- Soft tinted KPI cards (emerald/amber/cyan/rose/violet accents — NO indigo/blue).
- Rounded-xl cards with subtle borders (`border-border`, `bg-card`).
- Emerald → teal gradient on primary Issue Book buttons (SCHOLARIO accent).
- Compact, dense tables with overflow-x-auto for responsiveness.
- Hidden columns on smaller screens (md:, lg:) for the table responsive layout.
- Real gradient avatars for borrowers.
- Status pills with dot indicators throughout.
- All numbers tabular-nums for crisp alignment.
