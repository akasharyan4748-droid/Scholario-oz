# SCHOLARIO-OS — Enterprise Monorepo Preparation & Target Workspace Structure

## Target Workspace Structure

To prepare for future pnpm + Turborepo workspace migration across multiple web apps, mobile apps, and microservices, SCHOLARIO-OS is organized into cleanly isolated domains and shared libraries.

```
scholario-os/
├── apps/                          # Target Application Packages
│   ├── web-platform/             # Next.js Full-Stack Portal (Current Root)
│   ├── parent-mobile/            # Future React Native / Expo Parent App
│   ├── teacher-kiosk/            # Future Classroom/Biometric Attendance Kiosk
│   └── public-portal/            # Public School Website & Admission Forms
│
├── packages/                      # Reusable Enterprise Libraries
│   ├── kernel/                   # Core Platform Kernel (Context, Bus, Workflow)
│   ├── design-system/           # Reusable UI Components & Tokens
│   ├── feature-flags/            # Tenant Feature Toggles
│   ├── permissions/              # RBAC & ABAC Policy Registries
│   ├── validation/               # Shared Schemas & Input Validators
│   └── types/                    # Shared Domain Data Models
│
├── tooling/                       # Build & Code Quality Infrastructure
│   ├── eslint-config/            # Shared Lint Rules
│   ├── tsconfig/                 # Standardized TypeScript Configs
│   └── scripts/                  # Scaffolding & Verification Generators
│
└── docs/                          # Architecture Specifications
    ├── architecture/             # Platform Architecture Specs
    └── API.md                    # Standard API Contracts
```

---

## Extension & Plugin Ecosystem

Modules register extension points using the `PluginEngine` (`/src/lib/kernel/plugin-engine.ts`):
- **Dashboard Widgets**: Insert custom KPI analytics widgets dynamically.
- **Sidebar Navigation**: Inject custom ERP navigation items for specialized modules (Hostel, Transport, Mess, Alumni).
- **Student Profile Tabs**: Add custom diagnostic tabs without touching core student profile layouts.
- **Topbar Quick Actions**: Attach quick workflow triggers (e.g., Quick Collect Fee, Emergency WhatsApp Alert).
