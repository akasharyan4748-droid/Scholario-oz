# SCHOLARIO-OS — Enterprise Platform Kernel & Architecture Specification

## Architecture Overview

SCHOLARIO-OS has evolved from a traditional monolith into an **Enterprise Multi-Tenant Platform Kernel**. The platform is designed around strict domain boundaries, event-driven reactive decoupling, attribute-based policy evaluation, and zero-core-modification plugin extensibility.

---

## 1. Platform Kernel Abstractions

```
                               ┌───────────────────────────┐
                               │  SCHOLARIO Platform Kernel │
                               └─────────────┬─────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
┌───────────┐     ┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ Module    │     │ Domain Event │    │ Workflow     │    │ Policy      │    │ Service      │
│ Registry  │     │ Bus          │    │ Engine       │    │ Engine      │    │ Container    │
└───────────┘     └──────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### 1.1 Core Components
- **Kernel (`/src/lib/kernel/index.ts`)**: Initializes multi-tenant contexts (`TenantContext`), user security profiles (`UserContext`), and runtime environment parameters.
- **Module Registry (`/src/lib/kernel/module-registry.ts`)**: Dynamically discovers and validates platform capabilities (Admissions, Finance, HR, Exams, Transport, Hostel, Library).
- **Domain Event Bus (`/src/lib/kernel/event-bus.ts`)**: Asynchronous publish/subscribe bus for inter-module decoupling (e.g. `ADMISSION_APPROVED` -> `STUDENT_ENROLLED` -> `FEE_SCHEDULED`).
- **Workflow Engine (`/src/lib/kernel/workflow-engine.ts`)**: State machine defining transitions, approval gates, and multi-tier signoffs.
- **Policy Engine (`/src/lib/kernel/policy-engine.ts`)**: Attribute-Based Access Control (ABAC) evaluating business rules (e.g., fee discount ceilings, operating time windows).
- **Service Container (`/src/lib/kernel/service-container.ts`)**: Dependency locator pattern providing decoupled access to Notification, Storage, Search, and Audit services.
- **File Service (`/src/lib/kernel/file-service.ts`)**: Unified document, photo, and certificate upload handling with MIME validation and category classification.
- **Notification Engine (`/src/lib/kernel/notification-engine.ts`)**: Multi-channel delivery engine supporting In-App, Email, SMS, WhatsApp, and Push notifications.
- **Search Engine (`/src/lib/kernel/search-engine.ts`)**: Global query resolver routing queries to domain specific indexers.
- **Audit Service (`/src/lib/kernel/audit-service.ts`)**: Immutable audit logging tracking actor, role, tenant, delta state, and IP context.
- **Plugin Engine (`/src/lib/kernel/plugin-engine.ts`)**: Dynamic extension point registry enabling third-party and custom school extensions.

---

## 2. Shared Infrastructure Foundations

- **Design Tokens (`/src/lib/tokens/index.ts`)**: Single source of truth for color palettes, typography scales, spacing units, border radii, shadows, and glassmorphism.
- **Feature Flag Engine (`/src/lib/flags/index.ts`)**: Per-tenant module toggling without code deployments.
- **Permission Registry (`/src/lib/permissions/index.ts`)**: Fine-grained RBAC matrix enforcing domain and action-level authorization.
- **Validation Layer (`/src/lib/validation/index.ts`)**: Standardized input validation for emails, phone numbers, Aadhaar, PAN, and required fields.
- **Error Handling Framework (`/src/lib/error/index.ts`)**: Strongly-typed `AppError` taxonomy with user-safe message formatting and diagnostic logging.

---

## 3. Scalability & Ten-Year Roadmap

The architecture supports scaling to **500+ schools**, **100,000+ simultaneous students**, and **millions of academic/financial records**:
1. **Multi-Tenant Isolation**: Tenant contexts are injected at the kernel level, ensuring complete data boundary separation.
2. **Modular Micro-Services Readiness**: Domain services can be extracted into standalone serverless functions or containerized microservices without altering the module manifests.
3. **Decoupled Business Logic**: UI components interact exclusively through kernel hooks and domain stores, preventing cross-module code tangles.
