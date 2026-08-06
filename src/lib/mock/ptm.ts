// PTM (Parent-Teacher Meeting) scheduler data

export interface PTMSlot {
  id: string
  time: string
  duration: string
  parentName: string
  studentName: string
  rollNo: string
  avatar: string
  status: 'booked' | 'available' | 'completed' | 'cancelled'
  notes?: string
  rating?: number
}

export const ptmSchedule: PTMSlot[] = [
  { id: 'PTM01', time: '09:00 AM', duration: '10 min', parentName: 'Vikram Sharma', studentName: 'Aarav Sharma', rollNo: '18', avatar: 'AS', status: 'completed', notes: 'Excellent progress in Maths. Needs to work on handwriting.', rating: 5 },
  { id: 'PTM02', time: '09:10 AM', duration: '10 min', parentName: 'Nikhil Patel', studentName: 'Diya Patel', rollNo: '02', avatar: 'DP', status: 'completed', notes: 'Diya is a bright student. Encourage more reading at home.', rating: 5 },
  { id: 'PTM03', time: '09:20 AM', duration: '10 min', parentName: 'Karthik Reddy', studentName: 'Vivaan Reddy', rollNo: '03', avatar: 'VR', status: 'booked', },
  { id: 'PTM04', time: '09:30 AM', duration: '10 min', parentName: 'Arvind Singh', studentName: 'Ananya Singh', rollNo: '04', avatar: 'AN', status: 'booked', },
  { id: 'PTM05', time: '09:40 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available', },
  { id: 'PTM06', time: '09:50 AM', duration: '10 min', parentName: 'Sandeep Kumar', studentName: 'Reyansh Kumar', rollNo: '05', avatar: 'RK', status: 'booked', },
  { id: 'PTM07', time: '10:00 AM', duration: '10 min', parentName: 'Manish Verma', studentName: 'Ishaani Verma', rollNo: '06', avatar: 'IV', status: 'booked', },
  { id: 'PTM08', time: '10:10 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available', },
  { id: 'PTM09', time: '10:20 AM', duration: '10 min', parentName: 'Vinod Nair', studentName: 'Aditya Nair', rollNo: '07', avatar: 'AN', status: 'cancelled', notes: 'Parent informed — rescheduled to 11:00 AM', },
  { id: 'PTM10', time: '10:30 AM', duration: '10 min', parentName: 'Rajesh Gupta', studentName: 'Saanvi Gupta', rollNo: '08', avatar: 'SG', status: 'booked', },
  { id: 'PTM11', time: '10:40 AM', duration: '10 min', parentName: '', studentName: '', rollNo: '', avatar: '', status: 'available', },
  { id: 'PTM12', time: '10:50 AM', duration: '10 min', parentName: 'Tarun Mehta', studentName: 'Arjun Mehta', rollNo: '09', avatar: 'AM', status: 'booked', },
  { id: 'PTM13', time: '11:00 AM', duration: '10 min', parentName: 'Sriram Iyer', studentName: 'Myra Iyer', rollNo: '10', avatar: 'MI', status: 'booked', },
  { id: 'PTM14', time: '11:10 AM', duration: '10 min', parentName: 'Harish Khanna', studentName: 'Kabir Khanna', rollNo: '11', avatar: 'KK', status: 'booked', },
  { id: 'PTM15', time: '11:20 AM', duration: '10 min', parentName: 'Ganesh Rao', studentName: 'Kiara Rao', rollNo: '12', avatar: 'KR', status: 'booked', },
]

export interface PTMEvent {
  id: string
  title: string
  date: string
  time: string
  className: string
  totalSlots: number
  bookedSlots: number
  completedSlots: number
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
  venue: string
  notes: string
}

export const ptmEvents: PTMEvent[] = [
  { id: 'PTME01', title: 'Primary PTM — Class 1 to 5', date: '2024-12-07', time: '09:00 AM – 12:00 PM', className: 'Class 1–5', totalSlots: 18, bookedSlots: 13, completedSlots: 2, status: 'Ongoing', venue: 'Respective Classrooms', notes: 'Discuss Unit Test 3 results and progress.' },
  { id: 'PTME02', title: 'Middle School PTM — Class 6 to 8', date: '2024-12-14', time: '10:00 AM – 01:00 PM', className: 'Class 6–8', totalSlots: 24, bookedSlots: 18, completedSlots: 0, status: 'Scheduled', venue: 'Respective Classrooms', notes: 'Mid-term review and exam preparation guidance.' },
  { id: 'PTME03', title: 'Secondary PTM — Class 9 & 10', date: '2024-12-21', time: '09:30 AM – 12:30 PM', className: 'Class 9–10', totalSlots: 20, bookedSlots: 15, completedSlots: 0, status: 'Scheduled', venue: 'Auditorium', notes: 'Pre-board discussion and board exam strategy.' },
  { id: 'PTME04', title: 'Senior PTM — Class 11 & 12', date: '2024-11-30', time: '10:00 AM – 01:00 PM', className: 'Class 11–12', totalSlots: 16, bookedSlots: 16, completedSlots: 16, status: 'Completed', venue: 'Auditorium', notes: 'Career counseling and stream selection guidance.' },
]

export const ptmStats = {
  totalMeetings: 18,
  todayMeetings: 13,
  completedToday: 2,
  upcoming: 3,
  attendanceRate: 86,
  avgRating: 4.7,
  rescheduled: 1,
}
