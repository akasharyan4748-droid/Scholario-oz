// Top-level constants for the Indian address cascading dropdowns.

export const COUNTRIES = ['India'] as const

// Indian PIN codes: 6 digits, first digit 1–8 (no 0 or 9 start).
export const PIN_REGEX = /^[1-8][0-9]{5}$/
