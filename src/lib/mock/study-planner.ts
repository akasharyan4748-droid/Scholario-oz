// Study planner data — schedule, tasks, reminders, pomodoro

export interface StudyTask {
  id: string
  title: string
  subject: string
  type: 'Homework' | 'Revision' | 'Project' | 'Reading' | 'Practice'
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  dueTime: string
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed'
  color: string
}

export const studyTasks: StudyTask[] = [
  { id: 'ST01', title: 'Complete Maths Worksheet 4', subject: 'Mathematics', type: 'Homework', priority: 'high', dueDate: '2024-11-29', dueTime: '08:00 AM', estimatedTime: '30 min', status: 'in-progress', color: 'oklch(0.6 0.18 300)' },
  { id: 'ST02', title: 'Revise Addition with Carrying', subject: 'Mathematics', type: 'Revision', priority: 'high', dueDate: '2024-11-29', dueTime: '07:00 PM', estimatedTime: '20 min', status: 'pending', color: 'oklch(0.6 0.18 300)' },
  { id: 'ST03', title: 'Read "Wings of Fire" — Ch 3', subject: 'Library', type: 'Reading', priority: 'medium', dueDate: '2024-11-30', dueTime: '08:00 PM', estimatedTime: '25 min', status: 'pending', color: 'oklch(0.55 0.14 162)' },
  { id: 'ST04', title: 'Practice Hindi Varnamala', subject: 'Hindi', type: 'Practice', priority: 'medium', dueDate: '2024-11-29', dueTime: '06:00 PM', estimatedTime: '15 min', status: 'pending', color: 'oklch(0.62 0.2 25)' },
  { id: 'ST05', title: 'Science Project — Collect leaves', subject: 'Science', type: 'Project', priority: 'low', dueDate: '2024-12-02', dueTime: '05:00 PM', estimatedTime: '40 min', status: 'pending', color: 'oklch(0.65 0.16 75)' },
  { id: 'ST06', title: 'Revise Living & Non-Living Things', subject: 'Science', type: 'Revision', priority: 'high', dueDate: '2024-11-28', dueTime: '07:30 PM', estimatedTime: '20 min', status: 'completed', color: 'oklch(0.65 0.16 75)' },
  { id: 'ST07', title: 'Practice Computer — Parts quiz', subject: 'Computer Science', type: 'Practice', priority: 'medium', dueDate: '2024-11-28', dueTime: '08:30 PM', estimatedTime: '15 min', status: 'completed', color: 'oklch(0.7 0.15 200)' },
  { id: 'ST08', title: 'English — Reading Comprehension', subject: 'English', type: 'Homework', priority: 'high', dueDate: '2024-11-28', dueTime: '07:00 PM', estimatedTime: '25 min', status: 'completed', color: 'oklch(0.55 0.14 162)' },
]

export interface StudyBlock {
  id: string
  time: string
  duration: number
  subject: string
  activity: string
  type: 'study' | 'break' | 'revision'
  color: string
}

export const todayPlan: StudyBlock[] = [
  { id: 'SB01', time: '04:00 PM', duration: 25, subject: 'Mathematics', activity: 'Worksheet 4 — Addition', type: 'study', color: 'oklch(0.6 0.18 300)' },
  { id: 'SB02', time: '04:25 PM', duration: 5, subject: '', activity: 'Short break', type: 'break', color: 'oklch(0.8 0.01 160)' },
  { id: 'SB03', time: '04:30 PM', duration: 15, subject: 'Hindi', activity: 'Varnamala practice', type: 'study', color: 'oklch(0.62 0.2 25)' },
  { id: 'SB04', time: '04:45 PM', duration: 5, subject: '', activity: 'Short break', type: 'break', color: 'oklch(0.8 0.01 160)' },
  { id: 'SB05', time: '04:50 PM', duration: 20, subject: 'Science', activity: 'Revise Living Things', type: 'revision', color: 'oklch(0.65 0.16 75)' },
  { id: 'SB06', time: '05:10 PM', duration: 10, subject: '', activity: 'Long break + snack', type: 'break', color: 'oklch(0.7 0.15 200)' },
  { id: 'SB07', time: '05:20 PM', duration: 25, subject: 'English', activity: 'Reading Comprehension', type: 'study', color: 'oklch(0.55 0.14 162)' },
  { id: 'SB08', time: '05:45 PM', duration: 25, subject: 'Library', activity: 'Read Wings of Fire', type: 'study', color: 'oklch(0.6 0.15 60)' },
]

export interface Reminder {
  id: string
  title: string
  time: string
  type: 'exam' | 'submission' | 'event' | 'task'
  daysAway: number
  color: string
}

export const upcomingReminders: Reminder[] = [
  { id: 'RM01', title: 'Maths Worksheet 4 due', time: 'Tomorrow 8 AM', type: 'submission', daysAway: 1, color: 'oklch(0.6 0.18 300)' },
  { id: 'RM02', title: 'Science Project submission', time: 'Dec 2', type: 'submission', daysAway: 4, color: 'oklch(0.65 0.16 75)' },
  { id: 'RM03', title: 'Unit Test 4 — Maths', time: 'Dec 5', type: 'exam', daysAway: 7, color: 'oklch(0.62 0.2 25)' },
  { id: 'RM04', title: 'Annual Sports Day', time: 'Dec 15', type: 'event', daysAway: 17, color: 'oklch(0.55 0.14 162)' },
  { id: 'RM05', title: 'Pre-Board Exam begins', time: 'Dec 9', type: 'exam', daysAway: 11, color: 'oklch(0.62 0.2 25)' },
]

export const plannerStats = {
  tasksToday: 8,
  completedToday: 3,
  pendingToday: 5,
  studyTimeToday: 115,
  studyTimeTarget: 150,
  focusSessions: 4,
  focusSessionsTarget: 6,
  streak: 18,
  weeklyStudyHours: 12.5,
  weeklyTarget: 15,
  productivityScore: 78,
  weeklyTasks: [
    { day: 'Mon', completed: 5, total: 6 },
    { day: 'Tue', completed: 7, total: 8 },
    { day: 'Wed', completed: 4, total: 5 },
    { day: 'Thu', completed: 6, total: 7 },
    { day: 'Fri', completed: 3, total: 8 },
    { day: 'Sat', completed: 0, total: 0 },
    { day: 'Sun', completed: 0, total: 0 },
  ],
  subjectTimeAllocation: [
    { name: 'Mathematics', value: 4.2, color: 'oklch(0.6 0.18 300)' },
    { name: 'English', value: 2.8, color: 'oklch(0.55 0.14 162)' },
    { name: 'Science', value: 2.5, color: 'oklch(0.65 0.16 75)' },
    { name: 'Hindi', value: 1.8, color: 'oklch(0.62 0.2 25)' },
    { name: 'Computer Sci', value: 1.2, color: 'oklch(0.7 0.15 200)' },
  ],
}
