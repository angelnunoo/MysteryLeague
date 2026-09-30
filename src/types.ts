export type CaseType = 'rapido' | 'normal' | 'complejo' | 'expediente'

export type RankName = 'Aprendiz' | 'Investigador' | 'Detective' | 'Inspector' | 'Comisario'

export interface Choice {
  id: string
  label: string
}

export interface Suspect {
  id: string
  name: string
  role: string
  age: number
  summary: string
  alibi: string
}

export interface EvidenceItem {
  id: string
  title: string
  detail: string
  tag: string
}

export interface Testimony {
  id: string
  suspectId: string
  quote: string
  note: string
}

export interface TimelineEvent {
  id: string
  time: string
  text: string
}

export interface MysteryCase {
  id: string
  title: string
  subtitle: string
  type: CaseType
  location: string
  year: string
  cover: string
  emblem: 'clock' | 'mask' | 'anchor' | 'folder'
  baseXp: number
  baseCoins: number
  parSeconds: number
  synopsis: string
  story: string[]
  epilogue: string
  suspects: Suspect[]
  evidence: EvidenceItem[]
  testimonies: Testimony[]
  timeline: TimelineEvent[]
  hints: string[]
  motives: Choice[]
  methods: Choice[]
  solution: {
    culpritId: string
    motiveId: string
    methodId: string
    sequence: string[]
  }
}

export interface Profile {
  id: string
  username: string
  level: number
  xp: number
  rank: RankName
  casesSolved: number
  attempts: number
  scoreSum: number
  accuracy: number
  streak: number
  coins: number
  badgeIds: string[]
  onboardingCompleted: boolean
  avatarId: string
  lastActiveOn: string | null
  pinnedFriends: string[]
  inviteCode: string
  activeLeagueId: string | null
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface ResolutionAnswers {
  culpritId: string
  motiveId: string
  methodId: string
  sequence: string[]
}

export interface RewardSummary {
  score: number
  culpritCorrect: boolean
  motiveCorrect: boolean
  methodCorrect: boolean
  sequenceCorrect: number
  sequenceTotal: number
  timeBonus: number
  hintPenalty: number
  xp: number
  coins: number
  previousLevel: number
  newLevel: number
  previousRank: RankName
  newRank: RankName
  badgesUnlocked: string[]
  streak: number
  elapsedSeconds: number
  hintsUsed: number
}

export interface CaseRun {
  id: string
  userId: string
  caseId: string
  status: 'in_progress' | 'solved'
  startedAt: string
  solvedAt: string | null
  elapsedSeconds: number
  hintsUsed: number
  score: number | null
  xpAwarded: number
  coinsAwarded: number
  culpritCorrect: boolean | null
  answers: ResolutionAnswers | null
  reward: RewardSummary | null
  updatedAt: string
}

export interface Hypothesis {
  id: string
  text: string
  createdAt: string
}

export interface Notebook {
  userId: string
  caseId: string
  notes: string
  markedSuspects: string[]
  markedEvidence: string[]
  hypotheses: Hypothesis[]
  updatedAt: string
}

export interface DetectiveCard {
  id: string
  username: string
  xp: number
  level: number
  rank: RankName
  casesSolved: number
  accuracy: number
  streak: number
  coins: number
  badgeIds: string[]
  avatarId: string
  legend?: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
}
