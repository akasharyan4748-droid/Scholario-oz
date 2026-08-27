// Achievements module: shared config maps for badge rarity.
//
// No JSX render components live here — only the static `rarityStyles` map.

export const rarityStyles: Record<string, { ring: string; glow: string; label: string }> = {
  common: { ring: 'ring-slate-300/50', glow: 'shadow-slate-400/20', label: 'Common' },
  rare: { ring: 'ring-sky-400/50', glow: 'shadow-sky-400/30', label: 'Rare' },
  epic: { ring: 'ring-violet-400/50', glow: 'shadow-violet-400/30', label: 'Epic' },
  legendary: { ring: 'ring-amber-400/60', glow: 'shadow-amber-400/40', label: 'Legendary' },
}
