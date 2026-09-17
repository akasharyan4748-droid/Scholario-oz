// PTM (Parent-Teacher Meeting) scheduler data — Term 1, session 2026-27.
// Events are anchored to the school's real assessment calendar and the
// slot roster uses the real Grade 9-A students (Rohan Mehta is class
// teacher of Grade 9-A). Meeting-day state (notes, ratings, completions)
// lives in the ptm-store; this file is the immutable published plan.

export interface PTMSlot {
  id: string
  time: string
  duration: string
  parentName: string
  studentName: string
  rollNo: string
  avatar: string
  status: 'booked' | 'available' | 'completed' | 'cancelled'
  notes?: string
  rating?: number
}

/** Today's PTM (17 Sept 2026) — the PA1 progress meetings for Grade 9-A. */
export const ptmSchedule: PTMSlot[] = [
  { id: 'PTM01', time: '09:00 AM', duration: '10 min', parentName: 'Sharma Family', studentName: 'Aarav Sharma', rollNo: '01', avatar: 'AS', status: 'completed', notes: 'Strong PA1 result in Mathematics (42/50). Needs to work on presentation neatness.', rating: 5 },
  { id: 'PTM02', time: '09:10 AM', duration: '10 min', parentName: 'Patel Family', studentName: 'Diya Patel', rollNo: '02', avatar: 'DP', status: 'completed', notes: 'Consistent performer. Encourage more reading at home.', rating: 5 },
  { id: 'PTM03', time: '09:20 AM', duration: '10 min', parentName: 'Reddy Family', studentName: 'Vivaan Reddy', rollNo: '03', avatar: 'VR', status: 'booked' },
  { id: 'PTM04', time: '09:30 AM', duration: '10 min', parentName: 'Gupta Family', studentName: 'Ananya Gupta', rollNo: '04', avatar: 'AG', status: 'booked' },
  { id: 'PTM05', time: '09:40 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available' },
  { id: 'PTM06', time: '09:50 AM', duration: '10 min', parentName: 'Singh Family', studentName: 'Aditya Singh', rollNo: '05', avatar: 'AS', status: 'booked' },
  { id: 'PTM07', time: '10:00 AM', duration: '10 min', parentName: 'Nair Family', studentName: 'Saanvi Nair', rollNo: '06', avatar: 'SN', status: 'booked' },
  { id: 'PTM08', time: '10:10 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available' },
  { id: 'PTM09', time: '10:20 AM', duration: '10 min', parentName: 'Iyer Family', studentName: 'Arjun Iyer', rollNo: '07', avatar: 'AI', status: 'cancelled', notes: 'Parent informed — rescheduled to 11:00 AM' },
  { id: 'PTM10', time: '10:30 AM', duration: '10 min', parentName: 'Verma Family', studentName: 'Ishita Verma', rollNo: '08', avatar: 'IV', status: 'booked' },
  { id: 'PTM11', time: '10:40 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available' },
  { id: 'PTM12', time: '10:50 AM', duration: '10 min', parentName: 'Joshi Family', studentName: 'Reyansh Joshi', rollNo: '09', avatar: 'RJ', status: 'booked' },
  { id: 'PTM13', time: '11:00 AM', duration: '10 min', parentName: 'Mehta Family', studentName: 'Myra Mehta', rollNo: '10', avatar: 'MM', status: 'booked' },
]

export interface PTMEvent {
  id: string
  title: string
  date: string
  time: string
  className: string
  totalSlots: number
  bookedSlots: number
  completedSlots: number
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
  venue: string
  notes: string
}

/** The school's Term 1 PTM calendar (session 2026-27). */
export const ptmEvents: PTMEvent[] = [
  {
    id: 'PTME01',
    title: 'PA1 Progress PTM — Grade 9',
    date: '2026-09-17',
    time: '09:00 AM – 12:00 PM',
    className: 'Grade 9 - A',
    totalSlots: 13,
    bookedSlots: 10,
    completedSlots: 2,
    status: 'Ongoing',
    venue: 'Room 201',
    notes: 'Discuss Periodic Assessment 1 results and the way to Mid-Terms.',
  },
  {
    id: 'PTME02',
    title: 'Mid-Term Review PTM — Grade 9',
    date: '2026-09-05',
    time: '10:00 AM – 01:00 PM',
    className: 'Grade 9 - A',
    totalSlots: 13,
    bookedSlots: 13,
    completedSlots: 13,
    status: 'Completed',
    venue: 'Room 201',
    notes: 'Mid-Term results handover and study plan for Term 1 finals.',
  },
  {
    id: 'PTME03',
    title: 'Half-Yearly PTM — Grade 9 & 10',
    date: '2026-11-21',
    time: '09:30 AM – 12:30 PM',
    className: 'Grade 9 - A · Grade 10 - A',
    totalSlots: 20,
    bookedSlots: 8,
    completedSlots: 0,
    status: 'Scheduled',
    venue: 'Auditorium',
    notes: 'Combined session before the Term 2 assessments begin.',
  },
]
