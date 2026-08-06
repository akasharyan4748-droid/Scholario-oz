# SCHOLARIO-OS — Enterprise Design Language & System Specification (Phase 4)

## Executive Summary

Phase 4 defines the official, permanent visual design language and component architecture for SCHOLARIO-OS. Inspired by world-class design languages (Apple Human Interface Guidelines, Stripe Dashboard, Linear, and Notion), SCHOLARIO prioritizes **clarity, visual calm, spatial breathing room, and predictable information density**.

---

## 1. Design Principles

1. **Clarity Over Decoration**: Interfaces communicate essential information first. Decorative gradients and glossy glassmorphism are kept subtle and functional.
2. **Predictable Density**: Cards, tables, and metric blocks adhere to standard padding and height rules (`p-5`, `p-6`, `py-3.5`).
3. **One Action Per Context**: Primary CTA buttons are prominent and single-purposed per screen section.
4. **Distance Readability**: High-contrast typography paired with muted secondary labels (`text-slate-900` / `text-slate-500`).
5. **Progressive Disclosure**: Detailed filters and secondary analytics expand smoothly on demand rather than cluttering initial workspace views.

---

## 2. Design System Components Catalog

### 2.1 Card System (`/src/components/design-system/CardSystem.tsx`)
- **MetricCard**: Single KPI container with uppercase semantic label, prominent numeric display, trend percentage pill, and subtitle metadata.
- **WorkspaceCard**: Standard container wrapper for tables, form wizards, and interactive widgets.

### 2.2 Table System (`/src/components/design-system/TableSystem.tsx`)
- **EnterpriseTable**: Responsive table with sticky header capabilities, client search filtering, pagination controls, empty state handling, and CSV export.

### 2.3 Feedback System (`/src/components/design-system/FeedbackSystem.tsx`)
- **EmptyState**: Standardized illustration/icon placeholder with title, description, and primary CTA.
- **BannerAlert**: Contextual notification alerts for Info, Success, Warning, and Error states with retry callbacks.
- **PermissionDeniedState**: Lock indicator informing unauthorized roles when module boundaries are restricted.

---

## 3. Typography & Spacing Hierarchy

| Level | Font Size | Weight | Tracking | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-2xl` (24px) | `font-bold` | `tracking-tight` | Top-level Workspace Header |
| **Section Header** | `text-base` (16px) | `font-semibold` | Normal | Card and Table titles |
| **Metric Value** | `text-2xl` (24px) | `font-bold` | `tracking-tight` | Primary dashboard numeric numbers |
| **Body Text** | `text-xs` / `text-sm` (12-14px) | `font-normal` | Normal | Table cells, descriptions, form fields |
| **Micro Labels** | `text-[11px]` (11px) | `font-semibold` | `tracking-wider` | Table header caps, card section tags |

---

## 4. Color Palette & Dark Mode Alignment

- **Brand Primary**: Deep Indigo Slate (`#0F172A`)
- **Accent**: Indigo (`#4F46E5`) with light tint (`#EEF2FF`)
- **Semantic Success**: Emerald (`#10B981`)
- **Semantic Warning**: Amber (`#F59E0B`)
- **Semantic Danger**: Rose (`#EF4444`)
- **Neutral Canvas**: Warm Off-White (`#F8FAFC`) in Light Mode, Slate (`#020617`) in Dark Mode.
