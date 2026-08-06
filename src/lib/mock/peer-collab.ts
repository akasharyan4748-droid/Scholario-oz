// Peer collaboration data — study groups, Q&A, resource sharing

export interface StudyGroup {
  id: string
  name: string
  subject: string
  members: number
  leader: string
  description: string
  gradient: string
  lastActive: string
  unreadMessages: number
  nextSession?: string
}

export const studyGroups: StudyGroup[] = [
  { id: 'SG01', name: 'Math Masters', subject: 'Mathematics', members: 6, leader: 'Myra Iyer', description: 'We solve challenging math problems together and help each other with homework.', gradient: 'from-violet-500 to-purple-600', lastActive: '10 min ago', unreadMessages: 3, nextSession: 'Today 4:00 PM' },
  { id: 'SG02', name: 'Science Explorers', subject: 'Science', members: 5, leader: 'Anika Desai', description: 'Fun experiments and project ideas. We share interesting science facts!', gradient: 'from-emerald-500 to-teal-600', lastActive: '1 hr ago', unreadMessages: 0, nextSession: 'Tomorrow 4:30 PM' },
  { id: 'SG03', name: 'Reading Rangers', subject: 'English', members: 4, leader: 'Diya Patel', description: 'Book club — we read and discuss a new book every week.', gradient: 'from-amber-500 to-orange-600', lastActive: '3 hrs ago', unreadMessages: 1, nextSession: 'Friday 3:30 PM' },
  { id: 'SG04', name: 'Code Kids', subject: 'Computer Science', members: 3, leader: 'Aarav Sharma', description: 'Learning MS Paint and basic computer fun. Sharing cool tips!', gradient: 'from-cyan-500 to-sky-600', lastActive: 'Yesterday', unreadMessages: 0 },
]

export interface QAItem {
  id: string
  question: string
  askedBy: string
  avatar: string
  subject: string
  askedOn: string
  answers: number
  upvotes: number
  hasAcceptedAnswer: boolean
  tags: string[]
}

export const qaItems: QAItem[] = [
  { id: 'QA01', question: 'How do I know when to "carry" in addition?', askedBy: 'Vivaan Reddy', avatar: 'VR', subject: 'Mathematics', askedOn: '2 hrs ago', answers: 3, upvotes: 8, hasAcceptedAnswer: true, tags: ['addition', 'carrying', 'class-2'] },
  { id: 'QA02', question: 'What is the difference between living and non-living things?', askedBy: 'Kabir Khanna', avatar: 'KK', subject: 'Science', askedOn: '5 hrs ago', answers: 2, upvotes: 5, hasAcceptedAnswer: false, tags: ['science', 'living-things'] },
  { id: 'QA03', question: 'Can someone explain subtraction with borrowing?', askedBy: 'Reyansh Kumar', avatar: 'RK', subject: 'Mathematics', askedOn: 'Yesterday', answers: 4, upvotes: 12, hasAcceptedAnswer: true, tags: ['subtraction', 'borrowing'] },
  { id: 'QA04', question: 'What rhymes with "cat" for my poem?', askedBy: 'Sai Pillai', avatar: 'SP', subject: 'English', askedOn: 'Yesterday', answers: 5, upvotes: 6, hasAcceptedAnswer: false, tags: ['rhyming', 'poetry'] },
  { id: 'QA05', question: 'How to draw a straight line in MS Paint?', askedBy: 'Arjun Mehta', avatar: 'AM', subject: 'Computer Science', askedOn: '2 days ago', answers: 2, upvotes: 4, hasAcceptedAnswer: true, tags: ['ms-paint', 'drawing'] },
]

export interface SharedResource {
  id: string
  title: string
  sharedBy: string
  avatar: string
  type: 'Notes' | 'Worksheet' | 'Drawing' | 'Photo' | 'Link'
  subject: string
  sharedOn: string
  downloads: number
  likes: number
  description: string
}

export const sharedResources: SharedResource[] = [
  { id: 'SR01', title: 'Addition Tricks — My Notes', sharedBy: 'Myra Iyer', avatar: 'MI', type: 'Notes', subject: 'Mathematics', sharedOn: '2024-11-28', downloads: 12, likes: 8, description: 'Easy tricks I made for double-digit addition. Hope it helps!' },
  { id: 'SR02', title: 'Living Things Chart — My Drawing', sharedBy: 'Anika Desai', avatar: 'AD', type: 'Drawing', subject: 'Science', sharedOn: '2024-11-27', downloads: 8, likes: 14, description: 'I drew examples of living things for our project!' },
  { id: 'SR03', title: 'Hindi Varnamala Practice Sheet', sharedBy: 'Diya Patel', avatar: 'DP', type: 'Worksheet', subject: 'Hindi', sharedOn: '2024-11-26', downloads: 16, likes: 10, description: 'Extra practice sheet my mom made. Sharing with everyone!' },
  { id: 'SR04', title: 'Fun Science Video Link', sharedBy: 'Aarav Sharma', avatar: 'AS', type: 'Link', subject: 'Science', sharedOn: '2024-11-25', downloads: 0, likes: 6, description: 'Cool video about how plants grow. Watch it!' },
  { id: 'SR05', title: 'My Family Drawing', sharedBy: 'Kiara Rao', avatar: 'KR', type: 'Drawing', subject: 'Art & Craft', sharedOn: '2024-11-24', downloads: 5, likes: 12, description: 'My art homework — drew my family and our dog!' },
]

export const collaborationStats = {
  totalGroups: 4,
  myGroups: 4,
  totalMembers: 18,
  questionsAsked: 24,
  questionsAnswered: 42,
  resourcesShared: 38,
  totalDownloads: 186,
  helpfulnessScore: 92,
  streak: 12,
  weeklyActivity: [
    { day: 'Mon', posts: 8 }, { day: 'Tue', posts: 14 },
    { day: 'Wed', posts: 6 }, { day: 'Thu', posts: 12 },
    { day: 'Fri', posts: 18 }, { day: 'Sat', posts: 4 },
    { day: 'Sun', posts: 2 },
  ],
  activityByType: [
    { name: 'Q&A', value: 42, color: 'oklch(0.55 0.14 162)' },
    { name: 'Shares', value: 38, color: 'oklch(0.65 0.16 75)' },
    { name: 'Group Chat', value: 68, color: 'oklch(0.6 0.18 300)' },
    { name: 'Help Given', value: 28, color: 'oklch(0.7 0.15 200)' },
  ],
}
