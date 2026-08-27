// Composite dataset: assembles every regional state group into the
// single canonical INDIAN_STATES array used by the query helpers.
//
// Region split rationale (kept in roughly geographic order to mirror
// the original file's listing):
//   1. North        — J&K, Ladakh, HP, Punjab, Haryana, Uttarakhand, UP, Delhi, Chandigarh
//   2. South        — AP, Karnataka, Kerala, TN, Telangana, Puducherry, Lakshadweep
//   3. East         — Bihar, Jharkhand, Odisha, West Bengal
//   4. West         — Goa, Gujarat, Maharashtra, Rajasthan, D&N Haveli & D&D
//   5. Northeast    — Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura
//   6. Central      — Madhya Pradesh, Chhattisgarh, Andaman & Nicobar Islands

import type { StateData } from './types'
import { NORTH_STATES } from './states-north'
import { SOUTH_STATES } from './states-south'
import { EAST_STATES } from './states-east'
import { WEST_STATES } from './states-west'
import { NORTHEAST_STATES } from './states-northeast'
import { CENTRAL_STATES } from './states-central'

export const INDIAN_STATES: StateData[] = [
  ...SOUTH_STATES,
  ...NORTHEAST_STATES,
  ...EAST_STATES,
  ...CENTRAL_STATES,
  ...WEST_STATES,
  ...NORTH_STATES,
]
