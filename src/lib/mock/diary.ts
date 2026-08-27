// Student digital diary — journal, mood tracker, reflections

export interface DiaryEntry {
  id: string
  date: string
  title: string
  mood: 'great' | 'good' | 'okay' | 'sad' | 'angry'
  content: string
  tags: string[]
  subject?: string
}

export const diaryEntries: DiaryEntry[] = [
  { id: 'DE01', date: '2024-11-28', title: 'Best day ever! 🎉', mood: 'great', content: 'Today we learned subtraction with borrowing in Maths class. Rohan sir made it so fun with the place value blocks! I got all 10 problems right on my worksheet. Also, I played football during break and scored 2 goals. Feeling super happy today!', tags: ['maths', 'football', 'achievement'], subject: 'Mathematics' },
  { id: 'DE02', date: '2024-11-27', title: 'Library day', mood: 'good', content: 'Issued a new book from the library — "Wings of Fire" by Dr. A.P.J. Abdul Kalam. Geeta ma\'am said it\'s perfect for my reading level. Can\'t wait to start reading it tonight!', tags: ['library', 'reading'], subject: 'Library' },
  { id: 'DE03', date: '2024-11-26', title: 'Science project submission', mood: 'great', content: 'Submitted my "Plants Around Me" project today! Kavita ma\'am loved the leaves I collected and the way I labeled them. She gave me 23 out of 25 marks! 🌱', tags: ['science', 'project', 'achievement'], subject: 'Science' },
  { id: 'DE04', date: '2024-11-25', title: 'Tough day', mood: 'okay', content: 'I found the Hindi varnamala homework a bit hard today. Some letters look so similar! But Meera ma\'am helped me after class and I practiced extra. I\'ll do better tomorrow.', tags: ['hindi', 'challenge'], subject: 'Hindi' },
  { id: 'DE05', date: '2024-22', title: 'Music class fun', mood: 'good', content: 'Learned a new song in Music class today — "Hum Honge Kamyab". Lakshmi ma\'am said I have a nice voice! We\'re going to sing it at the Annual Day. So excited! 🎵', tags: ['music', 'annual-day'], subject: 'Music' },
  { id: 'DE06', date: '2024-11-21', title: 'Art class masterpiece', mood: 'great', content: 'Drew my family in Art class today. Faisal sir said my drawing of Papa was really good! I even added our dog Bruno. Art is becoming my favorite subject. 🎨', tags: ['art', 'family'], subject: 'Art & Craft' },
  { id: 'DE07', date: '2024-11-20', title: 'Perfect attendance badge!', mood: 'great', content: 'GOT THE PERFECT ATTENDANCE BADGE TODAY! 🏅 30 days of coming to school without missing a single day. Papa said he\'s proud of me. I got +50 XP too!', tags: ['achievement', 'badge', 'attendance'] },
]

export interface MoodDay {
  date: string
  mood: 'great' | 'good' | 'okay' | 'sad' | 'angry' | null
}

export const moodCalendar: MoodDay[] = [
  { date: '2024-11-01', mood: 'good' }, { date: '2024-11-04', mood: 'great' },
  { date: '2024-11-05', mood: 'great' }, { date: '2024-11-06', mood: 'good' },
  { date: '2024-11-07', mood: 'okay' }, { date: '2024-11-08', mood: 'good' },
  { date: '2024-11-11', mood: 'great' }, { date: '2024-11-12', mood: 'good' },
  { date: '2024-11-13', mood: 'great' }, { date: '2024-11-14', mood: 'great' },
  { date: '2024-11-15', mood: 'good' }, { date: '2024-11-18', mood: 'okay' },
  { date: '2024-11-19', mood: 'good' }, { date: '2024-11-20', mood: 'great' },
  { date: '2024-11-21', mood: 'great' }, { date: '2024-11-22', mood: 'good' },
  { date: '2024-11-25', mood: 'okay' }, { date: '2024-11-26', mood: 'great' },
  { date: '2024-11-27', mood: 'good' }, { date: '2024-11-28', mood: 'great' },
]

export interface Goal {
  id: string
  title: string
  category: 'academic' | 'personal' | 'habit'
  target: string
  progress: number
  deadline: string
  status: 'on-track' | 'completed' | 'behind'
}

export const goals: Goal[] = [
  { id: 'G01', title: 'Learn multiplication tables 2–5', category: 'academic', target: 'Memorize all 4 tables', progress: 75, deadline: '2024-12-15', status: 'on-track' },
  { id: 'G02', title: 'Read 5 library books this month', category: 'personal', target: '5 books', progress: 60, deadline: '2024-11-30', status: 'on-track' },
  { id: 'G03', title: 'Complete homework on time every day', category: 'habit', target: '30 day streak', progress: 80, deadline: '2024-12-10', status: 'on-track' },
  { id: 'G04', title: 'Score 90%+ in next Maths test', category: 'academic', target: '90% in Unit Test 4', progress: 100, deadline: '2024-11-22', status: 'completed' },
  { id: 'G05', title: 'Practice drawing for 20 min daily', category: 'habit', target: '14 day streak', progress: 50, deadline: '2024-12-05', status: 'on-track' },
]

export interface Reflection {
  id: string
  week: string
  bestMoment: string
  challenge: string
  learned: string
  gratitude: string
}

export const weeklyReflections: Reflection[] = [
  { id: 'RF01', week: 'Week of Nov 25', bestMoment: 'Getting 23/25 on my Science project!', challenge: 'Hindi varnamala was tricky, but I practiced and improved.', learned: 'I learned subtraction with borrowing — it\'s fun with blocks!', gratitude: 'Thankful for Meera ma\'am helping me with Hindi after class.' },
  { id: 'RF02', week: 'Week of Nov 18', bestMoment: 'Earning the Perfect Attendance badge! 🏅', challenge: 'Waking up early was hard some days, but I did it.', learned: 'Started learning a new song for Annual Day — Hum Honge Kamyab.', gratitude: 'Thankful for Papa packing my favorite lunch every day.' },
  { id: 'RF03', week: 'Week of Nov 11', bestMoment: 'Drawing my family in Art class and getting praised.', challenge: 'Understanding addition with carrying took some time.', learned: 'Addition with carrying — place value blocks really help!', gratitude: 'Thankful for my friends Diya and Myra who always play with me.' },
]

export const diaryStats = {
  totalEntries: 47,
  entriesThisMonth: 18,
  currentStreak: 12,
  longestStreak: 21,
  avgMoodScore: 4.2,
  moodDistribution: [
    { name: 'Great 😄', value: 18, color: 'oklch(0.55 0.14 162)' },
    { name: 'Good 🙂', value: 14, color: 'oklch(0.65 0.16 75)' },
    { name: 'Okay 😐', value: 5, color: 'oklch(0.7 0.15 200)' },
    { name: 'Sad 😔', value: 1, color: 'oklch(0.6 0.18 300)' },
    { name: 'Angry 😤', value: 0, color: 'oklch(0.62 0.2 25)' },
  ],
  topTags: [
    { tag: 'achievement', count: 12 },
    { tag: 'maths', count: 9 },
    { tag: 'friends', count: 8 },
    { tag: 'reading', count: 7 },
    { tag: 'art', count: 5 },
  ],
}

export const moodConfig = {
  great: { emoji: '😄', label: 'Great', color: 'oklch(0.55 0.14 162)', bg: 'bg-emerald-500/15', text: 'text-emerald-600' },
  good: { emoji: '🙂', label: 'Good', color: 'oklch(0.65 0.16 75)', bg: 'bg-amber-500/15', text: 'text-amber-600' },
  okay: { emoji: '😐', label: 'Okay', color: 'oklch(0.7 0.15 200)', bg: 'bg-sky-500/15', text: 'text-sky-600' },
  sad: { emoji: '😔', label: 'Sad', color: 'oklch(0.6 0.18 300)', bg: 'bg-violet-500/15', text: 'text-violet-600' },
  angry: { emoji: '😤', label: 'Angry', color: 'oklch(0.62 0.2 25)', bg: 'bg-rose-500/15', text: 'text-rose-600' },
}
