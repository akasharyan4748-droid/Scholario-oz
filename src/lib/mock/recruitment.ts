// Recruitment & HR data — job postings, candidates, interviews

export interface JobPosting {
  id: string
  title: string
  department: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  experience: string
  vacancies: number
  postedDate: string
  closingDate: string
  applicants: number
  shortlisted: number
  status: 'Open' | 'Closed' | 'On Hold'
  salary: string
  description: string
  gradient: string
}

export const jobPostings: JobPosting[] = [
  { id: 'JP01', title: 'Mathematics Teacher — Primary', department: 'Mathematics', type: 'Full-time', experience: '3-5 years', vacancies: 2, postedDate: '2024-11-20', closingDate: '2024-12-15', applicants: 48, shortlisted: 8, status: 'Open', salary: '₹45,000 – ₹60,000/month', description: 'Looking for an experienced Maths teacher for Classes 1-5. B.Ed + M.Sc Maths required.', gradient: 'from-violet-500 to-purple-600' },
  { id: 'JP02', title: 'English Teacher — Middle School', department: 'Languages', type: 'Full-time', experience: '5+ years', vacancies: 1, postedDate: '2024-11-15', closingDate: '2024-12-10', applicants: 62, shortlisted: 12, status: 'Open', salary: '₹50,000 – ₹70,000/month', description: 'Passionate English teacher for Classes 6-8. M.A. English + B.Ed. with ICSE/CBSE experience.', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'JP03', title: 'Sports Coach — Athletics', department: 'Arts & Sports', type: 'Full-time', experience: '3+ years', vacancies: 1, postedDate: '2024-11-25', closingDate: '2024-12-20', applicants: 24, shortlisted: 5, status: 'Open', salary: '₹40,000 – ₹55,000/month', description: 'Athletics coach for inter-school competitions. M.P.Ed. with state-level coaching experience.', gradient: 'from-amber-500 to-orange-600' },
  { id: 'JP04', title: 'Lab Assistant — Science', department: 'Science', type: 'Full-time', experience: '1-3 years', vacancies: 2, postedDate: '2024-11-10', closingDate: '2024-12-05', applicants: 38, shortlisted: 6, status: 'Open', salary: '₹28,000 – ₹35,000/month', description: 'Science lab assistant for Physics, Chemistry & Biology labs. B.Sc. + lab experience.', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'JP05', title: 'Counsellor — Student Wellness', department: 'Administration', type: 'Full-time', experience: '5+ years', vacancies: 1, postedDate: '2024-10-28', closingDate: '2024-11-25', applicants: 32, shortlisted: 4, status: 'Closed', salary: '₹55,000 – ₹75,000/month', description: 'Student counsellor for emotional & academic guidance. M.A. Psychology + 5 yrs experience.', gradient: 'from-rose-500 to-pink-600' },
  { id: 'JP06', title: 'Computer Science Teacher — Senior', department: 'Computer Science', type: 'Full-time', experience: '5+ years', vacancies: 1, postedDate: '2024-11-22', closingDate: '2024-12-18', applicants: 28, shortlisted: 6, status: 'On Hold', salary: '₹60,000 – ₹80,000/month', description: 'CS teacher for Classes 11-12 (Python, Java, Data Structures). M.Tech CSE + B.Ed.', gradient: 'from-indigo-500 to-blue-600' },
]

export interface Candidate {
  id: string
  name: string
  avatar: string
  appliedFor: string
  jobId: string
  experience: number
  qualification: string
  email: string
  phone: string
  appliedDate: string
  status: 'New' | 'Screening' | 'Interview' | 'Offered' | 'Rejected' | 'Hired'
  rating: number
  currentCompany?: string
  expectedSalary: string
  noticePeriod: string
  resumeScore: number
}

export const candidates: Candidate[] = [
  { id: 'CA01', name: 'Neha Agarwal', avatar: 'NA', appliedFor: 'Mathematics Teacher — Primary', jobId: 'JP01', experience: 4, qualification: 'M.Sc. Maths, B.Ed.', email: 'neha.a@gmail.com', phone: '+91 98100 11111', appliedDate: '2024-11-22', status: 'Interview', rating: 4.5, currentCompany: 'Delhi Public School', expectedSalary: '₹55,000/mo', noticePeriod: '30 days', resumeScore: 88 },
  { id: 'CA02', name: 'Rahul Saxena', avatar: 'RS', appliedFor: 'Mathematics Teacher — Primary', jobId: 'JP01', experience: 6, qualification: 'M.Sc. Maths, B.Ed., NET', email: 'rahul.s@gmail.com', phone: '+91 98200 22222', appliedDate: '2024-11-21', status: 'Interview', rating: 4.7, currentCompany: 'Ryan International', expectedSalary: '₹62,000/mo', noticePeriod: '15 days', resumeScore: 92 },
  { id: 'CA03', name: 'Priya Menon', avatar: 'PM', appliedFor: 'English Teacher — Middle School', jobId: 'JP02', experience: 7, qualification: 'M.A. English, B.Ed., TESOL', email: 'priya.m@gmail.com', phone: '+91 98300 33333', appliedDate: '2024-11-18', status: 'Offered', rating: 4.9, currentCompany: 'The British School', expectedSalary: '₹68,000/mo', noticePeriod: '45 days', resumeScore: 95 },
  { id: 'CA04', name: 'Karan Desai', avatar: 'KD', appliedFor: 'Sports Coach — Athletics', jobId: 'JP03', experience: 5, qualification: 'M.P.Ed., Athletics Level-2 Cert', email: 'karan.d@gmail.com', phone: '+91 98400 44444', appliedDate: '2024-11-26', status: 'Screening', rating: 4.2, currentCompany: 'Sports Authority of India', expectedSalary: '₹48,000/mo', noticePeriod: 'Immediate', resumeScore: 78 },
  { id: 'CA05', name: 'Sneha Iyer', avatar: 'SI', appliedFor: 'Lab Assistant — Science', jobId: 'JP04', experience: 2, qualification: 'B.Sc. Physics, Dip. Lab Tech', email: 'sneha.i@gmail.com', phone: '+91 98500 55555', appliedDate: '2024-11-12', status: 'Interview', rating: 4.3, currentCompany: 'Freshers', expectedSalary: '₹30,000/mo', noticePeriod: 'Immediate', resumeScore: 72 },
  { id: 'CA06', name: 'Arjun Pillai', avatar: 'AP', appliedFor: 'Lab Assistant — Science', jobId: 'JP04', experience: 3, qualification: 'B.Sc. Chemistry, 3 yrs exp', email: 'arjun.p@gmail.com', phone: '+91 98600 66666', appliedDate: '2024-11-14', status: 'New', rating: 0, expectedSalary: '₹32,000/mo', noticePeriod: '20 days', resumeScore: 68 },
  { id: 'CA07', name: 'Meera Kulkarni', avatar: 'MK', appliedFor: 'English Teacher — Middle School', jobId: 'JP02', experience: 6, qualification: 'M.A. English, B.Ed.', email: 'meera.k@gmail.com', phone: '+91 98700 77777', appliedDate: '2024-11-16', status: 'Rejected', rating: 2.8, currentCompany: 'Amity International', expectedSalary: '₹58,000/mo', noticePeriod: '30 days', resumeScore: 55 },
  { id: 'CA08', name: 'Vikas Rao', avatar: 'VR', appliedFor: 'Mathematics Teacher — Primary', jobId: 'JP01', experience: 3, qualification: 'M.Sc. Maths, B.Ed.', email: 'vikas.r@gmail.com', phone: '+91 98800 88888', appliedDate: '2024-11-24', status: 'Screening', rating: 0, currentCompany: 'Freshers', expectedSalary: '₹45,000/mo', noticePeriod: 'Immediate', resumeScore: 74 },
]

export interface Interview {
  id: string
  candidate: string
  avatar: string
  position: string
  date: string
  time: string
  panel: string[]
  round: string
  mode: 'In-person' | 'Video'
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  feedback?: string
  rating?: number
}

export const interviews: Interview[] = [
  { id: 'IV01', candidate: 'Neha Agarwal', avatar: 'NA', position: 'Maths Teacher — Primary', date: '2024-12-03', time: '10:00 AM', panel: ['Dr. Ananya Iyer', 'Rajesh Khanna', 'HR'], round: 'Technical + Demo', mode: 'In-person', status: 'Scheduled' },
  { id: 'IV02', candidate: 'Rahul Saxena', avatar: 'RS', position: 'Maths Teacher — Primary', date: '2024-12-03', time: '11:30 AM', panel: ['Dr. Ananya Iyer', 'Rajesh Khanna'], round: 'Technical + Demo', mode: 'In-person', status: 'Scheduled' },
  { id: 'IV03', candidate: 'Priya Menon', avatar: 'PM', position: 'English Teacher — Middle', date: '2024-11-29', time: '02:00 PM', panel: ['Dr. Ananya Iyer', 'Deepa Menon', 'HR'], round: 'Final + HR', mode: 'Video', status: 'Completed', feedback: 'Excellent communication & pedagogy. Recommended for offer.', rating: 4.9 },
  { id: 'IV04', candidate: 'Sneha Iyer', avatar: 'SI', position: 'Lab Assistant — Science', date: '2024-12-04', time: '09:30 AM', panel: ['Pooja Bhatt', 'HR'], round: 'Technical', mode: 'In-person', status: 'Scheduled' },
  { id: 'IV05', candidate: 'Meera Kulkarni', avatar: 'MK', position: 'English Teacher — Middle', date: '2024-11-28', time: '03:00 PM', panel: ['Deepa Menon', 'HR'], round: 'Screening', mode: 'Video', status: 'Completed', feedback: 'Needs more experience with CBSE curriculum. Not recommended.', rating: 2.8 },
]

export const recruitmentStats = {
  openPositions: 8,
  totalApplicants: 232,
  shortlisted: 41,
  interviewsThisWeek: 6,
  offersExtended: 1,
  hiredThisMonth: 2,
  avgTimeToHire: '18 days',
  offerAcceptance: 92,
  monthlyApplicants: [
    { month: 'Jul', count: 42 }, { month: 'Aug', count: 56 },
    { month: 'Sep', count: 38 }, { month: 'Oct', count: 64 },
    { month: 'Nov', count: 48 }, { month: 'Dec', count: 28 },
  ],
  pipelineStages: [
    { name: "New", value: 124, color: 'oklch(0.7 0.15 200)' },
    { name: "Screening", value: 56, color: 'oklch(0.65 0.16 75)' },
    { name: "Interview", value: 32, color: 'oklch(0.55 0.14 162)' },
    { name: "Offered", value: 8, color: 'oklch(0.6 0.18 300)' },
    { name: "Hired", value: 12, color: 'oklch(0.6 0.14 155)' },
  ],
}

export const hrStats = {
  totalEmployees: 124,
  activeEmployees: 120,
  onLeave: 4,
  newHiresThisMonth: 3,
  attritionRate: 4.2,
  avgTenure: '4.8 years',
  trainingsCompleted: 86,
  upcomingReviews: 42,
  satisfactionScore: 4.3,
}
