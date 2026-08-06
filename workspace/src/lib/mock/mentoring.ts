// Student mentoring data — mentor groups, 1-on-1 sessions, notes

export interface MentorGroup {
  id: string
  name: string
  grade: string
  students: number
  meetingDay: string
  meetingTime: string
  focus: string
  gradient: string
}

export const mentorGroups: MentorGroup[] = [
  { id: 'MG01', name: 'Math Whiz Club', grade: 'Class 2-A', students: 6, meetingDay: 'Tuesday', meetingTime: '03:00 PM', focus: 'Advanced problem solving & mental math', gradient: 'from-violet-500 to-purple-600' },
  { id: 'MG02', name: 'Reading Buddies', grade: 'Class 2-A', students: 5, meetingDay: 'Thursday', meetingTime: '03:00 PM', focus: 'Story reading & comprehension', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'MG03', name: 'Young Scientists', grade: 'Class 2-A', students: 4, meetingDay: 'Friday', meetingTime: '03:30 PM', focus: 'Hands-on experiments & curiosity', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'MG04', name: 'Confidence Crew', grade: 'Class 2-A', students: 3, meetingDay: 'Monday', meetingTime: '03:00 PM', focus: 'Public speaking & self-expression', gradient: 'from-amber-500 to-orange-600' },
]

export interface Mentee {
  id: string
  name: string
  avatar: string
  rollNo: string
  strengths: string[]
  areas: string[]
  lastSession: string
  nextSession?: string
  progress: number
  mood: 'thriving' | 'stable' | 'needs-support'
  notes: string
}

export const mentees: Mentee[] = [
  { id: 'ME01', name: 'Aarav Sharma', avatar: 'AS', rollNo: '18', strengths: ['Mathematics', 'Leadership', 'Helpfulness'], areas: ['Handwriting', 'Patience'], lastSession: '2024-11-26', nextSession: '2024-12-03', progress: 85, mood: 'thriving', notes: 'Showing excellent growth. Mentoring younger students in math. Confident and engaged.' },
  { id: 'ME02', name: 'Vivaan Reddy', avatar: 'VR', rollNo: '03', strengths: ['Science curiosity', 'Creativity'], areas: ['Homework consistency', 'Attendance'], lastSession: '2024-11-25', nextSession: '2024-12-02', progress: 62, mood: 'needs-support', notes: 'Struggling with homework completion. Working with parents. Needs gentle encouragement.' },
  { id: 'ME03', name: 'Reyansh Kumar', avatar: 'RK', rollNo: '05', strengths: ['Energy', 'Sports'], areas: ['Focus', 'Impulse control'], lastSession: '2024-11-22', nextSession: '2024-11-29', progress: 70, mood: 'stable', notes: 'High energy. Channeling into sports. Working on classroom focus with fidget tools.' },
  { id: 'ME04', name: 'Sai Pillai', avatar: 'SP', rollNo: '17', strengths: ['Observation', 'Listening'], areas: ['Class participation', 'Confidence'], lastSession: '2024-11-23', nextSession: '2024-11-30', progress: 58, mood: 'needs-support', notes: 'Very quiet. Using small group activities to build confidence. Slow but steady progress.' },
  { id: 'ME05', name: 'Myra Iyer', avatar: 'MI', rollNo: '10', strengths: ['Academic excellence', 'Leadership', 'Communication'], areas: ['Perfectionism'], lastSession: '2024-11-27', nextSession: '2024-12-04', progress: 95, mood: 'thriving', notes: 'Outstanding all-rounder. Leading quiz team. Mentoring her on handling pressure gracefully.' },
  { id: 'ME06', name: 'Kabir Khanna', avatar: 'KK', rollNo: '11', strengths: ['Art', 'Imagination'], areas: ['Attendance', 'Math'], lastSession: '2024-11-21', nextSession: '2024-11-28', progress: 55, mood: 'stable', notes: 'Creative but irregular attendance. Parent meeting done. Improving math through art integration.' },
]

export interface SessionLog {
  id: string
  mentee: string
  avatar: string
  date: string
  duration: string
  topic: string
  summary: string
  actionItems: string[]
  moodBefore: string
  moodAfter: string
  rating: number
}

export const sessionLogs: SessionLog[] = [
  { id: 'SL01', mentee: 'Aarav Sharma', avatar: 'AS', date: '2024-11-26', duration: '20 min', topic: 'Leadership & helping peers', summary: 'Discussed Aarav helping classmates with subtraction. Encouraged to continue. Set a goal to mentor 2 more students this month.', actionItems: ['Mentor Aditya in math', 'Share 1 study tip daily'], moodBefore: 'happy', moodAfter: 'energetic', rating: 5 },
  { id: 'SL02', mentee: 'Vivaan Reddy', avatar: 'VR', date: '2024-11-25', duration: '25 min', topic: 'Homework & attendance support', summary: 'Talked about homework challenges. Created a simple home routine with parents. Vivaan seemed receptive.', actionItems: ['Use homework tracker', 'Parent check-in daily', 'Bring questions to class'], moodBefore: 'tired', moodAfter: 'calm', rating: 4 },
  { id: 'SL03', mentee: 'Myra Iyer', avatar: 'MI', date: '2024-11-27', duration: '15 min', topic: 'Handling perfectionism', summary: 'Discussed that mistakes are learning opportunities. Myra shared pressure she feels. Reassured her.', actionItems: ['Try 1 new thing without perfection', 'Journal feelings'], moodBefore: 'stressed', moodAfter: 'happy', rating: 5 },
  { id: 'SL04', mentee: 'Sai Pillai', avatar: 'SP', date: '2024-11-23', duration: '20 min', topic: 'Building confidence', summary: 'Small group speaking exercise. Sai spoke 2 sentences in front of 3 friends — big win! Celebrated the progress.', actionItems: ['Speak in group of 4 next week', 'Share one observation daily'], moodBefore: 'calm', moodAfter: 'happy', rating: 4 },
]

export const mentoringStats = {
  totalMentees: 6,
  sessionsThisMonth: 24,
  sessionsThisWeek: 5,
  avgSessionDuration: '20 min',
  thrivingCount: 2,
  stableCount: 2,
  needsSupportCount: 2,
  avgProgress: 71,
  monthlySessions: [
    { month: 'Jul', count: 14 }, { month: 'Aug', count: 18 },
    { month: 'Sep', count: 16 }, { month: 'Oct', count: 22 },
    { month: 'Nov', count: 24 },
  ],
  progressDistribution: [
    { name: 'Thriving', value: 2, color: 'oklch(0.55 0.14 162)' },
    { name: 'Stable', value: 2, color: 'oklch(0.65 0.16 75)' },
    { name: 'Needs Support', value: 2, color: 'oklch(0.62 0.2 25)' },
  ],
}
