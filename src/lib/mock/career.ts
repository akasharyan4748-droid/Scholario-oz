// Career explorer data — careers, stream guidance, roadmap

export interface CareerPath {
  id: string
  title: string
  field: string
  icon: string
  gradient: string
  description: string
  avgSalary: string
  growthRate: string
  requiredSkills: string[]
  educationPath: string[]
  matchScore: number
  popularity: number
}

export const careerPaths: CareerPath[] = [
  { id: 'CP01', title: 'Software Engineer', field: 'Technology', icon: '💻', gradient: 'from-violet-500 to-purple-600', description: 'Design and build software applications, websites, and mobile apps. Solve problems with code!', avgSalary: '₹8-25 LPA', growthRate: '22% (high)', requiredSkills: ['Problem Solving', 'Mathematics', 'Logic', 'Creativity'], educationPath: ['Science (PCM) in Class 11-12', 'B.Tech Computer Science / BCA', 'Internships & Projects', 'Specialization (AI/Web/Mobile)'], matchScore: 92, popularity: 95 },
  { id: 'CP02', title: 'Doctor (Pediatrician)', field: 'Healthcare', icon: '👨‍⚕️', gradient: 'from-emerald-500 to-teal-600', description: 'Care for children\'s health — from babies to teens. Diagnose and treat illnesses.', avgSalary: '₹10-30 LPA', growthRate: '15% (steady)', requiredSkills: ['Biology', 'Chemistry', 'Empathy', 'Communication'], educationPath: ['Science (PCMB) in Class 11-12', 'MBBS (5.5 years)', 'MD Pediatrics (3 years)', 'Residency & License'], matchScore: 78, popularity: 88 },
  { id: 'CP03', title: 'Architect', field: 'Design', icon: '🏛️', gradient: 'from-amber-500 to-orange-600', description: 'Design buildings, homes, and spaces that people use every day. Blend art and science!', avgSalary: '₹6-20 LPA', growthRate: '8% (steady)', requiredSkills: ['Drawing', 'Mathematics', 'Creativity', 'Spatial Thinking'], educationPath: ['Science (PCM) in Class 11-12', 'B.Arch (5 years)', 'Internship with firm', 'Portfolio & License'], matchScore: 85, popularity: 72 },
  { id: 'CP04', title: 'Data Scientist', field: 'Technology', icon: '📊', gradient: 'from-cyan-500 to-sky-600', description: 'Find patterns in data to help businesses make smart decisions. Like a digital detective!', avgSalary: '₹10-35 LPA', growthRate: '28% (very high)', requiredSkills: ['Mathematics', 'Statistics', 'Logic', 'Curiosity'], educationPath: ['Science (PCM) in Class 11-12', 'B.Sc/B.Tech Stats or CS', 'Masters in Data Science', 'Certifications & Projects'], matchScore: 88, popularity: 90 },
  { id: 'CP05', title: 'Chartered Accountant', field: 'Finance', icon: '🧾', gradient: 'from-rose-500 to-pink-600', description: 'Manage money, taxes, and audits for companies. Help businesses stay financially healthy.', avgSalary: '₹8-25 LPA', growthRate: '12% (steady)', requiredSkills: ['Mathematics', 'Attention to Detail', 'Logic', 'Communication'], educationPath: ['Commerce in Class 11-12', 'CA Foundation → Intermediate → Final', 'Articleship (3 years)', 'ICAI Membership'], matchScore: 72, popularity: 80 },
  { id: 'CP06', title: 'Space Scientist', field: 'Science', icon: '🚀', gradient: 'from-indigo-500 to-blue-600', description: 'Study space, build satellites, and explore the universe. Work at ISRO or NASA!', avgSalary: '₹10-40 LPA', growthRate: '18% (high)', requiredSkills: ['Physics', 'Mathematics', 'Curiosity', 'Persistence'], educationPath: ['Science (PCM) in Class 11-12', 'B.Tech Aerospace / B.Sc Physics', 'Masters / PhD', 'ISRO/NASA entrance exams'], matchScore: 82, popularity: 85 },
  { id: 'CP07', title: 'Product Designer', field: 'Design', icon: '🎨', gradient: 'from-fuchsia-500 to-pink-600', description: 'Design how apps and products look and feel. Make technology beautiful and easy to use.', avgSalary: '₹8-22 LPA', growthRate: '16% (high)', requiredSkills: ['Art', 'Empathy', 'Creativity', 'Technology'], educationPath: ['Any stream in Class 12', 'B.Des / B.A Design', 'Portfolio building', 'UX/UI certifications'], matchScore: 80, popularity: 78 },
  { id: 'CP08', title: 'Environmental Scientist', field: 'Science', icon: '🌱', gradient: 'from-lime-500 to-green-600', description: 'Protect the planet! Study pollution, climate, and find ways to keep Earth healthy.', avgSalary: '₹6-18 LPA', growthRate: '14% (growing)', requiredSkills: ['Biology', 'Chemistry', 'Research', 'Passion for nature'], educationPath: ['Science (PCB) in Class 11-12', 'B.Sc Environmental Science', 'Masters specialization', 'Field research & certifications'], matchScore: 75, popularity: 68 },
]

export interface StreamOption {
  id: string
  name: string
  icon: string
  gradient: string
  subjects: string[]
  careers: string[]
  suitability: number
  description: string
  pros: string[]
  cons: string[]
}

export const streamOptions: StreamOption[] = [
  { id: 'ST01', name: 'Science — PCM (Physics, Chemistry, Maths)', icon: '🔬', gradient: 'from-violet-500 to-purple-600', subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Optional'], careers: ['Engineering', 'Architecture', 'Data Science', 'Pilot', 'Research'], suitability: 88, description: 'Perfect for students who love problem-solving, numbers, and understanding how things work.', pros: ['Wide career options', 'High earning potential', 'Can switch to most fields later'], cons: ['Rigorous study required', 'Math-heavy', 'Competitive entrance exams'] },
  { id: 'ST02', name: 'Science — PCB (Physics, Chemistry, Biology)', icon: '🧬', gradient: 'from-emerald-500 to-teal-600', subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Optional'], careers: ['Doctor', 'Dentist', 'Pharma', 'Biotech', 'Nursing'], suitability: 78, description: 'For students passionate about life, health, and living organisms.', pros: ['Noble profession', 'Job security', 'Make real difference'], cons: ['Long study duration', 'NEET is competitive', 'High pressure'] },
  { id: 'ST03', name: 'Commerce', icon: '📊', gradient: 'from-amber-500 to-orange-600', subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'], careers: ['CA', 'MBA', 'Banking', 'Finance', 'Entrepreneurship'], suitability: 72, description: 'For students interested in business, money, and how companies work.', pros: ['Practical knowledge', 'Entrepreneurship path', 'Flexible career options'], cons: ['Less science options', 'Numbers-focused', 'Need additional certifications'] },
  { id: 'ST04', name: 'Humanities / Arts', icon: '📖', gradient: 'from-rose-500 to-pink-600', subjects: ['History', 'Political Science', 'Psychology', 'Sociology', 'English'], careers: ['Law', 'Journalism', 'Civil Services', 'Teaching', 'Design'], suitability: 70, description: 'For students curious about society, culture, and human behavior.', pros: ['Creative freedom', 'Civil services path', 'Diverse careers'], cons: ['Perceived less lucrative', 'Needs self-direction', 'Broad scope'] },
]

export interface CareerMilestone {
  id: string
  grade: string
  age: string
  milestone: string
  action: string
  status: 'completed' | 'current' | 'upcoming'
}

export const careerRoadmap: CareerMilestone[] = [
  { id: 'CM01', grade: 'Class 6-8', age: '11-13 yrs', milestone: 'Explore Interests', action: 'Try different subjects, clubs, and activities. Notice what you enjoy!', status: 'completed' },
  { id: 'CM02', grade: 'Class 9-10', age: '14-15 yrs', milestone: 'Discover Strengths', action: 'Identify your strong subjects. Take aptitude tests. Talk to counsellors.', status: 'completed' },
  { id: 'CM03', grade: 'Class 10 (Now)', age: '15-16 yrs', milestone: 'Stream Selection', action: 'Choose Science/Commerce/Arts based on interests + aptitude + career goals.', status: 'current' },
  { id: 'CM04', grade: 'Class 11-12', age: '16-18 yrs', milestone: 'Deep Dive', action: 'Master your chosen stream. Prepare for entrance exams. Build a portfolio.', status: 'upcoming' },
  { id: 'CM05', grade: 'After Class 12', age: '18+ yrs', milestone: 'College & Beyond', action: 'Apply to colleges/universities. Pursue degree + internships. Specialize!', status: 'upcoming' },
]

export const careerStats = {
  careersExplored: 12,
  savedCareers: 3,
  aptitudeScore: 88,
  streamRecommendation: 'Science — PCM',
  confidenceLevel: 72,
  counselorSessions: 2,
  nextSession: 'Dec 10, 2024',
  interestAreas: [
    { name: 'Technology', value: 92, color: 'oklch(0.6 0.18 300)' },
    { name: 'Mathematics', value: 91, color: 'oklch(0.55 0.14 162)' },
    { name: 'Design', value: 85, color: 'oklch(0.65 0.16 75)' },
    { name: 'Science', value: 82, color: 'oklch(0.7 0.15 200)' },
    { name: 'Finance', value: 72, color: 'oklch(0.62 0.2 25)' },
  ],
}
