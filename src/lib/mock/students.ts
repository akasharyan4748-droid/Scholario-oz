// Students — realistic Indian school data
export interface Student {
  id: string
  admissionNo: string
  rollNo: string
  name: string
  avatar: string
  gender: 'Male' | 'Female'
  className: string
  section: string
  dob: string
  bloodGroup: string
  fatherName: string
  motherName: string
  guardianPhone: string
  email: string
  address: string
  admissionDate: string
  previousSchool: string
  status: 'Active' | 'Inactive'
  attendance: number
  feeStatus: 'Paid' | 'Partial' | 'Pending'
  feePaid: number
  feeTotal: number
  transport: boolean
  hostel: boolean
  scholarship: number
  photo: string
  libraryId: string
  transportId?: string
  medical: string
}

// Focus class for teacher/student demo: Class 2-A (teacher Rohan Mehta's class)
export const students: Student[] = [
  { id: 'STU-2024-001', admissionNo: 'DSO2024001', rollNo: '01', name: 'Aarav Sharma', avatar: 'AS', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-04-12', bloodGroup: 'O+', fatherName: 'Rahul Sharma', motherName: 'Pooja Sharma', guardianPhone: '+91 98100 12345', email: 'rahul.sharma@gmail.com', address: 'A-12, Sector 14, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Little Stars Playway', status: 'Active', attendance: 96, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AS', libraryId: 'LIB-1001', transportId: 'TRP-201', medical: 'No known allergies' },
  { id: 'STU-2024-002', admissionNo: 'DSO2024002', rollNo: '02', name: 'Diya Patel', avatar: 'DP', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-05-22', bloodGroup: 'A+', fatherName: 'Nikhil Patel', motherName: 'Sneha Patel', guardianPhone: '+91 98201 23456', email: 'nikhil.patel@gmail.com', address: 'B-45, DLF Phase 3, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Kidzee Preschool', status: 'Active', attendance: 98, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 5000, photo: 'DP', libraryId: 'LIB-1002', transportId: 'TRP-202', medical: 'Lactose intolerant' },
  { id: 'STU-2024-003', admissionNo: 'DSO2024003', rollNo: '03', name: 'Vivaan Reddy', avatar: 'VR', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-03-15', bloodGroup: 'B+', fatherName: 'Karthik Reddy', motherName: 'Lakshmi Reddy', guardianPhone: '+91 98300 34567', email: 'karthik.r@gmail.com', address: 'C-23, Sushant Lok, Gurugram', admissionDate: '2024-04-02', previousSchool: 'Eurokids', status: 'Active', attendance: 92, feeStatus: 'Partial', feePaid: 52000, feeTotal: 86000, transport: false, hostel: false, scholarship: 0, photo: 'VR', libraryId: 'LIB-1003', medical: 'Asthma — carries inhaler' },
  { id: 'STU-2024-004', admissionNo: 'DSO2024004', rollNo: '04', name: 'Ananya Singh', avatar: 'AN', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-06-08', bloodGroup: 'O-', fatherName: 'Arvind Singh', motherName: 'Meera Singh', guardianPhone: '+91 98400 45678', email: 'arvind.singh@gmail.com', address: 'D-67, Palam Vihar, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Bachpan Play School', status: 'Active', attendance: 99, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AN', libraryId: 'LIB-1004', transportId: 'TRP-203', medical: 'No known allergies' },
  { id: 'STU-2024-005', admissionNo: 'DSO2024005', rollNo: '05', name: 'Reyansh Kumar', avatar: 'RK', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-02-18', bloodGroup: 'A+', fatherName: 'Sandeep Kumar', motherName: 'Ritu Kumar', guardianPhone: '+91 98500 56789', email: 'sandeep.k@gmail.com', address: 'E-89, Sector 56, Gurugram', admissionDate: '2024-04-03', previousSchool: 'Tree House', status: 'Active', attendance: 88, feeStatus: 'Pending', feePaid: 20000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'RK', libraryId: 'LIB-1005', transportId: 'TRP-204', medical: 'Peanut allergy' },
  { id: 'STU-2024-006', admissionNo: 'DSO2024006', rollNo: '06', name: 'Ishaani Verma', avatar: 'IV', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-07-30', bloodGroup: 'AB+', fatherName: 'Manish Verma', motherName: 'Kavita Verma', guardianPhone: '+91 98600 67890', email: 'manish.v@gmail.com', address: 'F-34, Sector 40, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Little Stars', status: 'Active', attendance: 95, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: false, hostel: false, scholarship: 3000, photo: 'IV', libraryId: 'LIB-1006', medical: 'No known allergies' },
  { id: 'STU-2024-007', admissionNo: 'DSO2024007', rollNo: '07', name: 'Aditya Nair', avatar: 'AN', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-01-25', bloodGroup: 'B-', fatherName: 'Vinod Nair', motherName: 'Deepa Nair', guardianPhone: '+91 98700 78901', email: 'vinod.nair@gmail.com', address: 'G-56, Sector 23, Gurugram', admissionDate: '2024-04-02', previousSchool: 'Kidzee', status: 'Active', attendance: 94, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AN', libraryId: 'LIB-1007', transportId: 'TRP-205', medical: 'No known allergies' },
  { id: 'STU-2024-008', admissionNo: 'DSO2024008', rollNo: '08', name: 'Saanvi Gupta', avatar: 'SG', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-08-14', bloodGroup: 'O+', fatherName: 'Rajesh Gupta', motherName: 'Anjali Gupta', guardianPhone: '+91 98800 89012', email: 'rajesh.g@gmail.com', address: 'H-78, Sector 15, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Eurokids', status: 'Active', attendance: 97, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: false, hostel: false, scholarship: 0, photo: 'SG', libraryId: 'LIB-1008', medical: 'Dust allergy' },
  { id: 'STU-2024-009', admissionNo: 'DSO2024009', rollNo: '09', name: 'Arjun Mehta', avatar: 'AM', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-09-05', bloodGroup: 'A-', fatherName: 'Tarun Mehta', motherName: 'Shweta Mehta', guardianPhone: '+91 98900 90123', email: 'tarun.m@gmail.com', address: 'I-90, DLF Phase 5, Gurugram', admissionDate: '2024-04-03', previousSchool: 'Bachpan', status: 'Active', attendance: 91, feeStatus: 'Partial', feePaid: 43000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AM', libraryId: 'LIB-1009', transportId: 'TRP-206', medical: 'No known allergies' },
  { id: 'STU-2024-010', admissionNo: 'DSO2024010', rollNo: '10', name: 'Myra Iyer', avatar: 'MI', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-10-19', bloodGroup: 'AB-', fatherName: 'Sriram Iyer', motherName: 'Geeta Iyer', guardianPhone: '+91 99000 01234', email: 'sriram.i@gmail.com', address: 'J-12, Sector 31, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Little Stars', status: 'Active', attendance: 99, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 8000, photo: 'MI', libraryId: 'LIB-1010', transportId: 'TRP-207', medical: 'No known allergies' },
  { id: 'STU-2024-011', admissionNo: 'DSO2024011', rollNo: '11', name: 'Kabir Khanna', avatar: 'KK', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-11-22', bloodGroup: 'O+', fatherName: 'Harish Khanna', motherName: 'Renu Khanna', guardianPhone: '+91 99100 12340', email: 'harish.k@gmail.com', address: 'K-34, Sector 42, Gurugram', admissionDate: '2024-04-02', previousSchool: 'Tree House', status: 'Active', attendance: 85, feeStatus: 'Pending', feePaid: 10000, feeTotal: 86000, transport: false, hostel: false, scholarship: 0, photo: 'KK', libraryId: 'LIB-1011', medical: 'Egg allergy' },
  { id: 'STU-2024-012', admissionNo: 'DSO2024012', rollNo: '12', name: 'Kiara Rao', avatar: 'KR', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-12-11', bloodGroup: 'B+', fatherName: 'Ganesh Rao', motherName: 'Sumathi Rao', guardianPhone: '+91 99200 23451', email: 'ganesh.r@gmail.com', address: 'L-56, Sector 49, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Kidzee', status: 'Active', attendance: 96, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'KR', libraryId: 'LIB-1012', transportId: 'TRP-208', medical: 'No known allergies' },
  { id: 'STU-2024-013', admissionNo: 'DSO2024013', rollNo: '13', name: 'Vihaan Agarwal', avatar: 'VA', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-04-28', bloodGroup: 'A+', fatherName: 'Pradeep Agarwal', motherName: 'Sunita Agarwal', guardianPhone: '+91 99300 34562', email: 'pradeep.a@gmail.com', address: 'M-78, Sector 28, Gurugram', admissionDate: '2024-04-03', previousSchool: 'Eurokids', status: 'Active', attendance: 93, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'VA', libraryId: 'LIB-1013', transportId: 'TRP-209', medical: 'No known allergies' },
  { id: 'STU-2024-014', admissionNo: 'DSO2024014', rollNo: '14', name: 'Anika Desai', avatar: 'AD', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-05-17', bloodGroup: 'O-', fatherName: 'Mukesh Desai', motherName: 'Hetal Desai', guardianPhone: '+91 99400 45673', email: 'mukesh.d@gmail.com', address: 'N-90, Sector 12, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Bachpan', status: 'Active', attendance: 98, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: false, hostel: false, scholarship: 5000, photo: 'AD', libraryId: 'LIB-1014', medical: 'No known allergies' },
  { id: 'STU-2024-015', admissionNo: 'DSO2024015', rollNo: '15', name: 'Dhruv Joshi', avatar: 'DJ', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-06-25', bloodGroup: 'AB+', fatherName: 'Nilesh Joshi', motherName: 'Priti Joshi', guardianPhone: '+91 99500 56784', email: 'nilesh.j@gmail.com', address: 'O-23, Sector 22, Gurugram', admissionDate: '2024-04-02', previousSchool: 'Little Stars', status: 'Active', attendance: 90, feeStatus: 'Partial', feePaid: 60000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'DJ', libraryId: 'LIB-1015', transportId: 'TRP-210', medical: 'No known allergies' },
  { id: 'STU-2024-016', admissionNo: 'DSO2024016', rollNo: '16', name: 'Aadhya Menon', avatar: 'AM', gender: 'Female', className: 'Class 2', section: 'A', dob: '2017-07-09', bloodGroup: 'B-', fatherName: 'Suresh Menon', motherName: 'Latha Menon', guardianPhone: '+91 99600 67895', email: 'suresh.m@gmail.com', address: 'P-45, Sector 9, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Tree House', status: 'Active', attendance: 97, feeStatus: 'Paid', feePaid: 86000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AM', libraryId: 'LIB-1016', transportId: 'TRP-211', medical: 'No known allergies' },
  { id: 'STU-2024-017', admissionNo: 'DSO2024017', rollNo: '17', name: 'Sai Pillai', avatar: 'SP', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-08-02', bloodGroup: 'A+', fatherName: 'Mohan Pillai', motherName: 'Radha Pillai', guardianPhone: '+91 99700 78906', email: 'mohan.p@gmail.com', address: 'Q-67, Sector 17, Gurugram', admissionDate: '2024-04-03', previousSchool: 'Kidzee', status: 'Active', attendance: 89, feeStatus: 'Pending', feePaid: 30000, feeTotal: 86000, transport: false, hostel: false, scholarship: 0, photo: 'SP', libraryId: 'LIB-1017', medical: 'No known allergies' },
  { id: 'STU-2024-018', admissionNo: 'DSO2024018', rollNo: '18', name: 'Aarav Sharma', avatar: 'AS', gender: 'Male', className: 'Class 2', section: 'A', dob: '2017-09-27', bloodGroup: 'O+', fatherName: 'Vikram Sharma', motherName: 'Neha Sharma', guardianPhone: '+91 99800 89017', email: 'vikram.s@gmail.com', address: 'R-89, Sector 14, Gurugram', admissionDate: '2024-04-01', previousSchool: 'Eurokids', status: 'Active', attendance: 96, feeStatus: 'Partial', feePaid: 64000, feeTotal: 86000, transport: true, hostel: false, scholarship: 0, photo: 'AS', libraryId: 'LIB-1018', transportId: 'TRP-212', medical: 'No known allergies' },
]

export const getStudentById = (id: string) => students.find((s) => s.id === id)
export const getClassStudents = (className: string, section: string) =>
  students.filter((s) => s.className === className && s.section === section)

// Aggregate stats for principal dashboard
export const studentStats = {
  total: 1842,
  boys: 962,
  girls: 880,
  newThisMonth: 47,
  newThisYear: 312,
  byClass: [
    { class: 'Nursery–UKG', count: 312 },
    { class: 'Class 1–5', count: 684 },
    { class: 'Class 6–8', count: 426 },
    { class: 'Class 9–10', count: 248 },
    { class: 'Class 11–12', count: 172 },
  ],
  attendanceToday: 1719,
  attendanceRate: 93.3,
  birthdaysToday: 8,
  avgAttendance: 94.2,
}
