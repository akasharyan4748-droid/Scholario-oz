// Student wellness data — fitness, water, sleep, nutrition

export interface WellnessMetric {
  id: string
  label: string
  value: number
  target: number
  unit: string
  icon: string
  color: string
  trend: number
}

export const todayMetrics: WellnessMetric[] = [
  { id: 'WM01', label: 'Water Intake', value: 6, target: 8, unit: 'glasses', icon: '💧', color: 'oklch(0.6 0.18 230)', trend: 12 },
  { id: 'WM02', label: 'Sleep Last Night', value: 8, target: 9, unit: 'hours', icon: '😴', color: 'oklch(0.6 0.18 300)', trend: -5 },
  { id: 'WM03', label: 'Steps Today', value: 7240, target: 10000, unit: 'steps', icon: '👟', color: 'oklch(0.55 0.14 162)', trend: 18 },
  { id: 'WM04', label: 'Active Minutes', value: 42, target: 60, unit: 'min', icon: '🏃', color: 'oklch(0.65 0.16 75)', trend: 8 },
  { id: 'WM05', label: 'Screen Time', value: 95, target: 120, unit: 'min', icon: '📱', color: 'oklch(0.62 0.2 25)', trend: -12 },
  { id: 'WM06', label: 'Meditation', value: 10, target: 15, unit: 'min', icon: '🧘', color: 'oklch(0.7 0.15 200)', trend: 24 },
]

export interface WeeklyWellness {
  day: string
  water: number
  sleep: number
  steps: number
  active: number
}

export const weeklyWellness: WeeklyWellness[] = [
  { day: 'Mon', water: 7, sleep: 8, steps: 8200, active: 55 },
  { day: 'Tue', water: 8, sleep: 9, steps: 9100, active: 65 },
  { day: 'Wed', water: 6, sleep: 7, steps: 6800, active: 40 },
  { day: 'Thu', water: 8, sleep: 8, steps: 8400, active: 58 },
  { day: 'Fri', water: 7, sleep: 8, steps: 7900, active: 52 },
  { day: 'Sat', water: 9, sleep: 9, steps: 11200, active: 78 },
  { day: 'Sun', water: 6, sleep: 9, steps: 7240, active: 42 },
]

export interface NutritionLog {
  id: string
  meal: string
  time: string
  items: string[]
  calories: number
  healthy: boolean
}

export const todayNutrition: NutritionLog[] = [
  { id: 'NL01', meal: 'Breakfast', time: '07:30 AM', items: ['Aloo Paratha', 'Curd', 'Banana'], calories: 420, healthy: true },
  { id: 'NL02', meal: 'Snack', time: '10:30 AM', items: ['Apple', 'Almonds'], calories: 180, healthy: true },
  { id: 'NL03', meal: 'Lunch', time: '12:45 PM', items: ['Rajma', 'Rice', 'Roti', 'Salad'], calories: 580, healthy: true },
  { id: 'NL04', meal: 'Snack', time: '04:00 PM', items: ['Samosa', 'Tea'], calories: 280, healthy: false },
  { id: 'NL05', meal: 'Dinner', time: '07:30 PM', items: ['Paneer Curry', 'Roti', 'Jeera Rice'], calories: 620, healthy: true },
]

export interface MoodCheckIn {
  id: string
  date: string
  mood: 'energetic' | 'happy' | 'calm' | 'tired' | 'stressed'
  energy: number
  note?: string
}

export const moodCheckIns: MoodCheckIn[] = [
  { id: 'MC01', date: '2024-11-28', mood: 'energetic', energy: 90, note: 'Feeling great after football!' },
  { id: 'MC02', date: '2024-11-27', mood: 'happy', energy: 75 },
  { id: 'MC03', date: '2024-11-26', mood: 'calm', energy: 70, note: 'Good day at school.' },
  { id: 'MC04', date: '2024-11-25', mood: 'tired', energy: 45, note: 'Was a long day with tests.' },
  { id: 'MC05', date: '2024-11-22', mood: 'happy', energy: 80 },
]

export interface WellnessGoal {
  id: string
  title: string
  category: 'fitness' | 'nutrition' | 'sleep' | 'mindfulness'
  target: string
  progress: number
  streak: number
  status: 'on-track' | 'achieved' | 'behind'
}

export const wellnessGoals: WellnessGoal[] = [
  { id: 'WG01', title: 'Drink 8 glasses water daily', category: 'nutrition', target: '30 day streak', progress: 75, streak: 22, status: 'on-track' },
  { id: 'WG02', title: 'Sleep 9 hours every night', category: 'sleep', target: '14 day streak', progress: 60, streak: 8, status: 'on-track' },
  { id: 'WG03', title: '10,000 steps daily', category: 'fitness', target: '20 day streak', progress: 85, streak: 17, status: 'on-track' },
  { id: 'WG04', title: 'Meditate 15 min daily', category: 'mindfulness', target: '21 day streak', progress: 50, streak: 10, status: 'on-track' },
  { id: 'WG05', title: 'Limit screen time to 2 hrs', category: 'mindfulness', target: '7 day streak', progress: 100, streak: 7, status: 'achieved' },
]

export const wellnessStats = {
  wellnessScore: 82,
  maxScore: 100,
  grade: 'B+',
  streak: 22,
  longestStreak: 34,
  weeklyAvg: {
    water: 7.3,
    sleep: 8.3,
    steps: 8406,
    active: 56,
  },
  monthlyTrend: [
    { week: 'W1', score: 74 }, { week: 'W2', score: 78 },
    { week: 'W3', score: 80 }, { week: 'W4', score: 82 },
  ],
  badges: [
    { id: 'WB01', name: 'Hydration Hero', icon: '💧', earned: true, desc: '7 days of 8+ glasses' },
    { id: 'WB02', name: 'Early Bird', icon: '🐦', earned: true, desc: 'Sleep before 9 PM for 10 days' },
    { id: 'WB03', name: 'Step Master', icon: '👟', earned: true, desc: '10K steps for 15 days' },
    { id: 'WB04', name: 'Zen Master', icon: '🧘', earned: false, desc: 'Meditate 21 days straight' },
    { id: 'WB05', name: 'Nutrition Pro', icon: '🥗', earned: false, desc: 'Healthy meals for 30 days' },
    { id: 'WB06', name: 'Wellness Champion', icon: '🏆', earned: false, desc: 'Score 90+ for a month' },
  ],
}
