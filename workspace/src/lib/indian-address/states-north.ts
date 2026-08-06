// Northern Indian states: Jammu & Kashmir, Ladakh, Himachal Pradesh,
// Punjab, Haryana, Uttarakhand, Uttar Pradesh, Chandigarh (UT), Delhi (NCT).

import type { StateData } from './types'

export const NORTH_STATES: StateData[] = [
  {
    name: 'Haryana',
    districts: [
      { name: 'Gurugram', cities: ['Gurugram', 'Sohna', 'Manesar', 'DLF Phase 5', 'Sector 56'] },
      { name: 'Faridabad', cities: ['Faridabad', 'NIT', 'Ballabhgarh', 'Surajkund'] },
      { name: 'Panchkula', cities: ['Panchkula', 'Pinjore', 'Kalka', 'Morni'] },
      { name: 'Ambala', cities: ['Ambala City', 'Ambala Cantt', 'Naraingarh', 'Barara'] },
      { name: 'Sonipat', cities: ['Sonipat', 'Gohana', 'Kharkhoda', 'Rai'] },
    ],
  },
  {
    name: 'Himachal Pradesh',
    districts: [
      { name: 'Shimla', cities: ['Shimla', 'Theog', 'Rampur', 'Chopal'] },
      { name: 'Kullu', cities: ['Kullu', 'Manali', 'Banjar', 'Nirmand'] },
      { name: 'Solan', cities: ['Solan', 'Baddi', 'Nalagarh', 'Arki'] },
      { name: 'Kangra', cities: ['Dharamshala', 'Kangra', 'Palampur', 'Mcleodganj'] },
    ],
  },
  {
    name: 'Punjab',
    districts: [
      { name: 'Ludhiana', cities: ['Ludhiana', 'Model Town', 'Sarabha Nagar', 'Gill Road', 'Pakhowal Road'] },
      { name: 'Amritsar', cities: ['Amritsar', 'Ranjit Avenue', 'Lawrence Road', 'Batala Road'] },
      { name: 'Jalandhar', cities: ['Jalandhar', 'Model Town', 'Guru Teg Bahadur Nagar', 'Civil Lines'] },
      { name: 'Mohali (SAS Nagar)', cities: ['Mohali', 'Phase 7', 'Phase 11', 'Aerocity'] },
      { name: 'Patiala', cities: ['Patiala', 'Model Town', 'Tripuri', 'Leela Bhawan'] },
    ],
  },
  {
    name: 'Uttar Pradesh',
    districts: [
      { name: 'Gautam Buddha Nagar', cities: ['Noida', 'Greater Noida', 'Dadri', 'Jewar'] },
      { name: 'Ghaziabad', cities: ['Ghaziabad', 'Indirapuram', 'Vasundhara', 'Kaushambi', 'Raj Nagar'] },
      { name: 'Lucknow', cities: ['Lucknow', 'Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar'] },
      { name: 'Kanpur Nagar', cities: ['Kanpur', 'Swaroop Nagar', 'Civil Lines', 'Kidwai Nagar'] },
      { name: 'Agra', cities: ['Agra', 'Tajganj', 'Sikandra', 'Fatehabad Road'] },
      { name: 'Varanasi', cities: ['Varanasi', 'Cantt', 'Sigra', 'Lanka', 'Bhelupur'] },
      { name: 'Ghazipur', cities: ['Ghazipur', 'Zamania', 'Saidpur', 'Muhammadabad', 'Jakhania'] },
      { name: 'Mau', cities: ['Mau', 'Ghosi', 'Muhammadabad', 'Dohrighat', 'Kopaganj'] },
      { name: 'Azamgarh', cities: ['Azamgarh', 'Mubarakpur', 'Nizamabad', 'Mehnar', 'Phulpur'] },
      { name: 'Ballia', cities: ['Ballia', 'Rasra', 'Bairia', 'Belthara Road', 'Sikanderpur'] },
    ],
  },
  {
    name: 'Uttarakhand',
    districts: [
      { name: 'Dehradun', cities: ['Dehradun', 'Rajpur Road', 'FRI', 'Sahastradhara Road', 'Clement Town'] },
      { name: 'Haridwar', cities: ['Haridwar', 'Rishikesh', 'Laksar', 'Bhagwanpur'] },
      { name: 'Nainital', cities: ['Nainital', 'Haldwani', 'Kaladhungi', 'Bhowali'] },
      { name: 'Udham Singh Nagar', cities: ['Rudrapur', 'Kashipur', 'Kichha', 'Sitarganj'] },
    ],
  },
  // Union Territories — North
  {
    name: 'Delhi (NCT)',
    districts: [
      { name: 'New Delhi', cities: ['Connaught Place', 'Chanakyapuri', 'Dhaula Kuan', 'R K Puram'] },
      { name: 'Central Delhi', cities: ['Daryaganj', 'Karol Bagh', 'Paharganj', 'Rajendra Nagar'] },
      { name: 'South Delhi', cities: ['Greater Kailash', 'Saket', 'Vasant Kunj', 'Defence Colony', 'Lajpat Nagar'] },
      { name: 'West Delhi', cities: ['Rajouri Garden', 'Punjabi Bagh', 'Janakpuri', 'Dwarka'] },
      { name: 'North Delhi', cities: ['Civil Lines', 'Model Town', 'Rohini', 'Pitampura'] },
      { name: 'East Delhi', cities: ['Preet Vihar', 'Vivek Vihar', 'Shahdara', 'Mayur Vihar'] },
    ],
  },
  {
    name: 'Jammu & Kashmir',
    districts: [
      { name: 'Jammu', cities: ['Jammu', 'Gandhi Nagar', 'Narwal', 'Janipur'] },
      { name: 'Srinagar', cities: ['Srinagar', 'Lal Chowk', 'Rajbagh', 'Hyderpora'] },
      { name: 'Anantnag', cities: ['Anantnag', 'Kokernag', 'Achabal', 'Mattan'] },
      { name: 'Baramulla', cities: ['Baramulla', 'Sopore', 'Uri', 'Tangmarg'] },
    ],
  },
  {
    name: 'Ladakh',
    districts: [
      { name: 'Leh', cities: ['Leh', 'Choglamsar', 'Sabu', 'Stok'] },
      { name: 'Kargil', cities: ['Kargil', 'Drass', 'Sankoo', 'Zanskar'] },
    ],
  },
  {
    name: 'Chandigarh',
    districts: [
      { name: 'Chandigarh', cities: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Mohali Border', 'Panchkula Border'] },
    ],
  },
]
