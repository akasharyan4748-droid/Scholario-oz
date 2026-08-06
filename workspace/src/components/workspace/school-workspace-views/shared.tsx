import type { ActiveSchool } from '../../shared/sidebar';

// ============================================================
// school-workspace-views/shared.tsx
// Shared types and helpers used by the school workspace views.
// ============================================================

export interface SchoolWorkspaceViewsProps {
  activeItem: string;
  activeSchool: ActiveSchool;
}

export interface WorkspaceStudent {
  id: string;
  name: string;
  grade: string;
  parent: string;
  attendance: string;
  fees: string;
}

export interface WorkspacePupil {
  id: number;
  name: string;
  present: boolean;
}

export interface WorkspaceFee {
  id: string;
  student: string;
  amount: string;
  due: string;
  status: string;
}

export interface WorkspaceAiLog {
  prompt: string;
  response: string;
}
