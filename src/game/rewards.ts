import { todayISO, yesterdayISO } from '../lib/format'
import type { CaseType, MysteryCase, Profile, ResolutionAnswers, RewardSummary } from '../types'
import { withProgress } from './ranks'
import { scoreResolution } from './scoring'

export function applyCaseReward(input: {
  mystery: MysteryCase
  answers: ResolutionAnswers
  elapsedSeconds: number
  hintsUsed: number
  profile: Profile
  previouslySolvedTypes: CaseType[]
}): { summary: RewardSummary; profile: Profile } {
  const scored = scoreResolution(input.mystery, input.answers, input.elapsedSeconds, input.hintsUsed)
  const rawXp = Math.round(input.mystery.baseXp * (scored.score / 100))
  const xp = scored.culpritCorrect ? rawXp : Math.round(rawXp * 0.25)
  const coins = scored.culpritCorrect ? Math.round(input.mystery.baseCoins * (scored.score / 100)) : 0
  const previous = withProgress(input.profile)
  const today = todayISO()

  let streak = previous.streak
  if (scored.culpritCorrect) {
    if (previous.lastActiveOn === today) streak = Math.max(previous.streak, 1)
    else if (previous.lastActiveOn === yesterdayISO()) streak = previous.streak + 1
    else streak = 1
  }

  const progressed = withProgress({
    ...previous,
    xp: previous.xp + xp,
    coins: previous.coins + coins,
    attempts: previous.attempts + 1,
    scoreSum: previous.scoreSum + scored.score,
    casesSolved: previous.casesSolved + (scored.culpritCorrect ? 1 : 0),
    streak: scored.culpritCorrect ? streak : previous.streak,
    lastActiveOn: scored.culpritCorrect ? today : previous.lastActiveOn,
  })

  const owned = new Set(previous.badgeIds)
  const unlocked: string[] = []
  const grant = (id: string) => {
    if (owned.has(id)) return
    owned.add(id)
    unlocked.push(id)
  }

  if (scored.culpritCorrect && progressed.casesSolved === 1) grant('primer-caso')
  if (scored.culpritCorrect && input.hintsUsed === 0) grant('sin-pistas')
  if (
    scored.culpritCorrect &&
    scored.motiveCorrect &&
    scored.methodCorrect &&
    scored.sequenceCorrect === scored.sequenceTotal
  ) {
    grant('precision')
  }
  if (scored.culpritCorrect && input.elapsedSeconds <= input.mystery.parSeconds) grant('veloz')
  if (scored.culpritCorrect && input.mystery.type === 'expediente') grant('expediente')

  const types = new Set(input.previouslySolvedTypes)
  if (scored.culpritCorrect) types.add(input.mystery.type)
  if (types.size >= 4) grant('coleccion')
  if (progressed.streak >= 3) grant('racha-3')
  if (progressed.streak >= 7) grant('racha-7')
  if (progressed.level >= 6) grant('investigador')
  if (progressed.level >= 16) grant('detective')
  if (progressed.level >= 31) grant('inspector')
  if (progressed.level >= 51) grant('comisario')

  const profile = { ...progressed, badgeIds: [...owned] }
  return {
    profile,
    summary: {
      ...scored,
      xp,
      coins,
      previousLevel: previous.level,
      newLevel: profile.level,
      previousRank: previous.rank,
      newRank: profile.rank,
      badgesUnlocked: unlocked,
      streak: profile.streak,
      elapsedSeconds: input.elapsedSeconds,
      hintsUsed: input.hintsUsed,
    },
  }
}
