/* ============================================================
   indian-address/index.ts
   Barrel re-export for the cascading Indian address data and
   query helpers.

   Backward-compatibility entry point: every named export that
   used to live in the monolithic `indian-address.ts` is
   re-exported here so existing imports like:
       import { COUNTRIES, getStatesForCountry, validateIndianPin } from '@/lib/indian-address'
   continue to resolve unchanged.
   ============================================================ */

export type { DistrictData, StateData } from './types'
export { COUNTRIES, PIN_REGEX } from './constants'
export { INDIAN_STATES } from './states-data'
export {
  getStatesForCountry,
  getDistrictsForState,
  getCitiesForDistrict,
  validateIndianPin,
} from './queries'
