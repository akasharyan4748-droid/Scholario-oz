// Transport module: derived datasets computed from the operations mock.
//
// No JSX render components live here — only the route-distribution / capacity
// chart datasets derived once at module scope, plus the shared `TransportRoute`
// type alias used by the routes table + tracking sheet.

import { transportRoutes } from '@/lib/mock/operations'

export type TransportRoute = typeof transportRoutes[number]

export const ROUTE_DISTRIBUTION = transportRoutes.map((r, i) => ({
  name: `R${i + 1}`,
  value: r.students,
  color: ['oklch(0.55 0.14 162)', 'oklch(0.65 0.16 75)', 'oklch(0.7 0.15 200)', 'oklch(0.6 0.18 300)', 'oklch(0.62 0.2 25)', 'oklch(0.55 0.16 250)'][i % 6],
}))

export const CAPACITY_UTIL = transportRoutes.map((r, i) => ({
  name: `R${i + 1}`,
  value: Math.round((r.students / r.capacity) * 100),
}))
