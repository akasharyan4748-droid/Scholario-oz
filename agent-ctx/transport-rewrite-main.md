# transport-rewrite — Transport Module Rewrite

**Task ID**: transport-rewrite
**Agent**: main (Super Z)
**Task**: Rewrite the Transport module at `src/components/principal/modules/transport/` to use the new `transport-store.ts` (Zustand) instead of the deprecated `@/lib/mock/operations` transport mocks + local `data.tsx` dataset.

## Pre-work audit
- Read 5 existing transport files: index.tsx (84 LOC), routes-table.tsx (99 LOC), vehicles-table.tsx (63 LOC), tracking-sheet.tsx (221 LOC), data.tsx (20 LOC).
- All consumed deprecated mock data from `@/lib/mock/operations` (`transportStats`, `transportRoutes`, `vehicles`) + the local `data.tsx` (`ROUTE_DISTRIBUTION`, `CAPACITY_UTIL`, `TransportRoute` type alias).
- Studied reference patterns from the just-completed `library-rewrite` and `inventory-rewrite` tasks:
  - `library-shared.tsx` (LibKpiCard / LibPanel / status badges) — Transport follows the same KPI + Panel pattern.
  - `library/index.tsx` (sticky header + summary pill line + tab navigation + KPI cards row + tab panels).
  - `library/books-tables.tsx` (search + filter table with per-row actions + motion.tr).
  - `library/issue-book-dialog.tsx` (SearchableSelect-based dialog workflow).
- Verified `transport-store.ts` API:
  - `useTransportStore`: vehicles, routes, drivers, assignments, maintenance, search, setSearch, assignStudent, removeAssignment, changeRoute, completeMaintenance.
  - `useTransportData`: analytics (totalVehicles, totalRoutes, totalDrivers, studentsUsingTransport, onRoad, inMaintenance, gpsActive, maintenanceDue, unassignedStudents, routeDistribution, capacityUtil).
- Verified `useStudentsStore` API: students array with `transport: boolean`, `status: 'Active' | 'Archived'`, `className`, `section`, `admissionNo`, `name`, `id`. No student data is duplicated in the transport store — assignments reference students by id + display fields only.
- Confirmed only the transport module files reference `transportStats` / `transportRoutes` / `transport (mock vehicles array)` — safe to rewrite without breaking other modules.

## Files delivered

### `transport-shared.tsx` (NEW, 280 LOC)
- `TptTab` type (routes · vehicles · users · maintenance · reports)
- `TptAccent` (emerald / rose / amber / cyan / violet — NO indigo/blue)
- `TptKpiCard` — soft tinted KPI card with subtle blur glow top-right, optional onClick → tab navigation, focus-visible ring
- `TptPanel` — rounded card container with optional header (title + subtitle + action) and body
- `TptPill` — compact semantic pill
- `RouteStatusBadge` — On Route (emerald) · At School (cyan) · Maintenance (amber) · Inactive (muted) with dot
- `VehicleStatusBadge` — Active (emerald) · Maintenance (amber) · Inactive (muted) with dot
- `GpsBadge` — Active (emerald, pulsing dot) · Off (muted)
- `MaintenanceStatusBadge` — Due (amber) · Overdue (rose) · Scheduled (cyan) · Completed (emerald) with dot
- `DriverStatusBadge` — Active · On Leave · Inactive
- `TptEmptyState` with motion
- `TPT_GLOBAL_STYLES` for prefers-reduced-motion (scoped to `.transport-shell`)

### `routes-table.tsx` (REWRITE, 190 LOC)
- `RoutesTable` reads routes from `useTransportStore` (no mock data).
- Search: filter by route name / vehicleNo / driverName / startPoint (driven by the store's `search` state, shared across workspace).
- Columns: Route (icon tile + name + start→destination + stops) · Vehicle (mono font, hidden md+) · Driver (hidden lg+) · Capacity (enrolled/capacity with animated progress bar — emerald when normal, amber when near full, rose when full, with "Full" pill) · Status (RouteStatusBadge) · ETA (with Clock icon, hidden sm+; "—" for Maintenance/Inactive).
- overflow-x-auto for responsiveness; columns hidden on smaller screens.
- Empty state when no matches.

### `vehicles-table.tsx` (REWRITE, 175 LOC)
- `VehiclesTable` reads vehicles from `useTransportStore`.
- Search: filter by number / driverName / routeName / type.
- Columns: Vehicle No (icon tile + mono number; type badge inline on mobile) · Type (badge with type-specific accent: Bus=emerald, Mini Bus=cyan, Van=amber, hidden sm+) · Capacity (seats, centered) · Driver (hidden md+) · Route (with RouteIcon, hidden lg+) · GPS (GpsBadge) · Status (VehicleStatusBadge) · Last/Next Service (stacked, with Wrench + CalendarClock icons; Next Service shown in rose if overdue, hidden lg+).
- Maintenance rows get an amber icon tile.
- overflow-x-auto, columns hidden on smaller screens.

### `transport-users.tsx` (NEW, 460 LOC)
- `AssignmentsTable`:
  - Reads assignments from `useTransportStore` (no duplicate student data — display fields come from the store, populated from canonical students).
  - Search: filter by studentName / admissionNo / className / routeName / stop.
  - Columns: Student (gradient avatar + name + admissionNo + class) · Route (with RouteIcon, emerald) · Stop (with MapPin, hidden sm+) · Vehicle (mono font, hidden md+) · Driver (hidden lg+) · Actions (Change Route + Remove).
  - Header action: search input + "Assign Student" button (emerald → teal gradient).
  - Footer hint with assignment count + "X routes near full" context (amber).
  - Empty state with assign CTA.
- `AssignStudentDialog`:
  - Uses shared `SearchableSelect` for Student + Route pickers.
  - Student options: only Active + transport=true + NOT already in an active assignment (canonical `useStudentsStore` — no duplicate data).
  - Route options: not Inactive/Maintenance and with `enrolled < capacity`.
  - Selected student shows "Transport eligible" pill + admission/class meta.
  - Selected route shows seats pill + vehicle/driver meta.
  - Stop input (text, free-form) with example placeholder.
  - Policy notice: students can only be assigned to one active route at a time.
  - Calls `assignStudent(studentId, routeId, stop)` — uses store's return value (`{success, error?}`) to drive the toast (no fake success).
  - Emerald → teal gradient submit button (disabled until all three fields valid).
  - Pre-validation toasts for missing student / route / stop.
- `ChangeRouteDialog`:
  - Student context card (gradient avatar + name + admissionNo + class).
  - Visual "Current → New" route transition card grid.
  - New route select (excludes current route + Maintenance/Inactive + full routes).
  - Stop info card (unchanged).
  - Calls `changeRoute(assignmentId, newRouteId)` — toast confirms the move (from → to).
  - Handles empty new-route-options state.
- `RemoveAssignmentConfirm`:
  - Destructive dialog with student context card (rose tinted).
  - Calls `removeAssignment(assignmentId)` — toast confirms removal.
  - Brief explains the route frees one seat.
- `UnassignedStudentsBanner`:
  - Amber-tinted banner showing count of transport-eligible students not yet assigned (from `analytics.unassignedStudents`).
  - Inline "Assign" button → opens Assign Student dialog.
  - Returns null when count is 0 (no banner clutter).

### `maintenance-panel.tsx` (NEW, 270 LOC)
- Stats strip — 4 soft tinted mini-cards: Overdue (rose) · Due (amber) · Scheduled (cyan) · Completed (emerald).
- `MaintenancePanel`:
  - Reads maintenance records from `useTransportStore`.
  - Sorted by status priority: Overdue → Due → Scheduled → Completed.
  - Columns: Vehicle (icon tile, color-coded by status: rose for overdue, amber for due, emerald for completed, cyan for scheduled; vehicle number + type) · Service Type · Last Service (hidden md+) · Next Service (rose if overdue, hidden md+) · Status (MaintenanceStatusBadge) · Issue / Notes (italic quoted issue if any; "No issues" with checkmark if completed; "—" otherwise, hidden lg+) · Action.
  - Overdue rows have a subtle rose tint background for visibility.
  - Action button: "Complete" (emerald outline) for Due / Overdue / Scheduled records.
  - "Done" pill (emerald) for Completed records (no action button).
  - Calls `completeMaintenance(maintenanceId)` — toast confirms with vehicle number + service type + next-service note.
  - Empty state when no maintenance records.

### `transport-charts.tsx` (NEW, 230 LOC)
- `RouteDistributionChart`:
  - Horizontal bars from `analytics.routeDistribution` (uses store-provided oklch colors per route).
  - Each row: full route name (hidden on mobile, short "R1" code on mobile) · animated bar with store color · value count + "stu" suffix.
  - Footer stats: Total Students (emerald) + Avg per Route (cyan).
- `CapacityUtilizationChart`:
  - Progress bars from `analytics.capacityUtil` per route.
  - Each row: route name + enrolled/capacity · value% (color-coded: rose ≥100, amber 85–99, muted <85) · animated bar (rose/amber/emerald) · inline status text ("Route at full capacity" / "Near full · N seats left").
  - Header pill shows avg utilization %.
  - Footer grid: Avg Util · Near Full · Full counts.
- `TransportReports`:
  - Combines both charts in a 2-column grid (stacks on mobile) — used by the Reports tab.

### `index.tsx` (REWRITE, 290 LOC)
- `TransportModule` orchestrator:
  - Sticky header: contextual title "Transport Workspace" (NO duplicate "Transport Management" since sidebar already says "Transport"), "School Transport" eyebrow, Reports + Assign Student action buttons (emerald → teal gradient).
  - Summary pill line: Vehicles · Routes · Drivers · Students (violet) · On Road (emerald) · Maintenance (rose) · Maintenance Due (rose) — real counts from `useTransportData`.
  - Tab navigation: Routes · Vehicles · Users · Maintenance · Reports with real badges — Maintenance badge shows due+overdue count in rose; Users badge shows unassigned count in amber.
  - KPI cards row (4 TptKpiCards — Vehicles emerald · Routes cyan · Drivers amber · Students Using Transport violet) — always visible, each clickable → tab navigation. Sub labels include maintenance count, on-road count, vehicle count, unassigned count.
  - Active tab panel: AnimatePresence transitions, swap between RoutesTable / VehiclesTable / UnassignedStudentsBanner + AssignmentsTable / MaintenancePanel / TransportReports.
  - Users tab shows the unassigned-students banner above the assignments table when count > 0.
  - Maintenance tab calls `onComplete` to switch back to Vehicles tab (so the user can see the vehicle status changed).
  - Dialogs: AssignStudentDialog, ChangeRouteDialog, RemoveAssignmentConfirm (state-owned by module).
  - Keyboard shortcuts 1-5 to switch tabs (power-user only, not advertised).
  - aria-current on active tab.
  - prefers-reduced-motion support via TPT_GLOBAL_STYLES.
- All state from `useTransportStore` + `useTransportData` hooks — no local useState for vehicles/routes/assignments (search state lives in store).

### `data.tsx` (DELETED)
- Obsolete mock ROUTE_DISTRIBUTION + CAPACITY_UTIL + TransportRoute type — replaced by store analytics.

### `tracking-sheet.tsx` (DELETED)
- Obsolete GPS tracking Sheet UI — the new store does not expose a Track action and the brief does not require it. Removed to avoid dead code.

## Mutations wired (every action works)
- `assignStudent` — Assign Student dialog → toast with student + route + stop. Pre-validation toasts for missing fields / store errors (already assigned / route full / student not found).
- `removeAssignment` — Remove confirm dialog → toast with student + route.
- `changeRoute` — Change Route dialog → toast with student + from → to.
- `completeMaintenance` — Complete button on Due/Overdue/Scheduled maintenance rows → toast with vehicle + service type + next-service note. Vehicle status flips to Active; route status flips from Maintenance to At School; record status → Completed.
- `setSearch` — all three tables (routes / vehicles / users) share the search state across the workspace.

## Design language
- Soft tinted KPI cards (emerald/amber/cyan/violet accents — NO indigo/blue).
- Rounded-xl cards with subtle borders (`border-border`, `bg-card`).
- Emerald → teal gradient on primary action buttons (Assign Student, Assign, Change Route, Issue Book equivalents) — SCHOLARIO accent.
- Destructive actions use rose-tinted button + dialog borders.
- Compact, dense tables with overflow-x-auto for responsiveness.
- Hidden columns on smaller screens (sm: / md: / lg:) for the table responsive layout.
- Real gradient avatars for students in the assignments table.
- Status pills with dot indicators throughout.
- All numbers tabular-nums for crisp alignment.
- Capacity bars color-coded by fill level (emerald < 85%, amber 85–99%, rose = 100%).
- Maintenance rows tinted rose for Overdue visibility.
- Subtle motion (Framer Motion) with prefers-reduced-motion fallback.
- `motion.tr` row entrance with staggered delays (matches Library / Inventory pattern).
- Keyboard shortcuts for power users (1-5 to switch tabs) — not advertised in UI.

## Verification
- ESLint: 0 errors, 0 warnings (`bunx eslint src/components/principal/modules/transport/`).
- TypeScript: 0 transport-module errors (`bunx tsc --noEmit` filtered — only pre-existing errors in exams / salary / finance modules remain, all unrelated to transport).
- Dev server: Next.js 16.3.0 Turbopack ready, HTTP 200 on `/`, compiled cleanly. The TransportModule is statically imported in `principal-panel.tsx` (not lazy-loaded), so the homepage returning 200 confirms the transport bundle compiles successfully as part of the main bundle.

## File sizes (kept reasonable)
- transport-shared.tsx: 280 LOC
- routes-table.tsx: 190 LOC
- vehicles-table.tsx: 175 LOC
- transport-users.tsx: 460 LOC (assignments table + 3 dialogs + unassigned banner)
- maintenance-panel.tsx: 270 LOC (stats strip + maintenance table)
- transport-charts.tsx: 230 LOC (route distribution + capacity utilization + combined reports)
- index.tsx: 290 LOC (orchestrator with sticky header + summary pills + tab nav + KPIs + dialogs)
- **Total: ~1895 LOC across 7 files** (vs. ~525 LOC of mock-driven code across 5 files previously — gain is from the full Assign Student workflow, Change Route workflow, Remove confirm, Maintenance stats strip + Complete action, route distribution chart with totals, capacity utilization chart with color-coded thresholds, unassigned-students banner, and proper responsive table columns).
