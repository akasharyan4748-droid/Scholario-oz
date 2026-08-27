// Southern Indian states: Andhra Pradesh, Karnataka, Kerala,
// Tamil Nadu, Telangana, Puducherry (UT), Lakshadweep (UT).

import type { StateData } from './types'

export const SOUTH_STATES: StateData[] = [
  {
    name: 'Andhra Pradesh',
    districts: [
      { name: 'Visakhapatnam', cities: ['Visakhapatnam', 'Gajuwaka', 'Duvvada', 'Anakapalle', 'Bheemunipatnam'] },
      { name: 'East Godavari', cities: ['Rajahmundry', 'Kakinada', 'Amalapuram', 'Ramachandrapuram'] },
      { name: 'Chittoor', cities: ['Tirupati', 'Chittoor', 'Madanapalle', 'Srikalahasti'] },
      { name: 'Guntur', cities: ['Guntur', 'Narasaraopet', 'Tenali', 'Bapatla'] },
    ],
  },
  {
    name: 'Karnataka',
    districts: [
      { name: 'Bengaluru Urban', cities: ['Bengaluru', 'Whitefield', 'Electronic City', 'Indiranagar', 'Jayanagar', 'Koramangala'] },
      { name: 'Mysuru', cities: ['Mysuru', 'Krishnarajanagara', 'Nanjangud', 'Hunsur'] },
      { name: 'Mangaluru', cities: ['Mangaluru', 'Surathkal', 'Ullal', 'Bajpe'] },
      { name: 'Hubli-Dharwad', cities: ['Hubli', 'Dharwad', 'Gokul Road', 'Kumarapatna'] },
      { name: 'Belagavi', cities: ['Belagavi', 'Khanapur', 'Bailhongal', 'Gokak'] },
    ],
  },
  {
    name: 'Kerala',
    districts: [
      { name: 'Thiruvananthapuram', cities: ['Thiruvananthapuram', 'Kazhakoottam', 'Neyyattinkara', 'Attingal', 'Varkala'] },
      { name: 'Ernakulam', cities: ['Kochi', 'Kakkanad', 'Aluva', 'Tripunithura', 'Edappally'] },
      { name: 'Kozhikode', cities: ['Kozhikode', 'Feroke', 'Ramanattukara', 'Vadakara'] },
      { name: 'Thrissur', cities: ['Thrissur', 'Irinjalakuda', 'Kunnamkulam', 'Chalakudy'] },
      { name: 'Kollam', cities: ['Kollam', 'Karunagappally', 'Kottarakkara', 'Punalur'] },
    ],
  },
  {
    name: 'Tamil Nadu',
    districts: [
      { name: 'Chennai', cities: ['Chennai', 'T Nagar', 'Adyar', 'Velachery', 'Anna Nagar', 'Mylapore'] },
      { name: 'Coimbatore', cities: ['Coimbatore', 'RS Puram', 'Saibaba Colony', 'Race Course', 'Saravanampatti'] },
      { name: 'Madurai', cities: ['Madurai', 'KK Nagar', 'Anna Nagar', 'Goripalayam', 'Tallakulam'] },
      { name: 'Salem', cities: ['Salem', 'Fairlands', 'Alagapuram', 'Kondalampatti'] },
      { name: 'Tiruchirappalli', cities: ['Tiruchirappalli', 'Cantonment', 'Thillai Nagar', 'Woraiyur'] },
    ],
  },
  {
    name: 'Telangana',
    districts: [
      { name: 'Hyderabad', cities: ['Hyderabad', 'Banjara Hills', 'Gachibowli', 'Madhapur', 'Kukatpally', 'Begumpet'] },
      { name: 'Rangareddy', cities: ['LB Nagar', 'Serilingampally', 'Ibrahimpatnam', 'Hayathnagar'] },
      { name: 'Warangal Urban', cities: ['Warangal', 'Hanamkonda', 'Kazipet', 'Nakkalagutta'] },
      { name: 'Nizamabad', cities: ['Nizamabad', 'Armoor', 'Bodhan', 'Kamareddy'] },
    ],
  },
  // Union Territories — South
  {
    name: 'Puducherry',
    districts: [
      { name: 'Puducherry', cities: ['Puducherry', 'Lawspet', 'Muthialpet', 'Reddiarpalayam'] },
      { name: 'Karaikal', cities: ['Karaikal', 'Nedungadu', 'Tirunallar', 'Kottucherry'] },
      { name: 'Yanam', cities: ['Yanam', 'Kurasam', 'Farampeta'] },
      { name: 'Mahe', cities: ['Mahe', 'Pandakkal', 'Chalakara'] },
    ],
  },
  {
    name: 'Lakshadweep',
    districts: [
      { name: 'Kavaratti', cities: ['Kavaratti', 'Suheli', 'Tinnakara'] },
      { name: 'Agatti', cities: ['Agatti', 'Bangaram', 'Kalpeni'] },
      { name: 'Minicoy', cities: ['Minicoy', 'Viringili'] },
    ],
  },
]
