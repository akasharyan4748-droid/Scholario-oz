# TASK 2-c: Downloads + Inventory Module Polish (Principal)

Scholario school ERP at /home/z/my-project. Next.js 16 App Router + Tailwind 4 + shadcn/ui + zustand. Dev server ALREADY RUNNING at http://localhost:3000 — do NOT start/restart/build it.

## Read first
1. /home/z/my-project/worklog.md (project context)
2. Design benchmark: src/components/principal/modules/fees/fees-shared.tsx (FeeKpiCard, statusAccent, FeePill, FeeEmptyState, DateTimeText)
3. Shared components: src/components/principal/modules/shared/ (Panel, FilterToolbar, SegmentedTabs)
4. All files in src/components/principal/modules/downloads/ (index.tsx, document-list.tsx, document-detail.tsx, downloads-shared.tsx)
5. All files in src/components/principal/modules/inventory/ (index.tsx, items-table.tsx, movement-panels.tsx, add-item-dialog.tsx, item-action-dialog.tsx, inventory-shared.tsx)
6. Stores: src/lib/store/downloads-store.ts and src/lib/store/inventory-store.ts

## Goal: Downloads 7.5→9, Inventory 6.5→9 (Finance-quality, restrained)

### Downloads (real document centre — human-readable, zero dev jargon)
1. **Unify design language**: Quick Access cards + documents table currently feel like two systems. Unify card radius, typography scale, badge style. Category pills (All/Recent/Generated/Forms/Templates/Reports) need CLEAR selected state (follow SegmentedTabs conventions).
2. **Document rows**: document name, type badge with document-type icon (receipt → Receipt, form → FileText, report → FileBarChart), date, category, human size ("245 KB"), clear Download action. NO internal IDs, NO mime types, NO storage paths.
3. **Truncation**: long names line-clamp-1 with title attr tooltip — no mid-word clipping on desktop.
4. **Quick Access**: keep "most used"; open + download actions both work (check store for real actions; be honest if only toasts).
5. **Detail drawer**: clean header (doc icon + name + type badge), compact summary rows (date, category, size, belongs-to), primary Download + Print actions. Follow Finance drawer patterns.
6. **Empty state**: "No documents found" + clear-filters.

### Inventory (real school inventory management)
1. **Low-stock urgency**: rows where stock <= min get amber tint on the stock cell (bg-amber-500/10 text-amber-700) — NOT whole row. Status badge stays.
2. **Category icons**: Stationery → Pen, Sports → Trophy, Furniture → Armchair, Lab → FlaskConical, Electronics → Monitor, Cleaning → SprayBottle, default → Package. Small icon chip before item name.
3. **Row actions**: kebab menu with working actions (Adjust stock, Edit, archive).
4. **Filters**: category/location/status must combine with search correctly; adopt FilterToolbar (mobile sheet + active count) if 3+ facets.
5. **KPI/summary strip**: if missing, compact soft-tinted KPI row (Total Items, Total Value, Low Stock count, Movements this month) — values from inventory store ONLY.
6. **Movements tab**: rows read like a stock ledger (item, direction in/out, qty, by whom, date). In=emerald, Out=rose badges.
7. **Empty states** for items and movements.
8. **Add Item + Adjust dialogs**: compact, validated, save correctly.

### Browser verification (agent-browser --session dl-inv-c — YOUR OWN session)
- Login: http://localhost:3000/#portal → "Principal" credential card → "Sign In".
- Downloads: screenshots before/after; category switching; search; detail drawer; download action; 390px no overflow.
- Inventory: screenshots; filters combine; low-stock treatment visible; kebab actions; adjust stock flow (adjust an item, see movement recorded); 390px no overflow (`agent-browser set viewport 390 844` + `agent-browser eval "document.documentElement.scrollWidth"` → 390).
- Console zero errors on both.

### Gates
`cd /home/z/my-project && bunx tsc --noEmit` → 0 errors. `bun run lint` → clean.

## Constraints
- ONLY modify src/components/principal/modules/downloads/ and src/components/principal/modules/inventory/ (minimal store fixes ONLY for real defects).
- Keep existing tab shells and data models. NO new deps, NO fake data, NO over-design.

## Worklog
APPEND to /home/z/my-project/worklog.md a section starting `---` with: Task ID: 2-c, Agent: 2-c downloads-inventory-polish, Work Log, Stage Summary.
