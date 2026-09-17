// Teacher performance review data

export interface ReviewCycle {
  id: string
  name: string
  period: string
  startDate: string
  endDate: string
  status: 'Active' | 'Completed' | 'Upcoming'
  participants: number
  completed: number
}

export const reviewCycles: ReviewCycle[] = [
  { id: 'RC01', name: 'Annual Performance Review 2024', period: 'Jan 2024 – Dec 2024', startDate: '2024-12-01', endDate: '2024-12-20', status: 'Active', participants: 96, completed: 42 },
  { id: 'RC02', name: 'Mid-Year Review', period: 'Jan 2024 – Jun 2024', startDate: '2024-07-01', endDate: '2024-07-15', status: 'Completed', participants: 96, completed: 96 },
  { id: 'RC03', name: 'Peer Observation Round', period: 'Nov 2024', startDate: '2024-11-15', endDate: '2024-11-30', status: 'Completed', participants: 96, completed: 94 },
  { id: 'RC04', name: 'Q1 2025 Review', period: 'Jan 2025 – Mar 2025', startDate: '2025-04-01', endDate: '2025-04-15', status: 'Upcoming', participants: 96, completed: 0 },
]

export interface ReviewItem {
  id: string
  category: string
  criteria: string
  selfRating: number
  supervisorRating: number
  weight: number
  comments?: string
}

export const selfEvaluation: ReviewItem[] = [
  { id: 'R01', category: 'Teaching Quality', criteria: 'Lesson delivery & student engagement', selfRating: 4, supervisorRating: 5, weight: 25, comments: 'Innovative use of visual aids. Students highly engaged.' },
  { id: 'R02', category: 'Teaching Quality', criteria: 'Subject knowledge & clarity', selfRating: 5, supervisorRating: 5, weight: 20, comments: 'Excellent command over Mathematics concepts.' },
  { id: 'R03', category: 'Student Outcomes', criteria: 'Student performance & improvement', selfRating: 4, supervisorRating: 4, weight: 20, comments: 'Class average improved 8% this term.' },
  { id: 'R04', category: 'Professional Development', criteria: 'Training & skill upgradation', selfRating: 4, supervisorRating: 3, weight: 10, comments: 'Completed 2 certifications. Recommend more.' },
  { id: 'R05', category: 'Collaboration', criteria: 'Teamwork & contribution to school', selfRating: 5, supervisorRating: 4, weight: 15, comments: 'Mentors 2 junior teachers. Active in committees.' },
  { id: 'R06', category: 'Punctuality & Conduct', criteria: 'Attendance, discipline & professionalism', selfRating: 5, supervisorRating: 5, weight: 10, comments: '98% attendance. Exemplary conduct.' },
]

export interface Observation {
  id: string
  observer: string
  observerRole: string
  date: string
  className: string
  subject: string
  topic: string
  rating: number
  strengths: string[]
  improvements: string[]
  status: 'Completed' | 'Scheduled'
}

export const observations: Observation[] = [
  {
    id: 'OB01', observer: 'Dr. Ananya Iyer', observerRole: 'Principal', date: '2024-11-22', className: 'Class 2-A', subject: 'Mathematics', topic: 'Subtraction with Borrowing',
    rating: 5,
    strengths: ['Excellent use of manipulatives (place value blocks)', 'Clear step-by-step explanation', 'All students participated actively', 'Great classroom management'],
    improvements: ['Could give more wait time for slower students', 'Consider more real-life examples'],
    status: 'Completed',
  },
  {
    id: 'OB02', observer: 'Rajesh Khanna', observerRole: 'HoD Mathematics', date: '2024-11-08', className: 'Class 2-A', subject: 'Mathematics', topic: '2-digit Addition',
    rating: 4,
    strengths: ['Well-structured lesson', 'Good pace', 'Differentiated instruction for diverse learners'],
    improvements: ['Board work could be more organized', 'Use more formative assessment checks'],
    status: 'Completed',
  },
  {
    id: 'OB03', observer: 'Dr. Ananya Iyer', observerRole: 'Principal', date: '2024-12-05', className: 'Class 2-A', subject: 'Computer Science', topic: 'Introduction to MS Paint',
    rating: 0, strengths: [], improvements: [],
    status: 'Scheduled',
  },
]

export interface Feedback {
  id: string
  from: string
  fromRole: string
  date: string
  type: 'Appreciation' | 'Constructive' | 'Goal'
  message: string
}

export const feedback: Feedback[] = [
  { id: 'F01', from: 'Dr. Ananya Iyer', fromRole: 'Principal', date: '2024-11-25', type: 'Appreciation', message: 'Rohan, your innovative teaching methods in Mathematics have significantly improved student engagement. The Unit Test 3 results are a testament to your dedication. Keep up the excellent work!' },
  { id: 'F02', from: 'Rajesh Khanna', fromRole: 'HoD Mathematics', date: '2024-11-10', type: 'Constructive', message: 'Your lesson delivery is strong. I recommend incorporating more formative assessment strategies during the lesson to check for understanding in real-time.' },
  { id: 'F03', from: 'Dr. Ananya Iyer', fromRole: 'Principal', date: '2024-11-01', type: 'Goal', message: 'Goal for Q1 2025: Complete the "Differentiated Instruction" certification and implement strategies in Class 2-A. Mentor 2 junior Maths teachers.' },
  { id: 'F04', from: 'Deepa Menon', fromRole: 'Senior Teacher', date: '2024-10-20', type: 'Appreciation', message: 'Thank you for helping me with the Class 2 timetable coordination. Your organizational skills made the process smooth!' },
]

export const reviewStats = {
  overallScore: 4.4,
  maxScore: 5,
  grade: 'A',
  percentile: 88,
  completedCycles: 2,
  activeCycle: 1,
  goalsAchieved: 7,
  goalsTotal: 9,
  trainingCompleted: 4,
  trainingTotal: 6,
  scoreTrend: [
    { cycle: 'Mid 2023', score: 3.8 },
    { cycle: 'Annual 2023', score: 4.0 },
    { cycle: 'Mid 2024', score: 4.2 },
    { cycle: 'Annual 2024', score: 4.4 },
  ],
  categoryScores: [
    { category: 'Teaching', score: 4.5 },
    { category: 'Outcomes', score: 4.0 },
    { category: 'Development', score: 3.5 },
    { category: 'Collaboration', score: 4.5 },
    { category: 'Conduct', score: 5.0 },
  ],
}
