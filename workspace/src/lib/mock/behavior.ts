// Student behavior & conduct data — incidents, awards, character tracking

export interface BehaviorRecord {
  id: string
  studentName: string
  avatar: string
  rollNo: string
  className: string
  type: 'positive' | 'concern' | 'incident'
  category: string
  description: string
  date: string
  points: number
  reportedBy: string
  parentNotified: boolean
  status: 'open' | 'resolved' | 'monitoring'
}

export const behaviorRecords: BehaviorRecord[] = [
  { id: 'BR01', studentName: 'Aarav Sharma', avatar: 'AS', rollNo: '18', className: 'Class 2-A', type: 'positive', category: 'Helpfulness', description: 'Helped a classmate understand subtraction with borrowing during break.', date: '2024-11-28', points: 5, reportedBy: 'Rohan Mehta', parentNotified: true, status: 'resolved' },
  { id: 'BR02', studentName: 'Vivaan Reddy', avatar: 'VR', rollNo: '03', className: 'Class 2-A', type: 'concern', category: 'Incomplete Homework', description: 'Homework incomplete for the 3rd time this month. Spoke with student — needs parental support.', date: '2024-11-27', points: -3, reportedBy: 'Deepa Menon', parentNotified: true, status: 'monitoring' },
  { id: 'BR03', studentName: 'Myra Iyer', avatar: 'MI', rollNo: '10', className: 'Class 2-A', type: 'positive', category: 'Leadership', description: 'Led the house quiz team to victory. Excellent team coordination!', date: '2024-12-05', points: 10, reportedBy: 'Vikram Singh', parentNotified: true, status: 'resolved' },
  { id: 'BR04', studentName: 'Reyansh Kumar', avatar: 'RK', rollNo: '05', className: 'Class 2-A', type: 'incident', category: 'Playground Dispute', description: 'Minor altercation with a classmate over a football turn. Mediated and resolved.', date: '2024-11-26', points: -5, reportedBy: 'Sanjay Reddy', parentNotified: true, status: 'resolved' },
  { id: 'BR05', studentName: 'Diya Patel', avatar: 'DP', rollNo: '02', className: 'Class 2-A', type: 'positive', category: 'Academic Excellence', description: 'Scored 48/50 in Mathematics Unit Test 3. Consistent top performer.', date: '2024-11-22', points: 8, reportedBy: 'Rohan Mehta', parentNotified: true, status: 'resolved' },
  { id: 'BR06', studentName: 'Kabir Khanna', avatar: 'KK', rollNo: '11', className: 'Class 2-A', type: 'concern', category: 'Attendance', description: 'Absent for 4 days this week without prior notice. Parent meeting requested.', date: '2024-11-25', points: -2, reportedBy: 'Rohan Mehta', parentNotified: true, status: 'open' },
  { id: 'BR07', studentName: 'Anika Desai', avatar: 'AD', rollNo: '14', className: 'Class 2-A', type: 'positive', category: 'Creativity', description: 'Created a beautiful chart on living things. Used innovative materials.', date: '2024-11-24', points: 6, reportedBy: 'Kavita Joshi', parentNotified: false, status: 'resolved' },
  { id: 'BR08', studentName: 'Ananya Singh', avatar: 'AN', rollNo: '04', className: 'Class 2-A', type: 'positive', category: 'Discipline', description: '30 days perfect attendance. Punctual and well-prepared every day.', date: '2024-11-20', points: 7, reportedBy: 'Rohan Mehta', parentNotified: true, status: 'resolved' },
  { id: 'BR09', studentName: 'Sai Pillai', avatar: 'SP', rollNo: '17', className: 'Class 2-A', type: 'concern', category: 'Class Participation', description: 'Very quiet in class. Encouraging participation through small group activities.', date: '2024-11-23', points: 0, reportedBy: 'Deepa Menon', parentNotified: false, status: 'monitoring' },
  { id: 'BR10', studentName: 'Kiara Rao', avatar: 'KR', rollNo: '12', className: 'Class 2-A', type: 'positive', category: 'Kindness', description: 'Shared her lunch with a friend who forgot theirs. Heartwarming gesture.', date: '2024-11-21', points: 5, reportedBy: 'Rohan Mehta', parentNotified: false, status: 'resolved' },
]

export interface StudentBehaviorSummary {
  studentName: string
  avatar: string
  rollNo: string
  conductScore: number
  totalPoints: number
  positiveCount: number
  concernCount: number
  incidentCount: number
  rank: number
  trend: 'up' | 'down' | 'same'
  badges: string[]
}

export const behaviorSummary: StudentBehaviorSummary[] = [
  { studentName: 'Myra Iyer', avatar: 'MI', rollNo: '10', conductScore: 98, totalPoints: 42, positiveCount: 8, concernCount: 0, incidentCount: 0, rank: 1, trend: 'same', badges: ['🌟 Leader', '🏆 Top Scorer', '📚 Avid Reader'] },
  { studentName: 'Ananya Singh', avatar: 'AN', rollNo: '04', conductScore: 96, totalPoints: 38, positiveCount: 7, concernCount: 0, incidentCount: 0, rank: 2, trend: 'up', badges: ['📅 Perfect Attendance', '⭐ Disciplined'] },
  { studentName: 'Aarav Sharma', avatar: 'AS', rollNo: '18', conductScore: 94, totalPoints: 35, positiveCount: 6, concernCount: 1, incidentCount: 0, rank: 3, trend: 'up', badges: ['🤝 Helpful', '🧮 Math Whiz'] },
  { studentName: 'Diya Patel', avatar: 'DP', rollNo: '02', conductScore: 92, totalPoints: 32, positiveCount: 6, concernCount: 0, incidentCount: 0, rank: 4, trend: 'up', badges: ['🎨 Creative', '📖 Good Reader'] },
  { studentName: 'Anika Desai', avatar: 'AD', rollNo: '14', conductScore: 90, totalPoints: 28, positiveCount: 5, concernCount: 0, incidentCount: 0, rank: 5, trend: 'same', badges: ['🎨 Artistic Ace'] },
  { studentName: 'Kiara Rao', avatar: 'KR', rollNo: '12', conductScore: 88, totalPoints: 25, positiveCount: 5, concernCount: 0, incidentCount: 0, rank: 6, trend: 'up', badges: ['💖 Kind Heart'] },
]

export const behaviorStats = {
  totalRecords: 142,
  positiveThisMonth: 86,
  concernsThisMonth: 18,
  incidentsThisMonth: 4,
  avgClassConduct: 91.4,
  parentNotifications: 94,
  monthlyTrend: [
    { month: 'Jul', positive: 62, concern: 24, incident: 6 },
    { month: 'Aug', positive: 68, concern: 22, incident: 4 },
    { month: 'Sep', positive: 72, concern: 20, incident: 5 },
    { month: 'Oct', positive: 78, concern: 19, incident: 3 },
    { month: 'Nov', positive: 86, concern: 18, incident: 4 },
  ],
  categoryBreakdown: [
    { name: 'Helpfulness', value: 24, color: 'oklch(0.55 0.14 162)' },
    { name: 'Academic', value: 28, color: 'oklch(0.65 0.16 75)' },
    { name: 'Discipline', value: 18, color: 'oklch(0.7 0.15 200)' },
    { name: 'Leadership', value: 12, color: 'oklch(0.6 0.18 300)' },
    { name: 'Creativity', value: 16, color: 'oklch(0.62 0.2 25)' },
    { name: 'Concerns', value: 18, color: 'oklch(0.55 0.18 25)' },
    { name: 'Incidents', value: 4, color: 'oklch(0.5 0.2 25)' },
  ],
}
