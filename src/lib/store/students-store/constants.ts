import type { House } from './types'

// ============================================================
// CLASS DEFINITIONS
// ============================================================

export const SUBJECTS_BY_LEVEL: Record<string, string[]> = {
  'Pre-Primary': ['English', 'Mathematics', 'EVS', 'Hindi', 'Art & Craft', 'Music'],
  Primary: ['English', 'Mathematics', 'EVS', 'Hindi', 'Computer Science', 'Art & Craft'],
  Middle: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science'],
  Secondary: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science'],
  'Senior Secondary': ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
}

export const CLASS_DEFS = [
  { id: 'C01', name: 'Pre-Nursery', grade: -2, level: 'Pre-Primary' as const, sections: ['A', 'B'], capacity: 25, room: 'G-01', classTeacherId: 'T-002' },
  { id: 'C03', name: 'KG', grade: 0, level: 'Pre-Primary' as const, sections: ['A', 'B'], capacity: 28, room: 'G-03', classTeacherId: 'T-008' },
  { id: 'C05', name: 'Class 2', grade: 2, level: 'Primary' as const, sections: ['A', 'B', 'C'], capacity: 35, room: 'F1-05', classTeacherId: 'T-014' },
  { id: 'C07', name: 'Class 4', grade: 4, level: 'Primary' as const, sections: ['A', 'B'], capacity: 38, room: 'F1-07', classTeacherId: 'T-020' },
  { id: 'C09', name: 'Class 6', grade: 6, level: 'Middle' as const, sections: ['A', 'B'], capacity: 40, room: 'F2-09', classTeacherId: 'T-026' },
  { id: 'C11', name: 'Class 8', grade: 8, level: 'Middle' as const, sections: ['A', 'B'], capacity: 42, room: 'F2-11', classTeacherId: 'T-032' },
  { id: 'C12', name: 'Class 9', grade: 9, level: 'Secondary' as const, sections: ['A', 'B'], capacity: 45, room: 'F3-12', classTeacherId: 'T-035' },
  { id: 'C13', name: 'Class 10', grade: 10, level: 'Secondary' as const, sections: ['A', 'B'], capacity: 45, room: 'F3-13', classTeacherId: 'T-038' },
  { id: 'C14', name: 'Class 11', grade: 11, level: 'Senior Secondary' as const, sections: ['Sci-A', 'Com-A'], capacity: 45, room: 'F3-14', classTeacherId: 'T-041' },
  { id: 'C15', name: 'Class 12', grade: 12, level: 'Senior Secondary' as const, sections: ['Sci-A', 'Com-A'], capacity: 45, room: 'F3-15', classTeacherId: 'T-044' },
]

export const HOUSE_DEFS: House[] = [
  { id: 'H1', name: 'Aryabhata', color: 'oklch(0.6 0.18 250)', motto: 'Wisdom Through Knowledge', points: 1240, competitionWins: 12 },
  { id: 'H2', name: 'Bhaskara', color: 'oklch(0.6 0.18 25)', motto: 'Excellence In Action', points: 1180, competitionWins: 10 },
  { id: 'H3', name: 'Ramanujan', color: 'oklch(0.6 0.18 150)', motto: 'Logic Leads The Way', points: 1320, competitionWins: 14 },
  { id: 'H4', name: 'Tagore', color: 'oklch(0.6 0.18 75)', motto: 'Creativity Unbound', points: 1090, competitionWins: 9 },
]
