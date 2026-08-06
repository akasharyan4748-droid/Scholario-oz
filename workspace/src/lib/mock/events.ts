// Event management data — annual day, sports day, cultural events

export interface SchoolEvent {
  id: string
  name: string
  type: 'Cultural' | 'Sports' | 'Academic' | 'Competition' | 'Ceremony' | 'Trip'
  date: string
  endDate?: string
  time: string
  venue: string
  status: 'Planning' | 'Registration Open' | 'Ongoing' | 'Completed' | 'Cancelled'
  organizer: string
  coordinator: string
  budget: number
  spent: number
  registrations: number
  capacity: number
  description: string
  highlights: string[]
  gradient: string
}

export const events: SchoolEvent[] = [
  {
    id: 'EV01', name: 'Annual Sports Day 2024', type: 'Sports', date: '2024-12-15', time: '07:30 AM',
    venue: 'School Ground · Main Field', status: 'Registration Open', organizer: 'Sanjay Reddy', coordinator: 'Sports Department',
    budget: 185000, spent: 84200, registrations: 1240, capacity: 1842,
    description: 'The biggest sporting event of the year featuring track & field, team sports, and the inter-house championship. Parents cordially invited.',
    highlights: ['Inter-house athletics', 'Cricket & Football finals', 'Prize distribution by Chief Guest', 'March past by all houses'],
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'EV02', name: 'Annual Day — "Vistas 2024"', type: 'Cultural', date: '2024-12-20', time: '05:00 PM',
    venue: 'School Auditorium', status: 'Planning', organizer: 'Lakshmi Venkat', coordinator: 'Cultural Committee',
    budget: 320000, spent: 156000, registrations: 0, capacity: 800,
    description: 'A grand evening of music, dance, drama and celebrations showcasing student talent. Theme: "Vistas of India".',
    highlights: ['Classical & contemporary dance', 'Drama: "Unity in Diversity"', 'Music orchestra', 'Awards ceremony'],
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'EV03', name: 'Inter-House Quiz Championship', type: 'Competition', date: '2024-12-05', time: '11:00 AM',
    venue: 'Audio-Visual Hall', status: 'Completed', organizer: 'Deepa Menon', coordinator: 'Academic Committee',
    budget: 24000, spent: 21800, registrations: 64, capacity: 64,
    description: 'Battles of brains across 4 houses — Emerald, Ruby, Sapphire, Topaz. General knowledge, science, and rapid-fire rounds.',
    highlights: ['Sapphire House won 🏆', '4 rounds × 16 participants', 'Live audience of 400+'],
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'EV04', name: 'Science Exhibition — "Innovatio"', type: 'Academic', date: '2024-12-12', time: '10:00 AM',
    venue: 'Science Block · All Labs', status: 'Registration Open', organizer: 'Pooja Bhatt', coordinator: 'Science Department',
    budget: 86000, spent: 34200, registrations: 142, capacity: 200,
    description: 'Class 6–12 students showcase innovative science projects. External judges from IIT Delhi & AIIMS.',
    highlights: ['120+ working models', 'Robotics zone', 'Guest lecture by ISRO scientist', 'Best project awards'],
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    id: 'EV05', name: 'Annual Educational Trip — Jaipur', type: 'Trip', date: '2024-11-18', endDate: '2024-11-20', time: '06:00 AM',
    venue: 'Jaipur · Rajasthan', status: 'Completed', organizer: 'Vikram Singh', coordinator: 'Social Sciences Dept',
    budget: 480000, spent: 452000, registrations: 86, capacity: 90,
    description: '3-day educational trip to Jaipur for Class 8 students — Amber Fort, City Palace, Jantar Mantar, Hawa Mahal.',
    highlights: ['Heritage walk', 'Folk art workshop', 'Astronomy session at Jantar Mantar', 'Cultural evening'],
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'EV06', name: 'Investiture Ceremony 2024', type: 'Ceremony', date: '2024-07-15', time: '09:00 AM',
    venue: 'School Auditorium', status: 'Completed', organizer: 'Dr. Ananya Iyer', coordinator: 'Administration',
    budget: 58000, spent: 54600, registrations: 0, capacity: 1842,
    description: 'Badge pinning & oath-taking ceremony for the newly elected Student Council for academic year 2024-25.',
    highlights: ['Head Boy & Head Girl elected', '42 prefects badged', 'Chief Guest: District Magistrate'],
    gradient: 'from-indigo-500 to-blue-600',
  },
]

export interface EventTask {
  id: string
  eventId: string
  task: string
  assignee: string
  deadline: string
  status: 'done' | 'in-progress' | 'pending' | 'blocked'
  priority: 'high' | 'medium' | 'low'
}

export const eventTasks: EventTask[] = [
  { id: 'T01', eventId: 'EV01', task: 'Prepare sports field & tracks', assignee: 'Sanjay Reddy', deadline: '2024-12-13', status: 'in-progress', priority: 'high' },
  { id: 'T02', eventId: 'EV01', task: 'Arrange medals & trophies', assignee: 'Admin Office', deadline: '2024-12-10', status: 'done', priority: 'high' },
  { id: 'T03', eventId: 'EV01', task: 'Send parent invitations', assignee: 'Front Office', deadline: '2024-12-08', status: 'done', priority: 'medium' },
  { id: 'T04', eventId: 'EV01', task: 'Book chief guest & bouquets', assignee: 'Dr. Ananya Iyer', deadline: '2024-12-12', status: 'pending', priority: 'high' },
  { id: 'T05', eventId: 'EV01', task: 'Arrange first-aid & water stations', assignee: 'Infirmary', deadline: '2024-12-14', status: 'pending', priority: 'medium' },
  { id: 'T06', eventId: 'EV02', task: 'Auditorium decoration & lighting', assignee: 'Faisal Ahmed', deadline: '2024-12-19', status: 'pending', priority: 'high' },
  { id: 'T07', eventId: 'EV02', task: 'Sound system setup & rehearsal', assignee: 'AV Team', deadline: '2024-12-18', status: 'pending', priority: 'high' },
  { id: 'T08', eventId: 'EV02', task: 'Costume procurement for performances', assignee: 'Lakshmi Venkat', deadline: '2024-12-15', status: 'in-progress', priority: 'high' },
  { id: 'T09', eventId: 'EV04', task: 'Set up project tables & power', assignee: 'Maintenance', deadline: '2024-12-11', status: 'done', priority: 'medium' },
  { id: 'T10', eventId: 'EV04', task: 'Invite external judges', assignee: 'Pooja Bhatt', deadline: '2024-12-05', status: 'done', priority: 'high' },
]

export const eventStats = {
  totalEvents: 18,
  upcoming: 4,
  ongoing: 2,
  completed: 12,
  totalBudget: 1840000,
  totalSpent: 896800,
  totalParticipants: 4862,
  satisfactionRate: 94,
  monthlyEvents: [
    { month: 'Jul', count: 2 }, { month: 'Aug', count: 1 },
    { month: 'Sep', count: 2 }, { month: 'Oct', count: 3 },
    { month: 'Nov', count: 4 }, { month: 'Dec', count: 6 },
  ],
  byType: [
    { name: 'Cultural', value: 5, color: 'oklch(0.6 0.2 300)' },
    { name: 'Sports', value: 4, color: 'oklch(0.55 0.14 162)' },
    { name: 'Academic', value: 3, color: 'oklch(0.65 0.16 75)' },
    { name: 'Competition', value: 3, color: 'oklch(0.7 0.15 200)' },
    { name: 'Ceremony', value: 2, color: 'oklch(0.6 0.18 250)' },
    { name: 'Trip', value: 1, color: 'oklch(0.62 0.2 25)' },
  ],
}

export interface EventGallery {
  id: string
  eventId: string
  title: string
  photos: number
  date: string
}

export const eventGallery: EventGallery[] = [
  { id: 'G01', eventId: 'EV03', title: 'Quiz Championship — Sapphire Wins!', photos: 42, date: '2024-12-05' },
  { id: 'G02', eventId: 'EV05', title: 'Jaipur Educational Trip', photos: 128, date: '2024-11-20' },
  { id: 'G03', eventId: 'EV06', title: 'Investiture Ceremony 2024', photos: 86, date: '2024-07-15' },
]
