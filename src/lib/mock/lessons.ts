// Lesson planner data — teacher curriculum + weekly plans

export interface LessonPlan {
  id: string
  subject: string
  topic: string
  className: string
  date: string
  period: string
  duration: string
  objectives: string[]
  activities: string[]
  resources: string[]
  homework: string
  status: 'planned' | 'completed' | 'in-progress'
  progress: number
}

export const lessonPlans: LessonPlan[] = [
  {
    id: 'LP01', subject: 'Mathematics', topic: 'Addition with Carrying (2-digit)', className: 'Class 2-A',
    date: '2024-12-02', period: 'Period 2 · 08:45–09:30', duration: '45 min',
    objectives: ['Understand the concept of carrying over', 'Solve 2-digit addition problems independently', 'Apply to real-life word problems'],
    activities: ['Warm-up: Mental math 1-digit addition (5 min)', 'Demonstrate carrying on board with blocks (10 min)', 'Guided practice — 4 problems (15 min)', 'Independent worksheet (10 min)', 'Wrap-up & recap (5 min)'],
    resources: ['Place value blocks', 'Worksheet 4', 'Number chart 1–100', 'Smartboard presentation'],
    homework: 'Worksheet 4 — Q1 to Q8 (double-digit addition)',
    status: 'planned', progress: 0,
  },
  {
    id: 'LP02', subject: 'Computer Science', topic: 'Introduction to MS Paint', className: 'Class 2-A',
    date: '2024-12-02', period: 'Period 6 · 12:45–01:30', duration: '45 min',
    objectives: ['Identify Paint tools (brush, eraser, fill)', 'Draw a simple house using shapes', 'Save a file with their name'],
    activities: ['Demo of Paint tools on projector (10 min)', 'Students explore tools freely (10 min)', 'Guided drawing of a house (15 min)', 'Save file with name (5 min)', 'Show & tell (5 min)'],
    resources: ['Computer Lab — 18 systems', 'Projector', 'Sample drawing'],
    homework: 'Practice drawing your favorite animal at home',
    status: 'planned', progress: 0,
  },
  {
    id: 'LP03', subject: 'Mathematics', topic: 'Subtraction with Borrowing', className: 'Class 2-A',
    date: '2024-11-29', period: 'Period 2 · 08:45–09:30', duration: '45 min',
    objectives: ['Understand borrowing concept', 'Solve 2-digit subtraction with borrowing'],
    activities: ['Recap addition (5 min)', 'Borrowing demo with blocks (12 min)', 'Guided practice (15 min)', 'Worksheet (10 min)', 'Recap (3 min)'],
    resources: ['Place value blocks', 'Worksheet 3', 'Number chart'],
    homework: 'Worksheet 3 — Q1 to Q6',
    status: 'completed', progress: 100,
  },
  {
    id: 'LP04', subject: 'Computer Science', topic: 'Parts of a Computer', className: 'Class 2-A',
    date: '2024-11-28', period: 'Period 6 · 12:45–01:30', duration: '45 min',
    objectives: ['Name 4 main parts of a computer', 'Identify input vs output devices'],
    activities: ['Show real parts (CPU, monitor, keyboard, mouse) (10 min)', 'Label the parts worksheet (15 min)', 'Group sorting game — input/output (12 min)', 'Quiz (8 min)'],
    resources: ['Real computer parts', 'Labeling worksheet', 'Sorting cards'],
    homework: 'Draw and label a computer at home',
    status: 'completed', progress: 100,
  },
  {
    id: 'LP05', subject: 'Mathematics', topic: 'Multiplication Tables 2 & 3', className: 'Class 2-A',
    date: '2024-12-03', period: 'Period 2 · 08:45–09:30', duration: '45 min',
    objectives: ['Recite tables 2 and 3', 'Solve simple multiplication problems'],
    activities: ['Skip counting warm-up (5 min)', 'Introduce table of 2 with visuals (10 min)', 'Chanting practice (8 min)', 'Table of 3 (10 min)', 'Mixed practice (12 min)'],
    resources: ['Multiplication chart', 'Counters', 'Flashcards'],
    homework: 'Learn tables 2 and 3 by heart',
    status: 'planned', progress: 0,
  },
]

export interface CurriculumTopic {
  id: string
  unit: string
  topic: string
  hours: number
  completed: number
  status: 'done' | 'ongoing' | 'upcoming'
}

export const mathematicsCurriculum: CurriculumTopic[] = [
  { id: 'U1T1', unit: 'Unit 1: Numbers', topic: 'Numbers 1–100', hours: 12, completed: 12, status: 'done' },
  { id: 'U1T2', unit: 'Unit 1: Numbers', topic: 'Number Names', hours: 8, completed: 8, status: 'done' },
  { id: 'U1T3', unit: 'Unit 1: Numbers', topic: 'Before, After, Between', hours: 6, completed: 6, status: 'done' },
  { id: 'U2T1', unit: 'Unit 2: Addition', topic: '1-digit Addition', hours: 10, completed: 10, status: 'done' },
  { id: 'U2T2', unit: 'Unit 2: Addition', topic: '2-digit Addition (with carrying)', hours: 12, completed: 7, status: 'ongoing' },
  { id: 'U3T1', unit: 'Unit 3: Subtraction', topic: '1-digit Subtraction', hours: 10, completed: 10, status: 'done' },
  { id: 'U3T2', unit: 'Unit 3: Subtraction', topic: '2-digit Subtraction (borrowing)', hours: 12, completed: 12, status: 'done' },
  { id: 'U4T1', unit: 'Unit 4: Multiplication', topic: 'Tables 2, 3, 5', hours: 14, completed: 0, status: 'upcoming' },
  { id: 'U5T1', unit: 'Unit 5: Shapes', topic: '2D & 3D Shapes', hours: 8, completed: 0, status: 'upcoming' },
  { id: 'U6T1', unit: 'Unit 6: Measurement', topic: 'Length & Weight', hours: 10, completed: 0, status: 'upcoming' },
]

export const lessonPlannerStats = {
  totalPlans: 86,
  thisWeek: 12,
  completed: 78,
  pending: 8,
  avgDuration: '45 min',
  curriculumProgress: 62,
}
