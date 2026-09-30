import { BADGES } from '../game/badges'
import { LEGENDS } from '../game/legends'
import { createId } from '../lib/format'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  applyBuckets,
  bucketsForSolve,
  conversationWith,
  emptyScore,
  inviteCodeFromId,
  isBlocked,
  isFriend,
  makeLeagueCode,
  pair,
  seasonEnd,
  seasonIsOver,
  weekIndex,
  weekTotal,
  type Activity,
  type Block,
  type ChatMessage,
  type Conversation,
  type FriendRequest,
  type Friendship,
  type League,
  type LeagueInvite,
  type LeagueMember,
  type Person,
  type ReadMark,
  type ScoreBucket,
  type Season,
  type SocialSnapshot,
  type WeekScore,
} from '../social/logic'
import type { CaseType, Profile, RankName } from '../types'

const SOCIAL_KEY = 'ml-social'
const SOCIAL_EVENT = 'ml-social'

interface Stored {
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

const EMPTY: Stored = {
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

const LEGEND_LINES = [
  'Interesante. El reloj no miente, la gente sí.',
  'He visto ese expediente. Mira la hora, no el testigo.',
  'Si necesitas una segunda lectura, aquí estoy.',
  'No cierres el caso hasta que el motivo encaje.',
]

let writeChain = Promise.resolve()

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(SOCIAL_KEY)
    if (!raw) return structuredClone(EMPTY)
    const parsed = JSON.parse(raw) as Partial<Stored>
    return { ...structuredClone(EMPTY), ...parsed }
  } catch {
    return structuredClone(EMPTY)
  }
}

function writeStored(state: Stored) {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(state))
}

function mutate(change: (state: Stored) => void): Promise<Stored> {
  const run = writeChain.then(() => {
    const state = readStored()
    change(state)
    writeStored(state)
    return state
  })
  writeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function emit() {
  window.dispatchEvent(new Event(SOCIAL_EVENT))
}

function readLocalProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem('ml-db')
    if (!raw) return []
    const parsed = JSON.parse(raw) as { profiles?: Record<string, Partial<Profile>> }
    return Object.values(parsed.profiles ?? {}).filter((row): row is Profile => Boolean(row?.id && row.username))
  } catch {
    return []
  }
}

function toPerson(profile: Partial<Profile> & { id: string; username: string }, legend = false): Person {
  return {
    id: profile.id,
    username: profile.username,
    avatarId: profile.avatarId || 'lens',
    level: profile.level ?? 1,
    rank: profile.rank ?? 'Aprendiz',
    casesSolved: profile.casesSolved ?? 0,
    accuracy: profile.accuracy ?? 0,
    xp: profile.xp ?? 0,
    badgeIds: profile.badgeIds ?? [],
    inviteCode: profile.inviteCode || inviteCodeFromId(profile.id),
    legend,
  }
}

function localPeople(state: Stored): Person[] {
  const people = readLocalProfiles().map((profile) => toPerson(profile))
  const known = new Set(people.map((person) => person.id))
  const referenced = new Set<string>()
  for (const row of state.friendships) {
    referenced.add(row.userLow)
    referenced.add(row.userHigh)
  }
  for (const row of state.requests) {
    referenced.add(row.fromId)
    referenced.add(row.toId)
  }
  for (const row of state.members) referenced.add(row.userId)
  for (const row of state.activities) referenced.add(row.userId)
  for (const legend of LEGENDS) {
    if (!known.has(legend.id) && referenced.has(legend.id)) {
      people.push(
        toPerson(
          {
            id: legend.id,
            username: legend.username,
            avatarId: legend.avatarId,
            level: legend.level,
            rank: legend.rank,
            casesSolved: legend.casesSolved,
            accuracy: legend.accuracy,
            xp: legend.xp,
            badgeIds: [...legend.badgeIds],
          },
          true,
        ),
      )
    }
  }
  return people
}

function hydrate(state: Stored): SocialSnapshot {
  return { ...state, people: localPeople(state) }
}

function rollLocal(state: Stored, userId: string): boolean {
  let changed = false
  const leagueIds = state.members.filter((member) => member.userId === userId).map((member) => member.leagueId)
  for (const leagueId of new Set(leagueIds)) {
    const active = state.seasons.find((season) => season.leagueId === leagueId && season.status === 'active')
    if (!active || !seasonIsOver(active)) continue
    const memberIds = state.members.filter((member) => member.leagueId === leagueId).map((member) => member.userId)
    const ranked = memberIds
      .map((id) => ({
        userId: id,
        points: state.scores
          .filter((score) => score.seasonId === active.id && score.userId === id)
          .reduce((sum, score) => sum + weekTotal(score), 0),
      }))
      .filter((row) => row.points > 0)
      .sort((a, b) => b.points - a.points)
    active.status = 'closed'
    active.podium = ranked.slice(0, 3).map((row, index) => ({
      userId: row.userId,
      place: index + 1,
      points: row.points,
      prize: index === 0 ? 'oro' : index === 1 ? 'plata' : 'bronce',
    }))
    const startsAt = new Date().toISOString()
    state.seasons.push({
      id: createId(),
      leagueId,
      number: active.number + 1,
      startsAt,
      endsAt: seasonEnd(startsAt),
      status: 'active',
      podium: [],
    })
    changed = true
  }
  return changed
}

function assertDb() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function explain(error: { message: string }): Error {
  if (/does not exist|schema cache|Could not find/i.test(error.message)) {
    return new Error('Falta el esquema social. Ejecuta supabase/schema.sql en el editor SQL.')
  }
  return new Error(error.message)
}

function must<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw explain(result.error)
  return result.data
}

export async function loadSocial(userId: string): Promise<SocialSnapshot> {
  if (!isSupabaseConfigured) {
    const state = readStored()
    if (rollLocal(state, userId)) writeStored(state)
    return hydrate(state)
  }
  return remoteLoad(userId)
}

export function subscribeSocial(userId: string, onChange: () => void): () => void {
  const client = supabase
  if (!client) {
    const handler = () => onChange()
    window.addEventListener(SOCIAL_EVENT, handler)
    return () => window.removeEventListener(SOCIAL_EVENT, handler)
  }
  const channel = client
    .channel(`social-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'league_invites' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => onChange())
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

export function openTypingChannel(
  conversationId: string,
  userId: string,
  onRemote: (from: string, typing: boolean) => void,
) {
  const client = supabase
  if (!client) {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ conversationId: string; userId: string; typing: boolean }>).detail
      if (!detail || detail.conversationId !== conversationId || detail.userId === userId) return
      onRemote(detail.userId, detail.typing)
    }
    window.addEventListener('ml-typing', handler)
    return {
      push(_typing: boolean) {},
      close() {
        window.removeEventListener('ml-typing', handler)
      },
    }
  }
  const channel = client.channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } })
  channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
    const data = payload as { userId?: string; typing?: boolean }
    if (data.userId && data.userId !== userId) onRemote(data.userId, Boolean(data.typing))
  })
  void channel.subscribe()
  return {
    push(typing: boolean) {
      void channel.send({ type: 'broadcast', event: 'typing', payload: { userId, typing } })
    },
    close() {
      void client.removeChannel(channel)
    },
  }
}

export async function searchPeople(userId: string, query: string, snapshot: SocialSnapshot): Promise<Person[]> {
  const needle = query.trim().toLowerCase().replace(/[%_,]/g, '')
  if (needle.length < 2) return []
  let found: Person[] = []
  if (!supabase) {
    const locals = readLocalProfiles().map((profile) => toPerson(profile))
    const legends = LEGENDS.map((legend) =>
      toPerson(
        {
          id: legend.id,
          username: legend.username,
          avatarId: legend.avatarId,
          level: legend.level,
          rank: legend.rank,
          casesSolved: legend.casesSolved,
          accuracy: legend.accuracy,
          xp: legend.xp,
          badgeIds: [...legend.badgeIds],
          inviteCode: inviteCodeFromId(legend.id),
        },
        true,
      ),
    )
    found = [...locals, ...legends]
  } else {
    const result = await supabase.from('profiles').select('*').ilike('username', `%${needle}%`).limit(12)
    found = (must(result) as ProfileRow[]).map(rowToPerson)
  }
  return found
    .filter((person) => person.id !== userId && person.username.toLowerCase().includes(needle))
    .filter((person) => !isBlocked(snapshot, userId, person.id))
    .slice(0, 8)
}

export async function lookupPerson(username: string): Promise<Person | null> {
  const needle = username.trim().toLowerCase()
  if (!supabase) {
    const local = readLocalProfiles().find((profile) => profile.username.toLowerCase() === needle)
    if (local) return toPerson(local)
    const legend = LEGENDS.find((card) => card.username.toLowerCase() === needle)
    if (!legend) return null
    return toPerson(
      {
        id: legend.id,
        username: legend.username,
        avatarId: legend.avatarId,
        level: legend.level,
        rank: legend.rank,
        casesSolved: legend.casesSolved,
        accuracy: legend.accuracy,
        xp: legend.xp,
        badgeIds: [...legend.badgeIds],
      },
      true,
    )
  }
  const result = await supabase.from('profiles').select('*').ilike('username', needle).limit(1)
  const rows = must(result) as ProfileRow[]
  return rows[0] ? rowToPerson(rows[0]) : null
}

export async function sendRequest(userId: string, targetId: string): Promise<void> {
  if (userId === targetId) throw new Error('No puedes añadirte a ti mismo.')
  if (!supabase) {
    const state = readStored()
    if (isBlocked(hydrate(state), userId, targetId)) throw new Error('No podéis contactar.')
    if (isFriend(hydrate(state), userId, targetId)) throw new Error('Ya sois amigos.')
    const pending = state.requests.some(
      (request) =>
        request.status === 'pending' &&
        ((request.fromId === userId && request.toId === targetId) ||
          (request.fromId === targetId && request.toId === userId)),
    )
    if (pending) throw new Error('Ya hay una solicitud en curso.')
    const legend = LEGENDS.some((card) => card.id === targetId)
    await mutate((draft) => {
      if (legend) {
        const [low, high] = pair(userId, targetId)
        draft.friendships.push({ userLow: low, userHigh: high, createdAt: new Date().toISOString() })
        const conversation = ensureConversation(draft, userId, targetId)
        draft.messages.push({
          id: createId(),
          conversationId: conversation.id,
          senderId: targetId,
          body: 'He visto tu placa. Si el caso se tuerce, escríbeme.',
          createdAt: new Date().toISOString(),
        })
      } else {
        draft.requests.push({
          id: createId(),
          fromId: userId,
          toId: targetId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
    })
    emit()
    return
  }
  const db = assertDb()
  must(
    await db.from('friend_requests').insert({
      id: createId(),
      from_id: userId,
      to_id: targetId,
      status: 'pending',
    }),
  )
}

export async function acceptRequest(userId: string, requestId: string): Promise<void> {
  if (!supabase) {
    await mutate((draft) => {
      const request = draft.requests.find((item) => item.id === requestId && item.toId === userId)
      if (!request || request.status !== 'pending') throw new Error('La solicitud ya no está pendiente.')
      request.status = 'accepted'
      const [low, high] = pair(request.fromId, request.toId)
      if (!draft.friendships.some((row) => row.userLow === low && row.userHigh === high)) {
        draft.friendships.push({ userLow: low, userHigh: high, createdAt: new Date().toISOString() })
      }
    })
    emit()
    return
  }
  const db = assertDb()
  const row = must(
    await db.from('friend_requests').select('*').eq('id', requestId).eq('to_id', userId).maybeSingle(),
  ) as RequestRow | null
  if (!row || row.status !== 'pending') throw new Error('La solicitud ya no está pendiente.')
  must(await db.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId))
  const [low, high] = pair(row.from_id, row.to_id)
  const inserted = await db.from('friendships').insert({ user_low: low, user_high: high })
  if (inserted.error && !/duplicate|23505/i.test(inserted.error.message)) throw explain(inserted.error)
}

export async function declineRequest(userId: string, requestId: string): Promise<void> {
  if (!supabase) {
    await mutate((draft) => {
      const request = draft.requests.find((item) => item.id === requestId && item.toId === userId)
      if (request) request.status = 'declined'
    })
    emit()
    return
  }
  must(await assertDb().from('friend_requests').update({ status: 'declined' }).eq('id', requestId).eq('to_id', userId))
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const [low, high] = pair(userId, friendId)
  if (!supabase) {
    await mutate((draft) => {
      draft.friendships = draft.friendships.filter((row) => !(row.userLow === low && row.userHigh === high))
    })
    emit()
    return
  }
  must(await assertDb().from('friendships').delete().eq('user_low', low).eq('user_high', high))
}

export async function blockUser(userId: string, targetId: string): Promise<void> {
  const [low, high] = pair(userId, targetId)
  if (!supabase) {
    await mutate((draft) => {
      draft.friendships = draft.friendships.filter((row) => !(row.userLow === low && row.userHigh === high))
      draft.requests = draft.requests.filter(
        (request) =>
          !(
            (request.fromId === userId && request.toId === targetId) ||
            (request.fromId === targetId && request.toId === userId)
          ),
      )
      if (!draft.blocks.some((block) => block.blockerId === userId && block.blockedId === targetId)) {
        draft.blocks.push({ blockerId: userId, blockedId: targetId, createdAt: new Date().toISOString() })
      }
    })
    emit()
    return
  }
  const db = assertDb()
  must(await db.from('blocks').insert({ blocker_id: userId, blocked_id: targetId }))
  await db.from('friendships').delete().eq('user_low', low).eq('user_high', high)
  await db.from('friend_requests').delete().or(`and(from_id.eq.${userId},to_id.eq.${targetId}),and(from_id.eq.${targetId},to_id.eq.${userId})`)
}

export async function connectInvite(userId: string, code: string): Promise<string> {
  const normalized = code.trim().toUpperCase()
  if (!supabase) {
    const person = [...readLocalProfiles().map((profile) => toPerson(profile)), ...legendPeople()].find(
      (item) => item.inviteCode.toUpperCase() === normalized,
    )
    if (!person) throw new Error('Ese código no corresponde a ningún detective.')
    if (person.id === userId) throw new Error('Ese código es el tuyo.')
    await mutate((draft) => {
      const snap = hydrate(draft)
      if (isBlocked(snap, userId, person.id)) throw new Error('No podéis contactar.')
      const [low, high] = pair(userId, person.id)
      if (!draft.friendships.some((row) => row.userLow === low && row.userHigh === high)) {
        draft.friendships.push({ userLow: low, userHigh: high, createdAt: new Date().toISOString() })
      }
    })
    emit()
    return person.id
  }
  const result = await assertDb().rpc('accept_user_invite', { p_code: normalized })
  if (result.error) throw explain(result.error)
  if (!result.data) throw new Error('Ese código no corresponde a ningún detective.')
  return String(result.data)
}

export async function sendMessage(userId: string, friendId: string, body: string): Promise<void> {
  const text = body.trim()
  if (!text || text.length > 500) throw new Error('El mensaje debe tener entre 1 y 500 caracteres.')
  if (!supabase) {
    const state = readStored()
    const snap = hydrate(state)
    if (!isFriend(snap, userId, friendId) || isBlocked(snap, userId, friendId)) {
      throw new Error('El chat privado es solo entre amigos.')
    }
    let conversationId = ''
    await mutate((draft) => {
      const conversation = ensureConversation(draft, userId, friendId)
      conversationId = conversation.id
      draft.messages.push({
        id: createId(),
        conversationId,
        senderId: userId,
        body: text,
        createdAt: new Date().toISOString(),
      })
    })
    emit()
    if (friendId.startsWith('legend-')) scheduleLegend(conversationId, friendId)
    return
  }
  const conversationId = await ensureRemoteConversation(userId, friendId)
  must(
    await assertDb().from('messages').insert({
      id: createId(),
      conversation_id: conversationId,
      sender_id: userId,
      body: text,
    }),
  )
}

export async function markRead(userId: string, friendId: string): Promise<void> {
  if (!supabase) {
    await mutate((draft) => {
      const conversation = conversationWith(hydrate(draft), userId, friendId)
      if (!conversation) return
      const now = new Date().toISOString()
      const mark = draft.reads.find((row) => row.conversationId === conversation.id && row.userId === userId)
      if (mark) mark.lastReadAt = now
      else draft.reads.push({ conversationId: conversation.id, userId, lastReadAt: now })
    })
    emit()
    return
  }
  const conversationId = await ensureRemoteConversation(userId, friendId)
  const db = assertDb()
  const existing = await db
    .from('message_reads')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()
  if (existing.error) throw explain(existing.error)
  if (existing.data) {
    must(
      await db
        .from('message_reads')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId),
    )
  } else {
    must(
      await db.from('message_reads').insert({
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      }),
    )
  }
}

export async function createLeague(input: {
  userId: string
  name: string
  description: string
  avatarId: string
  maxMembers: number
}): Promise<string> {
  const name = input.name.trim()
  if (name.length < 3 || name.length > 32) throw new Error('El nombre de la liga necesita de 3 a 32 caracteres.')
  const maxMembers = Math.round(input.maxMembers)
  if (maxMembers < 2 || maxMembers > 50) throw new Error('El cupo debe estar entre 2 y 50.')
  const description = input.description.trim().slice(0, 180)
  if (!supabase) {
    let leagueId = ''
    await mutate((draft) => {
      const code = uniqueCode(draft)
      leagueId = createId()
      const startsAt = new Date().toISOString()
      draft.leagues.push({
        id: leagueId,
        ownerId: input.userId,
        name,
        description,
        avatarId: input.avatarId,
        inviteCode: code,
        maxMembers,
        createdAt: startsAt,
      })
      draft.members.push({ leagueId, userId: input.userId, role: 'owner', joinedAt: startsAt })
      draft.seasons.push({
        id: createId(),
        leagueId,
        number: 1,
        startsAt,
        endsAt: seasonEnd(startsAt),
        status: 'active',
        podium: [],
      })
    })
    emit()
    return leagueId
  }
  const db = assertDb()
  const leagueId = createId()
  const startsAt = new Date().toISOString()
  must(
    await db.from('leagues').insert({
      id: leagueId,
      owner_id: input.userId,
      name,
      description,
      avatar_id: input.avatarId,
      invite_code: makeLeagueCode(),
      max_members: maxMembers,
    }),
  )
  must(await db.from('league_members').insert({ league_id: leagueId, user_id: input.userId, role: 'owner' }))
  must(
    await db.from('seasons').insert({
      id: createId(),
      league_id: leagueId,
      number: 1,
      starts_at: startsAt,
      ends_at: seasonEnd(startsAt),
      status: 'active',
      podium: [],
    }),
  )
  return leagueId
}

export async function joinLeagueCode(userId: string, code: string): Promise<string> {
  const normalized = code.trim().toUpperCase()
  if (!supabase) {
    let leagueId = ''
    await mutate((draft) => {
      const league = draft.leagues.find((item) => item.inviteCode.toUpperCase() === normalized)
      if (!league) throw new Error('No hay una liga con ese código.')
      leagueId = joinMember(draft, league, userId)
    })
    emit()
    return leagueId
  }
  const result = await assertDb().rpc('join_league', { p_code: normalized })
  if (result.error) {
    if (/full/i.test(result.error.message)) throw new Error('Esa liga ya está completa.')
    if (/not found/i.test(result.error.message)) throw new Error('No hay una liga con ese código.')
    throw explain(result.error)
  }
  return String(result.data)
}

export async function inviteToLeague(userId: string, leagueId: string, friendId: string): Promise<void> {
  if (!supabase) {
    await mutate((draft) => {
      const snap = hydrate(draft)
      if (!isFriend(snap, userId, friendId)) throw new Error('Solo puedes invitar a amigos.')
      const league = draft.leagues.find((item) => item.id === leagueId)
      if (!league) throw new Error('No encontramos esa liga.')
      if (!draft.members.some((member) => member.leagueId === leagueId && member.userId === userId)) {
        throw new Error('No perteneces a esa liga.')
      }
      if (draft.members.some((member) => member.leagueId === leagueId && member.userId === friendId)) {
        throw new Error('Ya está en la liga.')
      }
      const pending = draft.leagueInvites.some(
        (invite) => invite.leagueId === leagueId && invite.toId === friendId && invite.status === 'pending',
      )
      if (pending) throw new Error('Ya tiene una invitación pendiente.')
      draft.leagueInvites.push({
        id: createId(),
        leagueId,
        fromId: userId,
        toId: friendId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    })
    emit()
    return
  }
  must(
    await assertDb().from('league_invites').insert({
      id: createId(),
      league_id: leagueId,
      from_id: userId,
      to_id: friendId,
      status: 'pending',
    }),
  )
}

export async function acceptLeagueInvite(userId: string, inviteId: string): Promise<string> {
  if (!supabase) {
    let leagueId = ''
    await mutate((draft) => {
      const invite = draft.leagueInvites.find((item) => item.id === inviteId && item.toId === userId)
      if (!invite || invite.status !== 'pending') throw new Error('La invitación ya no está pendiente.')
      const league = draft.leagues.find((item) => item.id === invite.leagueId)
      if (!league) throw new Error('Esa liga ya no existe.')
      leagueId = joinMember(draft, league, userId)
      invite.status = 'accepted'
    })
    emit()
    return leagueId
  }
  const result = await assertDb().rpc('accept_league_invite', { p_invite: inviteId })
  if (result.error) {
    if (/full/i.test(result.error.message)) throw new Error('Esa liga ya está completa.')
    throw explain(result.error)
  }
  return String(result.data)
}

export async function declineLeagueInvite(userId: string, inviteId: string): Promise<void> {
  if (!supabase) {
    await mutate((draft) => {
      const invite = draft.leagueInvites.find((item) => item.id === inviteId && item.toId === userId)
      if (invite) invite.status = 'declined'
    })
    emit()
    return
  }
  must(await assertDb().from('league_invites').update({ status: 'declined' }).eq('id', inviteId).eq('to_id', userId))
}

export async function recordSolve(input: {
  userId: string
  username: string
  caseTitle: string
  caseType: CaseType
  isWeekly: boolean
  culpritCorrect: boolean
  previousLevel: number
  nextLevel: number
  badgeIds: string[]
}): Promise<void> {
  const lines: Array<{ kind: Activity['kind']; text: string }> = []
  if (input.culpritCorrect) lines.push({ kind: 'case_solved', text: `${input.username} resolvió un caso.` })
  if (input.nextLevel > input.previousLevel) {
    lines.push({ kind: 'level_up', text: `${input.username} subió al nivel ${input.nextLevel}.` })
  }
  for (const badgeId of input.badgeIds) {
    const badge = BADGES.find((item) => item.id === badgeId)
    lines.push({
      kind: 'badge',
      text: `${input.username} consiguió ${badge ? `la insignia ${badge.name}` : 'una insignia'}.`,
    })
  }
  if (lines.length === 0 && !input.culpritCorrect) return
  const buckets = input.culpritCorrect ? bucketsForSolve(input.caseType, input.isWeekly) : []
  if (!supabase) {
    await mutate((draft) => {
      const now = new Date().toISOString()
      for (const line of lines) {
        draft.activities.unshift({ id: createId(), userId: input.userId, kind: line.kind, text: line.text, createdAt: now })
      }
      draft.activities = draft.activities.slice(0, 80)
      if (buckets.length === 0) return
      rollLocal(draft, input.userId)
      const leagueIds = draft.members.filter((member) => member.userId === input.userId).map((member) => member.leagueId)
      for (const leagueId of leagueIds) {
        const season = draft.seasons.find((item) => item.leagueId === leagueId && item.status === 'active')
        if (!season) continue
        grantBuckets(draft, season, input.userId, buckets)
      }
    })
    emit()
    return
  }
  const db = assertDb()
  if (lines.length) {
    must(
      await db.from('activities').insert(
        lines.map((line) => ({
          id: createId(),
          user_id: input.userId,
          kind: line.kind,
          text: line.text,
        })),
      ),
    )
  }
  if (buckets.length === 0) return
  const memberships = must(await db.from('league_members').select('league_id').eq('user_id', input.userId)) as Array<{
    league_id: string
  }>
  for (const membership of memberships) {
    await db.rpc('roll_league_season', { p_league: membership.league_id })
    const seasons = must(
      await db.from('seasons').select('*').eq('league_id', membership.league_id).eq('status', 'active').limit(1),
    ) as SeasonRow[]
    const season = seasons[0]
    if (!season) continue
    const week = weekIndex(season.starts_at)
    const existing = must(
      await db
        .from('league_scores')
        .select('*')
        .eq('season_id', season.id)
        .eq('user_id', input.userId)
        .eq('week_index', week)
        .maybeSingle(),
    ) as ScoreRow | null
    const current = existing
      ? scoreFromRow(existing)
      : emptyScore(season.id, input.userId, week, createId())
    const next = applyBuckets(current, buckets)
    must(
      await db.from('league_scores').upsert({
        id: next.id,
        season_id: next.seasonId,
        user_id: next.userId,
        week_index: next.weekIndex,
        rapido: next.rapido,
        expediente: next.expediente,
        especial: next.especial,
        objetivo: next.objetivo,
      }),
    )
  }
}

function grantBuckets(state: Stored, season: Season, userId: string, buckets: ScoreBucket[]) {
  const week = weekIndex(season.startsAt)
  let score = state.scores.find(
    (item) => item.seasonId === season.id && item.userId === userId && item.weekIndex === week,
  )
  if (!score) {
    score = emptyScore(season.id, userId, week, createId())
    state.scores.push(score)
  }
  const next = applyBuckets(score, buckets)
  score.rapido = next.rapido
  score.expediente = next.expediente
  score.especial = next.especial
  score.objetivo = next.objetivo
}

function joinMember(state: Stored, league: League, userId: string): string {
  const count = state.members.filter((member) => member.leagueId === league.id).length
  const already = state.members.some((member) => member.leagueId === league.id && member.userId === userId)
  if (!already && count >= league.maxMembers) throw new Error('Esa liga ya está completa.')
  if (!already) {
    state.members.push({ leagueId: league.id, userId, role: 'member', joinedAt: new Date().toISOString() })
  }
  return league.id
}

function ensureConversation(state: Stored, a: string, b: string): Conversation {
  const [low, high] = pair(a, b)
  const existing = state.conversations.find((row) => row.userLow === low && row.userHigh === high)
  if (existing) return existing
  const created = { id: createId(), userLow: low, userHigh: high }
  state.conversations.push(created)
  return created
}

async function ensureRemoteConversation(userId: string, friendId: string): Promise<string> {
  const db = assertDb()
  const [low, high] = pair(userId, friendId)
  const existing = must(
    await db.from('conversations').select('id').eq('user_low', low).eq('user_high', high).maybeSingle(),
  ) as { id: string } | null
  if (existing) return existing.id
  const id = createId()
  const inserted = await db.from('conversations').insert({ id, user_low: low, user_high: high }).select('id').single()
  if (inserted.error && /duplicate|23505/i.test(inserted.error.message)) {
    const again = must(
      await db.from('conversations').select('id').eq('user_low', low).eq('user_high', high).single(),
    ) as { id: string }
    return again.id
  }
  return (must(inserted) as { id: string }).id
}

function uniqueCode(state: Stored): string {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeLeagueCode()
    if (!state.leagues.some((league) => league.inviteCode === code)) return code
  }
  return makeLeagueCode()
}

function legendPeople(): Person[] {
  return LEGENDS.map((legend) =>
    toPerson(
      {
        id: legend.id,
        username: legend.username,
        avatarId: legend.avatarId,
        level: legend.level,
        rank: legend.rank,
        casesSolved: legend.casesSolved,
        accuracy: legend.accuracy,
        xp: legend.xp,
        badgeIds: [...legend.badgeIds],
        inviteCode: inviteCodeFromId(legend.id),
      },
      true,
    ),
  )
}

function scheduleLegend(conversationId: string, legendId: string) {
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('ml-typing', { detail: { conversationId, userId: legendId, typing: true } }),
    )
  }, 350)
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('ml-typing', { detail: { conversationId, userId: legendId, typing: false } }),
    )
    void mutate((draft) => {
      draft.messages.push({
        id: createId(),
        conversationId,
        senderId: legendId,
        body: LEGEND_LINES[Math.floor(Math.random() * LEGEND_LINES.length)] ?? LEGEND_LINES[0],
        createdAt: new Date().toISOString(),
      })
    }).then(() => emit())
  }, 1400)
}

interface ProfileRow {
  id: string
  username: string
  avatar_id: string
  level: number
  rank: RankName
  cases_solved: number
  accuracy: number
  xp: number
  badge_ids: string[] | null
  invite_code: string | null
}

interface RequestRow {
  id: string
  from_id: string
  to_id: string
  status: FriendRequest['status']
  created_at: string
}

interface SeasonRow {
  id: string
  league_id: string
  number: number
  starts_at: string
  ends_at: string
  status: Season['status']
  podium: Season['podium'] | null
}

interface ScoreRow {
  id: string
  season_id: string
  user_id: string
  week_index: number
  rapido: number
  expediente: number
  especial: number
  objetivo: number
}

interface InviteRow {
  id: string
  league_id: string
  from_id: string
  to_id: string
  status: LeagueInvite['status']
  created_at: string
}

function rowToPerson(row: ProfileRow): Person {
  return {
    id: row.id,
    username: row.username,
    avatarId: row.avatar_id,
    level: row.level,
    rank: row.rank,
    casesSolved: row.cases_solved,
    accuracy: row.accuracy,
    xp: row.xp,
    badgeIds: row.badge_ids ?? [],
    inviteCode: row.invite_code || inviteCodeFromId(row.id),
  }
}

function scoreFromRow(row: ScoreRow): WeekScore {
  return {
    id: row.id,
    seasonId: row.season_id,
    userId: row.user_id,
    weekIndex: row.week_index,
    rapido: row.rapido,
    expediente: row.expediente,
    especial: row.especial,
    objetivo: row.objetivo,
  }
}

async function remoteLoad(userId: string): Promise<SocialSnapshot> {
  const db = assertDb()
  const memberships = must(await db.from('league_members').select('league_id').eq('user_id', userId)) as Array<{
    league_id: string
  }>
  for (const membership of memberships) {
    await db.rpc('roll_league_season', { p_league: membership.league_id })
  }
  const [requests, friendships, blocks, conversations, activities, invites] = await Promise.all([
    db.from('friend_requests').select('*').or(`from_id.eq.${userId},to_id.eq.${userId}`),
    db.from('friendships').select('*').or(`user_low.eq.${userId},user_high.eq.${userId}`),
    db.from('blocks').select('*').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    db.from('conversations').select('*').or(`user_low.eq.${userId},user_high.eq.${userId}`),
    db.from('activities').select('*').order('created_at', { ascending: false }).limit(40),
    db.from('league_invites').select('*').or(`from_id.eq.${userId},to_id.eq.${userId}`),
  ])
  const requestRows = must(requests) as RequestRow[]
  const friendRows = must(friendships) as Array<{ user_low: string; user_high: string; created_at: string }>
  const blockRows = must(blocks) as Array<{ blocker_id: string; blocked_id: string; created_at: string }>
  const conversationRows = must(conversations) as Array<{ id: string; user_low: string; user_high: string }>
  const activityRows = must(activities) as Array<{
    id: string
    user_id: string
    kind: Activity['kind']
    text: string
    created_at: string
  }>
  const inviteRows = must(invites) as InviteRow[]
  const leagueIds = [...new Set(memberships.map((row) => row.league_id))]
  const conversationIds = conversationRows.map((row) => row.id)
  const [leagueResult, memberResult, seasonResult, messageResult, readResult] = await Promise.all([
    leagueIds.length ? db.from('leagues').select('*').in('id', leagueIds) : Promise.resolve({ data: [], error: null }),
    leagueIds.length
      ? db.from('league_members').select('*').in('league_id', leagueIds)
      : Promise.resolve({ data: [], error: null }),
    leagueIds.length ? db.from('seasons').select('*').in('league_id', leagueIds) : Promise.resolve({ data: [], error: null }),
    conversationIds.length
      ? db.from('messages').select('*').in('conversation_id', conversationIds).order('created_at', { ascending: true }).limit(300)
      : Promise.resolve({ data: [], error: null }),
    db.from('message_reads').select('*').eq('user_id', userId),
  ])
  const leagueRows = must(leagueResult) as Array<{
    id: string
    owner_id: string
    name: string
    description: string
    avatar_id: string
    invite_code: string
    max_members: number
    created_at: string
  }>
  const memberRows = must(memberResult) as Array<{
    league_id: string
    user_id: string
    role: LeagueMember['role']
    joined_at: string
  }>
  const seasonRows = must(seasonResult) as SeasonRow[]
  const messageRows = must(messageResult) as Array<{
    id: string
    conversation_id: string
    sender_id: string
    body: string
    created_at: string
  }>
  const readRows = must(readResult) as Array<{ conversation_id: string; user_id: string; last_read_at: string }>
  const seasonIds = seasonRows.map((row) => row.id)
  const scoreRows = (
    seasonIds.length
      ? must(await db.from('league_scores').select('*').in('season_id', seasonIds))
      : []
  ) as ScoreRow[]
  const ids = new Set<string>([userId])
  for (const row of requestRows) {
    ids.add(row.from_id)
    ids.add(row.to_id)
  }
  for (const row of friendRows) {
    ids.add(row.user_low)
    ids.add(row.user_high)
  }
  for (const row of memberRows) ids.add(row.user_id)
  for (const row of activityRows) ids.add(row.user_id)
  for (const row of messageRows) ids.add(row.sender_id)
  const profiles = must(await db.from('profiles').select('*').in('id', [...ids])) as ProfileRow[]
  return {
    people: profiles.map(rowToPerson),
    requests: requestRows.map((row) => ({
      id: row.id,
      fromId: row.from_id,
      toId: row.to_id,
      status: row.status,
      createdAt: row.created_at,
    })),
    friendships: friendRows.map((row) => ({
      userLow: row.user_low,
      userHigh: row.user_high,
      createdAt: row.created_at,
    })),
    blocks: blockRows.map((row) => ({
      blockerId: row.blocker_id,
      blockedId: row.blocked_id,
      createdAt: row.created_at,
    })),
    conversations: conversationRows.map((row) => ({
      id: row.id,
      userLow: row.user_low,
      userHigh: row.user_high,
    })),
    messages: messageRows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      body: row.body,
      createdAt: row.created_at,
    })),
    reads: readRows.map((row) => ({
      conversationId: row.conversation_id,
      userId: row.user_id,
      lastReadAt: row.last_read_at,
    })),
    activities: activityRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      kind: row.kind,
      text: row.text,
      createdAt: row.created_at,
    })),
    leagues: leagueRows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description,
      avatarId: row.avatar_id,
      inviteCode: row.invite_code,
      maxMembers: row.max_members,
      createdAt: row.created_at,
    })),
    members: memberRows.map((row) => ({
      leagueId: row.league_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    })),
    leagueInvites: inviteRows.map((row) => ({
      id: row.id,
      leagueId: row.league_id,
      fromId: row.from_id,
      toId: row.to_id,
      status: row.status,
      createdAt: row.created_at,
    })),
    seasons: seasonRows.map((row) => ({
      id: row.id,
      leagueId: row.league_id,
      number: row.number,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      podium: row.podium ?? [],
    })),
    scores: scoreRows.map(scoreFromRow),
  }
}
