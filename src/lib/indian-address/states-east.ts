// Eastern Indian states: Bihar, Jharkhand, West Bengal, Odisha.

import type { StateData } from './types'

export const EAST_STATES: StateData[] = [
  {
    name: 'Bihar',
    districts: [
      { name: 'Patna', cities: ['Patna', 'Danapur', 'Khagaul', 'Phulwari', 'Patna City'] },
      { name: 'Gaya', cities: ['Gaya', 'Bodh Gaya', 'Tekari', 'Wazirganj'] },
      { name: 'Muzaffarpur', cities: ['Muzaffarpur', 'Kanti', 'Motipur', 'Paroo'] },
      { name: 'Bhagalpur', cities: ['Bhagalpur', 'Sultanganj', 'Nathnagar', 'Khalilabad'] },
    ],
  },
  {
    name: 'Jharkhand',
    districts: [
      { name: 'Ranchi', cities: ['Ranchi', 'Kanke', 'Namkum', 'Bariatu', 'Doranda'] },
      { name: 'Dhanbad', cities: ['Dhanbad', 'Jharia', 'Govindpur', 'Nirsa'] },
      { name: 'Bokaro', cities: ['Bokaro Steel City', 'Chas', 'Chandankiyari', 'Jaridih'] },
      { name: 'Jamshedpur (East Singhbhum)', cities: ['Jamshedpur', 'Adityapur', 'Mango', 'Sakchi'] },
    ],
  },
  {
    name: 'Odisha',
    districts: [
      { name: 'Khordha', cities: ['Bhubaneswar', 'Jatni', 'Khordha', 'Balianta'] },
      { name: 'Cuttack', cities: ['Cuttack', 'Choudwar', 'Athagarh', 'Niali'] },
      { name: 'Puri', cities: ['Puri', 'Konark', 'Nimapara', 'Pipili'] },
      { name: 'Sambalpur', cities: ['Sambalpur', 'Burla', 'Hirakud', 'Kuchinda'] },
    ],
  },
  {
    name: 'West Bengal',
    districts: [
      { name: 'Kolkata', cities: ['Kolkata', 'Salt Lake', 'New Town', 'Ballygunge', 'Behala', 'Tollygunge'] },
      { name: 'North 24 Parganas', cities: ['Barrackpore', 'Dum Dum', 'Bongaon', 'Basirhat', 'Barasat'] },
      { name: 'South 24 Parganas', cities: ['Alipore', 'Diamond Harbour', 'Kakdwip', 'Canning'] },
      { name: 'Howrah', cities: ['Howrah', 'Shibpur', 'Bally', 'Santragachi'] },
      { name: 'Darjeeling', cities: ['Darjeeling', 'Kurseong', 'Kalimpong', 'Siliguri'] },
    ],
  },
]
