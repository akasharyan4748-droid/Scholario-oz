// Central Indian states (Madhya Pradesh, Chhattisgarh) and the
// Andaman and Nicobar Islands (UT).

import type { StateData } from './types'

export const CENTRAL_STATES: StateData[] = [
  {
    name: 'Madhya Pradesh',
    districts: [
      { name: 'Bhopal', cities: ['Bhopal', 'Kolar', 'MP Nagar', 'Shahpura', 'Awadhpuri'] },
      { name: 'Indore', cities: ['Indore', 'Vijay Nagar', 'Palasia', 'Bhawarkua', 'Sudama Nagar'] },
      { name: 'Jabalpur', cities: ['Jabalpur', 'Civil Lines', 'Napier Town', 'Wright Town'] },
      { name: 'Gwalior', cities: ['Gwalior', 'Lashkar', 'Morar', 'City Centre'] },
      { name: 'Ujjain', cities: ['Ujjain', 'Freeganj', 'Nayapura', 'Madhav Nagar'] },
    ],
  },
  {
    name: 'Chhattisgarh',
    districts: [
      { name: 'Raipur', cities: ['Raipur', 'Birgaon', 'Durg Road', 'Telibandha'] },
      { name: 'Durg', cities: ['Durg', 'Bhilai', 'Bhilai-3', 'Risali'] },
      { name: 'Bilaspur', cities: ['Bilaspur', 'Bilaspur Old', 'Masturi', 'Ratanpur'] },
      { name: 'Korba', cities: ['Korba', 'Churi', 'Gevra', 'Dipka'] },
    ],
  },
  // Union Territory — Islands
  {
    name: 'Andaman and Nicobar Islands',
    districts: [
      { name: 'South Andaman', cities: ['Port Blair', 'Aberdeen', 'Haddo', 'Phoenix Bay'] },
      { name: 'North and Middle Andaman', cities: ['Mayabunder', 'Rangat', 'Diglipur'] },
      { name: 'Nicobar', cities: ['Car Nicobar', 'Campbell Bay', 'Nancowry'] },
    ],
  },
]
