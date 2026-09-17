# TASK 2-b: Certificates Module Polish (Principal)

Scholario school ERP at /home/z/my-project. Next.js 16 App Router + Tailwind 4 + shadcn/ui + zustand. Dev server ALREADY RUNNING at http://localhost:3000 — do NOT start/restart/build it.

## Read first
1. /home/z/my-project/worklog.md (project context)
2. Design benchmark: src/components/principal/modules/fees/fees-shared.tsx (FeeKpiCard, statusAccent, FeePill, FeeEmptyState)
3. Shared components: src/components/principal/modules/shared/ (Panel, FilterToolbar, SegmentedTabs)
4. All files in src/components/principal/modules/certificates/ (index.tsx, generate-tab.tsx, history-tab.tsx, templates-tab.tsx, previews.tsx, cert-shared.tsx)
5. Store: src/lib/store/certificates-store.ts

## Goal
Polish the Principal Certificates module (3-tab shell: Generate/Templates/History, 7-type document picker, live preview pane, seeded records) to Finance quality. Current rating 6/10 — weakest module.

## Specific improvements (restraint — NO over-design)
1. **Empty preview pane fix (TOP PRIORITY)**: preview shows generic icon until a type is selected — wasting 50% of screen. Fix: pre-select first document type (Bonafide) by default so preview shows a REAL sample immediately, rendered in a clean paper-like frame.
2. **Document type cards**: clear SELECTED state (ring-2 ring-emerald-500/40 + check icon top-right + slight tint), hover feedback, distinct small icon per type. Compact cards.
3. **Stepper guidance**: replace plain "1. Document type" heading with compact horizontal stepper "Document type → Student → Details → Preview & issue" — completed steps get check, current step emphasized. Only steps that actually exist in the flow.
4. **History tab**: real certificate registry — rows: Certificate No., Type (badge), Student (name + class), Academic Session, Issue Date, Status (semantic badges), row actions (Preview/Print/Download — use existing store actions where present; honest otherwise). Search + type filter. Responsive table.
5. **Templates tab**: template cards show type, fields included, last updated, usage count if in store. Honest.
6. **Preview quality**: certificate preview must look like an OFFICIAL SCHOOL DOCUMENT (school header, certificate number, session, student particulars, signature blocks, stamp area) — audit existing previews.tsx and polish typography/paper feel WITHOUT redesign from scratch. NOT a web-dashboard look.
7. **Empty states** for history ("No certificates issued yet") and templates.
8. **Mobile 390px**: no page overflow (scrollWidth === 390). Picker grid 1-2 cols, preview below picker.

## Browser verification (agent-browser --session cert-b — YOUR OWN session)
- Login: http://localhost:3000/#portal → "Principal" credential card → "Sign In" → Certificates.
- Screenshot before/after. Test: default preview renders; selecting each type updates preview; complete a Bonafide generate flow for any student; appears in History with correct number; Preview from history works; Print/Download respond.
- 390px check + console zero errors.

## Gates
`cd /home/z/my-project && bunx tsc --noEmit` → 0 errors. `bun run lint` → clean.

## Constraints
- ONLY modify src/components/principal/modules/certificates/ (minimal certificates-store.ts fix ONLY for real defects).
- Keep 3-tab shell and data model. NO new deps, NO gradients on document previews (paper = white/cream), NO fake data.

## Worklog
APPEND to /home/z/my-project/worklog.md a section starting `---` with: Task ID: 2-b, Agent: 2-b certificates-polish, Work Log, Stage Summary.
