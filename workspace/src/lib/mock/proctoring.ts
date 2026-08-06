// Exam proctoring data — hall tickets, seating, invigilation

export interface ExamSlot {
  id: string
  exam: string
  date: string
  subject: string
  time: string
  duration: string
  classes: string[]
  students: number
  rooms: number
  invigilators: number
  status: 'Scheduled' | 'Ongoing' | 'Completed'
  gradient: string
}

export const examSlots: ExamSlot[] = [
  { id: 'ES01', exam: 'Pre-Board 2024', date: '2024-12-09', subject: 'Mathematics', time: '09:00 AM', duration: '3 hrs', classes: ['Class 10-A', 'Class 10-B'], students: 48, rooms: 3, invigilators: 6, status: 'Scheduled', gradient: 'from-violet-500 to-purple-600' },
  { id: 'ES02', exam: 'Pre-Board 2024', date: '2024-12-09', subject: 'English', time: '09:00 AM', duration: '3 hrs', classes: ['Class 12-Sci-A', 'Class 12-Com-A'], students: 42, rooms: 3, invigilators: 6, status: 'Scheduled', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'ES03', exam: 'Pre-Board 2024', date: '2024-12-10', subject: 'Science', time: '09:00 AM', duration: '3 hrs', classes: ['Class 10-A', 'Class 10-B'], students: 48, rooms: 3, invigilators: 6, status: 'Scheduled', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'ES04', exam: 'Unit Test 4', date: '2024-12-05', subject: 'Mathematics', time: '11:00 AM', duration: '1.5 hrs', classes: ['Class 2-A'], students: 18, rooms: 1, invigilators: 2, status: 'Completed', gradient: 'from-amber-500 to-orange-600' },
  { id: 'ES05', exam: 'Unit Test 4', date: '2024-12-05', subject: 'English', time: '11:00 AM', duration: '1.5 hrs', classes: ['Class 2-B'], students: 16, rooms: 1, invigilators: 2, status: 'Completed', gradient: 'from-rose-500 to-pink-600' },
]

export interface SeatingArrangement {
  id: string
  room: string
  capacity: number
  allocated: number
  rows: number
  cols: number
  exam: string
  invigilator: string
}

export const seatingArrangements: SeatingArrangement[] = [
  { id: 'SA01', room: 'Exam Hall A', capacity: 24, allocated: 18, rows: 4, cols: 6, exam: 'Unit Test 4 — Class 2-A Maths', invigilator: 'Rohan Mehta' },
  { id: 'SA02', room: 'Room 201', capacity: 30, allocated: 24, rows: 5, cols: 6, exam: 'Pre-Board Class 10-A Maths', invigilator: 'Rajesh Khanna' },
  { id: 'SA03', room: 'Room 202', capacity: 30, allocated: 24, rows: 5, cols: 6, exam: 'Pre-Board Class 10-B Maths', invigilator: 'Anjali Desai' },
  { id: 'SA04', room: 'Room 203', capacity: 24, allocated: 21, rows: 4, cols: 6, exam: 'Pre-Board Class 12-Sci English', invigilator: 'Deepa Menon' },
]

export interface InvigilationDuty {
  id: string
  teacher: string
  avatar: string
  date: string
  time: string
  room: string
  exam: string
  subject: string
  duration: string
  status: 'Assigned' | 'Ongoing' | 'Completed'
  report?: string
}

export const invigilationDuties: InvigilationDuty[] = [
  { id: 'ID01', teacher: 'Rohan Mehta', avatar: 'RM', date: '2024-12-09', time: '09:00 AM', room: 'Exam Hall A', exam: 'Pre-Board 2024', subject: 'Mathematics', duration: '3 hrs', status: 'Assigned' },
  { id: 'ID02', teacher: 'Deepa Menon', avatar: 'DM', date: '2024-12-09', time: '09:00 AM', room: 'Room 203', exam: 'Pre-Board 2024', subject: 'English', duration: '3 hrs', status: 'Assigned' },
  { id: 'ID03', teacher: 'Pooja Bhatt', avatar: 'PB', date: '2024-12-10', time: '09:00 AM', room: 'Room 201', exam: 'Pre-Board 2024', subject: 'Science', duration: '3 hrs', status: 'Assigned' },
  { id: 'ID04', teacher: 'Rohan Mehta', avatar: 'RM', date: '2024-12-05', time: '11:00 AM', room: 'Exam Hall A', exam: 'Unit Test 4', subject: 'Mathematics', duration: '1.5 hrs', status: 'Completed', report: 'All 18 students present. No malpractice. 1 student needed extra sheet.' },
  { id: 'ID05', teacher: 'Kavita Joshi', avatar: 'KJ', date: '2024-12-05', time: '11:00 AM', room: 'Room 101', exam: 'Unit Test 4', subject: 'Science', duration: '1.5 hrs', status: 'Completed', report: 'Smooth conduct. 2 late arrivals by 5 min.' },
]

export interface HallTicket {
  id: string
  studentName: string
  avatar: string
  rollNo: string
  className: string
  exam: string
  room: string
  seatNo: string
  subjects: { subject: string; date: string; time: string }[]
  status: 'Generated' | 'Printed' | 'Distributed'
}

export const hallTickets: HallTicket[] = [
  { id: 'HT01', studentName: 'Myra Iyer', avatar: 'MI', rollNo: '10', className: 'Class 2-A', exam: 'Unit Test 4', room: 'Exam Hall A', seatNo: 'A-12', subjects: [{ subject: 'Mathematics', date: '2024-12-05', time: '11:00 AM' }, { subject: 'English', date: '2024-12-06', time: '11:00 AM' }, { subject: 'Science', date: '2024-12-07', time: '11:00 AM' }], status: 'Distributed' },
  { id: 'HT02', studentName: 'Aarav Sharma', avatar: 'AS', rollNo: '18', className: 'Class 2-A', exam: 'Unit Test 4', room: 'Exam Hall A', seatNo: 'A-15', subjects: [{ subject: 'Mathematics', date: '2024-12-05', time: '11:00 AM' }, { subject: 'English', date: '2024-12-06', time: '11:00 AM' }, { subject: 'Science', date: '2024-12-07', time: '11:00 AM' }], status: 'Distributed' },
  { id: 'HT03', studentName: 'Diya Patel', avatar: 'DP', rollNo: '02', className: 'Class 2-A', exam: 'Unit Test 4', room: 'Exam Hall A', seatNo: 'A-08', subjects: [{ subject: 'Mathematics', date: '2024-12-05', time: '11:00 AM' }, { subject: 'English', date: '2024-12-06', time: '11:00 AM' }, { subject: 'Science', date: '2024-12-07', time: '11:00 AM' }], status: 'Printed' },
]

export const proctoringStats = {
  upcomingExams: 3,
  totalStudents: 108,
  roomsAllocated: 8,
  invigilatorsAssigned: 16,
  hallTicketsGenerated: 108,
  completedExams: 2,
  malpracticeReports: 0,
  attendanceRate: 98.2,
  monthlyExams: [
    { month: 'Sep', count: 2 }, { month: 'Oct', count: 1 },
    { month: 'Nov', count: 3 }, { month: 'Dec', count: 5 },
  ],
  roomUtilization: [
    { name: 'Exam Hall A', value: 18, color: 'oklch(0.55 0.14 162)' },
    { name: 'Room 201', value: 24, color: 'oklch(0.65 0.16 75)' },
    { name: 'Room 202', value: 24, color: 'oklch(0.6 0.18 300)' },
    { name: 'Room 203', value: 21, color: 'oklch(0.7 0.15 200)' },
  ],
}
