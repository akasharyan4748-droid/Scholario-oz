# UX-2 — My Profile Redesign + School ID Card Cleanup

Task ID: UX-2
Agent: full-stack-developer subagent
Scope: spec §8–§17, §50 — Profile module hero redesign, tabs cleanup, School ID card QR removal.

## What changed

### 1. `src/components/student/modules/profile.tsx` (full hero + tabs refactor)
- REMOVED `SectionHeading title="My Profile"` (§3/§4/§8 — sidebar already carries the module name; content now begins directly with the identity card). `SectionHeading` import dropped; also dropped the previously-unused `Heart` icon import.
- REMOVED the coloured horizontal gradient bar (`h-14 sm:h-16 from-violet-500…` with avatar pulled up via `-mt-8`). It caused text collision against the colour area.
- NEW identity card: `GlassCard p-5 sm:p-6 relative overflow-hidden` with two soft corner tints (violet top-right, emerald bottom-left, both `blur-3xl`, `pointer-events-none`, never crossing text). Layout: `flex-col gap-5 → sm:flex-row sm:items-center sm:gap-6` — avatar (16/20 violet gradient tile, spring entrance, emerald ShieldCheck active tick `ring-2 ring-white`) | name block (`h2 font-display text-xl sm:text-2xl font-extrabold truncate` + StatusBadge Active derived from `s.status` + Captain/Monitor position badges + "Class 2-A · Roll #18 · Tagore House" line) | [View School ID] button (`w-full sm:w-auto` — full-width touch target on mobile).
- Academic Snapshot (§11): derivations untouched (attendance/fee/overall/rank all live from canonical stores); header converted to the shared `SectionLabel` pattern (§48 scale) with the session label as the right-aligned hint — quieter, doesn't dominate.
- Tabs (§12/§13): inline pill bar replaced with the shared `ModuleTabBar` + `ModuleTabPanel` from `student/modules/shared-tabs.tsx` (one pill-tab pattern across Learning/Notices/Progress/Profile).
- Compact helper texts (§13): Personal note → "School-managed information · ask the office for corrections"; Parents note → "Shared with you as permitted by the school".
- My Responsibility strip (permission-derived) and all store derivations kept EXACTLY as-is.

### 2. `src/components/student/shell/student-id-card.tsx` (QR removal, §14–§17)
- REMOVED: `QRCodeSVG` import, `fnv1a()`, `verificationPayload()`, the `{idCard?.showQr && …}` "Scan to verify" block, the "Encoded: admission no + signed checksum" text, the `{admissionNo} · {code.toUpperCase()}` line, and the "Student ID" (database id `STU-58`) particulars field per §16.
- Card now contains ONLY official info: logoText tile, school name, "Student Identity Card" label, Active status badge, photo (initials), name, class/section, roll no, configured particulars (admission no / house / DOB / blood group per school-settings toggles), Principal signature line, valid-till, office-line footer.
- Doc comment updated: no machine-readable code or encoded token on the printed card — security happens behind the scenes; any future identity-confirmation flow would be a separate secure backend service (§14–§17).
- Print action + `printing-id-card` body-class mechanism untouched.

### 3. `src/components/principal/modules/school-settings/id-card-tab.tsx`
- Removed the `showQr` entry from `FIELD_TOGGLES` + the `FieldToggle` key union (principals can no longer enable a QR that doesn't render).
- `showQr` KEPT in school-settings-store types/initial-state (harmless persisted config; store untouched as instructed).

## Verification (gates)
- `bunx tsc --noEmit` → 0 errors ✓
- `bun run lint` → clean ✓
- `rg "QRCode|qr|checksum|fnv1a|VERIFY"` on student-id-card.tsx → zero matches (also case-insensitive) ✓
- `rg "showQr" src/` → only store types + initial-state remain ✓
- `rg -l "qrcode" src/` → `identity-codes.tsx` (principal's verification surface) still uses QRCodeSVG → `qrcode.react` dependency STAYS ✓
- dev.log → `✓ Compiled in 1852ms`, zero errors, GET / 200 ✓
- Hero responsive: stacked flex-col on mobile (full-width ID button), avatar beside name on ≥sm; no text collision (name sits on the calm card surface).
- Did NOT run agent-browser (main session QA) · did NOT bump APP_VERSION.
