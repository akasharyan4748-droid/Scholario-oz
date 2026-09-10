'use client'

/**
 * timetable/config — THE canonical school timetable configuration.
 *
 * Single source of truth for the master timetable's structure + seed data,
 * shared by EVERY role (Principal edits it; Teacher + Student read it):
 *
 *   - TimetableSlot type + enriched INITIAL_SLOTS (the school's applied seed)
 *   - DAYS / PERIODS (day + period structure incl. breaks & lunch)
 *   - CLASSES / ROOMS pickers
 *
 * Moved here from `components/principal/modules/timetable/data.tsx` (which
 * now re-exports this module) so the Student/Teacher roles consume the SAME
 * configuration without importing Principal UI code (live-sync requirement:
 * Principal publishes → every role reflects the change; never a second
 * timetable dataset).
 */

export interface TimetableSlot {
  id: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  period: number // 1 to 9 (see PERIODS)
  time: string
  className: string
  subject: string
  teacherId: string
  teacherName: string
  room: string
  type: 'Lecture' | 'Lab' | 'Break' | 'Assembly' | 'Sports'
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export type DayType = (typeof DAYS)[number]

export const PERIODS = [
  { number: 1, name: 'Period 1', time: '08:30 AM - 09:15 AM', durationMin: 45 },
  { number: 2, name: 'Period 2', time: '09:15 AM - 10:00 AM', durationMin: 45 },
  { number: 3, name: 'Period 3', time: '10:00 AM - 10:45 AM', durationMin: 45 },
  { number: 4, name: 'Short Break', time: '10:45 AM - 11:00 AM', isBreak: true, breakType: 'short', durationMin: 15 },
  { number: 5, name: 'Period 4', time: '11:00 AM - 11:45 AM', durationMin: 45 },
  { number: 6, name: 'Period 5', time: '11:45 AM - 12:30 PM', durationMin: 45 },
  { number: 7, name: 'Lunch Break', time: '12:30 PM - 01:15 PM', isBreak: true, breakType: 'lunch', durationMin: 45 },
  { number: 8, name: 'Period 6', time: '01:15 PM - 02:00 PM', durationMin: 45 },
  { number: 9, name: 'Period 7', time: '02:00 PM - 02:45 PM', durationMin: 45 },
]

/** Structural row for grid/list rendering (periods + breaks in order). */
export interface TimetableRow {
  number: number
  name: string
  time: string
  isBreak: boolean
  breakType: 'short' | 'lunch' | undefined
  durationMin: number
}

/** Build initial TimetableRow[] from PERIODS — used everywhere draftRows is initialized. */
export function buildInitialRows() {
  return PERIODS.map((p) => ({
    number: p.number,
    name: p.name,
    time: p.time,
    isBreak: p.isBreak || false,
    breakType: p.breakType as 'short' | 'lunch' | undefined,
    durationMin: p.durationMin,
  }))
}

export const CLASSES = ['Class 2-A', 'Class 2-B', 'Class 9-A', 'Class 10-A', 'Class 12-Sci-A']

export const ROOMS = [
  'Room 102', 'Room 103', 'Room 301', 'Room 304',
  'Physics Lab', 'Chemistry Lab', 'Computer Lab 1',
  'Sports Complex', 'Library Hall',
]

/** Form state shape for the Add/Edit slot modal. */
export interface TimetableFormState {
  day: DayType
  period: number
  className: string
  subject: string
  teacherId: string
  room: string
  type: 'Lecture' | 'Lab' | 'Sports'
}

export const initialFormState: TimetableFormState = {
  day: 'Monday',
  period: 1,
  className: 'Class 2-A',
  subject: 'Mathematics',
  teacherId: 'T-014',
  room: 'Room 102',
  type: 'Lecture',
}

/** Result of the teacher/room/class conflict check performed while editing the form. */
export interface TimetableConflictInfo {
  teacherConflict: TimetableSlot | undefined
  roomConflict: TimetableSlot | undefined
  classConflict: TimetableSlot | undefined
  hasConflict: boolean
}

/**
 * INITIAL_SLOTS — the school's applied seed timetable (Demo School tenant).
 *
 * Enriched to a COMPLETE, realistic master schedule so every role sees a
 * real product: Class 2-A runs a full primary program Mon–Fri (7 teaching
 * periods/day) + a Saturday half-day (5 periods), and the senior sections
 * run their Thursday blocks. Subject→teacher assignments follow the
 * canonical teacher roster (T-002 Priya English, T-005 Meera Hindi,
 * T-011 Kavita Science, T-014 Rohan Maths/CS, T-023 Vikram Social Studies,
 * T-047 Sanjay PE, T-050 Lakshmi Music, T-053 Faisal Art, T-056 Geeta
 * Library). Every day+period is conflict-free (no teacher double-booking).
 */
export const INITIAL_SLOTS: TimetableSlot[] = [
  // ── Monday · Class 2-A ──
  { id: 'tt-101', day: 'Monday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-102', day: 'Monday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-103', day: 'Monday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Physics Lab', type: 'Lab' },
  { id: 'tt-104', day: 'Monday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'Computer Science', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Computer Lab 1', type: 'Lab' },
  { id: 'tt-105', day: 'Monday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Social Studies', teacherId: 'T-023', teacherName: 'Vikram Singh', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-106', day: 'Monday', period: 8, time: '01:15 PM - 02:00 PM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-005', teacherName: 'Meera Krishnan', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-107', day: 'Monday', period: 9, time: '02:00 PM - 02:45 PM', className: 'Class 2-A', subject: 'Art & Craft', teacherId: 'T-053', teacherName: 'Faisal Ahmed', room: 'Room 103', type: 'Lecture' },

  // ── Tuesday · Class 2-A ──
  { id: 'tt-201', day: 'Tuesday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-202', day: 'Tuesday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-203', day: 'Tuesday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Physical Education', teacherId: 'T-047', teacherName: 'Sanjay Reddy', room: 'Sports Complex', type: 'Sports' },
  { id: 'tt-204', day: 'Tuesday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-205', day: 'Tuesday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-005', teacherName: 'Meera Krishnan', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-206', day: 'Tuesday', period: 8, time: '01:15 PM - 02:00 PM', className: 'Class 2-A', subject: 'Library', teacherId: 'T-056', teacherName: 'Geeta Sharma', room: 'Library Hall', type: 'Lecture' },
  { id: 'tt-207', day: 'Tuesday', period: 9, time: '02:00 PM - 02:45 PM', className: 'Class 2-A', subject: 'Social Studies', teacherId: 'T-023', teacherName: 'Vikram Singh', room: 'Room 102', type: 'Lecture' },

  // ── Wednesday · Class 2-A ──
  { id: 'tt-301', day: 'Wednesday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-302', day: 'Wednesday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-303', day: 'Wednesday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Art & Craft', teacherId: 'T-053', teacherName: 'Faisal Ahmed', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-304', day: 'Wednesday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-305', day: 'Wednesday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-005', teacherName: 'Meera Krishnan', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-306', day: 'Wednesday', period: 8, time: '01:15 PM - 02:00 PM', className: 'Class 2-A', subject: 'Music', teacherId: 'T-050', teacherName: 'Lakshmi Venkat', room: 'Room 103', type: 'Lecture' },
  { id: 'tt-307', day: 'Wednesday', period: 9, time: '02:00 PM - 02:45 PM', className: 'Class 2-A', subject: 'Library', teacherId: 'T-056', teacherName: 'Geeta Sharma', room: 'Library Hall', type: 'Lecture' },

  // ── Thursday · Class 2-A ──
  { id: 'tt-431', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-432', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-433', day: 'Thursday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-005', teacherName: 'Meera Krishnan', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-434', day: 'Thursday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'Social Studies', teacherId: 'T-023', teacherName: 'Vikram Singh', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-435', day: 'Thursday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-436', day: 'Thursday', period: 8, time: '01:15 PM - 02:00 PM', className: 'Class 2-A', subject: 'Computer Science', teacherId: 'T-041', teacherName: 'Arjun Kapoor', room: 'Computer Lab 1', type: 'Lab' },
  { id: 'tt-437', day: 'Thursday', period: 9, time: '02:00 PM - 02:45 PM', className: 'Class 2-A', subject: 'Physical Education', teacherId: 'T-047', teacherName: 'Sanjay Reddy', room: 'Sports Complex', type: 'Sports' },

  // ── Friday · Class 2-A ──
  { id: 'tt-501', day: 'Friday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-005', teacherName: 'Meera Krishnan', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-502', day: 'Friday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-503', day: 'Friday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-504', day: 'Friday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-505', day: 'Friday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Social Studies', teacherId: 'T-023', teacherName: 'Vikram Singh', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-506', day: 'Friday', period: 8, time: '01:15 PM - 02:00 PM', className: 'Class 2-A', subject: 'Physical Education', teacherId: 'T-047', teacherName: 'Sanjay Reddy', room: 'Sports Complex', type: 'Sports' },
  { id: 'tt-507', day: 'Friday', period: 9, time: '02:00 PM - 02:45 PM', className: 'Class 2-A', subject: 'Art & Craft', teacherId: 'T-053', teacherName: 'Faisal Ahmed', room: 'Room 103', type: 'Lecture' },

  // ── Saturday · Class 2-A (half day — ends 12:30 PM) ──
  { id: 'tt-601', day: 'Saturday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-002', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-602', day: 'Saturday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-603', day: 'Saturday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-011', teacherName: 'Kavita Joshi', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-604', day: 'Saturday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'Art & Craft', teacherId: 'T-053', teacherName: 'Faisal Ahmed', room: 'Room 103', type: 'Lecture' },
  { id: 'tt-605', day: 'Saturday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Library', teacherId: 'T-056', teacherName: 'Geeta Sharma', room: 'Library Hall', type: 'Lecture' },

  // ── Thursday · Class 2-B ──
  { id: 'tt-411', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-B', subject: 'Mathematics', teacherId: 'T-032', teacherName: 'Anjali Desai', room: 'Room 103', type: 'Lecture' },
  { id: 'tt-412', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-B', subject: 'English', teacherId: 'T-020', teacherName: 'Deepa Menon', room: 'Room 103', type: 'Lecture' },
  { id: 'tt-413', day: 'Thursday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-B', subject: 'Science', teacherId: 'T-026', teacherName: 'Neha Gupta', room: 'Room 103', type: 'Lecture' },

  // ── Thursday · Class 9-A ──
  { id: 'tt-421', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 9-A', subject: 'Science', teacherId: 'T-017', teacherName: 'Amit Verma', room: 'Room 301', type: 'Lecture' },
  { id: 'tt-422', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 9-A', subject: 'Mathematics', teacherId: 'T-008', teacherName: 'Sunita Rao', room: 'Room 301', type: 'Lecture' },
  { id: 'tt-423', day: 'Thursday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 9-A', subject: 'English', teacherId: 'T-020', teacherName: 'Deepa Menon', room: 'Room 301', type: 'Lecture' },

  // ── Thursday · Class 10-A ──
  { id: 'tt-401', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 10-A', subject: 'Mathematics', teacherId: 'T-035', teacherName: 'Rajesh Khanna', room: 'Room 304', type: 'Lecture' },
  { id: 'tt-402', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 10-A', subject: 'Physics', teacherId: 'T-038', teacherName: 'Pooja Bhatt', room: 'Physics Lab', type: 'Lab' },
  { id: 'tt-403', day: 'Thursday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 10-A', subject: 'Chemistry', teacherId: 'T-026', teacherName: 'Neha Gupta', room: 'Chemistry Lab', type: 'Lab' },
  { id: 'tt-405', day: 'Thursday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 10-A', subject: 'English', teacherId: 'T-020', teacherName: 'Deepa Menon', room: 'Room 304', type: 'Lecture' },
  { id: 'tt-406', day: 'Thursday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 10-A', subject: 'Social Studies', teacherId: 'T-029', teacherName: 'Suresh Pillai', room: 'Room 304', type: 'Lecture' },

  // ── Thursday · Class 12-Sci-A ──
  { id: 'tt-441', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 12-Sci-A', subject: 'Physics', teacherId: 'T-038', teacherName: 'Pooja Bhatt', room: 'Physics Lab', type: 'Lab' },
  { id: 'tt-442', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 12-Sci-A', subject: 'Chemistry', teacherId: 'T-026', teacherName: 'Neha Gupta', room: 'Chemistry Lab', type: 'Lab' },
  { id: 'tt-443', day: 'Thursday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 12-Sci-A', subject: 'Mathematics', teacherId: 'T-035', teacherName: 'Rajesh Khanna', room: 'Room 301', type: 'Lecture' },
]
