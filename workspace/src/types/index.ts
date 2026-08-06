/**
 * Core User Roles supported by Scholario OS.
 * Designed to be scalable and integrated with database RLS.
 */
export type UserRole =
  | 'super_admin'     // Platform Owner / Operator
  | 'school_admin'    // Principal / Manager / Owner of a School
  | 'teacher'         // Academic Instructor
  | 'student'         // Enrolled Learner
  | 'parent'          // Guardian
  | 'accountant'      // Finance Administrator
  | 'receptionist'    // Front Desk Operator
  | 'librarian';      // Library catalog supervisor

/**
 * Multi-tenant School configuration model (White-label metadata).
 */
export interface School {
  id: string;
  name: string;
  slug: string; // Unique subdomain/URL identifier (e.g., 'scouts-academy')
  domain?: string; // Optional custom mapped premium domain (e.g., 'academy.com')
  logoUrl?: string;
  primaryColor: string; // Hex code
  secondaryColor: string; // Hex code
  accentColor: string; // Hex code
  appName: string; // Custom app name shown in tabs (e.g. "Scouts Portal")
  appIconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Universal User Entity.
 */
export interface User {
  id: string;
  schoolId?: string; // Nullable for Super Admins
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * App Session State.
 */
export interface SessionContextState {
  user: User | null;
  school: School | null;
  isLoading: boolean;
}
