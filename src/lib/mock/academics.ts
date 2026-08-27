// Examinations & results
export interface Exam {
  id: string
  name: string
  type: 'Unit Test' | 'Mid Term' | 'Final' | 'Surprise'
  startDate: string
  endDate: string
  classes: string[]
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Result Declared'
  subjects: number
}

export const exams: Exam[] = [
  { id: 'EX01', name: 'Mid Term Examination 2024', type: 'Mid Term', startDate: '2024-09-15', endDate: '2024-09-26', classes: ['Class 1–12'], status: 'Completed', subjects: 6 },
  { id: 'EX02', name: 'Unit Test 3', type: 'Unit Test', startDate: '2024-11-18', endDate: '2024-11-22', classes: ['Class 1–10'], status: 'Result Declared', subjects: 5 },
  { id: 'EX03', name: 'Pre-Board Examination', type: 'Final', startDate: '2024-12-09', endDate: '2024-12-20', classes: ['Class 10', 'Class 12'], status: 'Scheduled', subjects: 6 },
  { id: 'EX04', name: 'Annual Examination 2024', type: 'Final', startDate: '2025-02-20', endDate: '2025-03-10', classes: ['Class 1–12'], status: 'Scheduled', subjects: 7 },
  { id: 'EX05', name: 'Surprise Test — Mathematics', type: 'Surprise', startDate: '2024-11-28', endDate: '2024-11-28', classes: ['Class 2-A'], status: 'Completed', subjects: 1 },
]

export interface SubjectResult {
  subject: string
  maxMarks: number
  obtained: number
  grade: string
}

export const examResults = {
  // Aarav Sharma — Unit Test 3 (Class 2-A)
  studentResults: [
    { subject: 'English', maxMarks: 50, obtained: 46, grade: 'A+' },
    { subject: 'Mathematics', maxMarks: 50, obtained: 48, grade: 'A+' },
    { subject: 'Science', maxMarks: 50, obtained: 44, grade: 'A' },
    { subject: 'Social Studies', maxMarks: 50, obtained: 42, grade: 'A' },
    { subject: 'Hindi', maxMarks: 50, obtained: 45, grade: 'A+' },
    { subject: 'Computer Science', maxMarks: 50, obtained: 49, grade: 'A+' },
  ] as SubjectResult[],
  total: 274,
  maxTotal: 300,
  percentage: 91.3,
  grade: 'A+',
  rank: 3,
  totalStudents: 18,
  remarks: 'Excellent performance. Consistent across all subjects. Keep it up!',
  progressTrend: [
    { exam: 'UT1', percentage: 84 },
    { exam: 'UT2', percentage: 88 },
    { exam: 'Mid Term', percentage: 86 },
    { exam: 'UT3', percentage: 91 },
  ],
}

export const classToppers = [
  { rank: 1, name: 'Myra Iyer', percentage: 96.7, avatar: 'MI', rollNo: '10' },
  { rank: 2, name: 'Anika Desai', percentage: 94.3, avatar: 'AD', rollNo: '14' },
  { rank: 3, name: 'Aarav Sharma', percentage: 91.3, avatar: 'AS', rollNo: '18' },
  { rank: 4, name: 'Ananya Singh', percentage: 90.0, avatar: 'AN', rollNo: '04' },
  { rank: 5, name: 'Kiara Rao', percentage: 88.7, avatar: 'KR', rollNo: '12' },
]

export const examAnalytics = {
  passPercentage: 96.4,
  distinction: 612,
  firstClass: 824,
  averageScore: 78.6,
  subjectPerformance: [
    { subject: 'English', avg: 82.4 },
    { subject: 'Mathematics', avg: 74.2 },
    { subject: 'Science', avg: 78.6 },
    { subject: 'Social Studies', avg: 80.1 },
    { subject: 'Hindi', avg: 85.3 },
    { subject: 'Computer Science', avg: 88.9 },
  ],
  gradeDistribution: [
    { grade: 'A+', count: 612, color: 'oklch(0.55 0.14 162)' },
    { grade: 'A', count: 548, color: 'oklch(0.65 0.16 75)' },
    { grade: 'B+', count: 384, color: 'oklch(0.7 0.15 200)' },
    { grade: 'B', count: 218, color: 'oklch(0.6 0.18 300)' },
    { grade: 'C', count: 86, color: 'oklch(0.62 0.2 25)' },
  ],
}

// Homework & Assignments
export interface Homework {
  id: string
  title: string
  subject: string
  className: string
  assignedBy: string
  assignedOn: string
  dueDate: string
  description: string
  status: 'Active' | 'Closed'
  submissions: number
  total: number
}

export const homeworks: Homework[] = [
  { id: 'HW001', title: 'Addition & Subtraction — Worksheet 4', subject: 'Mathematics', className: 'Class 2-A', assignedBy: 'Rohan Mehta', assignedOn: '2024-11-26', dueDate: '2024-11-29', description: 'Complete the double-digit addition and subtraction worksheet. Show working for each problem.', status: 'Active', submissions: 14, total: 18 },
  { id: 'HW002', title: 'Reading Comprehension — The Thirsty Crow', subject: 'English', className: 'Class 2-A', assignedBy: 'Deepa Menon', assignedOn: '2024-11-25', dueDate: '2024-11-28', description: 'Read the story and answer all 8 questions in complete sentences.', status: 'Active', submissions: 16, total: 18 },
  { id: 'HW003', title: 'Living & Non-Living Things — Chart', subject: 'Science', className: 'Class 2-A', assignedBy: 'Kavita Joshi', assignedOn: '2024-11-22', dueDate: '2024-11-27', description: 'Make a colourful chart showing 5 living and 5 non-living things around you.', status: 'Active', submissions: 11, total: 18 },
  { id: 'HW004', title: 'Hindi Varnamala Practice', subject: 'Hindi', className: 'Class 2-A', assignedBy: 'Meera Krishnan', assignedOn: '2024-11-20', dueDate: '2024-11-24', description: 'Write each letter of the Hindi varnamala 5 times in your notebook.', status: 'Closed', submissions: 18, total: 18 },
  { id: 'HW005', title: 'My Family — Drawing', subject: 'Art & Craft', className: 'Class 2-A', assignedBy: 'Faisal Ahmed', assignedOn: '2024-11-24', dueDate: '2024-11-30', description: 'Draw a picture of your family and label each member.', status: 'Active', submissions: 9, total: 18 },
]

export interface Assignment {
  id: string
  title: string
  subject: string
  className: string
  dueDate: string
  marks: number
  status: 'Pending' | 'Submitted' | 'Graded'
  obtainedMarks?: number
  remarks?: string
  rubric: string[]
}

export const assignments: Assignment[] = [
  { id: 'ASG001', title: 'Numbers 1–100 — Number Line', subject: 'Mathematics', className: 'Class 2-A', dueDate: '2024-12-02', marks: 20, status: 'Pending', rubric: ['Correct sequence (8)', 'Neat presentation (4)', 'All numbers included (4)', 'On time (4)'] },
  { id: 'ASG002', title: 'Picture Description — My Pet', subject: 'English', className: 'Class 2-A', dueDate: '2024-11-30', marks: 15, status: 'Submitted', rubric: ['Grammar (5)', 'Vocabulary (5)', 'Creativity (5)'] },
  { id: 'ASG003', title: 'Plants Around Me — Project', subject: 'Science', className: 'Class 2-A', dueDate: '2024-11-25', marks: 25, status: 'Graded', obtainedMarks: 23, remarks: 'Beautifully presented! Excellent observation skills. Keep up the curiosity.', rubric: ['Identification (8)', 'Presentation (6)', 'Accuracy (6)', 'Creativity (5)'] },
  { id: 'ASG004', title: 'Community Helpers — Scrapbook', subject: 'Social Studies', className: 'Class 2-A', dueDate: '2024-12-05', marks: 20, status: 'Pending', rubric: ['Content (8)', 'Pictures (4)', 'Description (4)', 'Neatness (4)'] },
]

// Timetable — Class 2-A
export interface Period {
  time: string
  subject: string
  teacher: string
  room: string
}

export const weeklyTimetable: Record<string, Period[]> = {
  Monday: [
    { time: '08:00–08:45', subject: 'Assembly', teacher: '—', room: 'Ground' },
    { time: '08:45–09:30', subject: 'English', teacher: 'Deepa Menon', room: '2A' },
    { time: '09:30–10:15', subject: 'Mathematics', teacher: 'Rohan Mehta', room: '2A' },
    { time: '10:15–10:30', subject: 'Break', teacher: '—', room: '—' },
    { time: '10:30–11:15', subject: 'Science', teacher: 'Kavita Joshi', room: 'Sci-Lab' },
    { time: '11:15–12:00', subject: 'Hindi', teacher: 'Meera Krishnan', room: '2A' },
    { time: '12:00–12:45', subject: 'Lunch', teacher: '—', room: '—' },
    { time: '12:45–01:30', subject: 'Art & Craft', teacher: 'Faisal Ahmed', room: 'Art-Room' },
    { time: '01:30–02:15', subject: 'Library', teacher: 'Geeta Sharma', room: 'Library' },
  ],
  Tuesday: [
    { time: '08:00–08:45', subject: 'Assembly', teacher: '—', room: 'Ground' },
    { time: '08:45–09:30', subject: 'Mathematics', teacher: 'Rohan Mehta', room: '2A' },
    { time: '09:30–10:15', subject: 'English', teacher: 'Deepa Menon', room: '2A' },
    { time: '10:15–10:30', subject: 'Break', teacher: '—', room: '—' },
    { time: '10:30–11:15', subject: 'Social Studies', teacher: 'Vikram Singh', room: '2A' },
    { time: '11:15–12:00', subject: 'Computer Science', teacher: 'Arjun Kapoor', room: 'Comp-Lab' },
    { time: '12:00–12:45', subject: 'Lunch', teacher: '—', room: '—' },
    { time: '12:45–01:30', subject: 'Physical Education', teacher: 'Sanjay Reddy', room: 'Ground' },
    { time: '01:30–02:15', subject: 'Music', teacher: 'Lakshmi Venkat', room: 'Music-Room' },
  ],
  Wednesday: [
    { time: '08:00–08:45', subject: 'Assembly', teacher: '—', room: 'Ground' },
    { time: '08:45–09:30', subject: 'Hindi', teacher: 'Meera Krishnan', room: '2A' },
    { time: '09:30–10:15', subject: 'Mathematics', teacher: 'Rohan Mehta', room: '2A' },
    { time: '10:15–10:30', subject: 'Break', teacher: '—', room: '—' },
    { time: '10:30–11:15', subject: 'English', teacher: 'Deepa Menon', room: '2A' },
    { time: '11:15–12:00', subject: 'Science', teacher: 'Kavita Joshi', room: 'Sci-Lab' },
    { time: '12:00–12:45', subject: 'Lunch', teacher: '—', room: '—' },
    { time: '12:45–01:30', subject: 'Art & Craft', teacher: 'Faisal Ahmed', room: 'Art-Room' },
    { time: '01:30–02:15', subject: 'Physical Education', teacher: 'Sanjay Reddy', room: 'Ground' },
  ],
  Thursday: [
    { time: '08:00–08:45', subject: 'Assembly', teacher: '—', room: 'Ground' },
    { time: '08:45–09:30', subject: 'English', teacher: 'Deepa Menon', room: '2A' },
    { time: '09:30–10:15', subject: 'Mathematics', teacher: 'Rohan Mehta', room: '2A' },
    { time: '10:15–10:30', subject: 'Break', teacher: '—', room: '—' },
    { time: '10:30–11:15', subject: 'Hindi', teacher: 'Meera Krishnan', room: '2A' },
    { time: '11:15–12:00', subject: 'Social Studies', teacher: 'Vikram Singh', room: '2A' },
    { time: '12:00–12:45', subject: 'Lunch', teacher: '—', room: '—' },
    { time: '12:45–01:30', subject: 'Computer Science', teacher: 'Arjun Kapoor', room: 'Comp-Lab' },
    { time: '01:30–02:15', subject: 'Library', teacher: 'Geeta Sharma', room: 'Library' },
  ],
  Friday: [
    { time: '08:00–08:45', subject: 'Assembly', teacher: '—', room: 'Ground' },
    { time: '08:45–09:30', subject: 'Mathematics', teacher: 'Rohan Mehta', room: '2A' },
    { time: '09:30–10:15', subject: 'Science', teacher: 'Kavita Joshi', room: 'Sci-Lab' },
    { time: '10:15–10:30', subject: 'Break', teacher: '—', room: '—' },
    { time: '10:30–11:15', subject: 'English', teacher: 'Deepa Menon', room: '2A' },
    { time: '11:15–12:00', subject: 'Hindi', teacher: 'Meera Krishnan', room: '2A' },
    { time: '12:00–12:45', subject: 'Lunch', teacher: '—', room: '—' },
    { time: '12:45–01:30', subject: 'Music', teacher: 'Lakshmi Venkat', room: 'Music-Room' },
    { time: '01:30–02:15', subject: 'Art & Craft', teacher: 'Faisal Ahmed', room: 'Art-Room' },
  ],
}

export const todaySchedule = weeklyTimetable['Wednesday']
