'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'principal' | 'teacher' | 'student' | 'superadmin'

export interface SessionUser {
  role: Role
  name: string
  avatar: string
  id: string
  email: string
  teacherId?: string
  studentId?: string
}

interface AuthState {
  user: SessionUser | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  hydrated: boolean
  setHydrated: () => void
  startAuth: () => void
  login: (role: Role) => void
  endAuth: () => void
  logout: () => void
  switchTo: (role: Role) => void
}

const roleProfiles: Record<Role, SessionUser> = {
  principal: {
    role: 'principal',
    name: 'Dr. Ananya Iyer',
    avatar: 'AI',
    id: 'EMP-001',
    email: 'principal@scholario.in',
    teacherId: 'T-014',
  },
  teacher: {
    role: 'teacher',
    name: 'Rohan Mehta',
    avatar: 'RM',
    id: 'EMP-014',
    email: 'rohan.mehta@scholario.in',
    teacherId: 'T-014',
  },
  student: {
    role: 'student',
    name: 'Aarav Sharma',
    avatar: 'AS',
    id: 'STU-58',
    email: 'aarav.sharma@greenwood.edu.in',
    studentId: 'STU-58',
  },
  superadmin: {
    role: 'superadmin',
    name: 'Arjun Malhotra',
    avatar: 'AM',
    id: 'SA-001',
    email: 'admin@scholario.cloud',
  },
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAuthenticating: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      startAuth: () => set({ isAuthenticating: true }),
      endAuth: () => set({ isAuthenticating: false }),
      login: (role) =>
        set({
          user: roleProfiles[role],
          isAuthenticated: true,
          isAuthenticating: false,
        }),
      switchTo: (role) =>
        set({
          user: roleProfiles[role],
          isAuthenticated: true,
        }),
      logout: () =>
        set({ user: null, isAuthenticated: false, isAuthenticating: false }),
    }),
    {
      name: 'scholario-auth',
      // v1 — re-key student identity to the canonical STU-58 (fresh sessions
      // after the roster unification; stale persisted users are discarded).
      version: 1,
      onRehydrateStorage: () => (state) => {
        useAuth.setState({ hydrated: true })
        if (state) state.setHydrated()
      },
    }
  )
)
