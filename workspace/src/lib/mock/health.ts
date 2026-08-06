// Health & Wellness data — medical records, vaccinations, infirmary visits

export interface StudentHealth {
  id: string
  studentName: string
  avatar: string
  admissionNo: string
  className: string
  bloodGroup: string
  height: string
  weight: string
  bmi: number
  bmiStatus: 'normal' | 'underweight' | 'overweight'
  vision: string
  dental: string
  hearing: string
  allergies: string[]
  chronicConditions: string[]
  emergencyContact: string
  emergencyPhone: string
  lastCheckup: string
  status: 'Healthy' | 'Monitoring' | 'Follow-up Required'
}

export const studentHealthRecords: StudentHealth[] = [
  { id: 'H01', studentName: 'Aarav Sharma', avatar: 'AS', admissionNo: 'GWS2024018', className: 'Class 2-A', bloodGroup: 'O+', height: '122 cm', weight: '24 kg', bmi: 16.1, bmiStatus: 'normal', vision: '20/20', dental: 'Good', hearing: 'Normal', allergies: [], chronicConditions: [], emergencyContact: 'Vikram Sharma', emergencyPhone: '+91 99800 89017', lastCheckup: '2024-09-15', status: 'Healthy' },
  { id: 'H02', studentName: 'Diya Patel', avatar: 'DP', admissionNo: 'GWS2024002', className: 'Class 2-A', bloodGroup: 'A+', height: '120 cm', weight: '22 kg', bmi: 15.3, bmiStatus: 'normal', vision: '20/20', dental: 'Good', hearing: 'Normal', allergies: ['Lactose intolerance'], chronicConditions: [], emergencyContact: 'Nikhil Patel', emergencyPhone: '+91 98201 23456', lastCheckup: '2024-09-15', status: 'Healthy' },
  { id: 'H03', studentName: 'Vivaan Reddy', avatar: 'VR', admissionNo: 'GWS2024003', className: 'Class 2-A', bloodGroup: 'B+', height: '124 cm', weight: '26 kg', bmi: 16.9, bmiStatus: 'normal', vision: '20/30', dental: 'Cavity — filling done', hearing: 'Normal', allergies: [], chronicConditions: ['Asthma'], emergencyContact: 'Karthik Reddy', emergencyPhone: '+91 98300 34567', lastCheckup: '2024-09-16', status: 'Monitoring' },
  { id: 'H04', studentName: 'Reyansh Kumar', avatar: 'RK', admissionNo: 'GWS2024005', className: 'Class 2-A', bloodGroup: 'A+', height: '118 cm', weight: '21 kg', bmi: 15.1, bmiStatus: 'normal', vision: '20/20', dental: 'Good', hearing: 'Normal', allergies: ['Peanuts'], chronicConditions: [], emergencyContact: 'Sandeep Kumar', emergencyPhone: '+91 98500 56789', lastCheckup: '2024-09-16', status: 'Healthy' },
  { id: 'H05', studentName: 'Kabir Khanna', avatar: 'KK', admissionNo: 'GWS2024011', className: 'Class 2-A', bloodGroup: 'O+', height: '125 cm', weight: '28 kg', bmi: 17.9, bmiStatus: 'overweight', vision: '20/25', dental: 'Good', hearing: 'Normal', allergies: ['Eggs'], chronicConditions: [], emergencyContact: 'Harish Khanna', emergencyPhone: '+91 99100 12340', lastCheckup: '2024-09-17', status: 'Follow-up Required' },
  { id: 'H06', studentName: 'Ananya Singh', avatar: 'AN', admissionNo: 'GWS2024004', className: 'Class 2-A', bloodGroup: 'O-', height: '119 cm', weight: '21 kg', bmi: 14.8, bmiStatus: 'underweight', vision: '20/20', dental: 'Good', hearing: 'Normal', allergies: [], chronicConditions: [], emergencyContact: 'Arvind Singh', emergencyPhone: '+91 98400 45678', lastCheckup: '2024-09-15', status: 'Monitoring' },
  { id: 'H07', studentName: 'Myra Iyer', avatar: 'MI', admissionNo: 'GWS2024010', className: 'Class 2-A', bloodGroup: 'AB-', height: '121 cm', weight: '23 kg', bmi: 15.7, bmiStatus: 'normal', vision: '20/20', dental: 'Good', hearing: 'Normal', allergies: [], chronicConditions: [], emergencyContact: 'Sriram Iyer', emergencyPhone: '+91 99000 01234', lastCheckup: '2024-09-15', status: 'Healthy' },
  { id: 'H08', studentName: 'Sai Pillai', avatar: 'SP', admissionNo: 'GWS2024017', className: 'Class 2-A', bloodGroup: 'A+', height: '117 cm', weight: '20 kg', bmi: 14.6, bmiStatus: 'underweight', vision: '20/40', dental: 'Needs cleaning', hearing: 'Normal', allergies: [], chronicConditions: [], emergencyContact: 'Mohan Pillai', emergencyPhone: '+91 99700 78906', lastCheckup: '2024-09-17', status: 'Follow-up Required' },
]

export interface VaccinationRecord {
  id: string
  vaccine: string
  targetClasses: string
  scheduledDate: string
  administeredDate?: string
  totalStudents: number
  vaccinated: number
  status: 'Scheduled' | 'Ongoing' | 'Completed'
  location: string
}

export const vaccinations: VaccinationRecord[] = [
  { id: 'V01', vaccine: 'Flu Vaccine (Influenza)', targetClasses: 'Class 1–5', scheduledDate: '2024-12-04', administeredDate: '2024-12-04', totalStudents: 684, vaccinated: 642, status: 'Completed', location: 'Infirmary · Room 101' },
  { id: 'V02', vaccine: 'MMR Booster (Measles, Mumps, Rubella)', targetClasses: 'Class 5 & 6', scheduledDate: '2024-12-11', totalStudents: 248, vaccinated: 0, status: 'Scheduled', location: 'Infirmary · Room 101' },
  { id: 'V03', vaccine: 'TDap (Tetanus, Diphtheria, Pertussis)', targetClasses: 'Class 9 & 10', scheduledDate: '2024-12-18', totalStudents: 248, vaccinated: 0, status: 'Scheduled', location: 'Infirmary · Room 101' },
  { id: 'V04', vaccine: 'HPV Vaccine (Cervical Cancer)', targetClasses: 'Class 7 & 8 (Girls)', scheduledDate: '2024-11-20', administeredDate: '2024-11-20', totalStudents: 86, vaccinated: 78, status: 'Completed', location: 'Infirmary · Room 101' },
  { id: 'V05', vaccine: 'Hepatitis B Booster', targetClasses: 'Class 3 & 4', scheduledDate: '2024-11-28', administeredDate: '2024-11-28', totalStudents: 212, vaccinated: 198, status: 'Completed', location: 'Infirmary · Room 101' },
]

export interface InfirmaryVisit {
  id: string
  studentName: string
  avatar: string
  className: string
  complaint: string
  diagnosis: string
  treatment: string
  visitTime: string
  visitDate: string
  severity: 'minor' | 'moderate' | 'urgent'
  discharged: boolean
  parentNotified: boolean
}

export const infirmaryVisits: InfirmaryVisit[] = [
  { id: 'IV01', studentName: 'Reyansh Kumar', avatar: 'RK', className: 'Class 2-A', complaint: 'Headache after lunch', diagnosis: 'Mild dehydration', treatment: 'ORS + rest 30 min', visitTime: '01:15 PM', visitDate: '2024-11-28', severity: 'minor', discharged: true, parentNotified: true },
  { id: 'IV02', studentName: 'Vivaan Reddy', avatar: 'VR', className: 'Class 2-A', complaint: 'Difficulty breathing', diagnosis: 'Mild asthma flare-up', treatment: 'Inhaler administered, observed 1 hr', visitTime: '11:30 AM', visitDate: '2024-11-28', severity: 'moderate', discharged: true, parentNotified: true },
  { id: 'IV03', studentName: 'Kiara Rao', avatar: 'KR', className: 'Class 2-A', complaint: 'Fall in playground — knee scrape', diagnosis: 'Minor abrasion', treatment: 'Antiseptic + bandage', visitTime: '10:45 AM', visitDate: '2024-11-28', severity: 'minor', discharged: true, parentNotified: false },
  { id: 'IV04', studentName: 'Dhruv Joshi', avatar: 'DJ', className: 'Class 2-A', complaint: 'Fever 100.4°F', diagnosis: 'Viral fever', treatment: 'Paracetamol, sent home', visitTime: '09:20 AM', visitDate: '2024-11-28', severity: 'moderate', discharged: true, parentNotified: true },
  { id: 'IV05', studentName: 'Anika Desai', avatar: 'AD', className: 'Class 2-A', complaint: 'Stomach pain', diagnosis: 'Indigestion', treatment: 'Antacid + rest', visitTime: '12:30 PM', visitDate: '2024-11-27', severity: 'minor', discharged: true, parentNotified: false },
]

export const healthStats = {
  totalStudents: 1842,
  healthyCount: 1684,
  monitoringCount: 124,
  followUpCount: 34,
  vaccinationRate: 92,
  infirmaryVisitsToday: 5,
  infirmaryVisitsMonth: 86,
  avgResponseTime: '8 min',
  staff: 4,
  monthlyTrend: [
    { month: 'Jun', visits: 62 }, { month: 'Jul', visits: 78 },
    { month: 'Aug', visits: 94 }, { month: 'Sep', visits: 72 },
    { month: 'Oct', visits: 88 }, { month: 'Nov', visits: 86 },
  ],
  bmiDistribution: [
    { name: 'Normal', value: 1486, color: 'oklch(0.55 0.14 162)' },
    { name: 'Underweight', value: 218, color: 'oklch(0.65 0.16 75)' },
    { name: 'Overweight', value: 138, color: 'oklch(0.62 0.2 25)' },
  ],
}
