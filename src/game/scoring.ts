import type { MysteryCase, ResolutionAnswers } from '../types'

export interface ScoreBreakdown {
  score: number
  culpritCorrect: boolean
  motiveCorrect: boolean
  methodCorrect: boolean
  sequenceCorrect: number
  sequenceTotal: number
  timeBonus: number
  hintPenalty: number
}

export function scoreResolution(
  mystery: MysteryCase,
  answers: ResolutionAnswers,
  elapsedSeconds: number,
  hintsUsed: number,
): ScoreBreakdown {
  const culpritCorrect = answers.culpritId === mystery.solution.culpritId
  const motiveCorrect = answers.motiveId === mystery.solution.motiveId
  const methodCorrect = answers.methodId === mystery.solution.methodId
  const sequenceTotal = mystery.solution.sequence.length
  const sequenceCorrect = mystery.solution.sequence.reduce(
    (count, id, index) => count + (answers.sequence[index] === id ? 1 : 0),
    0,
  )

  const answerPoints =
    (culpritCorrect ? 35 : 0) +
    (motiveCorrect ? 20 : 0) +
    (methodCorrect ? 20 : 0) +
    Math.round((sequenceTotal === 0 ? 0 : sequenceCorrect / sequenceTotal) * 15)

  const timeRatio = Math.min(1, mystery.parSeconds / Math.max(elapsedSeconds, 30))
  const timeBonus = Math.round(timeRatio * 10)
  const hintPenalty = hintsUsed * 4
  const score = Math.max(0, Math.min(100, answerPoints + timeBonus - hintPenalty))

  return {
    score,
    culpritCorrect,
    motiveCorrect,
    methodCorrect,
    sequenceCorrect,
    sequenceTotal,
    timeBonus,
    hintPenalty,
  }
}
