// Gamification: badges, leaderboard, XP, streaks

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earned: boolean
  earnedDate?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const badges: Badge[] = [
  { id: 'B01', name: 'Perfect Attendance', description: 'Attend 30 days in a row', icon: '📅', color: 'from-emerald-400 to-teal-500', earned: true, earnedDate: '2024-11-20', rarity: 'rare' },
  { id: 'B02', name: 'Math Whiz', description: 'Score 90%+ in 3 math tests', icon: '🧮', color: 'from-violet-400 to-purple-500', earned: true, earnedDate: '2024-11-18', rarity: 'epic' },
  { id: 'B03', name: 'Book Worm', description: 'Read 10 library books', icon: '📚', color: 'from-amber-400 to-orange-500', earned: true, earnedDate: '2024-10-30', rarity: 'common' },
  { id: 'B04', name: 'Homework Hero', description: 'Submit 25 homework on time', icon: '✏️', color: 'from-cyan-400 to-sky-500', earned: true, earnedDate: '2024-11-22', rarity: 'rare' },
  { id: 'B05', name: 'Topper', description: 'Rank #1 in any exam', icon: '🏆', color: 'from-yellow-400 to-amber-500', earned: false, rarity: 'legendary' },
  { id: 'B06', name: 'Science Star', description: 'Score 95%+ in Science', icon: '🔬', color: 'from-lime-400 to-green-500', earned: false, rarity: 'epic' },
  { id: 'B07', name: 'Early Bird', description: 'Reach school before 7:45 AM for 20 days', icon: '🐦', color: 'from-orange-400 to-red-500', earned: true, earnedDate: '2024-11-15', rarity: 'common' },
  { id: 'B08', name: 'Helping Hand', description: 'Help 5 classmates with homework', icon: '🤝', color: 'from-pink-400 to-rose-500', earned: false, rarity: 'rare' },
  { id: 'B09', name: 'All-Rounder', description: 'Excel in academics + sports + arts', icon: '⭐', color: 'from-fuchsia-400 to-pink-500', earned: false, rarity: 'legendary' },
  { id: 'B10', name: 'Streak Master', description: 'Maintain a 50-day login streak', icon: '🔥', color: 'from-red-400 to-orange-500', earned: false, rarity: 'epic' },
  { id: 'B11', name: 'Artistic Ace', description: 'Win an art competition', icon: '🎨', color: 'from-purple-400 to-violet-500', earned: true, earnedDate: '2024-09-12', rarity: 'rare' },
  { id: 'B12', name: 'Spelling Bee', description: 'Win the inter-class spelling bee', icon: '🐝', color: 'from-yellow-400 to-lime-500', earned: false, rarity: 'rare' },
]

export interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  rollNo: string
  xp: number
  level: number
  badges: number
  trend: 'up' | 'down' | 'same'
  isCurrentUser?: boolean
}

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Myra Iyer', avatar: 'MI', rollNo: '10', xp: 4820, level: 12, badges: 9, trend: 'same' },
  { rank: 2, name: 'Anika Desai', avatar: 'AD', rollNo: '14', xp: 4510, level: 11, badges: 8, trend: 'up' },
  { rank: 3, name: 'Aarav Sharma', avatar: 'AS', rollNo: '18', xp: 4180, level: 10, badges: 6, trend: 'up', isCurrentUser: true },
  { rank: 4, name: 'Ananya Singh', avatar: 'AN', rollNo: '04', xp: 3960, level: 10, badges: 6, trend: 'down' },
  { rank: 5, name: 'Kiara Rao', avatar: 'KR', rollNo: '12', xp: 3740, level: 9, badges: 5, trend: 'up' },
  { rank: 6, name: 'Diya Patel', avatar: 'DP', rollNo: '02', xp: 3580, level: 9, badges: 5, trend: 'same' },
  { rank: 7, name: 'Saanvi Gupta', avatar: 'SG', rollNo: '08', xp: 3420, level: 9, badges: 4, trend: 'down' },
  { rank: 8, name: 'Ishaani Verma', avatar: 'IV', rollNo: '06', xp: 3210, level: 8, badges: 4, trend: 'up' },
  { rank: 9, name: 'Aadhya Menon', avatar: 'AM', rollNo: '16', xp: 3040, level: 8, badges: 3, trend: 'same' },
  { rank: 10, name: 'Aditya Nair', avatar: 'AN', rollNo: '07', xp: 2890, level: 7, badges: 3, trend: 'up' },
]

export const playerStats = {
  name: 'Aarav Sharma',
  level: 10,
  xp: 4180,
  xpToNext: 4800,
  rank: 3,
  totalStudents: 18,
  badgesEarned: 6,
  badgesTotal: 12,
  streak: 24,
  longestStreak: 38,
  gradePoints: 9.1,
  coins: 1240,
}

export const xpHistory = [
  { week: 'W1', xp: 280 },
  { week: 'W2', xp: 340 },
  { week: 'W3', xp: 420 },
  { week: 'W4', xp: 380 },
  { week: 'W5', xp: 510 },
  { week: 'W6', xp: 460 },
  { week: 'W7', xp: 590 },
  { week: 'W8', xp: 640 },
]

export const dailyQuests = [
  { id: 'Q1', title: 'Complete today\'s homework', xp: 50, progress: 1, total: 1, done: true },
  { id: 'Q2', title: 'Attend all classes', xp: 80, progress: 6, total: 8, done: false },
  { id: 'Q3', title: 'Read for 20 minutes', xp: 30, progress: 0, total: 1, done: false },
  { id: 'Q4', title: 'Submit pending assignment', xp: 100, progress: 0, total: 1, done: false },
]
