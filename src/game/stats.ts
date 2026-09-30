import type { CaseRun, Profile } from '../types'

const KEY = 'ml-player-meta'

interface Meta {
  bestStreak: number
}

function read(): Meta {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { bestStreak: 0 }
    return { bestStreak: 0, ...(JSON.parse(raw) as Partial<Meta>) }
  } catch {
    return { bestStreak: 0 }
  }
}

export function rememberStreak(streak: number): number {
  const meta = read()
  const best = Math.max(meta.bestStreak, streak)
  localStorage.setItem(KEY, JSON.stringify({ bestStreak: best }))
  return best
}

export function bestStreak(current: number): number {
  return Math.max(read().bestStreak, current)
}

export interface PlayerStats {
  averageSeconds: number
  accuracy: number
  casesSolved: number
  leagueWins: number
  bestStreak: number
  hintsUsed: number
}

export function playerStats(input: {
  profile: Profile
  runs: CaseRun[]
  leagueWins: number
}): PlayerStats {
  const solved = input.runs.filter((run) => run.status === 'solved')
  const averageSeconds = solved.length
    ? Math.round(solved.reduce((sum, run) => sum + run.elapsedSeconds, 0) / solved.length)
    : 0
  return {
    averageSeconds,
    accuracy: input.profile.accuracy,
    casesSolved: input.profile.casesSolved,
    leagueWins: input.leagueWins,
    bestStreak: bestStreak(input.profile.streak),
    hintsUsed: solved.reduce((sum, run) => sum + run.hintsUsed, 0),
  }
}
