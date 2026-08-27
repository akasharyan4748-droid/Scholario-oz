# Fee Structures QA Report — SCHOLARIO-OS

**Date:** 25 Aug 2026 (browser session) · **URL:** http://localhost:3000 · **Role:** Principal (cookie auth pre-set)
**Viewport:** 1440×900 (desktop), 820×1280 (tablet), 390×844 (mobile)
**Student used for Scenario D/F/G:** Vihaan Desai — DSO2024023 · Class 8-A · Roll 01 (Guardian: Rajesh Gupta)

---

## A. Overview tab — PASS ✅
Screenshot: `01-overview.png`

KPI cards → category strip → Collection Trend chart all render in order:
- KPI cards: **TOTAL EXPECTED ₹40.62 L** (42 students) · **COLLECTED ₹29.68 L** (73.1% collected) · **OUTSTANDING ₹18.38 L** (31 students with dues) · **STUDENTS WITH DUES 31** (across 11 classes)
- Collection-by-category strip: **REGULAR SCHOOL FEES ₹29.68 L · EXAMINATION FEES ₹0 · ADDITIONAL CHARGES ₹0 · TOTAL COLLECTED ₹29.68 L** (exam/additional were ₹0 before any such payment existed — correct starting state)
- Collection Trend chart renders (Apr–Dec, Collected/Pending series, ₹0–₹10L axis)
- Other sections present: Outstanding Dues, Needs Attention, Recent Payments, Payment Modes, Outstanding Aging, Class-wise Collection

**Bonus re-check after the Scenario D payment (₹2,500 additional):** strip correctly updated to **REGULAR SCHOOL FEES ₹29.68 L (unchanged) · EXAMINATION FEES ₹0 · ADDITIONAL CHARGES ₹2.5K · TOTAL COLLECTED ₹29.70 L** — the tour payment was counted as Additional and did NOT inflate the core figure.

## B. Master Catalogue (Fee Structures tab) — PASS ✅ (one minor UX note)
Screenshots: `02-catalogue-fullscreen.png`, `03-new-fee-head.png`

1. **Full-screen:** TRUE full-screen workspace. Overlay container computed as `fixed inset-0 z-50 bg-background`, 1440×900 = entire viewport, opaque background — NOT a right-side drawer, no blurred page visible behind.
2. **Compact rows:** header reads "16 active · 0 archived · school-wide fee head library"; rows are ~60–61px tall, table-like columns: fee head name + kind badge + `details` link + category + frequency + default amount + usage ("Used in N structures") + edit/archive actions. Search box, category filter and "Show archived" toggle in toolbar.
3. **16 fee heads incl. 4 Additional:** Tuition Fee, Admission Fee, Activity Fee, Computer & Science Lab Fee, Library Fee, Examination Fee, Transport Fee, Board Examination Fee, Development & Infrastructure Fee, Smart Class & Digital Content Fee, Sports & Cultural Fee, Medical & First Aid Fee (12 with blue "Core Fee" badges, 2 with orange "Exam Fee" badges), plus **4 with violet "Additional" badges** (computed bg `oklab(0.606 0.097 -0.231 / 0.1)` = violet): **Educational Tour** (Activity, One-Time, ₹2.5K), **Science Workshop** (Lab, One-Time, ₹1.0K), **Competition / Olympiad Fee** (Activity, One-Time, ₹600), **Adventure Camp** (Activity, One-Time, ₹3.5K).
4. **Descriptions NOT in rows:** each row only has a small "details" disclosure link ("Show description for X" buttons).
5. **"+ New Fee Head" form:** opens inline with exactly the expected simple fields — 3 kind choice cards (Core Fee / Exam Fee / Additional with helper text), Name, Category (Tuition), Default Amount, Frequency (Monthly), Description, **Active toggle (on by default)**, Cancel + disabled "Create Fee Head".

⚠️ **Minor UX finding:** **Escape does NOT close** the New Fee Head form (form remained open after `Escape`), and Escape does not close the catalogue either. Exiting works via the form's **Cancel** button and the **"← Back to Fee Structures"** button (both verified working). Not a blocker, but keyboard-dismiss is absent.

## C. MoneyInput leading-zero sanitization — PASS ✅
Screenshot: `04-money-input.png`

Tested in Master Catalogue → Edit (pencil) on **Tuition Fee** row → "Default Amount" field (aria-label "Default amount"):
1. Clicked field, `Ctrl+A`, typed `004500`, pressed **Tab** → observed input value: **`"4500"`** (leading zeros stripped on commit). ✅
2. Re-focused the field, `Ctrl+A` + **Backspace** → observed value: **`""` (empty string)** — field CAN become empty, is not forced to `"0"`. ✅
3. Re-typed `004500` → Tab → value again `"4500"` (stable).

Cancelled the edit afterwards (Cancel button) — no changes saved.

## D. Exam fee integration (Class 9 structure) — PASS ✅
Screenshot: `05-exam-fee.png`

Opened Fee Structures → **Class 9** card → drawer → **Edit** (pencil):
- Edit Mode banner shown ("Changes are NOT yet committed. Publishing creates a new immutable version…").
- **Examination Fee Schedule** seeded rows verified exactly: **Unit Test ₹100 · 4× planned · Mandatory · Active; Half-Yearly ₹500 · 1×; Annual Examination ₹700 · 1×; Pre-Board ₹600 · 1×; Total (active exam fees) ₹2.2K** (100×4+500+700+600 = ₹2,200 ✓).
- Clicked **"Add Exam Fee"** → form titled "Add Examination Fee" listing only REMAINING examinations from the Examination module: **Periodic Assessment, Term Examination, Practical, Viva / Oral, Internal Assessment, Custom** (already-scheduled Unit Test / Half-Yearly / Annual Examination / Pre-Board correctly excluded), with note "Per-examination charge — billed once per conducted exam of this type…".
- Selected **Practical** → amount input ("Examination fee amount") appeared → typed **500** → clicked **"Add to Draft"** → row appeared in schedule (5 selects: Unit Test, Half-Yearly, Annual Examination, Pre-Board, **Practical**) and total updated to **₹2.7K** (2200+500 ✓).
- Clicked **Discard** (did NOT publish) → drawer reverted to view mode with the original 4 exam rows and total **₹2.2K**; the Practical draft was discarded cleanly. Closed drawer via "Back to Structures".

## E. Payments tab — Additional Charges — PASS ✅
Screenshots: `06-payments-additional.png`, `07-new-charge.png`

- **Collect Payment** button present; activity strip: **TODAY ₹0** (since midnight) · **THIS WEEK ₹0** (rolling 7 days) · **THIS MONTH ₹0** (rolling 30 days).
- **Additional Charges (2)** section: "Event-based collections (tours, workshops) — separate from the annual fee structure."
  - **Educational Tour — Jaipur** — Tour · Optional · ₹2.5K per student · due 15 Sept 2025 · "Jaipur Educational Tour 2025" · Class 8 · 4 students · **Collected ₹0 of ₹10.0K · 0%** with green progress fill (computed green `lab(66.98 -58.27 19.54)`, width 0).
  - **Robotics Workshop** — Workshop · Mandatory · ₹1.0K per student · due 30 Oct 2025 · "Science Club — Autumn Workshop" · Class 9 · 4 students · **Collected ₹0 of ₹4.0K · 0%**, same green bar.
- **New Charge** form: template chips shown (**Educational Tour · ₹2.5K, Science Workshop · ₹1.0K, Competition / Olympiad Fee · ₹600, Adventure Camp · ₹3.5K**); fields Charge Name / Category chips (Tour-Trip, Workshop, Competition, Camp, Event, Material, Other) / Amount per Student / Applicable Classes chips / Due Date / Optional toggle / Event-Reference / Description.
  - Minor cosmetic oddity: class chip list shows **"Class 11" and "Class 12" twice each** (likely duplicated section chips).
  - Filled: Name **"Science Olympiad Registration"**, category **Competition**, amount **600**, class chip **Class 10**, due date **2026-01-15** (entered into date field), Optional left off → clicked **Create Charge**.
- New charge appears first in list: **Science Olympiad Registration · Competition · Optional · ₹600 per student · due 15 Jan 2026 · Class 10 · 4 students · Collected ₹0 of ₹2.4K · 0%** progress bar. Section header updated to "Additional Charges 3".

## F. Scenario D — collect an additional charge payment — PASS ✅
Screenshots: `08-collect-additional.png`, `09-payment-success.png`

Collect Payment → stage 1 search "Class 8" → selected **Vihaan Desai (DSO2024023 · Class 8-A · Roll 01 · Outstanding ₹57.4K)**.

Stage 2 (review):
- Outstanding split box: **Core Fees ₹58.9K** (₹57.4K outstanding + ₹1.5K late fee) and **Additional Charges ₹2.5K (1 charge)** — shown separately. ✅
- **Payment For** selector: **"School Fees (Core) — ₹58.9K due"** and **"Educational Tour — Jaipur — Tour · due 2025-09-15 · ₹2.5K due"**. ✅
- Clicked "Educational Tour — Jaipur" → **Amount auto-filled 2500** ✅ and note appeared: **"Recording against the additional charge — core fee balance stays unchanged."** ✅ (Fee head / purpose selects are replaced by the charge context.)
- Payment method **UPI** selected; reference field (placeholder "UPI-XXXXXXXXXX") entered **UPI-QA-0001**.
- Stage 3 (confirm) shows: Fee Head "Educational Tour — Jaipur", Purpose "Additional Charge — Educational Tour — Jaipur", Amount ₹2,500, Mode UPI, Reference UPI-QA-0001 → clicked **Pay ₹2,500**.
- Stage 5 — **Payment Recorded**: receipt **RCP-2025-1061 · ₹2,500**; receipt preview shows FEE HEAD "Educational Tour — Jaipur" ₹2,500, TOTAL/PAID ₹2,500, BALANCE —, Mode UPI, Transaction Ref UPI-QA-0001. Closed via Done.

## G. Scenario D verification in Student Accounts — PASS ✅
Screenshots: `10-student-account.png`, `11-ledger.png`

Student Accounts → searched "Vihaan Desai" → opened account drawer:
- Header stats: APPLICABLE ₹95.2K · CONCESSION −₹5.0K · NET PAYABLE ₹90.2K · **PAID (CORE) ₹15.6K** · **CORE OUTSTANDING ₹74.6K** · TOTAL DUE ₹76.1K (74.6 core + 1.5 late fee; additional ₹0).
- **Account Position** panel ("core fees and additional charges are tracked separately"):
  - **CORE SCHOOL FEES:** Annual expected ₹93.6K · Exam fees (scheduled) ₹1.6K · Concession −₹5.0K · Collected (core) ₹15.6K · **Core outstanding ₹74.6K** (= 90.2 net payable − 15.6 collected-core; internally consistent).
  - **ADDITIONAL CHARGES:** **Educational Tour — Jaipur ₹2.5K · Tour · due 2025-09-15 · optional · Paid · Additional outstanding ₹0**. ✅
- **Core outstanding UNCHANGED by the tour payment** — verified two ways:
  1. Drawer math: PAID (CORE) ₹15.6K excludes the ₹2,500 (if the tour payment had leaked into core, collected would be ₹18.1K / outstanding ₹72.1K).
  2. Re-opened the Collect Payment dialog post-payment: split still shows **Core Fees ₹58.9K** (identical to pre-payment value: ₹57.4K outstanding + ₹1.5K late fee) while **Additional Charges dropped ₹2.5K → ₹0** and the tour option now reads **"Paid"**.
- **Fee Ledger tab:** table columns **DATE / DESCRIPTION / TYPE / CHARGE / PAYMENT / BALANCE** — Type column exists ✅ with labels **Core Fee** (Tuition ₹66,000, Transport ₹21,600, Library ₹3,000, Activity ₹3,000), **Exam Fee** (Unit Test ₹400 = 100×4, Half-Yearly ₹500, Annual Examination ₹700), **Additional Fee** (Educational Tour — Jaipur ₹2,500 charge), **Concession** (−₹5,000), **Late Fee** (₹1,500), and **Payment** (25 Aug 2026 · RCP-2025-1061 · ₹2,500, description "Additional Charge — Educational Tour — Jaipur (additional charge payment)"). Status Timeline also shows the additional-charge event.

## H. Transactions tab — PASS ✅
Screenshot: `12-transactions-filtered.png`

- Table columns: **RECEIPT / STUDENT / CLASS / FEE HEAD / TYPE / AMOUNT / MODE / STATUS / DATE / COLLECTED BY / ACTIONS** — Type column present with pill badges: **Core Fee** (blue, 19 rows), **Additional** (violet, 1 row). Top row is the tour payment: **RCP-2025-1061 · Vihaan Desai · DSO2024023 · Class 8 · Educational Tour — Jaipur · Additional · ₹2,500 · UPI · Success · 25 Aug 2026 · Principal**.
- **Filters** panel: CLASS, PAYMENT MODE, STATUS, FEE HEAD (All Heads / Educational Tour — Jaipur / Tuition) and **TYPE: All Types / Core Fee / Examination Fee / Additional Charge**. ✅
- Filtered by **Additional Charge** → exactly **1 row** remains: the Educational Tour — Jaipur payment (RCP-2025-1061). ✅
- Cleared filter (back to "All Types") → 20 rows restored. Summary strip shows "successful only · across filtered rows" totals (₹15.09 L / avg ₹1.16 L unfiltered).

## I. Console + responsive — PASS ✅ (stale compile errors confirmed absent on fresh load)

**Console (full session buffer, excluding React DevTools info / HMR / Fast-Refresh logs):**
1. `Module not found: Can't resolve './payments/payments-section'` — 16 occurrences, all from **earlier compile history** (the file `src/components/principal/modules/fees/payments/payments-section.tsx` exists on disk and the Payments tab renders).
2. `Error: Export FeesVerificationQueue doesn't exist in target module … fees-approvals.tsx (Did you mean to import FeesApprovalsSection?)` — ~40+ occurrences in the buffer, also stale (current source: `payments-section.tsx:29` imports `FeesVerificationQueue`, and `fees-approvals.tsx:48` exports it — the files are consistent now; these entries are from an intermediate Fast-Refresh state during development).
3. No other console errors.

**Fresh-console verification:** ran `console --clear` → `reload` → re-navigated Dashboard → Fee Management → **Payments tab** and waited. Fresh console contains ONLY `[info] React DevTools` + `[HMR] connected`. **Neither the `payments-section` module-not-found error NOR the `FeesVerificationQueue` export error reappeared.** ✅ Console also stayed clean after the entire scripted interaction set (payments, charge creation, ledger, filters).

**Responsive:**
- Tablet 820×1280, Fee Structures tab (`13-tablet.png`): renders, **no horizontal overflow** (scrollWidth 820 = clientWidth 820).
- Mobile 390×844 (`14-mobile.png`): Fee Management with the tab row visible as a horizontally scrollable strip (Overview x=20, Student Accounts x=102, Fee Structures x=227, Payments x=338; Transactions/Settings scroll off-canvas within the row — expected pattern). **No page-level horizontal overflow**: `document.documentElement.scrollWidth > clientWidth` → **false** (390 = 390, body scrollWidth 390). ✅
- Viewport reset to 1440×900 afterwards.

---

## Summary

| Section | Verdict |
|---|---|
| A. Overview (KPIs + category strip + trend) | **PASS** |
| B. Master Catalogue full-screen workspace | **PASS** (Escape does not dismiss form/workspace — minor UX note) |
| C. MoneyInput leading-zero sanitization | **PASS** (`004500`→`4500` on Tab; clearable to empty) |
| D. Exam fee integration (Class 9, remaining exams) | **PASS** |
| E. Payments tab — Additional Charges + New Charge | **PASS** (duplicate Class 11/12 chips — cosmetic) |
| F. Scenario D — collect additional charge | **PASS** |
| G. Scenario D verification (core untouched) | **PASS** |
| H. Transactions Type column + Type filter | **PASS** |
| I. Console + responsive | **PASS** (all console errors stale; clean on fresh load; no mobile overflow) |

**Issues found (non-blocking, report-only):**
1. `Escape` does not close the "New Fee Head" form or the Master Catalogue workspace (must use Cancel / "← Back to Fee Structures").
2. New Charge form lists duplicate "Class 11" and "Class 12" applicability chips (cosmetic).
3. Stale compile-history console errors exist in a long-lived session buffer (`payments-section` module-not-found ×16; `FeesVerificationQueue` export error ×~40) but do NOT reproduce on fresh load — current source is consistent.

No code was modified during this QA pass.
