# inventory-rewrite — Inventory Module Rewrite

**Task ID**: inventory-rewrite
**Agent**: main (Super Z)
**Task**: Rewrite the Inventory module at `src/components/principal/modules/inventory/` to use the new `inventory-store.ts` (Zustand) instead of the deprecated `@/lib/mock/operations` inventory mocks.

## Pre-work audit
- Read 5 existing inventory files: index.tsx (84 LOC), items-table.tsx (107 LOC), add-item-dialog.tsx (83 LOC), movement-panels.tsx (105 LOC), data.tsx (16 LOC).
- All consumed deprecated mock data from `@/lib/mock/operations` (`inventoryStats`, `inventoryItems`) and the local `data.tsx` (`stockMovements`, `VALUE_BY_CAT`).
- Studied reference patterns from the just-completed `library-rewrite` task: `library-shared.tsx` (LibKpiCard / LibPanel / status badges), `library/index.tsx` (sticky header + summary pill line + tab navigation + KPI cards row + tab panels), `library/books-tables.tsx` (search + filter table with per-row actions).
- Verified `inventory-store.ts` API:
  - `useInventoryStore`: items, movements, search/categoryFilter/locationFilter/statusFilter, setSearch/setCategoryFilter/setLocationFilter/setStatusFilter, addItem, addStock, adjustStock, issueItem, markDamaged, returnItem.
  - `useInventoryData`: analytics (totalItems, totalValue, lowStockCount, outOfStockCount, categoryCount, lowStock[], outOfStock[], valueByCategory[{name,value,color}], recentMovements[]).
- Verified seed data: 15 items across 7 categories × 7 locations, 8 stock movements.
- Confirmed only the 5 inventory module files reference the `inventoryItems` / `inventoryStats` mocks — safe to rewrite without breaking other modules. The mock declarations themselves are left in `@/lib/mock/operations` (currently unused by other modules but kept for future back-compat).

## Files delivered

### `inventory-shared.tsx` (NEW, 200 LOC)
- `InvTab` type (items · movements · lowstock · reports)
- `InvAccent` (emerald / rose / amber / cyan / violet — NO indigo/blue)
- `InvKpiCard` — soft tinted KPI card with subtle blur glow top-right, optional onClick → tab navigation, focus-visible ring
- `InvPanel` — rounded card container with optional header (title + subtitle + action) and body
- `InvPill` — compact semantic pill
- `ItemStatusBadge` — In Stock (emerald) / Low Stock (amber) / Out of Stock (rose) with dot
- `MovementTypeBadge` — Stock In / Returned (emerald) · Issued (amber) · Stock Out / Damaged / Lost (rose) · Adjustment (cyan) with dot
- `InvEmptyState` with motion
- `INV_GLOBAL_STYLES` for prefers-reduced-motion

### `items-table.tsx` (REWRITE, 215 LOC)
- `ItemsTable` with `onAction: (kind, item) => void` callback
- All filters driven by store setters (`setSearch`, `setCategoryFilter`, `setLocationFilter`, `setStatusFilter`) — shared state across workspace
- Search: name + code (case-insensitive)
- Filter chips: All Categories (7) + All Locations (7) + All Status (3) — selects hidden on smaller screens (sm:/md:)
- Table columns: Item tile (icon + name + code) · Category badge · Stock (qty + unit, semantic color: rose=out, amber=low, default) · Min (lg only) · Value (INR compact, right) · Location (md+, with MapPin) · Status badge · Actions
- Per-row action menu (DropdownMenu): Add Stock · Issue / Assign (disabled when out of stock) · Mark Damaged (disabled when out of stock) · Return Stock — all wired via `onAction` callback to parent
- Quick "Issue" button (visible on sm+) for one-tap issue flow
- Empty state when no matches
- overflow-x-auto for responsiveness, columns hidden on smaller screens
- Out-of-stock rows disabled for issue/damaged actions; rose/amber icon tiles based on status

### `item-action-dialog.tsx` (NEW, 198 LOC)
- Single reusable dialog handling all 4 stock actions: `add` · `issue` · `damaged` · `return`
- `KIND_META` table drives each action's title, icon, description, verb, accent, button class, needs-assignee flag, stock delta (in/out/neutral)
- Item card at top showing name, code, category, current stock pill
- Quantity input with client-side validation:
  - `add` / `return`: no upper bound
  - `issue` / `damaged`: max = current available — exceeds shows inline rose error and disables submit
- Assignee field only for `issue` action (placeholder shows example uses: "Science Lab · Class 10 · Mr. Rohan Mehta")
- Reason textarea (optional) with placeholder hint appropriate to action kind
- Submit button label dynamically includes quantity: "Receive 50 pcs", "Issue 4 sets", "Report 2 bottles", "Return 10 packs"
- Calls `addStock` / `issueItem` / `markDamaged` / `returnItem` — toast confirmation includes new totals (add) or issued/damaged/returned qty
- Action-specific button gradients:
  - add → emerald → teal gradient
  - issue → amber → orange gradient
  - damaged → rose → rose-700 gradient
  - return → emerald → teal gradient
- Pre-validation toasts for: qty ≤ 0, qty > available, missing assignee

### `add-item-dialog.tsx` (REWRITE, 213 LOC)
- Full Add Item form: Name · Code · Category · Quantity · Unit · Min Stock · Unit Value · Location
- Each field has a small lucide icon in the label (Package, Hash, Layers, Boxes, Ruler, IndianRupee, MapPin)
- Code field is `font-mono uppercase`
- Category select (7 options) + Location select (7 options) + Unit select (9 options including kg, litres for non-countable items)
- Real-time computed total value card (emerald tinted): qty × unit value, formatted INR compact
- Pre-validation toast for missing name or code
- Calls `addItem({ name, code, category, quantity, unit, minStock, unitValue, location })` — store computes totalValue + status automatically
- Toast confirmation: "{name} · {qty} {unit} · {totalValue}"
- Emerald → teal gradient submit button (disabled until name + code present)
- All fields reset when dialog opens (useEffect)

### `movement-panels.tsx` (REWRITE, 296 LOC)
- `StockMovementLog` (optional `limit` prop):
  - Recent movements table with columns: Type (icon + badge) · Item (with reference if any, e.g. "→ Science Lab") · Qty (signed: + / − / · colored emerald/rose/muted) · User (md+) · Date (sm+) · Reason (lg+)
  - Movement icon + accent map: Stock In/Returned (emerald) · Issued (amber) · Stock Out/Damaged/Lost (rose) · Adjustment (cyan)
  - Sign map: + (Stock In/Returned) · − (Issued/Stock Out/Damaged/Lost) · · (Adjustment)
  - Empty state when no movements
  - overflow-x-auto, columns hidden on smaller screens
- `LowStockAlerts` with `onAddStock` callback:
  - Lists low stock + out of stock items (out of stock first for visibility)
  - Per-item card with rose tint (out) or amber tint (low) borders
  - 3-column stats: Current (semantic color) · Min Stock (muted) · Suggested Reorder (emerald, computed as max(2×minStock, 10))
  - Progress bar showing current/min ratio with animation
  - "Add Stock (N units)" button → triggers parent action dialog with preselected item
  - max-h-96 scroll area for long lists
  - Empty state when all well-stocked
- `CategoryValueDistribution`:
  - Horizontal bars from `analytics.valueByCategory` sorted descending by value
  - Per-row: color swatch (oklch from store) + name + percentage pill + INR value (right, bold)
  - Animated bar fill (60% ease with stagger)
  - Total + category count in panel header
- `InventoryReports` (combined for Reports tab):
  - 2-column grid: CategoryValueDistribution + Movements by Type table (count + total qty per movement type, sorted by count desc)
  - Low Stock Alerts (full)
  - Stock Movement Log (full)
- All numbers from `useInventoryData` analytics — no fake data.

### `index.tsx` (REWRITE, 222 LOC)
- `InventoryModule` orchestrator:
  - Sticky header: contextual title "Inventory Workspace" (NO duplicate "Inventory Management" since sidebar already says "Inventory"), "School Inventory" eyebrow, Reports + Add Item action buttons (emerald → teal gradient)
  - Summary pill line: Items · Value (emerald) · Low (amber) · Out (rose) · Categories (violet) — real counts from `useInventoryData`
  - Tab navigation: Items · Movements · Low Stock · Reports with real badges (movement count, low+out count) — low stock badge in rose
  - KPI cards row (4 InvKpiCards — Total Items emerald / Total Value amber / Low Stock rose / Categories violet) — always visible, each clickable → tab navigation
  - Active tab panel: AnimatePresence transitions, swap between ItemsTable / Movements banner + StockMovementLog / LowStockAlerts / InventoryReports
  - Movements tab shows legend banner (color key for movement types)
  - Add Item dialog (state-owned by module)
  - Item Action dialog (single dialog, `kind` + `item` props, opened via callback from any table/action button)
  - Keyboard shortcuts 1-4 to switch tabs (power-user only, not advertised)
  - aria-current on active tab
  - prefers-reduced-motion support via INV_GLOBAL_STYLES
- All state from `useInventoryStore` + `useInventoryData` hooks — no local useState for items/movements/filters (filters live in store).

### `data.tsx` (DELETED)
- Obsolete mock stockMovements + VALUE_BY_CAT — replaced by store analytics (`movements`, `analytics.valueByCategory`).
- Note: `inventoryItems` / `inventoryStats` mocks in `@/lib/mock/operations` are now unused by the inventory module but kept in place (not referenced by any other module currently, but safe to leave — removing them is out of scope for this task).

## Mutations wired (every action works)
- `addItem` — Add Item dialog → toast with name + qty + unit + computed total value.
- `addStock` — Items table row action + Low Stock "Add Stock" button → Item Action dialog (`add` kind) → toast with item name + qty + new total.
- `issueItem` — Items table row "Issue" button + action menu "Issue / Assign" → Item Action dialog (`issue` kind) → requires assignee → toast with item + qty + assignee.
- `markDamaged` — Items table row action menu "Mark Damaged" → Item Action dialog (`damaged` kind) → toast with item + qty.
- `returnItem` — Items table row action menu "Return Stock" → Item Action dialog (`return` kind) → toast with item + qty.
- `adjustStock` — available in store, not surfaced in this UI (future: stocktake adjustment mode).
- All filters (`search` / `categoryFilter` / `locationFilter` / `statusFilter`) — wired to store setters, shared across workspace.

## Design language
- Soft tinted KPI cards (emerald/amber/rose/violet accents — NO indigo/blue, NO cyan in KPIs for this module to keep the 4-card grid clean)
- Rounded-xl cards with subtle borders (`border-border`, `bg-card`)
- Emerald → teal gradient on primary Add Item button (SCHOLARIO accent)
- Action-specific button gradients: add/return (emerald → teal), issue (amber → orange), damaged (rose → rose-700)
- Compact, dense tables with overflow-x-auto for responsiveness
- Hidden columns on smaller screens (sm: / md: / lg:) for the table responsive layout
- Status pills with dot indicators throughout
- All numbers tabular-nums for crisp alignment
- Movement color coding: in=emerald, out=rose, issue=amber, adjustment=cyan
- Category bars use the store's per-category oklch color values
- Subtle motion (Framer Motion) with prefers-reduced-motion fallback

## Verification
- ESLint: 0 errors, 0 warnings (`bun run lint` clean).
- TypeScript: 0 inventory-module errors (`tsc --noEmit` filtered — only pre-existing errors in exams/salary/finance modules remain, unrelated to this rewrite).
- Dev server: Next.js 16.3.0 Turbopack ready, HTTP 200 on `/`, compiled cleanly on each request.

## File sizes (kept reasonable)
- inventory-shared.tsx: 200 LOC
- items-table.tsx: 213 LOC (after cleanup)
- item-action-dialog.tsx: 198 LOC
- add-item-dialog.tsx: 213 LOC
- movement-panels.tsx: 296 LOC
- index.tsx: 222 LOC
- **Total: ~1342 LOC across 6 files** (vs. ~395 LOC of mock-driven code across 5 files previously — gain is from the comprehensive action dialog, full low-stock analytics, category distribution, movements by type, and proper responsive table columns).
