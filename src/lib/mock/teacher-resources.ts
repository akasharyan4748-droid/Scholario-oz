// Teacher resource library — teaching materials, worksheets, presentations

export interface TeachingResource {
  id: string
  title: string
  type: 'Lesson Plan' | 'Worksheet' | 'Presentation' | 'Assessment' | 'Activity' | 'Video' | 'Reference'
  subject: string
  grade: string
  topic: string
  description: string
  fileSize: string
  downloads: number
  rating: number
  uploadedBy: string
  uploadedOn: string
  lastUsed?: string
  tags: string[]
  shared: boolean
}

export const teachingResources: TeachingResource[] = [
  { id: 'TR01', title: 'Addition with Carrying — Complete Lesson', type: 'Lesson Plan', subject: 'Mathematics', grade: 'Class 2', topic: '2-digit Addition', description: 'Full 45-min lesson plan with objectives, activities, worksheets, and assessment. Aligned to CBSE.', fileSize: '2.4 MB', downloads: 142, rating: 4.9, uploadedBy: 'Rohan Mehta', uploadedOn: '2024-09-15', lastUsed: '2024-12-02', tags: ['CBSE', 'manipulatives', 'place-value'], shared: true },
  { id: 'TR02', title: 'Numbers 1-100 — Practice Worksheet', type: 'Worksheet', subject: 'Mathematics', grade: 'Class 2', topic: 'Number Sense', description: '30-problem worksheet with number lines, before/after, and sequencing. Answer key included.', fileSize: '890 KB', downloads: 218, rating: 4.8, uploadedBy: 'Rohan Mehta', uploadedOn: '2024-08-20', lastUsed: '2024-11-28', tags: ['practice', 'printable', 'answer-key'], shared: true },
  { id: 'TR03', title: 'Living & Non-Living Things — Slides', type: 'Presentation', subject: 'Science', grade: 'Class 2', topic: 'Living Things', description: 'Interactive 24-slide deck with pictures, videos, and discussion questions.', fileSize: '14.2 MB', downloads: 96, rating: 4.7, uploadedBy: 'Kavita Joshi', uploadedOn: '2024-10-12', lastUsed: '2024-11-22', tags: ['visual', 'interactive'], shared: true },
  { id: 'TR04', title: 'Unit Test 3 — Mathematics', type: 'Assessment', subject: 'Mathematics', grade: 'Class 2', topic: 'Mixed Topics', description: '50-mark unit test covering addition, subtraction, and number sense. Blueprint + marking scheme.', fileSize: '1.1 MB', downloads: 64, rating: 4.6, uploadedBy: 'Rohan Mehta', uploadedOn: '2024-11-10', lastUsed: '2024-11-22', tags: ['exam', 'blueprint', 'marking-scheme'], shared: true },
  { id: 'TR05', title: 'The Thirsty Crow — Story Activity', type: 'Activity', subject: 'English', grade: 'Class 2', topic: 'Reading Comprehension', description: 'Story cards, sequencing activity, and 8 comprehension questions with role-play ideas.', fileSize: '3.6 MB', downloads: 184, rating: 4.9, uploadedBy: 'Deepa Menon', uploadedOn: '2024-09-25', lastUsed: '2024-11-26', tags: ['story', 'role-play', 'comprehension'], shared: true },
  { id: 'TR06', title: 'Hindi Varnamala — Flash Cards', type: 'Activity', subject: 'Hindi', grade: 'Class 2', topic: 'Alphabet', description: 'Printable flash cards for all 44 Hindi letters with pictures. Color and B&W versions.', fileSize: '6.8 MB', downloads: 156, rating: 4.8, uploadedBy: 'Meera Krishnan', uploadedOn: '2024-08-15', lastUsed: '2024-11-20', tags: ['flash-cards', 'printable', 'alphabet'], shared: true },
  { id: 'TR07', title: 'Parts of a Computer — Video Lesson', type: 'Video', subject: 'Computer Science', grade: 'Class 2', topic: 'Hardware Basics', description: '8-minute animated video explaining CPU, monitor, keyboard, mouse, and input/output.', fileSize: '48 MB', downloads: 88, rating: 4.7, uploadedBy: 'Arjun Kapoor', uploadedOn: '2024-10-20', lastUsed: '2024-11-28', tags: ['animated', 'visual'], shared: true },
  { id: 'TR08', title: 'Community Helpers — Reference Chart', type: 'Reference', subject: 'Social Studies', grade: 'Class 2', topic: 'Community', description: 'Large printable chart with 12 community helpers, their tools, and roles.', fileSize: '5.2 MB', downloads: 112, rating: 4.6, uploadedBy: 'Vikram Singh', uploadedOn: '2024-09-18', lastUsed: '2024-11-21', tags: ['chart', 'printable', 'reference'], shared: true },
  { id: 'TR09', title: 'Subtraction with Borrowing — Worksheet', type: 'Worksheet', subject: 'Mathematics', grade: 'Class 2', topic: '2-digit Subtraction', description: '25-problem worksheet with word problems and visual aids. Differentiated 3 levels.', fileSize: '1.3 MB', downloads: 198, rating: 4.8, uploadedBy: 'Rohan Mehta', uploadedOn: '2024-11-25', lastUsed: '2024-11-29', tags: ['practice', 'differentiated', 'word-problems'], shared: true },
  { id: 'TR10', title: 'Plants Around Us — Project Guide', type: 'Lesson Plan', subject: 'Science', grade: 'Class 2', topic: 'Plants', description: 'Complete project guide with rubric, examples, and presentation tips for the plant project.', fileSize: '2.8 MB', downloads: 104, rating: 4.9, uploadedBy: 'Kavita Joshi', uploadedOn: '2024-11-15', lastUsed: '2024-11-25', tags: ['project', 'rubric', 'guide'], shared: true },
  { id: 'TR11', title: 'My Family — Drawing Template', type: 'Activity', subject: 'Art & Craft', grade: 'Class 2', topic: 'Family', description: 'Printable drawing template with framing and labeling guide for family drawings.', fileSize: '720 KB', downloads: 78, rating: 4.5, uploadedBy: 'Faisal Ahmed', uploadedOn: '2024-11-20', lastUsed: '2024-11-24', tags: ['template', 'drawing'], shared: true },
  { id: 'TR12', title: 'Rhymes Collection — Annual Day Prep', type: 'Reference', subject: 'Music', grade: 'Class 1-3', topic: 'Rhymes & Songs', description: 'Curated collection of 15 popular rhymes with lyrics, tunes, and action guides.', fileSize: '1.8 MB', downloads: 64, rating: 4.7, uploadedBy: 'Lakshmi Venkat', uploadedOn: '2024-11-10', lastUsed: '2024-11-26', tags: ['rhymes', 'lyrics', 'annual-day'], shared: true },
]

export const resourceLibraryStats = {
  totalResources: 248,
  myUploads: 38,
  sharedResources: 186,
  totalDownloads: 4862,
  avgRating: 4.7,
  storageUsed: 4.2,
  storageTotal: 10,
  byType: [
    { name: 'Worksheets', value: 84, color: 'oklch(0.55 0.14 162)' },
    { name: 'Lesson Plans', value: 62, color: 'oklch(0.65 0.16 75)' },
    { name: 'Presentations', value: 48, color: 'oklch(0.6 0.2 300)' },
    { name: 'Assessments', value: 36, color: 'oklch(0.62 0.2 25)' },
    { name: 'Activities', value: 18, color: 'oklch(0.7 0.15 200)' },
  ],
  recentUploads: [
    { month: 'Aug', count: 42 },
    { month: 'Sep', count: 56 },
    { month: 'Oct', count: 38 },
    { month: 'Nov', count: 64 },
    { month: 'Dec', count: 28 },
  ],
}

export interface CollaborativeFolder {
  id: string
  name: string
  resources: number
  sharedWith: number
  color: string
  lastUpdated: string
}

export const sharedFolders: CollaborativeFolder[] = [
  { id: 'F01', name: 'Class 2 — All Subjects', resources: 86, sharedWith: 8, color: 'from-emerald-500 to-teal-600', lastUpdated: '2024-12-02' },
  { id: 'F02', name: 'Mathematics Department', resources: 142, sharedWith: 12, color: 'from-violet-500 to-purple-600', lastUpdated: '2024-11-29' },
  { id: 'F03', name: 'Primary Worksheets', resources: 68, sharedWith: 18, color: 'from-amber-500 to-orange-600', lastUpdated: '2024-11-28' },
  { id: 'F04', name: 'CBSE Assessment Bank', resources: 54, sharedWith: 24, color: 'from-cyan-500 to-sky-600', lastUpdated: '2024-11-25' },
]
