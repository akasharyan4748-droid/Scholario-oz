# SCHOLARIO-OS — Enterprise Engineering Handbook & Platform Constitution

**Version:** 1.0.0 (Phase 5 Platform Freeze)  
**Status:** Permanent Platform Standard  
**Target Audience:** Staff Engineers, Contributors, AI Coding Assistants, System Architects  

---

## Executive Summary & Platform Freeze Declaration

SCHOLARIO-OS has transitioned into a frozen, production-grade enterprise multi-tenant platform architecture. The underlying **Platform Kernel**, **Module Registry**, **Domain Event Bus**, **Workflow Engine**, **Policy Engine**, **Permission Engine**, **Feature Flag Service**, and **Design System** are permanent platform infrastructure. 

All future feature developments across Principal, Teacher, Student, Parent, and Super Admin workspaces MUST build ON top of these frozen foundations without architectural rewrites or custom visual styling.

---

## 1. Engineering Principles

1. **Clarity Over Cleverness**: Code must be explicit, self-documenting, readable, and predictable.
2. **Composition Over Inheritance**: Build specialized capabilities by composing small, single-responsibility units.
3. **Single Source of Truth**: Data models, design tokens, feature flags, and permissions must radiate from central registries.
4. **Predictability Before Innovation**: Follow established platform patterns before introducing new libraries or paradigms.
5. **Decoupled Module Boundaries**: Modules communicate strictly via the Kernel, Domain Event Bus, or Service Container interfaces.

---

## 2. Architecture Rules & Platform Freeze

The following core modules and engines are **PERMANENTLY FROZEN**:
- **Platform Kernel** (`/src/lib/kernel/index.ts`)
- **Module Registry** (`/src/lib/kernel/module-registry.ts`)
- **Domain Event Bus** (`/src/lib/kernel/event-bus.ts`)
- **Workflow Engine** (`/src/lib/kernel/workflow-engine.ts`)
- **Policy Engine** (`/src/lib/kernel/policy-engine.ts`)
- **Design Tokens & Design System** (`/src/lib/tokens/index.ts`, `/src/components/design-system/*`)
- **Permission & Feature Flag Engines** (`/src/lib/permissions/index.ts`, `/src/lib/flags/index.ts`)

---

## 3. Coding Standards & File Size Guidelines

- **File Length Target**: Standard target length is **~300 lines of code per file**. Large, monolithic files ("God Components") must be refactored into focused sub-components or services.
- **Strict Typing**: TypeScript `any` is strictly forbidden. All props, API payloads, state objects, and events must be strongly typed.
- **Token Usage**: Hardcoded hex colors, arbitrary inline paddings, or raw font families are banned. Always utilize Tailwind design classes or `DESIGN_TOKENS`.

---

## 4. Standard Folder Hierarchy

Every feature workspace module MUST follow this exact directory layout:

```
src/
├── components/           # UI Components using Design System
├── hooks/                # Custom React state hooks
├── services/             # Domain business logic & API client wrappers
├── store/                # Client state slices
├── validators/           # Schema definitions and input validators
├── types/                # TypeScript interface and type definitions
├── constants/            # Enum definitions and static configs
└── utils/                # Pure helper functions
```

---

## 5. Component Standards

- **Design System Mandate**: Every page MUST construct its interface using the official Design System components:
  - Cards: `MetricCard`, `WorkspaceCard`
  - Data Tables: `EnterpriseTable`
  - Feedback: `EmptyState`, `BannerAlert`, `PermissionDeniedState`
- Custom, unapproved card styling or raw table tags (`<table>`) inside feature views are strictly prohibited.

---

## 6. Form Standards

- Forms must adhere to consistent UX patterns: keyboard focus navigation, clear inline validation messages, responsive mobile layouts, and standard file upload dropzones.
- Input fields must use the standardized validation patterns defined in `/src/lib/validation/index.ts`.

---

## 7. Table Standards

- All data lists must render using `EnterpriseTable`.
- Key required features: client-side search, sticky header formatting, paginated pagination controls, empty state fallback, and CSV export callbacks.

---

## 8. Chart Standards

- Charts must complement the UI, maintaining low visual density and refined spacing.
- Raw, unstyled canvas or Recharts wrappers are forbidden outside of standard, reusable chart containers.

---

## 9. State Management Standards

- **Server State**: Managed via async fetchers or service layer hooks.
- **Client State**: Local UI state (`useState` / React Context) for view controls and toggles.
- **Kernel State**: Global tenant context, active user roles, and feature flag overrides managed directly via the Kernel.

---

## 10. API Standards

- All endpoints MUST return standard payload envelopes:
  - `ApiSuccessResponse<T>`: `{ success: true, data: T, meta: ApiResponseMeta }`
  - `ApiPaginatedResponse<T>`: `{ success: true, data: T[], pagination: {...}, meta: ApiResponseMeta }`
  - `ApiErrorResponse`: `{ success: false, error: { code, message, category }, meta: ApiResponseMeta }`

---

## 11. Database Standards

- **Tenant Isolation**: Every database query must filter on `tenantId`.
- **Soft Delete**: Tables must implement `isDeleted` flags rather than hard deleting records.
- **Repository Pattern**: Domain access must funnel through repository instances extending `BaseRepository<T>`.

---

## 12. Event Standards

- Inter-module actions MUST publish domain events to the Event Bus (`eventBus.publish()`).
- Direct cross-module imports or direct state mutations across module boundaries are prohibited.

---

## 13. Storage Standards

- All document, photo, and certificate uploads must pass through `FileService` (`/src/lib/kernel/file-service.ts`).
- MIME types and 10MB size limits must be checked prior to storage persistence.

---

## 14. Notification Standards

- Multi-channel delivery (In-App, Email, SMS, WhatsApp, Push) must pass through `NotificationEngine` (`/src/lib/kernel/notification-engine.ts`).

---

## 15. Payment Standards

- Payment processing (UPI, Netbanking, Cards, Cash receipts) must interface through `PaymentGatewayService` (`/src/lib/infrastructure/payments/payment-gateway.ts`).

---

## 16. Security Standards

- All user inputs must be sanitized using `SecurityGuard.sanitizeString()`.
- API endpoints must enforce sliding window rate limits via `SecurityGuard.checkRateLimit()`.

---

## 17. Performance Standards

- Lazy loading and dynamic imports for heavy modal overlays or sub-views.
- Avoid unnecessary re-renders by stabilizing dependency arrays and memoizing expensive computations.

---

## 18. Accessibility Standards

- All interactive elements must maintain AA contrast ratios (4.5:1 for normal text).
- Visible focus rings (`focus:ring-2 focus:ring-indigo-500/20`) and minimum 44px touch targets on mobile viewports.

---

## 19. Testing Standards

- Maintain unit test coverage for pure validators, policy evaluators, and repository transformations.
- Run typecheck and ESLint before completing pull requests or code edits.

---

## 20. Code Review Checklist

Before approving any PR or code edit, verify:
- [ ] No hardcoded colors, spacing, or typography.
- [ ] File size is under ~300 lines of code.
- [ ] Interface uses `EnterpriseTable`, `MetricCard`, and Design System primitives.
- [ ] No direct cross-module imports; uses Kernel or Event Bus.
- [ ] TypeScript compilation passes cleanly.
- [ ] ESLint passes with zero warnings or errors.

---

## 21. AI Contribution Guidelines

When an AI Assistant performs coding tasks on SCHOLARIO-OS:
1. **Read Before Modifying**: Must inspect existing Kernel abstractions and Design System primitives first.
2. **Reuse Platform Services**: Must never implement duplicate file upload, notification, or state management logic.
3. **Respect Scope**: Must implement strictly what was requested without adding unsolicited UI tabs or extra background servers.
4. **Verification**: Must run compilation and linting checks after edits.

---

## 22. Long-Term Maintenance Strategy

SCHOLARIO-OS is architected to power thousands of educational institutions over a 10-year horizon. The separation of the Platform Kernel, Domain Event Bus, and Design System allows individual school workspaces to scale seamlessly while guaranteeing zero regressions to platform stability.
