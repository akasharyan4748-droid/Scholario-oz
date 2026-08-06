/* ============================================================
   role-dashboards/index.ts
   Barrel re-export for the role dashboard components.

   Backward-compatibility entry point: every named export that
   used to live in the monolithic `role-dashboards.tsx` is
   re-exported here so existing imports like:
       import { SuperAdminDashboard, AdminDashboard } from '@/components/shared/role-dashboards'
   continue to resolve unchanged.
   ============================================================ */

export { SuperAdminDashboard } from './super-admin-dashboard';
export { AdminDashboard } from './admin-dashboard';
export { TeacherDashboard } from './teacher-dashboard';
export { StudentDashboard } from './student-dashboard';
export { ParentDashboard } from './parent-dashboard';
