// Centralized Application Configuration & Architecture Constants
export const APP_CONFIG = {
  name: "SCHOLARIO-OS",
  version: "1.0.0",
  description: "Enterprise School Management Platform",
  apiPrefix: "/api",
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  roles: {
    SUPER_ADMIN: "SUPER_ADMIN",
    PRINCIPAL: "PRINCIPAL",
    TEACHER: "TEACHER",
    STUDENT: "STUDENT",
    PARENT: "PARENT",
  },
  features: {
    multiSchool: true,
    aiAssistant: true,
    realtimeAlerts: true,
  },
} as const;

export type AppRole = keyof typeof APP_CONFIG.roles;
