// Library, Transport, Inventory, Communication, Calendar

// LIBRARY
export const libraryStats = {
  totalBooks: 18420,
  issued: 1242,
  available: 17178,
  overdue: 86,
  totalFines: 18400,
  newThisMonth: 142,
  byCategory: [
    { name: 'Fiction', value: 6840, color: 'oklch(0.55 0.14 162)' },
    { name: 'Reference', value: 3220, color: 'oklch(0.65 0.16 75)' },
    { name: 'Textbooks', value: 4180, color: 'oklch(0.6 0.18 300)' },
    { name: 'Story Books', value: 2680, color: 'oklch(0.7 0.15 200)' },
    { name: 'Magazines', value: 1500, color: 'oklch(0.62 0.2 25)' },
  ],
}

export const libraryBooks = [
  { id: 'BK001', title: 'Wings of Fire', author: 'Dr. A.P.J. Abdul Kalam', category: 'Biography', isbn: '978-8173711466', copies: 12, available: 8, issued: 4 },
  { id: 'BK002', title: 'The Jungle Book', author: 'Rudyard Kipling', category: 'Fiction', isbn: '978-9380816798', copies: 15, available: 9, issued: 6 },
  { id: 'BK003', title: 'Panchatantra Tales', author: 'Vishnu Sharma', category: 'Story Books', isbn: '978-8126414838', copies: 20, available: 14, issued: 6 },
  { id: 'BK004', title: 'Mathematics for Class 2', author: 'NCERT', category: 'Textbooks', isbn: '978-8174507344', copies: 25, available: 22, issued: 3 },
  { id: 'BK005', title: 'Our Environment', author: 'NCERT', category: 'Textbooks', isbn: '978-8174507351', copies: 25, available: 20, issued: 5 },
  { id: 'BK006', title: 'Akbar and Birbal', author: 'Amar Chitra Katha', category: 'Story Books', isbn: '978-8184820058', copies: 10, available: 6, issued: 4 },
  { id: 'BK007', title: 'Encyclopedia of Science', author: 'DK', category: 'Reference', isbn: '978-1405394834', copies: 6, available: 3, issued: 3 },
  { id: 'BK008', title: 'Tenali Raman Stories', author: 'Amar Chitra Katha', category: 'Story Books', isbn: '978-8184820126', copies: 12, available: 8, issued: 4 },
]

export const issuedBooks = [
  { id: 'ISS001', book: 'Wings of Fire', student: 'Aarav Sharma', admissionNo: 'DSO2025018', issueDate: '2025-11-12', dueDate: '2025-11-26', status: 'Overdue', fine: 20 },
  { id: 'ISS002', book: 'The Jungle Book', student: 'Diya Patel', admissionNo: 'DSO2025002', issueDate: '2025-11-18', dueDate: '2025-12-02', status: 'Issued', fine: 0 },
  { id: 'ISS003', book: 'Panchatantra Tales', student: 'Myra Iyer', admissionNo: 'DSO2025010', issueDate: '2025-11-20', dueDate: '2025-12-04', status: 'Issued', fine: 0 },
  { id: 'ISS004', book: 'Encyclopedia of Science', student: 'Anika Desai', admissionNo: 'DSO2025014', issueDate: '2025-11-05', dueDate: '2025-11-19', status: 'Overdue', fine: 40 },
  { id: 'ISS005', book: 'Akbar and Birbal', student: 'Kiara Rao', admissionNo: 'DSO2025012', issueDate: '2025-11-22', dueDate: '2025-12-06', status: 'Issued', fine: 0 },
]

// TRANSPORT
export const transportStats = {
  totalVehicles: 24,
  totalRoutes: 16,
  totalDrivers: 28,
  studentsUsingTransport: 1248,
  onRoad: 22,
  inMaintenance: 2,
  gpsActive: 24,
}

export const transportRoutes = [
  { id: 'TR01', routeName: 'Route 1 — DLF Phase 1–5', vehicleNo: 'HR-26-AB-1245', driver: 'Ramesh Yadav', driverPhone: '+91 98100 11111', students: 42, capacity: 48, status: 'On Route', eta: '14 min', stops: 8 },
  { id: 'TR02', routeName: 'Route 2 — Sushant Lok & Sector 56', vehicleNo: 'HR-26-CD-2367', driver: 'Mukesh Kumar', driverPhone: '+91 98200 22222', students: 38, capacity: 48, status: 'On Route', eta: '22 min', stops: 7 },
  { id: 'TR03', routeName: 'Route 3 — Palam Vihar & Sector 23', vehicleNo: 'HR-26-EF-3489', driver: 'Suresh Singh', driverPhone: '+91 98300 33333', students: 36, capacity: 42, status: 'At School', eta: '0 min', stops: 6 },
  { id: 'TR04', routeName: 'Route 4 — Sohna Road & Sector 49', vehicleNo: 'HR-26-GH-4512', driver: 'Pradeep Sharma', driverPhone: '+91 98400 44444', students: 44, capacity: 48, status: 'On Route', eta: '18 min', stops: 9 },
  { id: 'TR05', routeName: 'Route 5 — Sector 14 & 15', vehicleNo: 'HR-26-IJ-5634', driver: 'Anil Verma', driverPhone: '+91 98500 55555', students: 32, capacity: 42, status: 'Maintenance', eta: '—', stops: 5 },
  { id: 'TR06', routeName: 'Route 6 — Sector 40 & 42', vehicleNo: 'HR-26-KL-6756', driver: 'Dinesh Patel', driverPhone: '+91 98600 66666', students: 40, capacity: 48, status: 'On Route', eta: '12 min', stops: 7 },
]

export const vehicles = [
  { id: 'V01', number: 'HR-26-AB-1245', type: 'Bus', capacity: 48, driver: 'Ramesh Yadav', route: 'Route 1', gps: true, status: 'Active', lastService: '2025-10-15' },
  { id: 'V02', number: 'HR-26-CD-2367', type: 'Bus', capacity: 48, driver: 'Mukesh Kumar', route: 'Route 2', gps: true, status: 'Active', lastService: '2025-10-22' },
  { id: 'V03', number: 'HR-26-EF-3489', type: 'Mini Bus', capacity: 42, driver: 'Suresh Singh', route: 'Route 3', gps: true, status: 'Active', lastService: '2024-09-30' },
  { id: 'V04', number: 'HR-26-GH-4512', type: 'Bus', capacity: 48, driver: 'Pradeep Sharma', route: 'Route 4', gps: true, status: 'Active', lastService: '2025-10-08' },
  { id: 'V05', number: 'HR-26-IJ-5634', type: 'Mini Bus', capacity: 42, driver: 'Anil Verma', route: 'Route 5', gps: true, status: 'Maintenance', lastService: '2025-11-20' },
  { id: 'V06', number: 'HR-26-KL-6756', type: 'Bus', capacity: 48, driver: 'Dinesh Patel', route: 'Route 6', gps: true, status: 'Active', lastService: '2025-10-18' },
]

// INVENTORY
export const inventoryStats = {
  totalAssets: 4862,
  totalValue: 18420000,
  lowStock: 14,
  categories: [
    { name: 'Furniture', count: 2840, value: 8400000, color: 'oklch(0.55 0.14 162)' },
    { name: 'Lab Equipment', count: 842, value: 5200000, color: 'oklch(0.65 0.16 75)' },
    { name: 'Stationery', count: 1240, value: 820000, color: 'oklch(0.6 0.18 300)' },
    { name: 'Sports', count: 580, value: 2400000, color: 'oklch(0.7 0.15 200)' },
    { name: 'Electronics', count: 360, value: 1600000, color: 'oklch(0.62 0.2 25)' },
  ],
}

export const inventoryItems = [
  { id: 'INV001', name: 'Student Desk (Wooden)', category: 'Furniture', stock: 840, unit: 'pcs', value: 2800, status: 'In Stock', location: 'Store Room A' },
  { id: 'INV002', name: 'Whiteboard — 4x6 ft', category: 'Furniture', stock: 48, unit: 'pcs', value: 4200, status: 'In Stock', location: 'Store Room A' },
  { id: 'INV003', name: 'Microscope (Compound)', category: 'Lab Equipment', stock: 36, unit: 'pcs', value: 8400, status: 'In Stock', location: 'Science Lab' },
  { id: 'INV004', name: 'Beaker Set (Glass)', category: 'Lab Equipment', stock: 8, unit: 'sets', value: 1200, status: 'Low Stock', location: 'Science Lab' },
  { id: 'INV005', name: 'Notebooks (200 pg)', category: 'Stationery', stock: 240, unit: 'pcs', value: 60, status: 'In Stock', location: 'Store Room B' },
  { id: 'INV006', name: 'Crayons Pack (24)', category: 'Stationery', stock: 12, unit: 'pcs', value: 120, status: 'Low Stock', location: 'Store Room B' },
  { id: 'INV007', name: 'Football (Size 5)', category: 'Sports', stock: 24, unit: 'pcs', value: 840, status: 'In Stock', location: 'Sports Room' },
  { id: 'INV008', name: 'Projector (Epson)', category: 'Electronics', stock: 18, unit: 'pcs', value: 42000, status: 'In Stock', location: 'AV Room' },
]

// COMMUNICATION
export interface Announcement {
  id: string
  title: string
  content: string
  category: 'General' | 'Academic' | 'Event' | 'Urgent' | 'Holiday'
  date: string
  audience: 'All' | 'Parents' | 'Teachers' | 'Students'
  postedBy: string
}

export const announcements: Announcement[] = [
  { id: 'AN01', title: 'Annual Sports Day — 15th December', content: 'The Annual Sports Day will be held on 15th December 2024 at the school ground. All students must report by 7:30 AM in sports uniform. Parents are cordially invited.', category: 'Event', date: '2025-11-26', audience: 'All', postedBy: 'Dr. Ananya Iyer' },
  { id: 'AN02', title: 'Pre-Board Examination Schedule Released', content: 'Pre-Board examinations for Class 10 & 12 will commence from 9th December 2024. Detailed timetable is available in the Examination module.', category: 'Academic', date: '2025-11-25', audience: 'All', postedBy: 'Pooja Bhatt' },
  { id: 'AN03', title: 'Parent–Teacher Meeting — Class 1 to 5', content: 'PTM for primary classes is scheduled on Saturday, 7th December 2024 from 9:00 AM to 12:00 PM. Please be on time.', category: 'General', date: '2025-11-24', audience: 'Parents', postedBy: 'Deepa Menon' },
  { id: 'AN04', title: 'Winter Vacation Notice', content: 'School will remain closed for winter vacation from 24th December 2024 to 1st January 2025. School reopens on 2nd January 2025.', category: 'Holiday', date: '2025-11-22', audience: 'All', postedBy: 'Dr. Ananya Iyer' },
  { id: 'AN05', title: 'Diwali Break — School Closed', content: 'School will remain closed from 28th October to 3rd November for Diwali celebrations. Wishing all a safe and happy Diwali!', category: 'Holiday', date: '2025-10-25', audience: 'All', postedBy: 'Dr. Ananya Iyer' },
]

export const noticeBoard = [
  { id: 'NB01', title: 'Inter-House Quiz Competition', date: '2025-12-05', tag: 'Competition', color: 'oklch(0.55 0.14 162)' },
  { id: 'NB02', title: 'Science Exhibition — Class 6 to 10', date: '2025-12-12', tag: 'Exhibition', color: 'oklch(0.65 0.16 75)' },
  { id: 'NB03', title: 'Annual Day Rehearsals Begin', date: '2025-12-02', tag: 'Cultural', color: 'oklch(0.6 0.18 300)' },
  { id: 'NB04', title: 'Vaccination Camp — Class 5 & 6', date: '2025-11-30', tag: 'Health', color: 'oklch(0.7 0.15 200)' },
]

// CALENDAR
export const calendarEvents = [
  { id: 'E01', date: '2025-12-02', title: 'Annual Day Rehearsals', type: 'Cultural', time: '09:00' },
  { id: 'E02', date: '2025-12-05', title: 'Inter-House Quiz', type: 'Competition', time: '11:00' },
  { id: 'E03', date: '2025-12-07', title: 'PTM — Primary Section', type: 'Meeting', time: '09:00' },
  { id: 'E04', date: '2025-12-09', title: 'Pre-Board Exam Begins', type: 'Exam', time: '08:00' },
  { id: 'E05', date: '2025-12-12', title: 'Science Exhibition', type: 'Event', time: '10:00' },
  { id: 'E06', date: '2025-12-15', title: 'Annual Sports Day', type: 'Event', time: '07:30' },
  { id: 'E07', date: '2025-12-20', title: 'Pre-Board Exam Ends', type: 'Exam', time: '14:00' },
  { id: 'E08', date: '2025-12-24', title: 'Winter Vacation Begins', type: 'Holiday', time: '—' },
  { id: 'E09', date: '2025-01-02', title: 'School Reopens', type: 'General', time: '08:00' },
]

export const upcomingEvents = calendarEvents.slice(0, 5)

// NOTIFICATIONS
export const notifications = [
  { id: 'N01', title: 'Fee payment received', description: '₹86,000 from Aadhya Menon', time: '2 min ago', type: 'fee', unread: true },
  { id: 'N02', title: 'New admission', description: 'Ira Malhotra joined Class 1-A', time: '18 min ago', type: 'admission', unread: true },
  { id: 'N03', title: 'Attendance alert', description: 'Class 7-B attendance below 85%', time: '1 hr ago', type: 'attendance', unread: true },
  { id: 'N04', title: 'Library book overdue', description: '4 books overdue in primary section', time: '2 hrs ago', type: 'library', unread: false },
  { id: 'N05', title: 'Salary processed', description: 'November payroll disbursed to 96 employees', time: '3 hrs ago', type: 'salary', unread: false },
  { id: 'N06', title: 'PTM reminder', description: 'Primary PTM on 7th December', time: '5 hrs ago', type: 'event', unread: false },
  { id: 'N07', title: 'Exam duty assigned', description: 'Mr. Rajesh Kumar — Mathematics · Class 10 · Room B · 21 Aug, 09:00 AM. Attendance opens 08:30 AM.', time: '12 min ago', type: 'exam', unread: true },
  { id: 'N08', title: 'Exam duty assigned', description: 'Ms. Priya Nair — English · Class 9 · Room A · 22 Aug, 09:00 AM. Attendance opens 08:30 AM.', time: '15 min ago', type: 'exam', unread: true },
  { id: 'N09', title: 'Attendance submitted', description: 'Mr. Rajesh Kumar submitted Class 10 Mathematics attendance — 42 Present, 0 Absent.', time: '45 min ago', type: 'exam', unread: false },
  { id: 'N10', title: 'Marks submitted', description: 'Mr. Anil Sharma submitted Class 10 Mathematics marks — 42 students.', time: '1 hr ago', type: 'exam', unread: false },
]
