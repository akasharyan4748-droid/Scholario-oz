// Western Indian states: Goa, Gujarat, Maharashtra, Rajasthan,
// and Dadra and Nagar Haveli and Daman and Diu (UT).

import type { StateData } from './types'

export const WEST_STATES: StateData[] = [
  {
    name: 'Goa',
    districts: [
      { name: 'North Goa', cities: ['Panaji', 'Mapusa', 'Porvorim', 'Calangute', 'Bicholim'] },
      { name: 'South Goa', cities: ['Margao', 'Vasco da Gama', 'Ponda', 'Quepem', 'Curchorem'] },
    ],
  },
  {
    name: 'Gujarat',
    districts: [
      { name: 'Ahmedabad', cities: ['Ahmedabad', 'Bopal', 'Gota', 'Chandkheda', 'Naroda', 'Vastral'] },
      { name: 'Surat', cities: ['Surat', 'Adajan', 'Vesu', 'Varachha', 'Katargam'] },
      { name: 'Vadodara', cities: ['Vadodara', 'Alkapuri', 'Sayajigunj', 'Manjalpur', 'Akota'] },
      { name: 'Rajkot', cities: ['Rajkot', 'Kalavad Road', 'Yagnik Road', 'Race Course'] },
      { name: 'Gandhinagar', cities: ['Gandhinagar', 'Sector 21', 'Kudasan', 'Infocity'] },
    ],
  },
  {
    name: 'Maharashtra',
    districts: [
      { name: 'Mumbai City', cities: ['Colaba', 'Fort', 'Marine Drive', 'Churchgate', 'Malabar Hill'] },
      { name: 'Mumbai Suburban', cities: ['Andheri', 'Bandra', 'Goregaon', 'Borivali', 'Dadar', 'Juhu'] },
      { name: 'Pune', cities: ['Pune City', 'Kothrud', 'Hadapsar', 'Baner', 'Wakad', 'Kharadi'] },
      { name: 'Nagpur', cities: ['Nagpur', 'Civil Lines', 'Dharampeth', 'Sitabuldi', 'Manish Nagar'] },
      { name: 'Thane', cities: ['Thane', 'Naupada', 'Vasant Vihar', 'Ghodbunder Road'] },
      { name: 'Nashik', cities: ['Nashik', 'College Road', 'Gangapur Road', 'Nashik Road'] },
    ],
  },
  {
    name: 'Rajasthan',
    districts: [
      { name: 'Jaipur', cities: ['Jaipur', 'Vaishali Nagar', 'Malviya Nagar', 'Mansarovar', 'C-Scheme'] },
      { name: 'Jodhpur', cities: ['Jodhpur', 'Sardarpura', 'Paota', 'Ratanada'] },
      { name: 'Udaipur', cities: ['Udaipur', 'Fatehsagar', 'Hiran Magri', 'Sukhadia Circle'] },
      { name: 'Kota', cities: ['Kota', 'Vigyan Nagar', 'Talwandi', 'Indra Vihar'] },
      { name: 'Ajmer', cities: ['Ajmer', 'Kutchery Road', 'Civil Lines', 'Ramganj'] },
    ],
  },
  // Union Territory — West
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    districts: [
      { name: 'Daman', cities: ['Daman', 'Moti Daman', 'Nani Daman'] },
      { name: 'Diu', cities: ['Diu', 'Ghogla', 'Bucharwada'] },
      { name: 'Dadra', cities: ['Dadra', 'Kadaiya', 'Silvassa Road'] },
      { name: 'Nagar Haveli', cities: ['Silvassa', 'Vapi', 'Umbergaon'] },
    ],
  },
]
