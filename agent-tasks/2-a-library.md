# TASK 2-a: Library Module Polish (Principal)

Scholario school ERP at /home/z/my-project. Next.js 16 App Router + Tailwind 4 + shadcn/ui + zustand. Dev server ALREADY RUNNING at http://localhost:3000 — do NOT start/restart/build it.

## Read first
1. /home/z/my-project/worklog.md (project context)
2. Design benchmark: src/components/principal/modules/fees/fees-shared.tsx (FeeKpiCard, statusAccent, FeeStat, FeePill, FeeEmptyState patterns)
3. Shared components: src/components/principal/modules/shared/ (Panel, FilterToolbar, SegmentedTabs, SettingsCard)
4. All files in src/components/principal/modules/library/ (index.tsx, books-tables.tsx, fines-summary.tsx, issue-book-dialog.tsx, library-shared.tsx)
5. Store: src/lib/store/library-store.ts

## Goal
Polish the Principal Library module (5-tab shell: Catalogue/Issued/Overdue/Fines/Reports) to Finance-module quality. Current rating 7-8.5/10.

## Specific improvements (restraint — NO over-design)
1. **KPI overview strip**: compact row of soft-tinted KPI cards (FeeKpiCard style: soft bg-[color]/[0.04], colored icon chip, tabular value, tiny uppercase label) ABOVE tab content: Total Books, Available Copies, Active Loans, Overdue, Pending Fines (₹). Values from `useLibraryData().analytics` ONLY (no second calculation). Clicking a card switches tabs (Issued→issues, Overdue→overdue, Fines→fines). Cards small (p-3.5, value text-xl).
2. **Catalogue rows**: keep Copies/Avail/Issued numbers; add subtle utilization hint — available as primary number with muted "of N" + thin h-1.5 progress bar (emerald when >30% available, amber low, rose zero). Keep row density.
3. **Status badges**: Available=emerald, Low Stock=amber, Out of Stock=rose (soft bg + colored text, like fees statusAccent).
4. **Filters**: search + category + status must combine correctly. Adopt shared FilterToolbar only if 4+ facets or overflow; SearchFilterBar OK for 2-3 facets.
5. **Empty states**: each tab shows FeeEmptyState pattern (icon + human title + description + clear-filters action) when empty. e.g. "No books match your filters".
6. **Mobile 390px**: NO horizontal page overflow (document.documentElement.scrollWidth === 390). Table may scroll INSIDE container (min-w) or convert to cards — match fees module convention. Touch targets >= 36px.
7. **Row actions**: Issue (catalogue), Return + Send Reminder (issued/overdue) — must work with toasts.
8. **Reports tab**: meaningful circulation data (top issued books, category breakdown, monthly activity) from store. Honest and simple.

## Browser verification (agent-browser --session lib-a — YOUR OWN session)
- Login: http://localhost:3000/#portal → click "Principal" credential card → "Sign In" → Library in sidebar.
- Screenshot before/after. Test: KPI values reconcile with tab badges; issue a book via dialog; it appears in Issued; return it; overdue tab shows fines; filters combine; empty state on no-match search.
- 390px: `agent-browser set viewport 390 844` then `agent-browser eval "document.documentElement.scrollWidth"` → 390.
- `agent-browser console` → zero errors.

## Gates
`cd /home/z/my-project && bunx tsc --noEmit` → 0 errors. `bun run lint` → clean.

## Constraints
- ONLY modify src/components/principal/modules/library/ (minimal library-store.ts fix ONLY if a real defect blocks you).
- Keep 5-tab shell, keyboard shortcuts, tab badges, dialog preselect.
- NO new deps, NO gradients, NO giant cards, NO fake data, NO dev jargon in copy.

## Worklog
APPEND (never overwrite) to /home/z/my-project/worklog.md a section starting with `---` containing: Task ID: 2-a, Agent: 2-a library-polish, Work Log steps, Stage Summary.
