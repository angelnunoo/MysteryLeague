import type { CaseType, RankName } from '../types'

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000
export const SEASON_WEEKS = 4
export const WEEKLY_CAP = 300

export const LEAGUE_POINTS = {
  rapido: 60,
  expediente: 100,
  especial: 100,
  objetivo: 40,
} as const

export type ScoreBucket = keyof typeof LEAGUE_POINTS
export type BoardMode = 'semanal' | 'mensual' | 'general' | 'historica'
export type Prize = 'oro' | 'plata' | 'bronce'

export interface Person {
  id: string
  username: string
  avatarId: string
  level: number
  rank: RankName
  casesSolved: number
  accuracy: number
  xp: number
  badgeIds: string[]
  inviteCode: string
  legend?: boolean
}

export interface FriendRequest {
  id: string
  fromId: string
  toId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export interface Friendship {
  userLow: string
  userHigh: string
  createdAt: string
}

export interface Block {
  blockerId: string
  blockedId: string
  createdAt: string
}

export interface Conversation {
  id: string
  userLow: string
  userHigh: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
}

export interface ReadMark {
  conversationId: string
  userId: string
  lastReadAt: string
}

export interface Activity {
  id: string
  userId: string
  kind: 'case_solved' | 'level_up' | 'badge'
  text: string
  createdAt: string
}

export interface League {
  id: string
  ownerId: string
  name: string
  description: string
  avatarId: string
  inviteCode: string
  maxMembers: number
  createdAt: string
}

export interface LeagueMember {
  leagueId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: string
}

export interface LeagueInvite {
  id: string
  leagueId: string
  fromId: string
  toId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export interface PodiumEntry {
  userId: string
  place: number
  points: number
  prize: Prize
}

export interface Season {
  id: string
  leagueId: string
  number: number
  startsAt: string
  endsAt: string
  status: 'active' | 'closed'
  podium: PodiumEntry[]
}

export interface WeekScore {
  id: string
  seasonId: string
  userId: string
  weekIndex: number
  rapido: number
  expediente: number
  especial: number
  objetivo: number
}

export interface Standing {
  person: Person
  points: number
  place: number
  prize: Prize | null
}

export interface SocialSnapshot {
  people: Person[]
  requests: FriendRequest[]
  friendships: Friendship[]
  blocks: Block[]
  conversations: Conversation[]
  messages: ChatMessage[]
  reads: ReadMark[]
  activities: Activity[]
  leagues: League[]
  members: LeagueMember[]
  leagueInvites: LeagueInvite[]
  seasons: Season[]
  scores: WeekScore[]
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function inviteCodeFromId(id: string): string {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    code += ALPHABET[(hash >>> (index * 5)) & 31]
  }
  return code
}

export function makeLeagueCode(): string {
  let code = ''
  const bytes = new Uint32Array(6)
  crypto.getRandomValues(bytes)
  for (const value of bytes) code += ALPHABET[value % ALPHABET.length]
  return code
}

export function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export function otherId(low: string, high: string, mine: string): string {
  return low === mine ? high : low
}

export function weekTotal(score: Pick<WeekScore, ScoreBucket>): number {
  return score.rapido + score.expediente + score.especial + score.objetivo
}

export function bucketsForSolve(type: CaseType, isWeekly: boolean): ScoreBucket[] {
  const buckets: ScoreBucket[] = []
  if (type === 'rapido') buckets.push('rapido')
  else if (type === 'expediente') buckets.push('expediente')
  else if (type === 'complejo' || isWeekly) buckets.push('especial')
  if (isWeekly) buckets.push('objetivo')
  return buckets
}

export function applyBuckets(score: WeekScore, buckets: ScoreBucket[]): WeekScore {
  const next = { ...score }
  for (const bucket of buckets) {
    if (next[bucket] === 0) next[bucket] = LEAGUE_POINTS[bucket]
  }
  return next
}

export function seasonEnd(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() + SEASON_WEEKS * WEEK_MS).toISOString()
}

export function weekIndex(startsAt: string, now = new Date()): number {
  const delta = now.getTime() - new Date(startsAt).getTime()
  return Math.min(SEASON_WEEKS - 1, Math.max(0, Math.floor(delta / WEEK_MS)))
}

export function seasonIsOver(season: Season, now = new Date()): boolean {
  return new Date(season.endsAt).getTime() <= now.getTime()
}

export function daysLeft(endsAt: string, now = new Date()): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86400000))
}

export function prizeForPlace(place: number): Prize | null {
  if (place === 1) return 'oro'
  if (place === 2) return 'plata'
  if (place === 3) return 'bronce'
  return null
}

export function badgeForPrize(prize: Prize): string {
  if (prize === 'oro') return 'liga-oro'
  if (prize === 'plata') return 'liga-plata'
  return 'liga-bronce'
}

export function emptyScore(seasonId: string, userId: string, week: number, id: string): WeekScore {
  return { id, seasonId, userId, weekIndex: week, rapido: 0, expediente: 0, especial: 0, objetivo: 0 }
}

function rank(people: Person[], pointsOf: (person: Person) => number): Standing[] {
  return [...people]
    .map((person) => ({ person, points: pointsOf(person) }))
    .sort((a, b) => b.points - a.points || a.person.username.localeCompare(b.person.username, 'es'))
    .map((row, index) => ({
      ...row,
      place: index + 1,
      prize: prizeForPlace(index + 1),
    }))
}

export function buildBoard(input: {
  people: Person[]
  season: Season
  seasons: Season[]
  scores: WeekScore[]
  mode: BoardMode
  now?: Date
}): Standing[] {
  const now = input.now ?? new Date()
  const seasonScores = input.scores.filter((score) => score.seasonId === input.season.id)
  const currentWeek = weekIndex(input.season.startsAt, now)

  return rank(input.people, (person) => {
    if (input.mode === 'semanal') {
      const row = seasonScores.find((score) => score.userId === person.id && score.weekIndex === currentWeek)
      return row ? weekTotal(row) : 0
    }
    if (input.mode === 'mensual') {
      const month = now.getMonth()
      const year = now.getFullYear()
      return seasonScores
        .filter((score) => score.userId === person.id)
        .filter((score) => {
          const start = new Date(new Date(input.season.startsAt).getTime() + score.weekIndex * WEEK_MS)
          return start.getMonth() === month && start.getFullYear() === year
        })
        .reduce((sum, score) => sum + weekTotal(score), 0)
    }
    if (input.mode === 'historica') {
      const past = input.seasons
        .filter((season) => season.leagueId === input.season.leagueId && season.status === 'closed')
        .flatMap((season) => season.podium)
        .filter((entry) => entry.userId === person.id)
        .reduce((sum, entry) => sum + entry.points, 0)
      const current = seasonScores.filter((score) => score.userId === person.id).reduce((sum, score) => sum + weekTotal(score), 0)
      return past + current
    }
    return seasonScores.filter((score) => score.userId === person.id).reduce((sum, score) => sum + weekTotal(score), 0)
  })
}

export function currentWeekScore(scores: WeekScore[], season: Season, userId: string, now = new Date()): WeekScore | undefined {
  const week = weekIndex(season.startsAt, now)
  return scores.find((score) => score.seasonId === season.id && score.userId === userId && score.weekIndex === week)
}

export function inviteUrl(code: string): string {
  return `${window.location.origin}/i/${code}`
}

export function leagueUrl(code: string): string {
  return `${window.location.origin}/l/${code}`
}

export function whatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export const INVITE_MESSAGE = 'Únete a mi investigación en MysteryLeague'

export function personById(snapshot: SocialSnapshot, id: string): Person | undefined {
  return snapshot.people.find((person) => person.id === id)
}

export function isBlocked(snapshot: SocialSnapshot, a: string, b: string): boolean {
  return snapshot.blocks.some(
    (block) =>
      (block.blockerId === a && block.blockedId === b) || (block.blockerId === b && block.blockedId === a),
  )
}

export function isFriend(snapshot: SocialSnapshot, a: string, b: string): boolean {
  const [low, high] = pair(a, b)
  return snapshot.friendships.some((row) => row.userLow === low && row.userHigh === high)
}

export function friendIds(snapshot: SocialSnapshot, userId: string): string[] {
  return snapshot.friendships
    .filter((row) => row.userLow === userId || row.userHigh === userId)
    .map((row) => otherId(row.userLow, row.userHigh, userId))
}

export function conversationWith(snapshot: SocialSnapshot, a: string, b: string): Conversation | undefined {
  const [low, high] = pair(a, b)
  return snapshot.conversations.find((row) => row.userLow === low && row.userHigh === high)
}

export function unreadMessages(snapshot: SocialSnapshot, userId: string, conversationId: string): number {
  const mark = snapshot.reads.find((row) => row.conversationId === conversationId && row.userId === userId)
  const cursor = mark ? new Date(mark.lastReadAt).getTime() : 0
  return snapshot.messages.filter(
    (message) =>
      message.conversationId === conversationId &&
      message.senderId !== userId &&
      new Date(message.createdAt).getTime() > cursor,
  ).length
}

export interface Notice {
  id: string
  title: string
  body: string
  href: string
  createdAt: string
}

export function noticesFor(snapshot: SocialSnapshot, userId: string): Notice[] {
  const requests = snapshot.requests
    .filter((request) => request.toId === userId && request.status === 'pending')
    .map((request) => ({
      id: `req-${request.id}`,
      title: 'Solicitud de amistad',
      body: `${personById(snapshot, request.fromId)?.username ?? 'Alguien'} quiere investigar contigo.`,
      href: '/social?tab=amigos',
      createdAt: request.createdAt,
    }))
  const invites = snapshot.leagueInvites
    .filter((invite) => invite.toId === userId && invite.status === 'pending')
    .map((invite) => ({
      id: `liga-${invite.id}`,
      title: 'Invitación a una liga',
      body: `${snapshot.leagues.find((league) => league.id === invite.leagueId)?.name ?? 'Una liga'} te espera.`,
      href: '/liga',
      createdAt: invite.createdAt,
    }))
  const chats = snapshot.conversations
    .map((conversation) => {
      const count = unreadMessages(snapshot, userId, conversation.id)
      const friendId = otherId(conversation.userLow, conversation.userHigh, userId)
      const latest = snapshot.messages
        .filter((message) => message.conversationId === conversation.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return count > 0 && latest
        ? {
            id: `chat-${conversation.id}`,
            title: personById(snapshot, friendId)?.username ?? 'Mensaje',
            body: latest.body,
            href: `/social/chat/${friendId}`,
            createdAt: latest.createdAt,
          }
        : null
    })
    .filter((notice): notice is Notice => Boolean(notice))
  return [...requests, ...invites, ...chats].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function emptySnapshot(): SocialSnapshot {
  return {
    people: [],
    requests: [],
    friendships: [],
    blocks: [],
    conversations: [],
    messages: [],
    reads: [],
    activities: [],
    leagues: [],
    members: [],
    leagueInvites: [],
    seasons: [],
    scores: [],
  }
}
