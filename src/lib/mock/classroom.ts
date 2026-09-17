// Classroom resources data — smartboard, media, teaching tools

export interface SmartboardApp {
  id: string
  name: string
  category: string
  description: string
  icon: string
  gradient: string
  lastUsed: string
  usageCount: number
  rating: number
  pinned: boolean
}

export const smartboardApps: SmartboardApp[] = [
  { id: 'SA01', name: 'Interactive Whiteboard', category: 'Drawing', description: 'Digital whiteboard with pens, shapes, and multi-touch support.', icon: '✏️', gradient: 'from-violet-500 to-purple-600', lastUsed: 'Today', usageCount: 142, rating: 4.8, pinned: true },
  { id: 'SA02', name: 'Math Manipulatives', category: 'Mathematics', description: 'Virtual place value blocks, counters, number lines, and fraction tiles.', icon: '🧮', gradient: 'from-emerald-500 to-teal-600', lastUsed: 'Today', usageCount: 86, rating: 4.9, pinned: true },
  { id: 'SA03', name: 'Story Time Reader', category: 'English', description: 'Animated storybooks with narration, comprehension quizzes, and discussion prompts.', icon: '📚', gradient: 'from-amber-500 to-orange-600', lastUsed: 'Yesterday', usageCount: 64, rating: 4.7, pinned: false },
  { id: 'SA04', name: 'Science Lab 3D', category: 'Science', description: '3D models of plants, animals, and experiments. Interactive dissection & observation.', icon: '🔬', gradient: 'from-cyan-500 to-sky-600', lastUsed: '2 days ago', usageCount: 48, rating: 4.6, pinned: false },
  { id: 'SA05', name: 'World Map Explorer', category: 'Social Studies', description: 'Interactive maps with countries, capitals, cultures, and historical events.', icon: '🗺️', gradient: 'from-rose-500 to-pink-600', lastUsed: '3 days ago', usageCount: 32, rating: 4.5, pinned: false },
  { id: 'SA06', name: 'Hindi Varnamala', category: 'Hindi', description: 'Animated Hindi alphabet with pronunciation, tracing, and picture associations.', icon: 'अ', gradient: 'from-orange-500 to-red-600', lastUsed: 'Yesterday', usageCount: 56, rating: 4.8, pinned: true },
  { id: 'SA07', name: 'Music Studio', category: 'Music', description: 'Virtual instruments, rhythm games, and song recorder for music class.', icon: '🎵', gradient: 'from-fuchsia-500 to-pink-600', lastUsed: '1 week ago', usageCount: 24, rating: 4.4, pinned: false },
  { id: 'SA08', name: 'Art Canvas', category: 'Art & Craft', description: 'Digital art tools with brushes, colors, stamps, and gallery showcase.', icon: '🎨', gradient: 'from-indigo-500 to-blue-600', lastUsed: '2 days ago', usageCount: 38, rating: 4.6, pinned: false },
]

export interface MediaResource {
  id: string
  title: string
  type: 'Video' | 'Audio' | 'Image' | 'Presentation' | 'Interactive'
  subject: string
  duration?: string
  fileSize: string
  plays: number
  lastUsed: string
  thumbnailColor: string
}

export const mediaResources: MediaResource[] = [
  { id: 'MR01', title: 'Addition with Carrying — Animated', type: 'Video', subject: 'Mathematics', duration: '8:24', fileSize: '48 MB', plays: 18, lastUsed: 'Today', thumbnailColor: 'from-violet-500 to-purple-600' },
  { id: 'MR02', title: 'Living Things Song', type: 'Audio', subject: 'Science', duration: '3:45', fileSize: '8 MB', plays: 12, lastUsed: 'Yesterday', thumbnailColor: 'from-emerald-500 to-teal-600' },
  { id: 'MR03', title: 'The Thirsty Crow — Storybook', type: 'Interactive', subject: 'English', duration: '6:12', fileSize: '24 MB', plays: 16, lastUsed: 'Today', thumbnailColor: 'from-amber-500 to-orange-600' },
  { id: 'MR04', title: 'Parts of a Computer — Slides', type: 'Presentation', subject: 'Computer Science', fileSize: '14 MB', plays: 8, lastUsed: '2 days ago', thumbnailColor: 'from-cyan-500 to-sky-600' },
  { id: 'MR05', title: 'Community Helpers — Image Set', type: 'Image', subject: 'Social Studies', fileSize: '6 MB', plays: 10, lastUsed: '3 days ago', thumbnailColor: 'from-rose-500 to-pink-600' },
  { id: 'MR06', title: 'Hindi Varnamala Audio Guide', type: 'Audio', subject: 'Hindi', duration: '12:30', fileSize: '18 MB', plays: 14, lastUsed: 'Yesterday', thumbnailColor: 'from-orange-500 to-red-600' },
]

export interface TeachingTool {
  id: string
  name: string
  description: string
  icon: string
  category: 'Assessment' | 'Engagement' | 'Organization' | 'Accessibility'
  status: 'Available' | 'In Use' | 'Disabled'
  gradient: string
}

export const teachingTools: TeachingTool[] = [
  { id: 'TT01', name: 'Live Poll', description: 'Quick polls & quizzes during class', icon: '📊', category: 'Assessment', status: 'Available', gradient: 'from-violet-500 to-purple-600' },
  { id: 'TT02', name: 'Random Picker', description: 'Randomly select students for participation', icon: '🎲', category: 'Engagement', status: 'Available', gradient: 'from-amber-500 to-orange-600' },
  { id: 'TT03', name: 'Timer & Stopwatch', description: 'Countdown timers for activities', icon: '⏱️', category: 'Organization', status: 'Available', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'TT04', name: 'Noise Meter', description: 'Visual classroom noise level indicator', icon: '📢', category: 'Engagement', status: 'In Use', gradient: 'from-rose-500 to-pink-600' },
  { id: 'TT05', name: 'Text-to-Speech', description: 'Read text aloud for accessibility', icon: '🔊', category: 'Accessibility', status: 'Available', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'TT06', name: 'Group Maker', description: 'Auto-create random student groups', icon: '👥', category: 'Organization', status: 'Available', gradient: 'from-indigo-500 to-blue-600' },
]

export const classroomStats = {
  totalApps: 8,
  pinnedApps: 3,
  totalMedia: 48,
  mediaPlayedToday: 24,
  toolsAvailable: 6,
  toolsInUse: 1,
  smartboardStatus: 'Connected',
  smartboardTemp: '42°C',
  smartboardUptime: '6h 24m',
  weeklyUsage: [
    { day: 'Mon', sessions: 8 }, { day: 'Tue', sessions: 12 },
    { day: 'Wed', sessions: 10 }, { day: 'Thu', sessions: 14 },
    { day: 'Fri', sessions: 9 }, { day: 'Sat', sessions: 4 },
    { day: 'Sun', sessions: 0 },
  ],
  usageBySubject: [
    { name: 'Mathematics', value: 86, color: 'oklch(0.6 0.18 300)' },
    { name: 'English', value: 64, color: 'oklch(0.55 0.14 162)' },
    { name: 'Science', value: 48, color: 'oklch(0.65 0.16 75)' },
    { name: 'Hindi', value: 56, color: 'oklch(0.62 0.2 25)' },
    { name: 'Other', value: 38, color: 'oklch(0.7 0.15 200)' },
  ],
}
