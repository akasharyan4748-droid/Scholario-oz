# TASK 2-d: Principal Settings Module Polish

Scholario school ERP at /home/z/my-project. Next.js 16 App Router + Tailwind 4 + shadcn/ui + zustand. Dev server ALREADY RUNNING at http://localhost:3000 — do NOT start/restart/build it.

## Read first
1. /home/z/my-project/worklog.md (project context)
2. Design benchmark (exemplar settings): src/components/principal/modules/fees/fees-settings.tsx + src/components/principal/modules/shared/settings-card.tsx + src/components/principal/modules/shared/settings-primitives.tsx
3. All files in src/components/principal/modules/school-settings/ (index.tsx, general-tab.tsx, academics-tab.tsx, timetable-tab.tsx, fees-tab.tsx, payroll-tab.tsx, bookstore-tab.tsx, uniforms-tab.tsx, transport-tab.tsx, library-tab.tsx, houses-tab.tsx, admission-tab.tsx, shared.tsx)
4. src/lib/store/school-settings-store/ (data model) and src/lib/tenant/ (capability gating) + src/lib/permissions.ts

## Goal
Settings must feel logical, calm, simple for a school administrator. Current rating 7.5/10. Weaknesses: flat field grouping, oversized spacing/scroll fatigue, jargon risk.

## Specific improvements (do NOT rebuild)
1. **Logical grouping (General Profile tab)**: flat identity grid → grouped sub-sections with compact headers: "School Identity" (name, code, board, established), "Contact & Location" (address, city, phone, email), "Leadership" (principal name/email), "Affiliation" (CBSE no, affiliation). Use SettingsCard-style containers, tight 10px uppercase muted section headers (Finance Settings style). Fields stay in existing responsive grid.
2. **Density**: reduce oversized field heights/padding to Finance Settings scale (h-9 inputs, compact labels). Keep touch-friendly >= 36px. Goal: less scrolling, calm.
3. **Tab content audit**: verify each of the 11 tabs' content quality: compact section cards, correct inputs, no jargon, no dev narration, no wall-of-text. Fix worst offenders. Tab labels may be simplified ONLY if confusing (e.g. "Admission Config" → "Admissions"). Do NOT reorganize tabs otherwise.
4. **Super Admin managed states**: settings that are platform-controlled (school plan, domain, platform capabilities — check src/lib/tenant/ + permissions.ts) render a compact "Managed by Super Admin" state (lock icon + tiny badge, control read-only/disabled muted). Do NOT invent new permission systems. If everything here is genuinely principal-editable, no managed states needed — say so in report.
5. **Save flow**: "Save Configuration" + dirty state must work: edit, save, toast, reload → persisted. Verify in browser.
6. **Copy audit**: replace dev/configuration jargon with plain school-administrator language. Helper lines one-line max, no paragraphs.
7. **Responsive 390px**: tabs scroll horizontally INSIDE their container (no page overflow, scrollWidth === 390); fields stack 1-col.

## Browser verification (agent-browser --session settings-d — YOUR OWN session)
- Login: http://localhost:3000/#portal → "Principal" credential → "Sign In" → Settings.
- Screenshots before/after major tabs (General, Academics, Fees, Library).
- Test: edit + save flow; tab switching; 390px no overflow; console zero errors.

## Gates
`cd /home/z/my-project && bunx tsc --noEmit` → 0 errors. `bun run lint` → clean.

## Constraints
- ONLY modify src/components/principal/modules/school-settings/ (minimal store fix ONLY for real defects).
- Keep ALL existing settings fields + persistence. NO new deps, NO over-design, NO fake data.
- Do NOT touch Fee Settings inside the Finance module (separate, already polished).

## Worklog
APPEND to /home/z/my-project/worklog.md a section starting `---` with: Task ID: 2-d, Agent: 2-d settings-polish, Work Log, Stage Summary.
