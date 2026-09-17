# STU-PREMIUM-8b — full-stack-developer work record

> Full record also appended to `/home/z/my-project/worklog.md` (canonical log).
> Scope: Records group (Library, Certificates, Transport) to the Principal design standard + honest bus-tracking simulation + light-touch Settings alignment. No tsc/eslint/dev-server/build run (orchestrator validates centrally).

Task ID: STU-PREMIUM-8b
Agent: full-stack-developer
Task: Bring the Records group (My Library, My Certificates, Bus Tracking) to the Principal/kit design standard and make the Transport "live" simulation honest (roster-derived route, deterministic estimated ETA, no random jitter); light-touch Settings container alignment.

## Files changed (12)

**My Library**
- `src/components/student/modules/my-library.tsx` — root → StudentPage; 3 GlassCard summary chips → kit SummaryCardGrid/SummaryCard (sky Issued / rose Overdue / amber Fine Due, values from the library-store); Books With You + Reading History → kit Panel (title/subtitle/action headers); both empty branches → StudentEmptyState; history list scrolls (max-h-96 overflow-y-auto custom-scrollbar); store wiring (STU-58 filter, dueInfo/daysBetween, StatusBadge rows, motion rows) unchanged.

**My Certificates**
- `src/components/student/modules/my-certificates.tsx` — root → StudentPage; GlassCard → kit Panel ("Issued Certificates" / "Preview or download any of your documents"); empty → StudentEmptyState; certificate list scrolls (max-h-96 custom-scrollbar); preview Dialog, docHtml() HTML download, toast, store filter (STU-58 / DSO2024058) all preserved verbatim.

**Bus Tracking — honesty fix (the core of this task)**
- `src/lib/mock/bus-tracking.ts` — data file documents the honesty model in its header; `etaMinutes` REMOVED (the module computes the ETA deterministically — no stored estimate to fake-update); `lastUpdate: '2 sec ago'` → `lastUpdatedAt: '07:24 AM'` (static timestamp that matches the current stop's actual arrival time in the same file); `currentSpeed` kept and commented as the last reported static value. Stop list / trip history / stats untouched (mock is the module's data source by design).
- `src/components/student/modules/bus-tracking/index.tsx` — the fake live simulation is GONE: the `useEffect` + `setInterval` (decrementing ETA by 0.1, random-walking the speed ±2 km/h, inching progress by 0.3 every 1.5s) and the `void progress` hack are deleted. ETA is now `Math.max(1, stopsToGo × MINUTES_PER_STOP=4)` — deterministic from the route data, labelled "Estimated". Route identity derives from the roster: `useStudentsStore → student.transportRoute` (for the demo student this is `Route E-5` from the seed, NOT the mock's old hardcoded "Route 4"); the mock record supplies the corridor/vehicle/crew/stops for that route. Roster gate: no `transportRoute` → StudentPage + Panel + StudentEmptyState "No transport assigned" (icon + one line, no action, per spec). Roster-missing spinner guard mirrors attendance.tsx. Root → StudentPage (space-y-4); map+details Panel (`bodyClassName="p-0"`, lg:col-span-2).
- `src/components/student/modules/bus-tracking/kpi-row.tsx` — shared `KpiCard` → kit SummaryCardGrid/SummaryCard: "Estimated Arrival" (violet, scheduled-pickup sub), "Last Reported Speed" (cyan, `as of {lastUpdatedAt}`), "Stops to Go" (amber, `at stop N of 8`), "On-Time Rate" (emerald, from route stats). No props for speed anymore (static data value).
- `src/components/student/modules/bus-tracking/live-map.tsx` — "LIVE · 2 sec ago" badge (emerald, animate-ping) → honest "SCHEDULED · updated 07:24 AM" badge (static sky dot, no ping). The bus marker no longer crawls on an infinite fake animation loop — it sits at a deterministic position derived from the route data (distanceCovered/totalDistance = 8.4/12.6 → ~67% along the path) with a gentle decorative idle sway; the fake "live" pulse ring is removed. Progress bar width = the same data fraction (one-time ease-in, no ticking).
- `src/components/student/modules/bus-tracking/bus-details.tsx` — takes a `routeLabel` prop (roster route); the header shows the roster route instead of the mock's `routeNo` ('Route 4'); vehicle/crew/trip metrics still from the module's data record.
- `src/components/student/modules/bus-tracking/stops-timeline.tsx` — GlassCard → kit Panel (title="Stops Timeline", subtitle="Your pickup: …"); stop list scrolls (max-h-96 custom-scrollbar); "HERE NOW" chip (live claim) → "CURRENT".
- `src/components/student/modules/bus-tracking/trip-history.tsx` — GlassCard → kit Panel (title="Trip History", subtitle="Last 5 trips", lg:col-span-2 kept); table untouched.
- `src/components/student/modules/bus-tracking/safety-card.tsx` — GlassCard → kit Panel; stats/SOS content untouched.

**Settings (light touch)**
- `src/components/student/modules/settings/index.tsx` — root `div.space-y-6` → kit StudentPage; SettingsCard's GlassCard → kit Panel with `bodyClassName="p-4 sm:p-5 lg:p-6"` (per-card motion entrance kept). Every setting untouched and functional: notification switches (notif-prefs store), light/dark theme (theme store), leaderboard privacy switch, change-password POST /api/auth/change-password flow, logout. GlassCard import removed; SectionHeading/GradientAvatar/StatusBadge kept.

## Verification (no tsc/eslint/dev/build per constraints)
- All 11 touched files parse clean via `Bun.Transpiler` (syntax + JSX); kit imports resolve through the `@/components/student/modules/shared/kit` alias path used elsewhere.
- No references to the removed mock fields remain (`myBusRoute.etaMinutes` / `myBusRoute.lastUpdate` → grep 0 hits; only `lastUpdatedAt` consumers are kpi-row + live-map).
- No unused imports left in touched files (Clock removed from my-library, Calendar removed from trip-history, Navigation removed from stops-timeline, GlassCard imports removed everywhere I touched).
- dev.log tail: clean — `✓ Compiled in 712ms`, `GET / 200` after the changes, no Error/Failed lines (one transient unrelated `/api/notifications-feed` 500 recovered immediately; no API files touched).
- Deep-links/store wiring preserved: all four module roots still mount prop-less from student-panel's staticModules registry (`my-library`, `my-certificates`, `bus`, `settings`); BusTrackingModule public signature unchanged.

## Decisions worth flagging for the orchestrator
1. **Roster route ≠ mock routeNo**: STU-58's seeded `transportRoute` is `Route E-5` (seed formula `Route ${A+(n%6)}-${(n%9)+1}`, n=58), while the mock record's `routeNo` says 'Route 4'. The task brief remembered the value as "Route 4 ..." — that's the mock's label, not the roster's. Resolution: the displayed route identity comes from the ROSTER at runtime (same source Profile shows, so the two screens now agree); the mock's `routeNo` field is no longer rendered anywhere (its `routeName` 'Sohna Road & Sector 49' survives as the corridor descriptor). If a future agent wants perfect mock/roster identity, the mock stop list should be re-keyed to the roster route — cosmetic only, no functional impact.
2. **ETA formula**: per spec, stops-remaining × 4 min/stop (1 stop → "4 min") labeled "Estimated", with the scheduled pickup time as the sub-line. The scheduled times in the stop list imply a tighter 1-min gap — both are now visible and labeled, so neither disagrees silently (same convention as 7a's attendance-window labeling).
3. **Map**: kept as an illustrative route schematic (decorative SVG roads, school + your-stop markers, gentle idle sway on the bus) but the badge now says SCHEDULED with a static timestamp and the bus position is data-derived — no live claim anywhere in the module.
4. **SOS button + driver/attendant call buttons** still fire demo toasts (mock is the module's data source per the task's own framing; relabelling them was not in scope).
5. Fees/Applications untouched (out of scope, production-grade); other GlassCard usages elsewhere (wellness/achievements/portfolio/etc.) untouched — only files in scope were converted.
