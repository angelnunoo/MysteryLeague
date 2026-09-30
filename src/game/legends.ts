import { progressFromXp } from './ranks'
import type { DetectiveCard } from '../types'

const RAW = [
  { id: 'legend-sello', username: 'SelloRojo', xp: 5400, casesSolved: 61, accuracy: 94, streak: 12, coins: 980, badgeIds: ['primer-caso', 'precision', 'detective', 'expediente'], avatarId: 'crown' },
  { id: 'legend-vega', username: 'VegaNocturna', xp: 2480, casesSolved: 33, accuracy: 88, streak: 4, coins: 540, badgeIds: ['primer-caso', 'sin-pistas', 'investigador'], avatarId: 'raven' },
  { id: 'legend-archivo', username: 'ArchivoSur', xp: 860, casesSolved: 14, accuracy: 76, streak: 2, coins: 210, badgeIds: ['primer-caso', 'veloz'], avatarId: 'seal' },
  { id: 'legend-nube', username: 'NubeGris', xp: 310, casesSolved: 6, accuracy: 71, streak: 1, coins: 90, badgeIds: ['primer-caso'], avatarId: 'coat' },
  { id: 'legend-luz', username: 'LuzDeGas', xp: 140, casesSolved: 2, accuracy: 64, streak: 0, coins: 40, badgeIds: ['primer-caso'], avatarId: 'key' },
  { id: 'legend-muelle', username: 'Muelle13', xp: 40, casesSolved: 1, accuracy: 58, streak: 1, coins: 15, badgeIds: ['primer-caso'], avatarId: 'lens' },
] as const

export const LEGENDS: DetectiveCard[] = RAW.map((rival) => {
  const progress = progressFromXp(rival.xp)
  return {
    ...rival,
    badgeIds: [...rival.badgeIds],
    level: progress.level,
    rank: progress.rank,
    legend: true,
  }
})
