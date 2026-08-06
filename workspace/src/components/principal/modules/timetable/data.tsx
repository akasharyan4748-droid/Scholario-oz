'use client'

// Mock data, constants, and types for the Timetable module.
// All page sections import from this single source of truth.

export interface TimetableSlot {
  id: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  period: number // 1 to 8
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
  { number: 1, name: 'Period 1', time: '08:30 AM - 09:15 AM' },
  { number: 2, name: 'Period 2', time: '09:15 AM - 10:00 AM' },
  { number: 3, name: 'Period 3', time: '10:00 AM - 10:45 AM' },
  { number: 4, name: 'Short Break', time: '10:45 AM - 11:00 AM', isBreak: true },
  { number: 5, name: 'Period 4', time: '11:00 AM - 11:45 AM' },
  { number: 6, name: 'Period 5', time: '11:45 AM - 12:30 PM' },
  { number: 7, name: 'Lunch Break', time: '12:30 PM - 01:15 PM', isBreak: true },
  { number: 8, name: 'Period 6', time: '01:15 PM - 02:00 PM' },
  { number: 9, name: 'Period 7', time: '02:00 PM - 02:45 PM' },
]

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

export const INITIAL_SLOTS: TimetableSlot[] = [
  { id: 'tt-101', day: 'Monday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-102', day: 'Monday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-003', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-103', day: 'Monday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-002', teacherName: 'Pooja Bhatt', room: 'Physics Lab', type: 'Lab' },
  { id: 'tt-105', day: 'Monday', period: 5, time: '11:00 AM - 11:45 AM', className: 'Class 2-A', subject: 'Computer Science', teacherId: 'T-001', teacherName: 'Arjun Kapoor', room: 'Computer Lab 1', type: 'Lab' },
  { id: 'tt-106', day: 'Monday', period: 6, time: '11:45 AM - 12:30 PM', className: 'Class 2-A', subject: 'Social Studies', teacherId: 'T-005', teacherName: 'Rajesh Khanna', room: 'Room 102', type: 'Lecture' },

  { id: 'tt-201', day: 'Tuesday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'English', teacherId: 'T-003', teacherName: 'Priya Nair', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-202', day: 'Tuesday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-203', day: 'Tuesday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Physical Education', teacherId: 'T-007', teacherName: 'Vikram Singh', room: 'Sports Complex', type: 'Sports' },

  { id: 'tt-301', day: 'Wednesday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-302', day: 'Wednesday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Science', teacherId: 'T-002', teacherName: 'Pooja Bhatt', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-303', day: 'Wednesday', period: 3, time: '10:00 AM - 10:45 AM', className: 'Class 2-A', subject: 'Art & Craft', teacherId: 'T-008', teacherName: 'Meera Deshmukh', room: 'Room 102', type: 'Lecture' },

  { id: 'tt-401', day: 'Thursday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 10-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 304', type: 'Lecture' },
  { id: 'tt-402', day: 'Thursday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 10-A', subject: 'Physics', teacherId: 'T-002', teacherName: 'Pooja Bhatt', room: 'Physics Lab', type: 'Lab' },

  { id: 'tt-501', day: 'Friday', period: 1, time: '08:30 AM - 09:15 AM', className: 'Class 2-A', subject: 'Hindi', teacherId: 'T-006', teacherName: 'Sunita Sharma', room: 'Room 102', type: 'Lecture' },
  { id: 'tt-502', day: 'Friday', period: 2, time: '09:15 AM - 10:00 AM', className: 'Class 2-A', subject: 'Mathematics', teacherId: 'T-014', teacherName: 'Rohan Mehta', room: 'Room 102', type: 'Lecture' },
]
