export const RARITIES = {
  common: { label: 'Common', color: '#a3a3a3' },
  rare: { label: 'Rare', color: '#93c5fd' },
  epic: { label: 'Epic', color: '#c4b5fd' },
  legendary: { label: 'Legendary', color: '#fcd34d' },
}

export const RARITY_WEIGHTS = [
  { rarity: 'common', weight: 70 },
  { rarity: 'rare', weight: 20 },
  { rarity: 'epic', weight: 8 },
  { rarity: 'legendary', weight: 2 },
]

export const STAR_IDENTITIES = [
  // legendary (2)
  { id: 'orion', name: 'Orion', title: 'The Explorer', rarity: 'legendary', color: '#fff8e1', description: 'A wandering star drawn to new horizons, never content with one sky.' },
  { id: 'andromeda', name: 'Andromeda', title: 'The Eternal', rarity: 'legendary', color: '#fbcfe8', description: 'Bound across galaxies, patient as the void itself.' },

  // epic (5)
  { id: 'nova', name: 'Nova', title: 'The Creator', rarity: 'epic', color: '#c4b5fd', description: 'Burns brightest when remaking itself from nothing.' },
  { id: 'polaris', name: 'Polaris', title: 'The Guide', rarity: 'epic', color: '#e0e7ff', description: 'The steady light every traveler trusts at midnight.' },
  { id: 'phoenix', name: 'Phoenix', title: 'The Rebuilder', rarity: 'epic', color: '#fca5a5', description: 'Rises again from every quiet ending.' },
  { id: 'astra', name: 'Astra', title: 'The Pathfinder', rarity: 'epic', color: '#c7d2fe', description: 'Draws lines where no lines existed before.' },
  { id: 'zenith', name: 'Zenith', title: 'The Visionary', rarity: 'epic', color: '#fde68a', description: 'Sees what the sky has not yet placed.' },

  // rare (11)
  { id: 'sirius', name: 'Sirius', title: 'The Pioneer', rarity: 'rare', color: '#93c5fd', description: 'The first light on any frontier.' },
  { id: 'vega', name: 'Vega', title: 'The Dreamer', rarity: 'rare', color: '#bae6fd', description: 'Keeps wishes orbiting quietly, near and far.' },
  { id: 'atlas', name: 'Atlas', title: 'The Builder', rarity: 'rare', color: '#a7f3d0', description: 'Carries whole constellations on steady shoulders.' },
  { id: 'draco', name: 'Draco', title: 'The Strategist', rarity: 'rare', color: '#a5b4fc', description: 'Moves in slow, deliberate arcs across the dark.' },
  { id: 'luna', name: 'Luna', title: 'The Observer', rarity: 'rare', color: '#e9d5ff', description: 'Watches the entire sky and speaks very little.' },
  { id: 'sol', name: 'Sol', title: 'The Optimist', rarity: 'rare', color: '#fcd34d', description: 'Warmth that outlasts the longest night.' },
  { id: 'eclipse', name: 'Eclipse', title: 'The Challenger', rarity: 'rare', color: '#cbd5e1', description: 'Never afraid of being briefly hidden.' },
  { id: 'aurora', name: 'Aurora', title: 'The Innovator', rarity: 'rare', color: '#86efac', description: 'Paints the dark with colors it never had.' },
  { id: 'lyra', name: 'Lyra', title: 'The Curious', rarity: 'rare', color: '#f9a8d4', description: 'Follows every glimmer to its source.' },
  { id: 'rigel', name: 'Rigel', title: 'The Navigator', rarity: 'rare', color: '#7dd3fc', description: 'Finds true north in any amount of chaos.' },
  { id: 'altair', name: 'Altair', title: 'The Tactician', rarity: 'rare', color: '#fdba74', description: 'Always three moves ahead of the night.' },

  // common (36)
  { id: 'cassiopeia', name: 'Cassiopeia', title: 'The Poet', rarity: 'common', color: '#fff8e1', description: 'Arranges stars into quiet, patient verses.' },
  { id: 'betelgeuse', name: 'Betelgeuse', title: 'The Bold', rarity: 'common', color: '#ffd9a8', description: 'Glows loud without ever saying a word.' },
  { id: 'antares', name: 'Antares', title: 'The Constant', rarity: 'common', color: '#fca5a5', description: 'Steady in the deep red distance.' },
  { id: 'deneb', name: 'Deneb', title: 'The Distant', rarity: 'common', color: '#e0e7ff', description: 'Far away, yet brighter than the near.' },
  { id: 'aldebaran', name: 'Aldebaran', title: 'The Steady', rarity: 'common', color: '#fde68a', description: 'The dependable eye that never blinks.' },
  { id: 'procyon', name: 'Procyon', title: 'The Swift', rarity: 'common', color: '#bae6fd', description: 'Arrives just before the dawn, quietly.' },
  { id: 'capella', name: 'Capella', title: 'The Warm', rarity: 'common', color: '#fff8e1', description: 'Small, yet the whole sky can feel it.' },
  { id: 'fomalhaut', name: 'Fomalhaut', title: 'The Lone', rarity: 'common', color: '#c7d2fe', description: 'Perfectly comfortable in solitude.' },
  { id: 'arcturus', name: 'Arcturus', title: 'The Sentinel', rarity: 'common', color: '#ffd9a8', description: 'Guards the edge of the old sky.' },
  { id: 'pollux', name: 'Pollux', title: 'The Friendly', rarity: 'common', color: '#f9a8d4', description: 'Always part of a pair, never alone.' },
  { id: 'castor', name: 'Castor', title: 'The Bright', rarity: 'common', color: '#a7f3d0', description: 'Twin light, twice the reach.' },
  { id: 'regulus', name: 'Regulus', title: 'The Crowned', rarity: 'common', color: '#fde68a', description: 'Wears the sky the way others wear crowns.' },
  { id: 'spica', name: 'Spica', title: 'The Pure', rarity: 'common', color: '#e0e7ff', description: 'A single note of perfect white.' },
  { id: 'bellatrix', name: 'Bellatrix', title: 'The Fierce', rarity: 'common', color: '#93c5fd', description: "The warrior's star, unyielding and bright." },
  { id: 'merak', name: 'Merak', title: 'The Guidepost', rarity: 'common', color: '#c7d2fe', description: 'Leads the eye gently toward the pole.' },
  { id: 'dubhe', name: 'Dubhe', title: 'The Pointer', rarity: 'common', color: '#a5b4fc', description: 'Shows the way without saying a word.' },
  { id: 'alcyone', name: 'Alcyone', title: 'The Calm', rarity: 'common', color: '#bae6fd', description: 'The still eye of the silent cluster.' },
  { id: 'mizar', name: 'Mizar', title: 'The Double', rarity: 'common', color: '#fbcfe8', description: 'Two lights, one long story.' },
  { id: 'alcor', name: 'Alcor', title: 'The Companion', rarity: 'common', color: '#fff8e1', description: 'Beside the bright, completely unafraid.' },
  { id: 'electra', name: 'Electra', title: 'The Radiant', rarity: 'common', color: '#fde68a', description: 'Glows like a held breath.' },
  { id: 'maia', name: 'Maia', title: 'The Gentle', rarity: 'common', color: '#c4b5fd', description: 'Soft light, certain presence.' },
  { id: 'taygeta', name: 'Taygeta', title: 'The Quiet', rarity: 'common', color: '#e9d5ff', description: 'Spends its light listening to the night.' },
  { id: 'celaeno', name: 'Celaeno', title: 'The Hidden', rarity: 'common', color: '#7dd3fc', description: 'Found only by those who truly look.' },
  { id: 'asterope', name: 'Asterope', title: 'The Young', rarity: 'common', color: '#a7f3d0', description: 'New light with endless potential.' },
  { id: 'atria', name: 'Atria', title: 'The Southern', rarity: 'common', color: '#ffd9a8', description: 'Burns low but faithfully, always.' },
  { id: 'achernar', name: 'Achernar', title: 'The Swift', rarity: 'common', color: '#93c5fd', description: 'The fast end of the long river.' },
  { id: 'shaula', name: 'Shaula', title: 'The Stinger', rarity: 'common', color: '#fca5a5', description: 'Bright, and a little bit wild.' },
  { id: 'kaus', name: 'Kaus', title: 'The Archer', rarity: 'common', color: '#fde68a', description: 'Aims long, aims true.' },
  { id: 'sabik', name: 'Sabik', title: 'The Keen', rarity: 'common', color: '#86efac', description: 'Sees straight through the haze.' },
  { id: 'unukalhai', name: 'Unukalhai', title: 'The Old', rarity: 'common', color: '#fff8e1', description: 'Ancient light, still listening.' },
  { id: 'rastaban', name: 'Rastaban', title: 'The Watchful', rarity: 'common', color: '#c7d2fe', description: 'Never blinks, never misses.' },
  { id: 'alnasl', name: 'Alnasl', title: 'The Point', rarity: 'common', color: '#fdba74', description: 'The exact tip of the arrow.' },
  { id: 'pippen', name: 'Pippen', title: 'The Racer', rarity: 'common', color: '#bae6fd', description: 'The fastest light on the horizon.' },
  { id: 'kitalpha', name: 'Kitalpha', title: 'The Horse', rarity: 'common', color: '#a7f3d0', description: 'Carries the sky at a gentle gallop.' },
  { id: 'homam', name: 'Homam', title: 'The High', rarity: 'common', color: '#c4b5fd', description: 'Rides above the low glow of the city.' },
  { id: 'zubenelgenubi', name: 'Zubenelgenubi', title: 'The Balanced', rarity: 'common', color: '#e9d5ff', description: 'Holds the scales perfectly still.' },
]

const byId = new Map(STAR_IDENTITIES.map((s) => [s.id, s]))

export function identityById(id) {
  return byId.get(String(id).toLowerCase()) || null
}

export function randomRarity() {
  const total = RARITY_WEIGHTS.reduce((sum, r) => sum + r.weight, 0)
  let roll = Math.random() * total
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    roll -= weight
    if (roll < 0) return rarity
  }
  return 'common'
}

export function randomIdentity(rarity = null) {
  const r = rarity || randomRarity()
  const pool = STAR_IDENTITIES.filter((s) => s.rarity === r)
  return pool[Math.floor(Math.random() * pool.length)] || STAR_IDENTITIES[0]
}
