export const COMPETITIVE_RANKS = [
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Diamante',
  'Maestro',
  'Leyenda',
] as const

export type CompetitiveRankName = (typeof COMPETITIVE_RANKS)[number]

const FLOORS: Array<{ rank: CompetitiveRankName; from: number }> = [
  { rank: 'Bronce', from: 0 },
  { rank: 'Plata', from: 100 },
  { rank: 'Oro', from: 220 },
  { rank: 'Platino', from: 380 },
  { rank: 'Diamante', from: 560 },
  { rank: 'Maestro', from: 780 },
  { rank: 'Leyenda', from: 1000 },
]

export function rankIndex(rank: CompetitiveRankName): number {
  return COMPETITIVE_RANKS.indexOf(rank)
}

export function rankFromPoints(points: number): CompetitiveRankName {
  let current: CompetitiveRankName = 'Bronce'
  for (const step of FLOORS) {
    if (points >= step.from) current = step.rank
  }
  return current
}

export function rankProgress(points: number): { into: number; need: number; ratio: number; next: CompetitiveRankName | null } {
  const rank = rankFromPoints(points)
  const index = rankIndex(rank)
  const floor = FLOORS[index]?.from ?? 0
  const next = FLOORS[index + 1]
  if (!next) return { into: points - floor, need: 0, ratio: 1, next: null }
  const span = next.from - floor
  const into = Math.max(0, points - floor)
  return { into, need: span, ratio: span === 0 ? 1 : Math.min(1, into / span), next: next.rank }
}

export function competitivePoints(input: {
  accuracy: number
  casesSolved: number
  leagueWins: number
  weeklyPlace: number | null
  eventClears: number
  communityPosts: number
  dossierRead: number
}): number {
  let points = 0
  points += Math.min(200, Math.round(input.accuracy * 1.2))
  points += Math.min(160, input.casesSolved * 12)
  points += input.leagueWins * 80
  if (input.weeklyPlace === 1) points += 60
  else if (input.weeklyPlace != null && input.weeklyPlace <= 3) points += 30
  points += input.eventClears * 40
  points += Math.min(80, input.communityPosts * 10)
  points += Math.min(120, input.dossierRead * 6)
  return points
}
