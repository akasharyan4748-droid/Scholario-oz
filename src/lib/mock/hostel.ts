// Hostel management data — rooms, allocation, mess, fees

export interface HostelBlock {
  id: string
  name: string
  type: 'Boys' | 'Girls'
  totalRooms: number
  occupied: number
  warden: string
  wardenPhone: string
  status: 'Operational' | 'Maintenance'
}

export const hostelBlocks: HostelBlock[] = [
  { id: 'HB01', name: 'Aravali Block — Boys', type: 'Boys', totalRooms: 48, occupied: 44, warden: 'Suresh Pillai', wardenPhone: '+91 98300 11234', status: 'Operational' },
  { id: 'HB02', name: 'Nilgiri Block — Boys', type: 'Boys', totalRooms: 42, occupied: 38, warden: 'Amit Verma', wardenPhone: '+91 98400 22345', status: 'Operational' },
  { id: 'HB03', name: 'Shivalik Block — Girls', type: 'Girls', totalRooms: 44, occupied: 41, warden: 'Meera Krishnan', wardenPhone: '+91 98500 33456', status: 'Operational' },
  { id: 'HB04', name: 'Vindhya Block — Girls', type: 'Girls', totalRooms: 36, occupied: 32, warden: 'Sunita Rao', wardenPhone: '+91 98600 44567', status: 'Maintenance' },
]

export interface HostelRoom {
  id: string
  roomNo: string
  block: string
  type: 'Single' | 'Double' | 'Triple'
  capacity: number
  occupied: number
  occupants: string[]
  monthlyRent: number
  status: 'Occupied' | 'Partial' | 'Vacant' | 'Maintenance'
  floor: number
  ac: boolean
}

export const hostelRooms: HostelRoom[] = [
  { id: 'HR01', roomNo: 'A-101', block: 'Aravali', type: 'Double', capacity: 2, occupied: 2, occupants: ['Vihaan Agarwal', 'Sai Pillai'], monthlyRent: 12000, status: 'Occupied', floor: 1, ac: true },
  { id: 'HR02', roomNo: 'A-102', block: 'Aravali', type: 'Double', capacity: 2, occupied: 1, occupants: ['Dhruv Joshi'], monthlyRent: 12000, status: 'Partial', floor: 1, ac: true },
  { id: 'HR03', roomNo: 'A-103', block: 'Aravali', type: 'Single', capacity: 1, occupied: 0, occupants: [], monthlyRent: 18000, status: 'Vacant', floor: 1, ac: true },
  { id: 'HR04', roomNo: 'A-201', block: 'Aravali', type: 'Triple', capacity: 3, occupied: 3, occupants: ['Arjun Mehta', 'Aditya Nair', 'Kabir Khanna'], monthlyRent: 9000, status: 'Occupied', floor: 2, ac: false },
  { id: 'HR05', roomNo: 'N-101', block: 'Nilgiri', type: 'Double', capacity: 2, occupied: 2, occupants: ['Reyansh Kumar', 'Dhruv Joshi'], monthlyRent: 12000, status: 'Occupied', floor: 1, ac: true },
  { id: 'HR06', roomNo: 'N-102', block: 'Nilgiri', type: 'Single', capacity: 1, occupied: 1, occupants: ['Vivaan Reddy'], monthlyRent: 18000, status: 'Occupied', floor: 1, ac: true },
  { id: 'HR07', roomNo: 'S-101', block: 'Shivalik', type: 'Double', capacity: 2, occupied: 2, occupants: ['Diya Patel', 'Myra Iyer'], monthlyRent: 12000, status: 'Occupied', floor: 1, ac: true },
  { id: 'HR08', roomNo: 'S-201', block: 'Shivalik', type: 'Triple', capacity: 3, occupied: 2, occupants: ['Ananya Singh', 'Kiara Rao'], monthlyRent: 9000, status: 'Partial', floor: 2, ac: false },
  { id: 'HR09', roomNo: 'S-202', block: 'Shivalik', type: 'Single', capacity: 1, occupied: 0, occupants: [], monthlyRent: 18000, status: 'Vacant', floor: 2, ac: true },
  { id: 'HR10', roomNo: 'V-101', block: 'Vindhya', type: 'Double', capacity: 2, occupied: 0, occupants: [], monthlyRent: 12000, status: 'Maintenance', floor: 1, ac: true },
]

export interface MessMeal {
  id: string
  day: string
  breakfast: string
  lunch: string
  snacks: string
  dinner: string
}

export const messMenu: MessMeal[] = [
  { id: 'MM01', day: 'Monday', breakfast: 'Aloo Paratha, Curd, Pickle', lunch: 'Rajma, Rice, Roti, Salad', snacks: 'Samosa + Tea', dinner: 'Paneer Butter Masala, Roti, Jeera Rice' },
  { id: 'MM02', day: 'Tuesday', breakfast: 'Poha, Jalebi, Milk', lunch: 'Chole, Bhature, Salad', snacks: 'Biscuits + Tea', dinner: 'Chicken Curry / Aloo Gobi, Roti, Rice' },
  { id: 'MM03', day: 'Wednesday', breakfast: 'Idli, Sambar, Coconut Chutney', lunch: 'Dal Tadka, Rice, Roti, Bhindi', snacks: 'Pasta + Tea', dinner: 'Veg Biryani, Raita, Papad' },
  { id: 'MM04', day: 'Thursday', breakfast: 'Masala Dosa, Chutney', lunch: 'Kadhi Pakora, Rice, Roti', snacks: 'Pakora + Tea', dinner: 'Palak Paneer, Roti, Rice, Salad' },
  { id: 'MM05', day: 'Friday', breakfast: 'Puri, Aloo Sabzi, Halwa', lunch: 'Chana Masala, Rice, Roti', snacks: 'Vada + Tea', dinner: 'Veg Pulao, Shahi Paneer, Roti' },
  { id: 'MM06', day: 'Saturday', breakfast: 'Upma, Banana, Milk', lunch: 'Sambar, Rice, Roti, Porial', snacks: 'Sandwich + Tea', dinner: 'Aloo Matar, Roti, Rice, Gulab Jamun' },
  { id: 'MM07', day: 'Sunday', breakfast: 'Chole Kulche, Lassi', lunch: 'Veg Thali Special (5 items)', snacks: 'Noodles + Tea', dinner: 'Chicken Biryani / Veg Dum Biryani, Raita' },
]

export const messFeedback = [
  { id: 'MF01', student: 'Myra Iyer', rating: 5, comment: 'Sunday biryani was amazing!', date: '2024-11-28' },
  { id: 'MF02', student: 'Arjun Mehta', rating: 4, comment: 'Breakfast is great, dinner could have more variety.', date: '2024-11-27' },
  { id: 'MF03', student: 'Diya Patel', rating: 5, comment: 'Loved the paneer butter masala!', date: '2024-11-26' },
  { id: 'MF04', student: 'Vivaan Reddy', rating: 3, comment: 'Would like more South Indian options.', date: '2024-11-25' },
]

export const hostelStats = {
  totalBlocks: 4,
  totalRooms: 170,
  occupiedRooms: 155,
  vacantRooms: 10,
  maintenanceRooms: 5,
  totalBoarders: 312,
  boysCount: 168,
  girlsCount: 144,
  occupancyRate: 91.2,
  monthlyRevenue: 4280000,
  messRating: 4.4,
  messServingsToday: 936,
  monthlyTrend: [
    { month: 'Jun', occupancy: 88 }, { month: 'Jul', occupancy: 90 },
    { month: 'Aug', occupancy: 91 }, { month: 'Sep', occupancy: 92 },
    { month: 'Oct', occupancy: 90 }, { month: 'Nov', occupancy: 91 },
  ],
  blockDistribution: [
    { name: 'Aravali (Boys)', value: 44, color: 'oklch(0.55 0.14 162)' },
    { name: 'Nilgiri (Boys)', value: 38, color: 'oklch(0.65 0.16 75)' },
    { name: 'Shivalik (Girls)', value: 41, color: 'oklch(0.6 0.18 300)' },
    { name: 'Vindhya (Girls)', value: 32, color: 'oklch(0.7 0.15 200)' },
  ],
}
