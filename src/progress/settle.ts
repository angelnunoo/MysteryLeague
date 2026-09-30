import { competitivePoints, rankFromPoints, rankIndex, type CompetitiveRankName } from './competitive'
import { eventByCase } from './events'
import type { ProgressState } from './state'
import { STREAK_BREAK_COPY, STREAK_MILESTONES } from './streaks'

export interface SettleInput {
  level: number
  streak: number
  accuracy: number
  casesSolved: number
  badgeIds: string[]
  seasonWinIds: string[]
  weeklyPlace: number | null
  communityPosts: number
  eventSolved: string[]
  createdAt: string
}

export interface Settlement {
  changed: boolean
  credits: number
  xp: number
  badges: string[]
  items: string[]
  reason: string
  rankUp: CompetitiveRankName | null
  points: number
  state: ProgressState
}

export function settle(state: ProgressState, input: SettleInput): Settlement {
  const claimed = new Set(state.claimed)
  let credits = 0
  const badges: string[] = []
  const items: string[] = []
  const reasons: string[] = []
  let notice = state.streakNotice

  if (state.observedStreak >= 2 && input.streak < state.observedStreak && notice !== STREAK_BREAK_COPY) {
    notice = STREAK_BREAK_COPY
  }

  for (const step of STREAK_MILESTONES) {
    const key = `racha-${step.days}`
    if (input.streak >= step.days && !claimed.has(key)) {
      claimed.add(key)
      credits += step.credits
      if (step.badge) badges.push(step.badge)
      if (step.item) items.push(step.item)
      reasons.push(step.label)
    }
  }

  for (let level = 2; level <= input.level; level += 1) {
    const key = `nivel-${level}`
    if (!claimed.has(key)) {
      claimed.add(key)
      credits += 20
      reasons.push(`Nivel ${level}`)
    }
  }

  for (const id of input.badgeIds) {
    const key = `logro-${id}`
    if (!claimed.has(key)) {
      claimed.add(key)
      credits += 12
      reasons.push('Logro')
    }
  }

  for (const seasonId of input.seasonWinIds) {
    const key = `temporada-${seasonId}`
    if (!claimed.has(key)) {
      claimed.add(key)
      credits += 100
      reasons.push('Temporada ganada')
    }
  }

  for (const caseId of input.eventSolved) {
    const key = `evento-${caseId}`
    if (claimed.has(key)) continue
    claimed.add(key)
    credits += 40
    const event = eventByCase(caseId)
    if (event) {
      badges.push(event.badgeId)
      items.push(event.cosmeticId)
      reasons.push(event.name)
    }
  }

  if (state.dossierRead >= 20 && !claimed.has('ravenhill-fin')) {
    claimed.add('ravenhill-fin')
    credits += 80
    badges.push('orden-ravenhill')
    reasons.push('Expediente Ravenhill')
  }

  const points = competitivePoints({
    accuracy: input.accuracy,
    casesSolved: input.casesSolved,
    leagueWins: input.seasonWinIds.length,
    weeklyPlace: input.weeklyPlace,
    eventClears: input.eventSolved.length,
    communityPosts: input.communityPosts,
    dossierRead: state.dossierRead,
  })
  const rank = rankFromPoints(points)
  let rankHistory = state.rankHistory
  let rankUp: CompetitiveRankName | null = null
  if (rank !== state.rank) {
    if (rankIndex(rank) > rankIndex(state.rank)) rankUp = rank
    rankHistory = [...state.rankHistory, { rank, at: new Date().toISOString() }].slice(-12)
  } else if (rankHistory.length === 0) {
    rankHistory = [{ rank, at: input.createdAt }]
  }

  const next: ProgressState = {
    ...state,
    claimed: [...claimed],
    observedStreak: input.streak,
    streakNotice: notice,
    rank,
    rankHistory,
  }

  const changed =
    credits > 0 ||
    badges.length > 0 ||
    items.length > 0 ||
    rank !== state.rank ||
    notice !== state.streakNotice ||
    input.streak !== state.observedStreak ||
    next.claimed.length !== state.claimed.length

  return {
    changed,
    credits,
    xp: 0,
    badges,
    items,
    reason: reasons[0] ?? 'Investigación',
    rankUp,
    points,
    state: next,
  }
}
