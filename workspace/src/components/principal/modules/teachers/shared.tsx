// Shared helpers and constants for the Teachers module.

/**
 * Deterministically pick a vibrant gradient for an entity (teacher / position card)
 * based on its id. Keeps avatar colours stable across re-renders.
 */
export const accentGradients = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-pink-500',
  'from-orange-400 to-red-500',
]

export function gradientFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return accentGradients[Math.abs(hash) % accentGradients.length]
}
