// Student flashcards & revision — spaced repetition

export interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: string
  nextReview?: string
  interval: number // days
  ease: number // 1.3 to 2.5
  reviews: number
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
}

export const flashcards: Flashcard[] = [
  { id: 'FC01', front: 'What is 7 + 8?', back: '15', subject: 'Mathematics', topic: 'Addition', difficulty: 'easy', lastReviewed: '2024-11-28', nextReview: '2024-12-01', interval: 3, ease: 2.3, reviews: 4, status: 'reviewing' },
  { id: 'FC02', front: 'What is 14 - 6?', back: '8', subject: 'Mathematics', topic: 'Subtraction', difficulty: 'easy', lastReviewed: '2024-11-27', nextReview: '2024-12-04', interval: 7, ease: 2.5, reviews: 6, status: 'mastered' },
  { id: 'FC03', front: 'What is 5 × 3?', back: '15', subject: 'Mathematics', topic: 'Multiplication', difficulty: 'medium', lastReviewed: '2024-11-28', nextReview: '2024-11-29', interval: 1, ease: 1.8, reviews: 2, status: 'learning' },
  { id: 'FC04', front: 'Spell the number: 45', back: 'Forty-Five', subject: 'Mathematics', topic: 'Number Names', difficulty: 'medium', lastReviewed: '2024-11-26', nextReview: '2024-12-03', interval: 7, ease: 2.4, reviews: 5, status: 'mastered' },
  { id: 'FC05', front: 'What do plants need to grow?', back: 'Sunlight, Water, Air, and Soil', subject: 'Science', topic: 'Plants', difficulty: 'easy', lastReviewed: '2024-11-28', nextReview: '2024-12-02', interval: 4, ease: 2.2, reviews: 3, status: 'reviewing' },
  { id: 'FC06', front: 'Name 3 living things', back: 'Examples: Dog, Tree, Human (anything that grows, eats, breathes)', subject: 'Science', topic: 'Living Things', difficulty: 'easy', lastReviewed: '2024-11-25', nextReview: '2024-12-05', interval: 10, ease: 2.5, reviews: 7, status: 'mastered' },
  { id: 'FC07', front: 'Opposite of "Hot"', back: 'Cold', subject: 'English', topic: 'Opposites', difficulty: 'easy', lastReviewed: '2024-11-28', nextReview: '2024-12-06', interval: 8, ease: 2.4, reviews: 5, status: 'mastered' },
  { id: 'FC08', front: 'Past tense of "go"', back: 'Went', subject: 'English', topic: 'Grammar', difficulty: 'medium', lastReviewed: '2024-11-27', nextReview: '2024-11-30', interval: 3, ease: 2.0, reviews: 3, status: 'reviewing' },
  { id: 'FC09', front: 'What is a noun?', back: 'A word that names a person, place, animal, or thing', subject: 'English', topic: 'Grammar', difficulty: 'medium', lastReviewed: '2024-11-28', nextReview: '2024-11-29', interval: 1, ease: 1.7, reviews: 2, status: 'learning' },
  { id: 'FC10', front: 'हिंदी में "सेब" क्या है?', back: 'Apple (a fruit)', subject: 'Hindi', topic: 'Vocabulary', difficulty: 'easy', lastReviewed: '2024-11-28', nextReview: '2024-12-01', interval: 3, ease: 2.3, reviews: 4, status: 'reviewing' },
  { id: 'FC11', front: 'What does CPU stand for?', back: 'Central Processing Unit — the "brain" of the computer', subject: 'Computer Science', topic: 'Hardware', difficulty: 'medium', lastReviewed: '2024-11-28', nextReview: '2024-11-29', interval: 1, ease: 1.6, reviews: 2, status: 'learning' },
  { id: 'FC12', front: 'Name an input device', back: 'Keyboard, Mouse, Microphone, Scanner (any one)', subject: 'Computer Science', topic: 'Hardware', difficulty: 'easy', lastReviewed: '2024-11-26', nextReview: '2024-12-04', interval: 7, ease: 2.5, reviews: 6, status: 'mastered' },
  { id: 'FC13', front: 'Capital of India?', back: 'New Delhi', subject: 'Social Studies', topic: 'Geography', difficulty: 'easy', lastReviewed: '2024-11-25', nextReview: '2024-12-08', interval: 12, ease: 2.5, reviews: 8, status: 'mastered' },
  { id: 'FC14', front: 'What is a community helper?', back: 'A person who helps people in the community (doctor, teacher, police, etc.)', subject: 'Social Studies', topic: 'Community', difficulty: 'medium', lastReviewed: '2024-11-28', nextReview: '2024-11-30', interval: 2, ease: 1.9, reviews: 3, status: 'reviewing' },
  { id: 'FC15', front: 'What is 12 + 9?', back: '21', subject: 'Mathematics', topic: 'Addition', difficulty: 'easy', reviews: 0, interval: 0, ease: 2.5, status: 'new' },
  { id: 'FC16', front: 'Name the 4 main parts of a computer', back: 'CPU, Monitor, Keyboard, Mouse', subject: 'Computer Science', topic: 'Hardware', difficulty: 'medium', reviews: 0, interval: 0, ease: 2.5, status: 'new' },
]

export interface SubjectNote {
  id: string
  subject: string
  topic: string
  title: string
  content: string
  keyPoints: string[]
  examples: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  readProgress: number
  bookmarked: boolean
}

export const subjectNotes: SubjectNote[] = [
  {
    id: 'SN01', subject: 'Mathematics', topic: 'Addition with Carrying', title: 'Two-Digit Addition (Carrying)',
    content: 'When adding two-digit numbers, sometimes the sum of the ones column is 10 or more. We "carry" the extra ten to the tens column. Example: 47 + 28. Add ones: 7 + 8 = 15. Write 5, carry 1. Add tens: 4 + 2 + 1 (carried) = 7. Answer: 75.',
    keyPoints: ['Always start from the ones column (right side)', 'If the sum is 10+, write the ones digit and carry the 1', 'Add the carried 1 to the tens column', 'Use place value blocks to understand better'],
    examples: ['46 + 27 = 73 (carry 1)', '58 + 34 = 92 (carry 1)', '39 + 25 = 64 (carry 1)'],
    difficulty: 'medium', readProgress: 100, bookmarked: true,
  },
  {
    id: 'SN02', subject: 'Science', topic: 'Living & Non-Living Things', title: 'What Makes Something Alive?',
    content: 'Living things grow, need food and water, breathe, move, and reproduce. Non-living things do not do these things. Plants are living — they grow, need water and sunlight, and make seeds. A rock is non-living.',
    keyPoints: ['Living things: grow, eat, breathe, move, reproduce', 'Non-living things: do not grow or need food', 'Plants are living things', 'Animals and humans are living things'],
    examples: ['Living: Dog, Tree, Fish, Human', 'Non-living: Rock, Pencil, Water, Chair'],
    difficulty: 'easy', readProgress: 80, bookmarked: true,
  },
  {
    id: 'SN03', subject: 'English', topic: 'Nouns', title: 'Types of Nouns',
    content: 'A noun is a word that names a person, place, animal, or thing. Common nouns name general items (boy, city). Proper nouns name specific items and start with a capital letter (Rahul, Delhi).',
    keyPoints: ['Noun = naming word', 'Common noun: general (girl, school)', 'Proper noun: specific, capital letter (Priya, Demo School)', 'Collective noun: group (team, flock)'],
    examples: ['Person: teacher, Dr. Iyer', 'Place: park, India', 'Animal: dog, Bruno', 'Thing: book, pencil'],
    difficulty: 'medium', readProgress: 60, bookmarked: false,
  },
  {
    id: 'SN04', subject: 'Computer Science', topic: 'Parts of a Computer', title: 'Input & Output Devices',
    content: 'A computer has input devices (we use to give information) and output devices (computer uses to show information). Input: keyboard, mouse, microphone. Output: monitor, printer, speaker.',
    keyPoints: ['Input devices: send data TO the computer', 'Output devices: computer sends data to US', 'CPU: the brain that processes everything', 'Monitor: shows output on screen'],
    examples: ['Input: Keyboard, Mouse, Scanner', 'Output: Monitor, Printer, Speaker'],
    difficulty: 'easy', readProgress: 100, bookmarked: true,
  },
]

export const flashcardStats = {
  totalCards: 86,
  dueToday: 12,
  newCards: 24,
  masteredCards: 38,
  learningCards: 24,
  streak: 14,
  longestStreak: 28,
  reviewsToday: 8,
  accuracyRate: 88,
  cardsBySubject: [
    { subject: 'Mathematics', total: 24, mastered: 14, color: 'oklch(0.6 0.18 300)' },
    { subject: 'English', total: 18, mastered: 8, color: 'oklch(0.55 0.14 162)' },
    { subject: 'Science', total: 16, mastered: 7, color: 'oklch(0.65 0.16 75)' },
    { subject: 'Computer Science', total: 12, mastered: 4, color: 'oklch(0.7 0.15 200)' },
    { subject: 'Hindi', total: 10, mastered: 3, color: 'oklch(0.62 0.2 25)' },
    { subject: 'Social Studies', total: 6, mastered: 2, color: 'oklch(0.6 0.15 60)' },
  ],
  weeklyReviews: [
    { day: 'Mon', reviews: 18 }, { day: 'Tue', reviews: 22 },
    { day: 'Wed', reviews: 14 }, { day: 'Thu', reviews: 26 },
    { day: 'Fri', reviews: 20 }, { day: 'Sat', reviews: 12 },
    { day: 'Sun', reviews: 8 },
  ],
}
