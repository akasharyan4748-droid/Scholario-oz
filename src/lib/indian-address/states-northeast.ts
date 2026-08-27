// North-eastern Indian states: Arunachal Pradesh, Assam, Manipur,
// Meghalaya, Mizoram, Nagaland, Sikkim, Tripura.

import type { StateData } from './types'

export const NORTHEAST_STATES: StateData[] = [
  {
    name: 'Arunachal Pradesh',
    districts: [
      { name: 'Papum Pare', cities: ['Itanagar', 'Naharlagun', 'Doimukh', 'Nirjuli'] },
      { name: 'West Kameng', cities: ['Bomdila', 'Dirang', 'Rupa', 'Kalaktang'] },
      { name: 'Tawang', cities: ['Tawang', 'Lumla', 'Jang', 'Kitpi'] },
    ],
  },
  {
    name: 'Assam',
    districts: [
      { name: 'Kamrup Metropolitan', cities: ['Guwahati', 'Dispur', 'Jalukbari', 'Gmc Area'] },
      { name: 'Dibrugarh', cities: ['Dibrugarh', 'Chabua', 'Naharkatia', 'Moran'] },
      { name: 'Cachar', cities: ['Silchar', 'Lakhipur', 'Sonai', 'Hailakandi Road'] },
      { name: 'Sivasagar', cities: ['Sivasagar', 'Nazira', 'Simaluguri', 'Amguri'] },
    ],
  },
  {
    name: 'Manipur',
    districts: [
      { name: 'Imphal West', cities: ['Imphal', 'Lamphelpat', 'Takyel', 'Langjing'] },
      { name: 'Imphal East', cities: ['Porompat', 'Koirengai', 'Andro', 'Jiribam'] },
      { name: 'Senapati', cities: ['Senapati', 'Kangpokpi', 'Sadar Hills', 'Tadubi'] },
    ],
  },
  {
    name: 'Meghalaya',
    districts: [
      { name: 'East Khasi Hills', cities: ['Shillong', 'Laitumkhrah', 'Police Bazaar', 'Mawkhar'] },
      { name: 'West Garo Hills', cities: ['Tura', 'Phulbari', 'Selsella', 'Ampati'] },
      { name: 'Ri-Bhoi', cities: ['Nongpoh', 'Umiam', 'Byrnihat', 'Umsning'] },
    ],
  },
  {
    name: 'Mizoram',
    districts: [
      { name: 'Aizawl', cities: ['Aizawl', 'Durtlang', 'Chaltlang', 'Zarkawt'] },
      { name: 'Lunglei', cities: ['Lunglei', 'Hnahthial', 'Tlabung', 'Chawngte'] },
      { name: 'Kolasib', cities: ['Kolasib', 'Bilkhawthlir', 'Vairengte', 'Thingdawl'] },
    ],
  },
  {
    name: 'Nagaland',
    districts: [
      { name: 'Kohima', cities: ['Kohima', 'Meriema', 'Tseminyu', 'Chiephobozou'] },
      { name: 'Dimapur', cities: ['Dimapur', 'Chumukedima', 'Niuland', 'Medziphema'] },
      { name: 'Mokokchung', cities: ['Mokokchung', 'Tuli', 'Changtongya', 'Mangkolemba'] },
    ],
  },
  {
    name: 'Sikkim',
    districts: [
      { name: 'Gangtok', cities: ['Gangtok', 'Tadong', 'Deorali', 'Ranipool'] },
      { name: 'Namchi', cities: ['Namchi', 'Jorethang', 'Melli', 'Ravangla'] },
      { name: 'Gyalshing', cities: ['Gyalshing', 'Pelling', 'Yuksom', 'Legship'] },
    ],
  },
  {
    name: 'Tripura',
    districts: [
      { name: 'West Tripura', cities: ['Agartala', 'Khumulwng', 'Mohankpur', 'Jirania'] },
      { name: 'South Tripura', cities: ['Belonia', 'Santirbazar', 'Sabroom', 'Amarpur'] },
      { name: 'Dhalai', cities: ['Ambassa', 'Kamalpur', 'Khowai', 'Gandacherra'] },
    ],
  },
]
