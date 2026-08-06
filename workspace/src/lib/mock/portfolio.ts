// Student portfolio — achievements showcase, growth, extracurriculars

export interface PortfolioAchievement {
  id: string
  title: string
  category: 'Academic' | 'Sports' | 'Cultural' | 'Leadership' | 'Community' | 'Skill'
  date: string
  description: string
  issuer: string
  level: 'Class' | 'School' | 'Inter-School' | 'District' | 'State'
  icon: string
  gradient: string
}

export const achievements: PortfolioAchievement[] = [
  { id: 'PA01', title: '3rd Rank — Unit Test 3', category: 'Academic', date: '2024-11-22', description: 'Achieved 91.3% in the Unit Test 3 examination, ranking 3rd in Class 2-A.', issuer: 'Demo School of Scholario', level: 'Class', icon: '🥉', gradient: 'from-amber-400 to-orange-500' },
  { id: 'PA02', title: 'Perfect Attendance Award', category: 'Academic', date: '2024-11-20', description: '30 consecutive days of perfect attendance — never missed a single class.', issuer: 'Demo School of Scholario', level: 'School', icon: '📅', gradient: 'from-emerald-400 to-teal-500' },
  { id: 'PA03', title: 'Science Project — Best Presentation', category: 'Academic', date: '2024-11-25', description: 'Awarded for the "Plants Around Us" project — scored 23/25 with creative presentation.', issuer: 'Science Department', level: 'Class', icon: '🌱', gradient: 'from-lime-400 to-green-500' },
  { id: 'PA04', title: 'Inter-House Quiz — Winner', category: 'Academic', date: '2024-12-05', description: 'Part of the winning Sapphire House team in the Inter-House Quiz Championship.', issuer: 'Demo School of Scholario', level: 'School', icon: '🧠', gradient: 'from-cyan-400 to-sky-500' },
  { id: 'PA05', title: 'Football — 2 Goals in Match', category: 'Sports', date: '2024-11-28', description: 'Scored 2 goals in the inter-class football match. Star performer of the week.', issuer: 'Sports Department', level: 'Class', icon: '⚽', gradient: 'from-violet-400 to-purple-500' },
  { id: 'PA06', title: 'Art Competition — Special Mention', category: 'Cultural', date: '2024-09-12', description: 'Received special mention in the inter-school art competition for "My Family" drawing.', issuer: 'District Art Council', level: 'Inter-School', icon: '🎨', gradient: 'from-pink-400 to-rose-500' },
  { id: 'PA07', title: 'Annual Day Performer', category: 'Cultural', date: '2024-12-20', description: 'Selected to perform in the Annual Day cultural program — "Hum Honge Kamyab" choir.', issuer: 'Cultural Committee', level: 'School', icon: '🎵', gradient: 'from-fuchsia-400 to-pink-500' },
  { id: 'PA08', title: 'Class Helper — Math Peer Support', category: 'Leadership', date: '2024-11-28', description: 'Recognized for helping classmates with subtraction concepts during break time.', issuer: 'Rohan Mehta', level: 'Class', icon: '🤝', gradient: 'from-orange-400 to-red-500' },
  { id: 'PA09', title: 'Library Reading Champion', category: 'Skill', date: '2024-10-30', description: 'Read 10 library books in one term — fastest reader in Class 2-A.', issuer: 'Geeta Sharma (Librarian)', level: 'Class', icon: '📚', gradient: 'from-indigo-400 to-blue-500' },
  { id: 'PA10', title: 'Early Bird Award', category: 'Community', date: '2024-11-15', description: 'Reached school before 7:45 AM for 20 consecutive days. Punctuality champion.', issuer: 'Demo School of Scholario', level: 'School', icon: '🐦', gradient: 'from-yellow-400 to-amber-500' },
]

export interface SkillRadar {
  skill: string
  score: number
  max: number
}

export const skillRadar: SkillRadar[] = [
  { skill: 'Mathematics', score: 91, max: 100 },
  { skill: 'English', score: 88, max: 100 },
  { skill: 'Science', score: 85, max: 100 },
  { skill: 'Hindi', score: 90, max: 100 },
  { skill: 'Computer Sci', score: 94, max: 100 },
  { skill: 'Social Studies', score: 84, max: 100 },
  { skill: 'Art & Craft', score: 89, max: 100 },
  { skill: 'Sports', score: 82, max: 100 },
]

export interface GrowthMilestone {
  id: string
  grade: string
  year: string
  highlight: string
  rank?: string
  percentage?: number
}

export const growthJourney: GrowthMilestone[] = [
  { id: 'GM01', grade: 'Nursery', year: '2020-21', highlight: 'Joined Demo School. Adapted well to school environment.', percentage: 78 },
  { id: 'GM02', grade: 'LKG', year: '2021-22', highlight: 'Started reading 3-letter words. Won first coloring competition.', percentage: 82 },
  { id: 'GM03', grade: 'UKG', year: '2022-23', highlight: 'Excellent progress in phonics. Began basic addition.', percentage: 85 },
  { id: 'GM04', grade: 'Class 1', year: '2023-24', highlight: 'Top 5 in class. Started Computer Science. Reading champion.', rank: '5th', percentage: 87 },
  { id: 'GM05', grade: 'Class 2', year: '2024-25', highlight: '3rd rank in UT3. Math Whiz badge. Perfect attendance. Football star.', rank: '3rd', percentage: 91 },
]

export interface Extracurricular {
  id: string
  activity: string
  role: string
  duration: string
  status: 'active' | 'completed'
  achievement?: string
}

export const extracurriculars: Extracurricular[] = [
  { id: 'EC01', activity: 'Football Club', role: 'Forward', duration: '2024 — Present', status: 'active', achievement: 'Top scorer this term' },
  { id: 'EC02', activity: 'Quiz Club', role: 'Member — Sapphire House', duration: '2024 — Present', status: 'active', achievement: 'Inter-house winners 🏆' },
  { id: 'EC03', activity: 'Art Club', role: 'Member', duration: '2024 — Present', status: 'active', achievement: 'Special mention — inter-school' },
  { id: 'EC04', activity: 'Music — Choir', role: 'Singer', duration: '2024 — Present', status: 'active', achievement: 'Selected for Annual Day' },
  { id: 'EC05', activity: 'Library Reading Program', role: 'Avid Reader', duration: '2024 — Present', status: 'active', achievement: '10 books this term 📚' },
  { id: 'EC06', activity: 'Eco Club', role: 'Member', duration: '2023-24', status: 'completed', achievement: 'Plant-a-tree drive' },
]

export const portfolioStats = {
  totalAchievements: 10,
  certificates: 6,
  badges: 6,
  extracurriculars: 6,
  skillsAvg: 88,
  growthScore: 91,
  overallGrade: 'A+',
  rankInClass: 3,
  totalStudents: 18,
  portfolioScore: 4.6,
  maxScore: 5,
  subjectPerformance: [
    { subject: 'Mathematics', ut1: 84, ut2: 88, ut3: 91 },
    { subject: 'English', ut1: 82, ut2: 86, ut3: 88 },
    { subject: 'Science', ut1: 78, ut2: 82, ut3: 85 },
    { subject: 'Hindi', ut1: 85, ut2: 88, ut3: 90 },
  ],
}
