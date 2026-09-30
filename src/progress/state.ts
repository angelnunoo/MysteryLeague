import type { CompetitiveRankName } from './competitive'

export interface RankMark {
  rank: CompetitiveRankName
  at: string
}

export interface ProgressState {
  claimed: string[]
  observedStreak: number
  streakNotice: string | null
  rank: CompetitiveRankName
  rankHistory: RankMark[]
  dossierRead: number
  theories: string[]
  missionClaims: string[]
}

export function emptyProgress(at = new Date().toISOString()): ProgressState {
  return {
    claimed: [],
    observedStreak: 0,
    streakNotice: null,
    rank: 'Bronce',
    rankHistory: [{ rank: 'Bronce', at }],
    dossierRead: 0,
    theories: [],
    missionClaims: [],
  }
}

export function normalizeProgress(raw: unknown): ProgressState {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  const value = raw as Partial<ProgressState>
  return {
    ...base,
    ...value,
    claimed: Array.isArray(value.claimed) ? value.claimed.filter((item) => typeof item === 'string') : [],
    theories: Array.isArray(value.theories) ? value.theories.filter((item) => typeof item === 'string').slice(0, 12) : [],
    missionClaims: Array.isArray(value.missionClaims) ? value.missionClaims.filter((item) => typeof item === 'string') : [],
    rankHistory:
      Array.isArray(value.rankHistory) && value.rankHistory.length > 0
        ? value.rankHistory.filter((item) => item && typeof item.rank === 'string' && typeof item.at === 'string').slice(-12)
        : base.rankHistory,
    rank: value.rank ?? 'Bronce',
    dossierRead: typeof value.dossierRead === 'number' ? value.dossierRead : 0,
    observedStreak: typeof value.observedStreak === 'number' ? value.observedStreak : 0,
    streakNotice: typeof value.streakNotice === 'string' ? value.streakNotice : null,
  }
}
