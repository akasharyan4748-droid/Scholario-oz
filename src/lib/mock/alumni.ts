// Alumni & Donations data

export interface Alumni {
  id: string
  name: string
  avatar: string
  batch: string
  passingYear: number
  course: string
  currentRole: string
  company: string
  location: string
  email: string
  phone: string
  linkedin: string
  totalDonation: number
  lastDonation?: number
  lastDonationDate?: string
  status: 'Active' | 'Inactive' | 'Lifetime Member'
  achievements: string[]
}

export const alumni: Alumni[] = [
  { id: 'AL01', name: 'Aditya Kapoor', avatar: 'AK', batch: '2008', passingYear: 2008, course: 'Science (PCMB)', currentRole: 'Senior Software Engineer', company: 'Google', location: 'Bangalore, India', email: 'aditya.k@gmail.com', phone: '+91 98100 11111', linkedin: 'in/adityakapoor', totalDonation: 285000, lastDonation: 50000, lastDonationDate: '2024-09-15', status: 'Lifetime Member', achievements: ['Tech Innovator Award 2023', 'Patent holder — 2 patents'] },
  { id: 'AL02', name: 'Priya Sharma', avatar: 'PS', batch: '2010', passingYear: 2010, course: 'Commerce', currentRole: 'Investment Banker', company: 'Goldman Sachs', location: 'Mumbai, India', email: 'priya.s@gmail.com', phone: '+91 98200 22222', linkedin: 'in/priyasharma', totalDonation: 184000, lastDonation: 35000, lastDonationDate: '2024-10-20', status: 'Active', achievements: ['Forbes 30 Under 30', 'CFA Charterholder'] },
  { id: 'AL03', name: 'Rahul Verma', avatar: 'RV', batch: '2005', passingYear: 2005, course: 'Science (PCM)', currentRole: 'Cardiac Surgeon', company: 'AIIMS Delhi', location: 'New Delhi, India', email: 'rahul.v@gmail.com', phone: '+91 98300 33333', linkedin: 'in/rahulverma', totalDonation: 420000, lastDonation: 100000, lastDonationDate: '2024-08-10', status: 'Lifetime Member', achievements: ['Padma Shri nominee', '500+ surgeries'] },
  { id: 'AL04', name: 'Sneha Reddy', avatar: 'SR', batch: '2012', passingYear: 2012, course: 'Science (PCMB)', currentRole: 'Research Scientist', company: 'ISRO', location: 'Bangalore, India', email: 'sneha.r@gmail.com', phone: '+91 98400 44444', linkedin: 'in/snehareddy', totalDonation: 96000, lastDonation: 25000, lastDonationDate: '2024-11-05', status: 'Active', achievements: ['Chandrayaan-3 mission team', 'Ph.D. IIT Madras'] },
  { id: 'AL05', name: 'Karan Mehta', avatar: 'KM', batch: '2015', passingYear: 2015, course: 'Commerce', currentRole: 'Startup Founder & CEO', company: 'FinEdge', location: 'Gurugram, India', email: 'karan.m@gmail.com', phone: '+91 98500 55555', linkedin: 'in/karanmehta', totalDonation: 64000, lastDonation: 20000, lastDonationDate: '2024-10-30', status: 'Active', achievements: ['Series A funding $12M', 'Forbes 30 Under 30'] },
  { id: 'AL06', name: 'Ananya Iyer', avatar: 'AI', batch: '2003', passingYear: 2003, course: 'Science (PCM)', currentRole: 'Principal (Current)', company: 'Demo School of Scholario', location: 'Gurugram, India', email: 'ananya.iyer@demoschool.edu', phone: '+91 98100 11223', linkedin: 'in/ananyaiyer', totalDonation: 150000, lastDonation: 50000, lastDonationDate: '2024-07-01', status: 'Lifetime Member', achievements: ['Ph.D. Physics', 'Best Principal Award 2023'] },
  { id: 'AL07', name: 'Vikram Singh', avatar: 'VS', batch: '2011', passingYear: 2011, course: 'Science (PCMB)', currentRole: 'IAS Officer', company: 'Government of India', location: 'Jaipur, India', email: 'vikram.s@ias.in', phone: '+91 98600 66666', linkedin: 'in/vikramsingh', totalDonation: 120000, lastDonation: 40000, lastDonationDate: '2024-09-20', status: 'Active', achievements: ['AIR 12 UPSC CSE 2014', 'Young Achiever Award'] },
  { id: 'AL08', name: 'Meera Nair', avatar: 'MN', batch: '2009', passingYear: 2009, course: 'Commerce', currentRole: 'Chartered Accountant', company: 'Deloitte India', location: 'Chennai, India', email: 'meera.n@gmail.com', phone: '+91 98700 77777', linkedin: 'in/meeranair', totalDonation: 78000, lastDonation: 18000, lastDonationDate: '2024-11-12', status: 'Active', achievements: ['CA All India Rank 4', 'Partner at 32'] },
  { id: 'AL09', name: 'Arjun Gupta', avatar: 'AG', batch: '2014', passingYear: 2014, course: 'Science (PCM)', currentRole: 'Architect', company: 'Studio Lotus', location: 'New Delhi, India', email: 'arjun.g@gmail.com', phone: '+91 98800 88888', linkedin: 'in/arjungupta', totalDonation: 45000, lastDonation: 15000, lastDonationDate: '2024-06-15', status: 'Active', achievements: ['Aga Khan Award nominee', 'Published architect'] },
  { id: 'AL10', name: 'Divya Patel', avatar: 'DP', batch: '2016', passingYear: 2016, course: 'Commerce', currentRole: 'Marketing Manager', company: 'Unilever', location: 'Mumbai, India', email: 'divya.p@gmail.com', phone: '+91 98900 99999', linkedin: 'in/divyapatel', totalDonation: 32000, lastDonation: 12000, lastDonationDate: '2024-10-05', status: 'Active', achievements: ['IIM Ahmedabad MBA', 'Cannes Lion winner'] },
]

export interface Donation {
  id: string
  donor: string
  avatar: string
  batch: string
  amount: number
  purpose: string
  date: string
  method: 'UPI' | 'Bank Transfer' | 'Cheque' | 'Cash'
  status: 'Received' | 'Pledged' | 'Processing'
  receiptNo: string
}

export const donations: Donation[] = [
  { id: 'D01', donor: 'Rahul Verma', avatar: 'RV', batch: '2005', amount: 100000, purpose: 'Scholarship Fund', date: '2024-08-10', method: 'Bank Transfer', status: 'Received', receiptNo: 'DON-2024-089' },
  { id: 'D02', donor: 'Aditya Kapoor', avatar: 'AK', batch: '2008', amount: 50000, purpose: 'Smart Classroom', date: '2024-09-15', method: 'UPI', status: 'Received', receiptNo: 'DON-2024-092' },
  { id: 'D03', donor: 'Priya Sharma', avatar: 'PS', batch: '2010', amount: 35000, purpose: 'Sports Infrastructure', date: '2024-10-20', method: 'Bank Transfer', status: 'Received', receiptNo: 'DON-2024-103' },
  { id: 'D04', donor: 'Karan Mehta', avatar: 'KM', batch: '2015', amount: 20000, purpose: 'Annual Day', date: '2024-10-30', method: 'UPI', status: 'Received', receiptNo: 'DON-2024-108' },
  { id: 'D05', donor: 'Sneha Reddy', avatar: 'SR', batch: '2012', amount: 25000, purpose: 'Science Lab', date: '2024-11-05', method: 'Bank Transfer', status: 'Received', receiptNo: 'DON-2024-112' },
  { id: 'D06', donor: 'Meera Nair', avatar: 'MN', batch: '2009', amount: 18000, purpose: 'Library Books', date: '2024-11-12', method: 'Cheque', status: 'Processing', receiptNo: 'DON-2024-115' },
  { id: 'D07', donor: 'Vikram Singh', avatar: 'VS', batch: '2011', amount: 40000, purpose: 'Scholarship Fund', date: '2024-09-20', method: 'Bank Transfer', status: 'Received', receiptNo: 'DON-2024-095' },
  { id: 'D08', donor: 'Arjun Gupta', avatar: 'AG', batch: '2014', amount: 15000, purpose: 'Art Room', date: '2024-06-15', method: 'UPI', status: 'Received', receiptNo: 'DON-2024-062' },
]

export interface Reunion {
  id: string
  batch: string
  title: string
  date: string
  venue: string
  attendees: number
  confirmed: number
  status: 'Scheduled' | 'Planning' | 'Completed'
  organizer: string
}

export const reunions: Reunion[] = [
  { id: 'RU01', batch: '2004', title: '20-Year Reunion — Batch 2004', date: '2024-12-28', venue: 'School Campus · Lawns', attendees: 48, confirmed: 36, status: 'Scheduled', organizer: 'Rahul Verma' },
  { id: 'RU02', batch: '2014', title: '10-Year Reunion — Batch 2014', date: '2025-01-11', venue: 'Taj Hotel, Gurugram', attendees: 62, confirmed: 41, status: 'Planning', organizer: 'Arjun Gupta' },
  { id: 'RU03', batch: '2009', title: '15-Year Reunion — Batch 2009', date: '2024-12-15', venue: 'School Campus · Auditorium', attendees: 54, confirmed: 48, status: 'Scheduled', organizer: 'Meera Nair' },
  { id: 'RU04', batch: '1999', title: '25-Year Silver Jubilee', date: '2024-11-30', venue: 'School Campus · Lawns', attendees: 38, confirmed: 38, status: 'Completed', organizer: 'Suresh Pillai' },
]

export const alumniStats = {
  totalAlumni: 4286,
  activeMembers: 2840,
  lifetimeMembers: 184,
  totalDonations: 18420000,
  donationsThisYear: 2840000,
  donationsLastYear: 2120000,
  avgDonation: 42000,
  scholarshipBeneficiaries: 86,
  reunionsThisYear: 8,
  byDecade: [
    { decade: '1990s', count: 420 },
    { decade: '2000s', count: 1240 },
    { decade: '2010s', count: 1820 },
    { decade: '2020s', count: 806 },
  ],
  monthlyDonations: [
    { month: 'Jan', amount: 180000 }, { month: 'Feb', amount: 240000 },
    { month: 'Mar', amount: 320000 }, { month: 'Apr', amount: 280000 },
    { month: 'May', amount: 160000 }, { month: 'Jun', amount: 220000 },
    { month: 'Jul', amount: 380000 }, { month: 'Aug', amount: 420000 },
    { month: 'Sep', amount: 340000 }, { month: 'Oct', amount: 460000 },
    { month: 'Nov', amount: 380000 }, { month: 'Dec', amount: 520000 },
  ],
  donationPurpose: [
    { name: 'Scholarship Fund', value: 6800000, color: 'oklch(0.55 0.14 162)' },
    { name: 'Infrastructure', value: 5200000, color: 'oklch(0.65 0.16 75)' },
    { name: 'Sports', value: 2400000, color: 'oklch(0.6 0.18 300)' },
    { name: 'Library', value: 1800000, color: 'oklch(0.7 0.15 200)' },
    { name: 'Events', value: 2220000, color: 'oklch(0.62 0.2 25)' },
  ],
}
