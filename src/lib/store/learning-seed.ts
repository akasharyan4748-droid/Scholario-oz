/**
 * learning-seed — the demo tenant's LEGITIMATE seeded Learning OS data (§61).
 *
 * Two ownership families (§47/§76), both seeded at first load and then owned
 * by the persisted learning store:
 *
 *   SCHOOL CONTENT (the school published it):
 *     · resources  — the class 2-A learning library (videos, notes,
 *       worksheets, PDFs, interactive, flashcard decks and QUIZZES with real
 *       questions — every quiz is genuinely playable)
 *     · decks      — school-authored subject flashcard decks
 *     · groups     — school study groups + the class Q&A + shared resources
 *
 *   STUDENT CONTENT (Aarav's own learning state — seeded so the demo tenant
 *   shows a lived-in product, then ages like real personal data):
 *     · progress / bookmarks · notes · SM-2 review state on every card
 *     · tasks / goals / two weeks of real study sessions
 *
 * Dates derive from the REAL clock at first load (same convention as the
 * attendance seed) so the demo always has fresh "due today" cards, a live
 * study streak and a current week — never stale 2024 data.
 */

import { addDays } from '@/lib/learning/sm2'
import type {
  LearningResource, QuizQuestion, ResourceProgress, LearningNote,
  Flashcard, Deck, StudyTask, StudyGoal, StudySession,
  StudyGroup, QaQuestion, SharedResourceItem, ReviewLog,
} from './learning-types'

/* ─── Date helpers (local timezone, YYYY-MM-DD) ────────────────────── */

export function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Last `n` school days (Mon–Fri) strictly BEFORE today, oldest first. */
function lastSchoolDaysBefore(n: number): string[] {
  const out: string[] = []
  const cursor = new Date()
  let guard = 0
  while (out.length < n && guard < n * 4 + 20) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      out.unshift(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`)
    }
    cursor.setDate(cursor.getDate() - 1)
    guard++
  }
  return out // [older … newer], none is today
}

const TODAY = isoToday()
const SCHOOL_DAYS = lastSchoolDaysBefore(10)
const DAYS_AGO = (n: number) => SCHOOL_DAYS.length > n ? SCHOOL_DAYS[SCHOOL_DAYS.length - 1 - n] : SCHOOL_DAYS[0]
const isoAt = (date: string, hm: string) => `${date}T${hm}:00`

/* ─── Real quiz question banks (every quiz is genuinely playable) ──── */

function q(id: string, question: string, a: string, b: string, c: string, d: string, answer: 'A' | 'B' | 'C' | 'D'): QuizQuestion {
  return { id, question, options: [a, b, c, d], answer }
}

const FRACTIONS_QUIZ: QuizQuestion[] = [
  q('FQ1', 'What is half of 8?', '2', '3', '4', '6', 'C'),
  q('FQ2', 'In the fraction 3/4, the number on top is called the…', 'denominator', 'numerator', 'fraction bar', 'whole', 'B'),
  q('FQ3', 'Which fraction is the BIGGEST?', '1/2', '1/3', '1/4', '1/8', 'A'),
  q('FQ4', 'If a pizza is cut into 4 equal slices and you eat 1, you ate…', '1/2', '1/3', '1/4', '1/8', 'C'),
  q('FQ5', '1/2 and which fraction are equal?', '2/3', '2/4', '3/4', '4/5', 'B'),
  q('FQ6', 'A quarter of 12 is…', '2', '3', '4', '6', 'B'),
  q('FQ7', 'Which shows one third?', '2/3', '1/2', '1/3', '3/1', 'C'),
  q('FQ8', 'Ravi ate 2/6 of a chocolate bar. Priya ate 3/6. Who ate more?', 'Ravi', 'Priya', 'Both the same', 'Cannot tell', 'B'),
]

const NOUNS_QUIZ: QuizQuestion[] = [
  q('NQ1', 'Find the noun: "The brown dog barked loudly."', 'brown', 'dog', 'barked', 'loudly', 'B'),
  q('NQ2', 'Which word is a noun?', 'run', 'quickly', 'school', 'happy', 'C'),
  q('NQ3', '"Mumbai is a big city." How many nouns are in this sentence?', '1', '2', '3', '0', 'B'),
  q('NQ4', 'A noun can be a person, a place or a…', 'colour', 'thing', 'feeling word', 'action word', 'B'),
  q('NQ5', 'Find the noun: "My teacher reads a story."', 'my', 'reads', 'teacher', 'a', 'C'),
  q('NQ6', 'Which one is a PLACE noun?', 'doctor', 'park', 'jumping', 'blue', 'B'),
  q('NQ7', 'Find the noun: "The cat slept on the sofa."', 'slept', 'on', 'cat', 'the', 'C'),
  q('NQ8', 'Which sentence has TWO nouns?', 'Birds fly.', 'The girl holds a ball.', 'It is raining.', 'Run fast!', 'B'),
]

const PLANTS_QUIZ: QuizQuestion[] = [
  q('PQ1', 'Which part of the plant takes water from the soil?', 'leaf', 'flower', 'root', 'stem', 'C'),
  q('PQ2', 'What do plants need to make food?', 'sunlight', 'darkness', 'plastic', 'music', 'A'),
  q('PQ3', 'The part that holds the plant up and carries water is the…', 'stem', 'seed', 'petal', 'soil', 'A'),
  q('PQ4', 'Which part of the plant often smells sweet and has colours?', 'root', 'leaf', 'flower', 'stem', 'C'),
  q('PQ5', 'Leaves are usually which colour?', 'blue', 'green', 'purple', 'black', 'B'),
  q('PQ6', 'A new plant grows from a…', 'stone', 'seed', 'shadow', 'brick', 'B'),
  q('PQ7', 'Which of these is NOT a plant?', 'rose', 'fern', 'mushroom', 'mango tree', 'C'),
  q('PQ8', 'Why do plants need roots?', 'to look pretty', 'to drink water and hold on', 'to sing songs', 'to make shadows', 'B'),
]

const VARNAMALA_QUIZ: QuizQuestion[] = [
  q('VQ1', 'वर्णमाला का पहला अक्षर कौन सा है?', 'इ', 'उ', 'अ', 'ए', 'C'),
  q('VQ2', '"क" के बाद कौन सा अक्षर आता है?', 'ख', 'ग', 'घ', 'च', 'A'),
  q('VQ3', 'इनमें से स्वर (vowel) कौन है?', 'क', 'आ', 'म', 'न', 'B'),
  q('VQ4', '"म" के बाद कौन आता है?', 'य', 'र', 'ल', 'व', 'A'),
  q('VQ5', 'वर्णमाला में "ज्ञ" कहाँ आता है?', 'बीच में', 'शुरू में', 'अंत में', 'कहीं नहीं', 'C'),
  q('VQ6', '"प" किस वर्ग का अक्षर है?', 'क-वर्ग', 'च-वर्ग', 'त-वर्ग', 'प-वर्ग', 'D'),
]

const COMPUTER_QUIZ: QuizQuestion[] = [
  q('CQ1', 'Which part shows you pictures and words?', 'mouse', 'monitor', 'CPU', 'keyboard', 'B'),
  q('CQ2', 'The "brain" of the computer is the…', 'monitor', 'printer', 'CPU', 'speaker', 'C'),
  q('CQ3', 'Which one is an INPUT device?', 'monitor', 'printer', 'speaker', 'keyboard', 'D'),
  q('CQ4', 'Which one is an OUTPUT device?', 'mouse', 'keyboard', 'printer', 'microphone', 'C'),
  q('CQ5', 'How many main parts does a computer have?', '1', '2', '4', '10', 'C'),
  q('CQ6', 'You use the mouse to…', 'type letters', 'point and click', 'print pages', 'charge the CPU', 'B'),
  q('CQ7', 'A keyboard is used to…', 'type letters and numbers', 'show pictures', 'hear sound', 'cool the CPU', 'A'),
  q('CQ8', 'Which part makes sound?', 'headphones', 'mouse', 'CPU', 'webcam', 'A'),
]

/* ═══ 1. SCHOOL RESOURCES ═══════════════════════════════════════════ */

const R = (
  id: string, title: string, subject: string, topic: string,
  type: LearningResource['type'], difficulty: LearningResource['difficulty'],
  uploadedBy: string, extra: Partial<LearningResource> = {},
): LearningResource => ({
  id, title, subject, topic, type, difficulty, uploadedBy,
  uploadedOn: DAYS_AGO(9 + (Number(id.slice(3)) % 6)),
  description: extra.description ?? '',
  ...extra,
})

export const SCHOOL_RESOURCES: LearningResource[] = [
  // — Mathematics —
  R('LR-001', 'Fractions — Like Parts', 'Mathematics', 'Fractions', 'video', 'beginner', 'Rohan Mehta', {
    description: 'Animated lesson: what a half, a third and a quarter really mean, using chocolate bars and pizza.',
    durationMin: 12,
  }),
  R('LR-002', 'Fractions Practice Set', 'Mathematics', 'Fractions', 'worksheet', 'core', 'Rohan Mehta', {
    description: 'Shade the fraction, compare, and word problems with everyday objects.',
    pages: 4,
  }),
  R('LR-003', 'Addition with Carrying', 'Mathematics', 'Addition', 'video', 'beginner', 'Rohan Mehta', {
    description: 'Two-digit addition with carrying, explained with place-value blocks.',
    durationMin: 8,
  }),
  R('LR-004', 'Place Value to 1000 — Notes', 'Mathematics', 'Place Value', 'notes', 'core', 'Rohan Mehta', {
    description: 'Hundreds, tens and ones with expanded-form examples.',
    pages: 6,
  }),
  R('LR-005', 'Fractions Check', 'Mathematics', 'Fractions', 'quiz', 'challenge', 'Rohan Mehta', {
    description: 'Quick check on halves, thirds and quarters.',
    questions: FRACTIONS_QUIZ,
  }),
  R('LR-006', 'Number Line Jump', 'Mathematics', 'Numbers', 'interactive', 'beginner', 'Rohan Mehta', {
    description: 'Hop along the number line to add and subtract within 100.',
    durationMin: 10,
  }),
  R('LR-025', 'Fractions Flashcards', 'Mathematics', 'Fractions', 'deck', 'core', 'Rohan Mehta', {
    description: 'The class deck — match fractions to pictures and words.',
    deckId: 'DK-MATH-FRAC',
  }),
  // — English —
  R('LR-007', 'The Thirsty Crow — Read Aloud', 'English', 'Reading', 'video', 'beginner', 'Deepa Menon', {
    description: 'Storytime with narration and three comprehension questions at the end.',
    durationMin: 6,
  }),
  R('LR-008', 'Nouns — Person, Place or Thing', 'English', 'Grammar', 'notes', 'core', 'Deepa Menon', {
    description: 'What a noun is, with picture examples and a sorting activity.',
    pages: 4,
  }),
  R('LR-009', 'Nouns Quiz', 'English', 'Grammar', 'quiz', 'core', 'Deepa Menon', {
    description: 'Find the noun in each sentence.',
    questions: NOUNS_QUIZ,
  }),
  R('LR-010', 'Sentence Building Worksheet', 'English', 'Writing', 'worksheet', 'beginner', 'Deepa Menon', {
    description: 'Jumbled words → proper sentences, then draw your favourite one.',
    pages: 3,
  }),
  // — Science —
  R('LR-011', 'Living & Non-Living Things — Notes', 'Science', 'Living Things', 'notes', 'core', 'Kavita Joshi', {
    description: 'What makes something alive? Examples, key words and a picture sort.',
    pages: 8,
  }),
  R('LR-012', 'Plants Around Us — Project Guide', 'Science', 'Plants', 'pdf', 'core', 'Kavita Joshi', {
    description: 'Step-by-step guide for the leaf-collection project with presentation tips.',
    pages: 14,
  }),
  R('LR-013', 'How Seeds Travel', 'Science', 'Plants', 'video', 'beginner', 'Kavita Joshi', {
    description: 'Wind, water and animals — the three clever ways seeds find new homes.',
    durationMin: 9,
  }),
  R('LR-014', 'Plants Quiz', 'Science', 'Plants', 'quiz', 'core', 'Kavita Joshi', {
    description: 'Parts of a plant and what plants need.',
    questions: PLANTS_QUIZ,
  }),
  R('LR-015', 'Plants Flashcards', 'Science', 'Plants', 'deck', 'beginner', 'Kavita Joshi', {
    description: 'Leaf, root, stem, flower — learn every plant part.',
    deckId: 'DK-SCI',
  }),
  // — Hindi —
  R('LR-016', 'Varnamala Practice Sheet', 'Hindi', 'Varnamala', 'worksheet', 'beginner', 'Meera Krishnan', {
    description: 'Trace and write each letter of the वर्णमाला.',
    pages: 12,
  }),
  R('LR-017', 'कहानी: चतुर खरगोश', 'Hindi', 'Reading', 'video', 'beginner', 'Meera Krishnan', {
    description: 'पढ़ने का अभ्यास — the clever rabbit, read aloud with pictures.',
    durationMin: 7,
  }),
  R('LR-018', 'वर्णमाला Quiz', 'Hindi', 'Varnamala', 'quiz', 'core', 'Meera Krishnan', {
    description: 'अ से ज्ञ तक — match and order the letters.',
    questions: VARNAMALA_QUIZ,
  }),
  // — Social Studies —
  R('LR-019', 'Community Helpers — Notes', 'Social Studies', 'Community', 'notes', 'beginner', 'Vikram Singh', {
    description: 'Who keeps our neighbourhood running — doctor, police, teacher and more.',
    pages: 10,
  }),
  R('LR-020', 'Our Neighbourhood', 'Social Studies', 'Community', 'video', 'core', 'Vikram Singh', {
    description: 'A walk around a neighbourhood to see how places help us.',
    durationMin: 8,
  }),
  R('LR-021', 'Community Helpers Flashcards', 'Social Studies', 'Community', 'deck', 'beginner', 'Vikram Singh', {
    description: 'Match each helper to their tool and workplace.',
    deckId: 'DK-SOC',
  }),
  // — Computer Science —
  R('LR-022', 'Parts of a Computer', 'Computer Science', 'Computers', 'video', 'beginner', 'Arjun Kapoor', {
    description: 'Monitor, CPU, keyboard, mouse — what each part does.',
    durationMin: 10,
  }),
  R('LR-023', 'Computer Parts Quiz', 'Computer Science', 'Computers', 'quiz', 'core', 'Arjun Kapoor', {
    description: 'Name the parts and sort inputs from outputs.',
    questions: COMPUTER_QUIZ,
  }),
  R('LR-024', 'Input or Output? Worksheet', 'Computer Science', 'Computers', 'worksheet', 'beginner', 'Arjun Kapoor', {
    description: 'Colour the input devices blue and the output devices green.',
    pages: 4,
  }),
]

/* ═══ 2. FLASHCARD DECKS (school-authored) ══════════════════════════ */

export const SCHOOL_DECKS: Deck[] = [
  { id: 'DK-MATH-FRAC', name: 'Fractions', subject: 'Mathematics', topic: 'Fractions', source: 'school', description: 'Halves, thirds and quarters with pictures.' },
  { id: 'DK-MATH-ADD', name: 'Addition & Place Value', subject: 'Mathematics', topic: 'Addition', source: 'school', description: 'Carrying, place value and number bonds.' },
  { id: 'DK-SCI', name: 'Plants & Living Things', subject: 'Science', topic: 'Plants', source: 'school', description: 'Plant parts and what living things need.' },
  { id: 'DK-ENG', name: 'Nouns & Grammar', subject: 'English', topic: 'Grammar', source: 'school', description: 'Person, place or thing?' },
  { id: 'DK-HIN', name: 'वर्णमाला', subject: 'Hindi', topic: 'Varnamala', source: 'school', description: 'Letters of the Hindi alphabet.' },
  { id: 'DK-SOC', name: 'Community Helpers', subject: 'Social Studies', topic: 'Community', source: 'school', description: 'Helpers, their tools and workplaces.' },
  { id: 'DK-CS', name: 'Computer Basics', subject: 'Computer Science', topic: 'Computers', source: 'school', description: 'Parts of a computer, inputs and outputs.' },
]

/**
 * Cards + their SEEDED SM-2 state. The pattern distributes an honest mix of
 * mastered / learning / new cards with some due today, so every number on
 * screen (due today, learning, mastered) derives from real review state.
 */
type CardSpec = [front: string, back: string]

const DECK_CARDS: Record<string, CardSpec[]> = {
  'DK-MATH-FRAC': [
    ['What is 1/2 of 10?', '5'],
    ['Which is bigger: 1/2 or 1/4?', '1/2'],
    ['The top number of a fraction is called the…', 'Numerator'],
    ['The bottom number of a fraction is called the…', 'Denominator'],
    ['1/4 of a pizza means the pizza was cut into ___ equal slices', '4'],
    ['Draw/write: one third as a fraction', '1/3'],
    ['2/4 is the same as which simpler fraction?', '1/2'],
    ['A quarter of 8 is…', '2'],
    ['If you eat 1 slice of a pizza cut into 3, you ate…', '1/3'],
    ['True or false: 1/3 > 1/2', 'False — 1/3 is smaller'],
    ['What fraction of a day is one hour?', '1/24'],
    ['Numerator of 3/4?', '3'],
  ],
  'DK-MATH-ADD': [
    ['What is 27 + 15?', '42 (carry the 1)'],
    ['In 456, the 5 is in which place?', 'Tens'],
    ['What is 38 + 24?', '62'],
    ['Expanded form of 309?', '300 + 9'],
    ['What is 6 + 7?', '13'],
    ['When the ones column sums above 9, we…', 'Carry one to the tens'],
  ],
  'DK-SCI': [
    ['Which plant part drinks water from the soil?', 'The root'],
    ['What do leaves catch to make food?', 'Sunlight'],
    ['The stem does what two jobs?', 'Holds the plant up and carries water'],
    ['Name two things plants need', 'Water, sunlight (also air and soil)'],
    ['Name one living thing and one non-living thing', 'e.g. cat (living), chair (non-living)'],
    ['What grows into a new plant?', 'A seed'],
    ['Which part often smells sweet?', 'The flower'],
    ['True or false: mushrooms are plants', 'False — they are fungi'],
  ],
  'DK-ENG': [
    ['What is a noun?', 'A person, place or thing'],
    ['Find the noun: "The lazy cat slept."', 'cat'],
    ['Is "park" a person, place or thing?', 'A place'],
    ['Find the noun: "Grandma bakes bread."', 'Grandma, bread'],
    ['Is "jump" a noun or an action word?', 'An action word (verb)'],
    ['Find the noun: "The bell rang loudly."', 'bell'],
    ['Give one example of a thing noun', 'e.g. book'],
    ['How many nouns: "The dog chased the ball."?', 'Two — dog, ball'],
  ],
  'DK-HIN': [
    ['वर्णमाला का पहला अक्षर?', 'अ'],
    ['"क" के बाद कौन आता है?', 'ख'],
    ['एक स्वर (vowel) बताइए', 'आ (या इ, ई, उ, ऊ…)'],
    ['"म" के बाद कौन आता है?', 'य'],
    ['"प" किस वर्ग का है?', 'प-वर्ग'],
    ['वर्णमाला का अंतिम अक्षर?', 'ज्ञ'],
  ],
  'DK-SOC': [
    ['Who treats us when we are sick?', 'A doctor'],
    ['Who keeps our neighbourhood safe?', 'The police'],
    ['Which helper teaches us at school?', 'A teacher'],
    ['Who delivers letters and parcels?', 'The postman'],
    ['A farmer\'s workplace is the…', 'Field / farm'],
    ['Which helper fixes taps and pipes?', 'A plumber'],
  ],
  'DK-CS': [
    ['The brain of the computer?', 'CPU'],
    ['Which part shows pictures and words?', 'The monitor'],
    ['Name one input device', 'Keyboard (or mouse)'],
    ['Name one output device', 'Printer (or monitor, speakers)'],
    ['What do we use to point and click?', 'The mouse'],
    ['A keyboard is used to…', 'Type letters and numbers'],
  ],
}

/** Deterministic SM-2 state by position in the deck (see sm2.ts buckets). */
function seededCardState(i: number) {
  const m = i % 7
  if (m === 0) return { ease: 2.5, intervalDays: 30, reps: 4, lapses: 0, due: addDays(TODAY, 17) } // mastered
  if (m === 3) return { ease: 2.65, intervalDays: 45, reps: 5, lapses: 1, due: addDays(TODAY, 25) } // mastered
  if (m === 1) return { ease: 2.3, intervalDays: 2, reps: 2, lapses: 0, due: addDays(TODAY, -1) } // learning, due
  if (m === 5) return { ease: 2.45, intervalDays: 1, reps: 1, lapses: 0, due: addDays(TODAY, -2) } // learning, due
  if (m === 2) return { ease: 2.4, intervalDays: 4, reps: 2, lapses: 0, due: addDays(TODAY, 2) } // learning, future
  if (m === 6) return { ease: 2.5, intervalDays: 6, reps: 3, lapses: 0, due: addDays(TODAY, 4) } // learning, future
  return { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: TODAY } // new (available today)
}

export function buildSeededCards(): Flashcard[] {
  const cards: Flashcard[] = []
  for (const [deckId, specs] of Object.entries(DECK_CARDS)) {
    specs.forEach(([front, back], i) => {
      cards.push({
        id: `FC-${deckId.slice(3)}-${i + 1}`,
        deckId, front, back,
        source: 'school',
        createdAt: DAYS_AGO(9),
        lastReviewedAt: i % 7 !== 4 ? DAYS_AGO(2) : undefined,
        ...seededCardState(i),
      })
    })
  }
  return cards
}

/* ═══ 3. STUDENT STATE — progress / bookmarks / notes ═══════════════ */

export const SEEDED_PROGRESS: Record<string, ResourceProgress> = {
  'LR-001': { pct: 72, lastStudiedAt: DAYS_AGO(0), }, // Continue Learning anchor
  'LR-002': { pct: 30, lastStudiedAt: DAYS_AGO(1) },
  'LR-003': { pct: 100, lastStudiedAt: DAYS_AGO(4), completedAt: DAYS_AGO(4) },
  'LR-007': { pct: 100, lastStudiedAt: DAYS_AGO(3), completedAt: DAYS_AGO(3) },
  'LR-011': { pct: 100, lastStudiedAt: DAYS_AGO(5), completedAt: DAYS_AGO(5) },
  'LR-012': { pct: 45, lastStudiedAt: DAYS_AGO(1) },
  'LR-013': { pct: 15, lastStudiedAt: DAYS_AGO(0) },
  'LR-019': { pct: 100, lastStudiedAt: DAYS_AGO(6), completedAt: DAYS_AGO(6) },
  'LR-022': { pct: 100, lastStudiedAt: DAYS_AGO(2), completedAt: DAYS_AGO(2) },
  'LR-023': { pct: 100, lastStudiedAt: DAYS_AGO(2), completedAt: DAYS_AGO(2), quizScore: { correct: 7, total: 8, on: DAYS_AGO(2) } },
}

export const SEEDED_BOOKMARKS = ['LR-001', 'LR-005', 'LR-012', 'LR-016', 'LR-019']

export const SEEDED_NOTES: LearningNote[] = [
  {
    id: 'NT-001', title: 'Fractions — keep in mind',
    body: 'The BOTTOM number tells how many equal slices the whole was cut into. The TOP number tells how many we took. Bigger bottom = smaller slice!',
    subject: 'Mathematics', topic: 'Fractions', pinned: true, tags: ['fractions', 'maths'],
    linkedResourceId: 'LR-001', createdAt: DAYS_AGO(1), updatedAt: DAYS_AGO(1), archived: false,
  },
  {
    id: 'NT-002', title: 'Plants project — what to collect',
    body: 'Collect 5 different leaves (not from the ground — ask first!), press them in the notebook, and write one line about each plant.',
    subject: 'Science', topic: 'Plants', pinned: false, tags: ['project'],
    linkedResourceId: 'LR-012', createdAt: DAYS_AGO(2), updatedAt: DAYS_AGO(2), archived: false,
  },
  {
    id: 'NT-003', title: 'New words I learned',
    body: 'neighbourhood — the area around my home.\ncommunity — people living in one place.\nplural — more than one.',
    subject: 'English', topic: 'Reading', pinned: false, tags: ['words'],
    createdAt: DAYS_AGO(3), updatedAt: DAYS_AGO(3), archived: false,
  },
]

/* ═══ 4. PLANNER — tasks / goals / sessions ═════════════════════════ */

export const SEEDED_TASKS: StudyTask[] = [
  { id: 'TK-001', title: 'Practice fractions — Practice Set', subject: 'Mathematics', topic: 'Fractions', type: 'practice', date: TODAY, startTime: '08:00', durationMin: 25, priority: 'normal', notes: 'Finish pages 3 and 4 of the worksheet.', tags: ['fractions'], status: 'todo', resourceId: 'LR-002', goalId: 'GL-002', createdAt: DAYS_AGO(1) },
  { id: 'TK-002', title: 'English reading time', subject: 'English', topic: 'Reading', type: 'reading', date: TODAY, startTime: '17:30', durationMin: 20, priority: 'low', tags: [], status: 'todo', createdAt: DAYS_AGO(1) },
  { id: 'TK-003', title: 'Revise — Plants Around Us', subject: 'Science', topic: 'Plants', type: 'revision', date: TODAY, startTime: '19:00', durationMin: 30, priority: 'high', notes: 'Before the project submission.', tags: ['revision'], status: 'todo', resourceId: 'LR-012', goalId: 'GL-003', createdAt: DAYS_AGO(0) },
  { id: 'TK-004', title: 'Read — Living & Non-Living notes', subject: 'Science', topic: 'Living Things', type: 'reading', date: addDays(TODAY, 1), startTime: '17:00', durationMin: 20, priority: 'normal', tags: [], status: 'todo', resourceId: 'LR-011', createdAt: DAYS_AGO(0) },
  { id: 'TK-005', title: 'Varnamala practice sheet', subject: 'Hindi', topic: 'Varnamala', type: 'practice', date: addDays(TODAY, 2), startTime: '18:00', durationMin: 15, priority: 'low', tags: [], status: 'todo', resourceId: 'LR-016', createdAt: DAYS_AGO(0) },
  // Completed history (last week) — feeds analytics honestly
  { id: 'TK-006', title: 'Watch — Addition with Carrying', subject: 'Mathematics', topic: 'Addition', type: 'reading', date: DAYS_AGO(4), startTime: '08:00', durationMin: 15, priority: 'normal', tags: [], status: 'done', resourceId: 'LR-003', createdAt: DAYS_AGO(5), completedAt: DAYS_AGO(4) },
  { id: 'TK-007', title: 'Computer Parts Quiz', subject: 'Computer Science', topic: 'Computers', type: 'quiz', date: DAYS_AGO(2), startTime: '17:00', durationMin: 15, priority: 'normal', tags: [], status: 'done', resourceId: 'LR-023', createdAt: DAYS_AGO(3), completedAt: DAYS_AGO(2) },
  { id: 'TK-008', title: 'Read — Community Helpers notes', subject: 'Social Studies', topic: 'Community', type: 'reading', date: DAYS_AGO(6), startTime: '18:30', durationMin: 25, priority: 'normal', tags: [], status: 'done', resourceId: 'LR-019', createdAt: DAYS_AGO(7), completedAt: DAYS_AGO(6) },
]

export const SEEDED_GOALS: StudyGoal[] = [
  { id: 'GL-001', title: 'Study 5 hours this week', kind: 'time', target: 300, unit: 'minutes', scope: 'week', deadline: addDays(TODAY, 2), createdAt: SCHOOL_DAYS[0], archived: false },
  { id: 'GL-002', title: 'Master the Fractions deck', kind: 'cards', target: 10, unit: 'cards', scope: 'term', subject: 'Mathematics', createdAt: SCHOOL_DAYS[3], archived: false },
  { id: 'GL-003', title: 'Finish the Plants Around Us materials', kind: 'resources', target: 3, unit: 'resources', scope: 'term', subject: 'Science', deadline: addDays(TODAY, 3), createdAt: SCHOOL_DAYS[2], archived: false },
]

/** Two weeks of real study sessions (none today — today starts with you). */
export const SEEDED_SESSIONS: StudySession[] = [
  { id: 'SS-01', subject: 'Mathematics', topic: 'Fractions', startedAt: isoAt(DAYS_AGO(0), '17:10'), endedAt: isoAt(DAYS_AGO(0), '17:45'), durationMin: 35, mode: 'focus', focusMode: 'focus25', completed: true },
  { id: 'SS-02', subject: 'English', topic: 'Reading', startedAt: isoAt(DAYS_AGO(1), '17:30'), endedAt: isoAt(DAYS_AGO(1), '18:10'), durationMin: 40, mode: 'focus', focusMode: 'focus45', completed: true },
  { id: 'SS-03', subject: 'Science', topic: 'Plants', startedAt: isoAt(DAYS_AGO(2), '19:00'), endedAt: isoAt(DAYS_AGO(2), '19:30'), durationMin: 30, mode: 'focus', focusMode: 'focus25', completed: true },
  { id: 'SS-04', subject: 'Computer Science', topic: 'Computers', startedAt: isoAt(DAYS_AGO(2), '17:00'), endedAt: isoAt(DAYS_AGO(2), '17:55'), durationMin: 55, mode: 'focus', focusMode: 'focus60', completed: true },
  { id: 'SS-05', subject: 'Mathematics', topic: 'Addition', startedAt: isoAt(DAYS_AGO(3), '08:00'), endedAt: isoAt(DAYS_AGO(3), '08:35'), durationMin: 35, mode: 'focus', focusMode: 'focus25', completed: true },
  { id: 'SS-06', subject: 'Hindi', topic: 'Varnamala', startedAt: isoAt(DAYS_AGO(4), '18:00'), endedAt: isoAt(DAYS_AGO(4), '18:25'), durationMin: 25, mode: 'focus', focusMode: 'custom', completed: true },
  { id: 'SS-07', subject: 'English', topic: 'Grammar', startedAt: isoAt(DAYS_AGO(5), '17:00'), endedAt: isoAt(DAYS_AGO(5), '17:30'), durationMin: 30, mode: 'focus', focusMode: 'focus25', completed: true },
  { id: 'SS-08', subject: 'Science', topic: 'Living Things', startedAt: isoAt(DAYS_AGO(6), '19:00'), endedAt: isoAt(DAYS_AGO(6), '19:40'), durationMin: 40, mode: 'focus', focusMode: 'focus45', completed: true },
]

export const DAILY_GOAL_MIN_SEED = 45

/* ═══ 5. STUDY GROUPS / Q&A / SHARED ════════════════════════════════ */

export const SEEDED_GROUPS: StudyGroup[] = [
  {
    id: 'GRP-001', name: 'Math Masters', subject: 'Mathematics', topic: 'Fractions',
    description: 'We solve one fractions word problem together every meeting and quiz each other with flashcards.',
    rules: ['Take turns explaining your answer', 'It is OK to get it wrong — that is how we learn', 'Homework answers are hinted, never given'],
    visibility: 'class', createdBy: 'Rohan Mehta', createdAt: DAYS_AGO(20),
    joined: true, nextSessionAt: isoAt(addDays(TODAY, 2), '16:30'),
    members: ['Aarav Sharma', 'Ishaan Verma', 'Diya Patel', 'Kabir Singh', 'Anaya Rao', 'Rohan Mehta (teacher)'],
  },
  {
    id: 'GRP-002', name: 'Science Explorers', subject: 'Science', topic: 'Plants',
    description: 'Leaf-collection project team. We share findings and prep the class display together.',
    rules: ['Bring one finding per meeting', 'Be gentle with plants', 'Share materials'],
    visibility: 'class', createdBy: 'Kavita Joshi', createdAt: DAYS_AGO(14),
    joined: true, nextSessionAt: isoAt(addDays(TODAY, 4), '15:45'),
    members: ['Aarav Sharma', 'Vihaan Gupta', 'Sara Thomas', 'Arav Nair', 'Kavita Joshi (teacher)'],
  },
  {
    id: 'GRP-003', name: 'English Book Club', subject: 'English', topic: 'Reading',
    description: 'We read one short story a week and talk about our favourite part.',
    rules: ['Everyone reads the story first', 'No spoilers before the meeting'],
    visibility: 'class', createdBy: 'Deepa Menon', createdAt: DAYS_AGO(10),
    joined: false,
    members: ['Myra Kulkarni', 'Advik Reddy', 'Ira Bose', 'Deepa Menon (teacher)'],
  },
  {
    id: 'GRP-004', name: 'Varnamala Circle', subject: 'Hindi', topic: 'Varnamala',
    description: 'Practice Hindi letters together — writing, sounds and one rhyme per meeting.',
    rules: ['Practice aloud', 'Help classmates pronounce'],
    visibility: 'school', createdBy: 'Meera Krishnan', createdAt: DAYS_AGO(7),
    joined: false,
    members: ['Reyansh Das', 'Anvi Shetty', 'Meera Krishnan (teacher)'],
  },
]

export const SEEDED_QUESTIONS: QaQuestion[] = [
  {
    id: 'QA-001', groupId: 'GRP-001', title: 'Why is 1/3 smaller than 1/2?',
    body: 'The pizza has MORE slices when we cut thirds, so each slice is smaller. But why does the bottom number make the slice smaller?',
    subject: 'Mathematics', topic: 'Fractions', askedBy: 'Kabir Singh', askedAt: DAYS_AGO(1),
    helpful: 4, answers: [
      { id: 'QA-001-A1', body: 'Think of sharing 1 chocolate bar with more friends — more friends means a smaller piece for you! 3 friends → 1/3, 2 friends → 1/2.', by: 'Rohan Mehta', byRole: 'teacher', at: DAYS_AGO(1), helpful: 6, accepted: true },
      { id: 'QA-001-A2', body: 'I drew it with rectangles — thirds have more cutting lines!', by: 'Diya Patel', byRole: 'student', at: DAYS_AGO(1), helpful: 2 },
    ],
  },
  {
    id: 'QA-002', title: 'How do I remember noun vs verb?',
    body: 'I keep mixing them up in the quiz. Any tricks?',
    subject: 'English', topic: 'Grammar', askedBy: 'Aarav Sharma', askedAt: DAYS_AGO(2),
    helpful: 3, answers: [
      { id: 'QA-002-A1', body: 'Try the "can you touch it?" test — if you can touch or see it (cat, school, ball), it is a noun. If it is something you DO (run, eat, sleep), it is a verb.', by: 'Deepa Menon', byRole: 'teacher', at: DAYS_AGO(2), helpful: 5, accepted: true },
    ],
  },
  {
    id: 'QA-003', groupId: 'GRP-002', title: 'Can we use leaves that already fell?',
    body: 'For the Plants Around Us project — the guide says collect 5 leaves. Is it OK to take fallen ones?',
    subject: 'Science', topic: 'Plants', askedBy: 'Sara Thomas', askedAt: DAYS_AGO(3),
    helpful: 2, answers: [
      { id: 'QA-003-A1', body: 'Fallen leaves are perfect — the project is about leaf SHAPES, and we should never pull leaves off a living plant for no reason.', by: 'Kavita Joshi', byRole: 'teacher', at: DAYS_AGO(3), helpful: 4, accepted: true },
      { id: 'QA-003-A2', body: 'I found a mango leaf and a neem leaf near the ground!', by: 'Arav Nair', byRole: 'student', at: DAYS_AGO(2), helpful: 1 },
    ],
  },
  {
    id: 'QA-004', title: 'Is a mouse an input or output part?',
    body: 'The computer quiz confused me — the mouse feels like it does both?',
    subject: 'Computer Science', topic: 'Computers', askedBy: 'Vihaan Gupta', askedAt: DAYS_AGO(5),
    helpful: 5, locked: true, answers: [
      { id: 'QA-004-A1', body: 'Input! It sends YOUR clicks INTO the computer. Only parts that show or make something for you (monitor, printer, speakers) are output.', by: 'Arjun Kapoor', byRole: 'teacher', at: DAYS_AGO(5), helpful: 7, accepted: true },
    ],
  },
]

export const SEEDED_SHARES: SharedResourceItem[] = [
  { id: 'SHR-001', resourceId: 'LR-012', title: 'Plants Around Us — Project Guide', sharedBy: 'Kavita Joshi (teacher)', sharedAt: DAYS_AGO(3), groupId: 'GRP-002', note: 'Read pages 4–6 before Thursday.', saves: 5 },
  { id: 'SHR-002', resourceId: 'LR-005', title: 'Fractions Check (quiz)', sharedBy: 'Ishaan Verma', sharedAt: DAYS_AGO(2), groupId: 'GRP-001', note: 'Great practice before the test!', saves: 3 },
  { id: 'SHR-003', resourceId: 'LR-018', title: 'वर्णमाला Quiz', sharedBy: 'Meera Krishnan (teacher)', sharedAt: DAYS_AGO(4), note: 'For extra practice at home.', saves: 7 },
  { id: 'SHR-004', resourceId: 'LR-007', title: 'The Thirsty Crow — Read Aloud', sharedBy: 'Myra Kulkarni', sharedAt: DAYS_AGO(6), groupId: 'GRP-003', note: 'This week\'s Book Club story.', saves: 4 },
]

/** Recent review history (last few days) for "Recently reviewed". */
export function buildSeededReviewLogs(cards: Flashcard[]): ReviewLog[] {
  const recent = cards.filter((c) => c.lastReviewedAt).slice(0, 12)
  return recent.map((c, i) => ({
    id: `RL-SEED-${i + 1}`,
    cardId: c.id,
    deckId: c.deckId,
    grade: (['good', 'hard', 'good', 'easy', 'good', 'again'] as const)[i % 6],
    reviewedAt: `${c.lastReviewedAt}T${['17:05', '17:12', '17:20', '18:02', '18:09', '18:15'][i % 6]}:00`,
    intervalBefore: Math.max(1, c.intervalDays - 1),
    intervalAfter: c.intervalDays,
  }))
}
