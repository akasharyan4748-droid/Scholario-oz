// Type definitions for the cascading Indian address data:
// Country → State → District → City.

export interface DistrictData {
  name: string
  cities: string[]
}

export interface StateData {
  name: string
  districts: DistrictData[]
}
