import type { Profile, RankName } from '../types'

export function xpRequiredForLevel(level: number): number {
  return 50 + (level - 1) * 25
}

export function totalXpToReachLevel(level: number): number {
  let total = 0
  for (let current = 1; current < level; current += 1) {
    total += xpRequiredForLevel(current)
  }
  return total
}

export function levelFromTotalXp(xp: number): number {
  let level = 1
  let remaining = Math.max(0, xp)
  while (level < 99) {
    const need = xpRequiredForLevel(level)
    if (remaining < need) break
    remaining -= need
    level += 1
  }
  return level
}

export function rankForLevel(level: number): RankName {
  if (level <= 5) return 'Aprendiz'
  if (level <= 15) return 'Investigador'
  if (level <= 30) return 'Detective'
  if (level <= 50) return 'Inspector'
  return 'Comisario'
}

export function progressFromXp(xp: number) {
  const level = levelFromTotalXp(xp)
  const into = xp - totalXpToReachLevel(level)
  const need = xpRequiredForLevel(level)
  return {
    level,
    into,
    need,
    ratio: need === 0 ? 0 : into / need,
    rank: rankForLevel(level),
  }
}

export function withProgress(profile: Profile): Profile {
  const progress = progressFromXp(profile.xp)
  const accuracy = profile.attempts > 0 ? Math.round(profile.scoreSum / profile.attempts) : 0
  return {
    ...profile,
    level: progress.level,
    rank: progress.rank,
    accuracy,
  }
}

export const RANK_LADDER: Array<{ rank: RankName; from: number; to: string; blurb: string }> = [
  { rank: 'Aprendiz', from: 1, to: '5', blurb: 'Aprendes a mirar dos veces.' },
  { rank: 'Investigador', from: 6, to: '15', blurb: 'Las coartadas ya no te engañan.' },
  { rank: 'Detective', from: 16, to: '30', blurb: 'La ciudad empieza a hablarte.' },
  { rank: 'Inspector', from: 31, to: '50', blurb: 'Cierras expedientes que otros abandonan.' },
  { rank: 'Comisario', from: 51, to: '∞', blurb: 'La liga lleva tu nombre.' },
]
