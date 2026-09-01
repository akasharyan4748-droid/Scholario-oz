// Learning resources — study materials, videos, notes for students

export interface Resource {
  id: string
  title: string
  subject: string
  type: 'video' | 'pdf' | 'notes' | 'quiz' | 'worksheet'
  description: string
  duration?: string
  pages?: number
  questions?: number
  uploadedBy: string
  uploadedOn: string
  downloads: number
  rating: number
  bookmarked: boolean
  thumbnailColor: string
}

export const resources: Resource[] = [
  { id: 'R01', title: 'Addition with Carrying — Explained!', subject: 'Mathematics', type: 'video', description: 'A fun animated video explaining 2-digit addition with carrying using place value blocks.', duration: '8:24', uploadedBy: 'Rohan Mehta', uploadedOn: '2024-11-26', downloads: 142, rating: 4.8, bookmarked: true, thumbnailColor: 'from-violet-500 to-purple-600' },
  { id: 'R02', title: 'The Thirsty Crow — Story Reading', subject: 'English', type: 'video', description: 'Animated storytelling with narration and comprehension questions at the end.', duration: '6:12', uploadedBy: 'Deepa Menon', uploadedOn: '2024-11-25', downloads: 98, rating: 4.9, bookmarked: true, thumbnailColor: 'from-emerald-500 to-teal-600' },
  { id: 'R03', title: 'Living & Non-Living Things — Notes', subject: 'Science', type: 'notes', description: 'Complete chapter notes with examples, pictures, and key terms highlighted.', pages: 8, uploadedBy: 'Kavita Joshi', uploadedOn: '2024-11-22', downloads: 124, rating: 4.7, bookmarked: false, thumbnailColor: 'from-lime-500 to-green-600' },
  { id: 'R04', title: 'Hindi Varnamala Practice Sheet', subject: 'Hindi', type: 'worksheet', description: 'Printable worksheet to practice writing each letter of the Hindi varnamala.', pages: 12, uploadedBy: 'Meera Krishnan', uploadedOn: '2024-11-20', downloads: 156, rating: 4.6, bookmarked: false, thumbnailColor: 'from-orange-500 to-red-600' },
  { id: 'R05', title: 'Parts of a Computer — Quiz', subject: 'Computer Science', type: 'quiz', description: 'Test your knowledge! 10 questions on parts of a computer and input/output devices.', questions: 10, uploadedBy: 'Arjun Kapoor', uploadedOn: '2024-11-28', downloads: 87, rating: 4.5, bookmarked: true, thumbnailColor: 'from-cyan-500 to-sky-600' },
  { id: 'R06', title: 'My Family — Drawing Guide', subject: 'Art & Craft', type: 'pdf', description: 'Step-by-step guide on how to draw your family members and label them.', pages: 6, uploadedBy: 'Faisal Ahmed', uploadedOn: '2024-11-24', downloads: 76, rating: 4.8, bookmarked: false, thumbnailColor: 'from-pink-500 to-rose-600' },
  { id: 'R07', title: 'Subtraction with Borrowing — Video', subject: 'Mathematics', type: 'video', description: 'Learn subtraction with borrowing through visual examples and practice problems.', duration: '7:45', uploadedBy: 'Rohan Mehta', uploadedOn: '2024-11-29', downloads: 134, rating: 4.7, bookmarked: false, thumbnailColor: 'from-violet-500 to-purple-600' },
  { id: 'R08', title: 'Community Helpers — Notes', subject: 'Social Studies', type: 'notes', description: 'Colorful notes about different community helpers and their roles.', pages: 10, uploadedBy: 'Vikram Singh', uploadedOn: '2024-11-21', downloads: 102, rating: 4.6, bookmarked: true, thumbnailColor: 'from-amber-500 to-orange-600' },
  { id: 'R09', title: 'Numbers 1–100 — Number Line Activity', subject: 'Mathematics', type: 'worksheet', description: 'Interactive worksheet with number line activities and fill-in-the-blanks.', pages: 8, uploadedBy: 'Rohan Mehta', uploadedOn: '2024-11-18', downloads: 145, rating: 4.9, bookmarked: false, thumbnailColor: 'from-violet-500 to-purple-600' },
  { id: 'R10', title: 'Plants Around Us — Project Guide', subject: 'Science', type: 'pdf', description: 'Complete guide for your plant project with examples and presentation tips.', pages: 14, uploadedBy: 'Kavita Joshi', uploadedOn: '2024-11-23', downloads: 118, rating: 4.8, bookmarked: true, thumbnailColor: 'from-lime-500 to-green-600' },
  { id: 'R11', title: 'Music — Rhymes & Songs', subject: 'Music', type: 'video', description: 'Sing along with popular rhymes and learn new songs for the annual day.', duration: '12:30', uploadedBy: 'Lakshmi Venkat', uploadedOn: '2024-11-19', downloads: 89, rating: 4.9, bookmarked: false, thumbnailColor: 'from-fuchsia-500 to-pink-600' },
  { id: 'R12', title: 'English Grammar — Nouns Quiz', subject: 'English', type: 'quiz', description: 'Quick quiz to identify nouns in sentences. 10 fun questions!', questions: 10, uploadedBy: 'Deepa Menon', uploadedOn: '2024-11-27', downloads: 91, rating: 4.5, bookmarked: false, thumbnailColor: 'from-emerald-500 to-teal-600' },
]

export interface StudyProgress {
  subject: string
  completed: number
  total: number
  color: string
}

export const studyProgress: StudyProgress[] = [
  { subject: 'Mathematics', completed: 18, total: 24, color: 'oklch(0.6 0.18 300)' },
  { subject: 'English', completed: 14, total: 20, color: 'oklch(0.55 0.14 162)' },
  { subject: 'Science', completed: 12, total: 18, color: 'oklch(0.65 0.16 75)' },
  { subject: 'Hindi', completed: 16, total: 20, color: 'oklch(0.62 0.2 25)' },
  { subject: 'Computer Science', completed: 8, total: 12, color: 'oklch(0.7 0.15 200)' },
  { subject: 'Social Studies', completed: 10, total: 16, color: 'oklch(0.6 0.15 60)' },
]

export const resourceStats = {
  total: 248,
  videos: 62,
  notes: 84,
  worksheets: 56,
  quizzes: 46,
  bookmarked: 14,
  completed: 78,
  hoursLearned: 42,
}
