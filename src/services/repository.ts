import type { User } from '@supabase/supabase-js'
import { caseById } from '../data/cases'
import { applyCaseReward } from '../game/rewards'
import { progressFromXp, withProgress } from '../game/ranks'
import { createId, validateUsername } from '../lib/format'
import { inviteCodeFromId } from '../social/logic'
import { authStorage, clearAuthTokens, setRememberMe } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AuthUser,
  CaseRun,
  DetectiveCard,
  Hypothesis,
  Notebook,
  Profile,
  ResolutionAnswers,
  RewardSummary,
} from '../types'

const DB_KEY = 'ml-db'
const SESSION_KEY = 'ml-session'

interface LocalUser {
  id: string
  email: string
  username: string
  passwordHash: string
}

interface LocalDb {
  users: LocalUser[]
  profiles: Record<string, Profile>
  runs: CaseRun[]
  notebooks: Notebook[]
}

type Listener = (event: string, user: AuthUser | null) => void
const listeners = new Set<Listener>()

function emptyDb(): LocalDb {
  return { users: [], profiles: {}, runs: [], notebooks: [] }
}

function readDb(): LocalDb {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) return emptyDb()
  try {
    const parsed = JSON.parse(raw) as LocalDb
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles ?? {},
      runs: parsed.runs ?? [],
      notebooks: parsed.notebooks ?? [],
    }
  } catch {
    return emptyDb()
  }
}

function writeDb(db: LocalDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

let writeChain = Promise.resolve()

function mutateLocal(change: (db: LocalDb) => void): Promise<void> {
  const run = writeChain.then(() => {
    const db = readDb()
    change(db)
    writeDb(db)
  })
  writeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function digest(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.toLowerCase()}::${password}::mysteryleague`)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createDefaultProfile(id: string, username: string): Profile {
  return withProgress({
    id,
    username,
    level: 1,
    xp: 0,
    rank: 'Aprendiz',
    casesSolved: 0,
    attempts: 0,
    scoreSum: 0,
    accuracy: 0,
    streak: 0,
    coins: 0,
    badgeIds: [],
    onboardingCompleted: false,
    avatarId: 'lens',
    lastActiveOn: null,
    pinnedFriends: [],
    inviteCode: inviteCodeFromId(id),
    activeLeagueId: null,
    createdAt: new Date().toISOString(),
  })
}

function emit(event: string, user: AuthUser | null): void {
  for (const listener of listeners) listener(event, user)
}

function toAuthUser(user: LocalUser): AuthUser {
  return { id: user.id, email: user.email, username: user.username }
}

interface ProfileRow {
  id: string
  username: string
  level: number
  xp: number
  rank: Profile['rank']
  cases_solved: number
  attempts: number
  score_sum: number
  accuracy: number
  streak: number
  coins: number
  badge_ids: string[] | null
  onboarding_completed: boolean
  avatar_id: string
  last_active_on: string | null
  pinned_friends: string[] | null
  invite_code: string | null
  active_league_id: string | null
  created_at: string
}

function fromProfileRow(row: ProfileRow): Profile {
  return withProgress({
    id: row.id,
    username: row.username,
    level: row.level,
    xp: row.xp,
    rank: row.rank,
    casesSolved: row.cases_solved,
    attempts: row.attempts,
    scoreSum: row.score_sum,
    accuracy: row.accuracy,
    streak: row.streak,
    coins: row.coins,
    badgeIds: row.badge_ids ?? [],
    onboardingCompleted: row.onboarding_completed,
    avatarId: row.avatar_id,
    lastActiveOn: row.last_active_on,
    pinnedFriends: row.pinned_friends ?? [],
    inviteCode: row.invite_code || inviteCodeFromId(row.id),
    activeLeagueId: row.active_league_id ?? null,
    createdAt: row.created_at,
  })
}

function toProfileRow(profile: Profile): ProfileRow {
  const next = withProgress(profile)
  return {
    id: next.id,
    username: next.username,
    level: next.level,
    xp: next.xp,
    rank: next.rank,
    cases_solved: next.casesSolved,
    attempts: next.attempts,
    score_sum: next.scoreSum,
    accuracy: next.accuracy,
    streak: next.streak,
    coins: next.coins,
    badge_ids: next.badgeIds,
    onboarding_completed: next.onboardingCompleted,
    avatar_id: next.avatarId,
    last_active_on: next.lastActiveOn,
    pinned_friends: next.pinnedFriends,
    invite_code: next.inviteCode || inviteCodeFromId(next.id),
    active_league_id: next.activeLeagueId,
    created_at: next.createdAt,
  }
}

interface RunRow {
  id: string
  user_id: string
  case_id: string
  status: CaseRun['status']
  started_at: string
  solved_at: string | null
  elapsed_seconds: number
  hints_used: number
  score: number | null
  xp_awarded: number
  coins_awarded: number
  culprit_correct: boolean | null
  answers: ResolutionAnswers | null
  reward: RewardSummary | null
  updated_at: string
}

function fromRunRow(row: RunRow): CaseRun {
  return {
    id: row.id,
    userId: row.user_id,
    caseId: row.case_id,
    status: row.status,
    startedAt: row.started_at,
    solvedAt: row.solved_at,
    elapsedSeconds: row.elapsed_seconds,
    hintsUsed: row.hints_used,
    score: row.score,
    xpAwarded: row.xp_awarded,
    coinsAwarded: row.coins_awarded,
    culpritCorrect: row.culprit_correct,
    answers: row.answers,
    reward: row.reward,
    updatedAt: row.updated_at,
  }
}

function toRunRow(run: CaseRun): RunRow {
  return {
    id: run.id,
    user_id: run.userId,
    case_id: run.caseId,
    status: run.status,
    started_at: run.startedAt,
    solved_at: run.solvedAt,
    elapsed_seconds: run.elapsedSeconds,
    hints_used: run.hintsUsed,
    score: run.score,
    xp_awarded: run.xpAwarded,
    coins_awarded: run.coinsAwarded,
    culprit_correct: run.culpritCorrect,
    answers: run.answers,
    reward: run.reward,
    updated_at: run.updatedAt,
  }
}

interface NotebookRow {
  user_id: string
  case_id: string
  notes: string
  marked_suspects: string[] | null
  marked_evidence: string[] | null
  hypotheses: Hypothesis[] | null
  updated_at: string
}

function fromNotebookRow(row: NotebookRow): Notebook {
  return {
    userId: row.user_id,
    caseId: row.case_id,
    notes: row.notes,
    markedSuspects: row.marked_suspects ?? [],
    markedEvidence: row.marked_evidence ?? [],
    hypotheses: row.hypotheses ?? [],
    updatedAt: row.updated_at,
  }
}

function toNotebookRow(notebook: Notebook): NotebookRow {
  return {
    user_id: notebook.userId,
    case_id: notebook.caseId,
    notes: notebook.notes,
    marked_suspects: notebook.markedSuspects,
    marked_evidence: notebook.markedEvidence,
    hypotheses: notebook.hypotheses,
    updated_at: notebook.updatedAt,
  }
}

function usernameFromMetadata(user: User): string {
  const value = user.user_metadata?.username
  if (typeof value === 'string' && value.trim()) return value.trim()
  return `detective_${user.id.slice(0, 8)}`
}

function mapRemoteUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    username: usernameFromMetadata(user),
  }
}

export function translateAuthError(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'Ese correo ya tiene un expediente.'
  }
  if (text.includes('username') || text.includes('duplicate') || text.includes('unique')) {
    return 'Ese nombre de investigador ya existe.'
  }
  if (text.includes('password')) return 'La contraseña no cumple los requisitos.'
  if (text.includes('email')) return 'El correo no es válido.'
  if (text.includes('rate limit')) return 'Demasiados intentos. Espera un momento.'
  return 'No se pudo completar la operación. Inténtalo de nuevo.'
}

async function usernameTakenRemote(username: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('username_available', { p_name: username })
  if (error) return false
  return data === false
}

export const authService = {
  async getSession(): Promise<AuthUser | null> {
    if (!supabase) {
      const id = authStorage.getItem(SESSION_KEY)
      if (!id) return null
      const user = readDb().users.find((item) => item.id === id)
      return user ? toAuthUser(user) : null
    }
    const { data } = await supabase.auth.getSession()
    return data.session?.user ? mapRemoteUser(data.session.user) : null
  },

  onChange(listener: Listener): () => void {
    if (!supabase) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        listener(event, session?.user ? mapRemoteUser(session.user) : null)
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  },

  async signUp(input: {
    email: string
    password: string
    username: string
  }): Promise<{ status: 'session'; user: AuthUser } | { status: 'confirm_email' }> {
    const usernameError = validateUsername(input.username)
    if (usernameError) throw new Error(usernameError)
    const email = input.email.trim().toLowerCase()
    const username = input.username.trim()

    if (!supabase) {
      const db = readDb()
      if (db.users.some((user) => user.email === email)) {
        throw new Error('Ese correo ya tiene un expediente.')
      }
      if (db.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Ese nombre de investigador ya existe.')
      }
      const user: LocalUser = {
        id: createId(),
        email,
        username,
        passwordHash: await digest(email, input.password),
      }
      await mutateLocal((db) => {
        db.users.push(user)
        db.profiles[user.id] = createDefaultProfile(user.id, username)
      })
      setRememberMe(true)
      authStorage.setItem(SESSION_KEY, user.id)
      const authUser = toAuthUser(user)
      emit('SIGNED_IN', authUser)
      return { status: 'session', user: authUser }
    }

    if (await usernameTakenRemote(username)) {
      throw new Error('Ese nombre de investigador ya existe.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw new Error(translateAuthError(error.message))
    if (!data.user) throw new Error('No se pudo crear el expediente.')
    if (!data.session) return { status: 'confirm_email' }
    return { status: 'session', user: mapRemoteUser(data.user) }
  },

  async signIn(email: string, password: string, remember: boolean): Promise<AuthUser> {
    const normalized = email.trim().toLowerCase()
    setRememberMe(remember)
    clearAuthTokens()

    if (!supabase) {
      const db = readDb()
      const user = db.users.find((item) => item.email === normalized)
      if (!user || user.passwordHash !== (await digest(normalized, password))) {
        throw new Error('Correo o contraseña incorrectos.')
      }
      authStorage.setItem(SESSION_KEY, user.id)
      const authUser = toAuthUser(user)
      emit('SIGNED_IN', authUser)
      return authUser
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })
    if (error || !data.user) throw new Error(translateAuthError(error?.message ?? 'invalid login'))
    return mapRemoteUser(data.user)
  },

  async signOut(): Promise<void> {
    if (!supabase) {
      authStorage.removeItem(SESSION_KEY)
      clearAuthTokens()
      emit('SIGNED_OUT', null)
      return
    }
    await supabase.auth.signOut()
    clearAuthTokens()
  },

  async requestPasswordReset(email: string): Promise<'remote' | 'local'> {
    const normalized = email.trim().toLowerCase()
    if (!supabase) {
      const exists = readDb().users.some((user) => user.email === normalized)
      if (!exists) throw new Error('No hay ningún expediente con ese correo.')
      return 'local'
    }
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/restablecer`,
    })
    if (error) throw new Error(translateAuthError(error.message))
    return 'remote'
  },

  async updatePassword(input: { email?: string; password: string }): Promise<void> {
    if (!supabase) {
      const db = readDb()
      const email = input.email?.trim().toLowerCase()
      const sessionId = authStorage.getItem(SESSION_KEY)
      const user = db.users.find((item) => item.email === email || item.id === sessionId)
      if (!user) throw new Error('No se encontró el expediente.')
      const passwordHash = await digest(user.email, input.password)
      await mutateLocal((store) => {
        const current = store.users.find((item) => item.id === user.id)
        if (current) current.passwordHash = passwordHash
      })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: input.password })
    if (error) throw new Error(translateAuthError(error.message))
  },
}

export const profileService = {
  async load(user: AuthUser): Promise<Profile> {
    if (!supabase) {
      const db = readDb()
      const existing = db.profiles[user.id]
      if (existing) {
        const normalized = withProgress({
          ...existing,
          pinnedFriends: existing.pinnedFriends ?? [],
          inviteCode: existing.inviteCode || inviteCodeFromId(existing.id),
          activeLeagueId: existing.activeLeagueId ?? null,
        })
        if (!existing.inviteCode) {
          await mutateLocal((store) => {
            store.profiles[user.id] = normalized
          })
        }
        return normalized
      }
      const created = createDefaultProfile(user.id, user.username)
      await mutateLocal((store) => {
        store.profiles[user.id] = created
      })
      return created
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) throw new Error('No se pudo abrir tu expediente. Ejecuta supabase/schema.sql en el proyecto.')
    if (!data) {
      const created = createDefaultProfile(user.id, user.username)
      const { error: insertError } = await supabase.from('profiles').insert(toProfileRow(created))
      if (insertError) throw new Error(insertError.message)
      return created
    }
    return fromProfileRow(data as ProfileRow)
  },

  async save(profile: Profile): Promise<Profile> {
    const next = withProgress(profile)
    if (!supabase) {
      await mutateLocal((db) => {
        db.profiles[profile.id] = next
      })
      return next
    }
    const { error } = await supabase.from('profiles').update(toProfileRow(next)).eq('id', next.id)
    if (error) throw new Error(error.message)
    return next
  },

  async leaderboard(): Promise<DetectiveCard[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50)
    if (error || !data) return []
    return (data as ProfileRow[]).map((row) => {
      const profile = fromProfileRow(row)
      return {
        id: profile.id,
        username: profile.username,
        xp: profile.xp,
        level: profile.level,
        rank: profile.rank,
        casesSolved: profile.casesSolved,
        accuracy: profile.accuracy,
        streak: profile.streak,
        coins: profile.coins,
        badgeIds: profile.badgeIds,
        avatarId: profile.avatarId,
      }
    })
  },
}

export function toDetectiveCard(profile: Profile): DetectiveCard {
  const progress = progressFromXp(profile.xp)
  return {
    id: profile.id,
    username: profile.username,
    xp: profile.xp,
    level: progress.level,
    rank: progress.rank,
    casesSolved: profile.casesSolved,
    accuracy: profile.accuracy,
    streak: profile.streak,
    coins: profile.coins,
    badgeIds: profile.badgeIds,
    avatarId: profile.avatarId,
  }
}

function emptyNotebook(userId: string, caseId: string): Notebook {
  return {
    userId,
    caseId,
    notes: '',
    markedSuspects: [],
    markedEvidence: [],
    hypotheses: [],
    updatedAt: new Date().toISOString(),
  }
}

export const gameService = {
  async load(userId: string): Promise<{ runs: CaseRun[]; notebooks: Notebook[] }> {
    if (!supabase) {
      const db = readDb()
      return {
        runs: db.runs.filter((run) => run.userId === userId),
        notebooks: db.notebooks.filter((notebook) => notebook.userId === userId),
      }
    }
    const [runsResult, notesResult] = await Promise.all([
      supabase.from('case_runs').select('*').eq('user_id', userId),
      supabase.from('notebooks').select('*').eq('user_id', userId),
    ])
    if (runsResult.error || notesResult.error) {
      throw new Error('No se pudo cargar la investigación. Revisa que el esquema de Supabase esté aplicado.')
    }
    return {
      runs: ((runsResult.data ?? []) as RunRow[]).map(fromRunRow),
      notebooks: ((notesResult.data ?? []) as NotebookRow[]).map(fromNotebookRow),
    }
  },

  async saveRun(run: CaseRun): Promise<void> {
    if (!supabase) {
      await mutateLocal((db) => {
        const index = db.runs.findIndex((item) => item.id === run.id)
        if (index >= 0) db.runs[index] = run
        else db.runs.push(run)
      })
      return
    }
    const { error } = await supabase.from('case_runs').upsert(toRunRow(run))
    if (error) throw new Error(error.message)
  },

  async saveNotebook(notebook: Notebook): Promise<void> {
    if (!supabase) {
      await mutateLocal((db) => {
        const index = db.notebooks.findIndex(
          (item) => item.userId === notebook.userId && item.caseId === notebook.caseId,
        )
        if (index >= 0) db.notebooks[index] = notebook
        else db.notebooks.push(notebook)
      })
      return
    }
    const { error } = await supabase.from('notebooks').upsert(toNotebookRow(notebook))
    if (error) throw new Error(error.message)
  },

  async complete(input: {
    profile: Profile
    runs: CaseRun[]
    caseId: string
    answers: ResolutionAnswers
    elapsedSeconds: number
    hintsUsed: number
  }): Promise<{ profile: Profile; run: CaseRun; summary: RewardSummary }> {
    const mystery = caseById(input.caseId)
    if (!mystery) throw new Error('Ese expediente no existe.')
    const current = input.runs.find((run) => run.caseId === input.caseId && run.userId === input.profile.id)
    if (current?.status === 'solved') throw new Error('Este caso ya tiene veredicto.')

    const previouslySolvedTypes = input.runs
      .filter((run) => run.culpritCorrect && run.caseId !== input.caseId)
      .map((run) => caseById(run.caseId)?.type)
      .filter((type): type is NonNullable<typeof type> => Boolean(type))

    const { profile, summary } = applyCaseReward({
      mystery,
      answers: input.answers,
      elapsedSeconds: input.elapsedSeconds,
      hintsUsed: input.hintsUsed,
      profile: input.profile,
      previouslySolvedTypes,
    })

    const now = new Date().toISOString()
    const run: CaseRun = {
      id: current?.id ?? createId(),
      userId: input.profile.id,
      caseId: input.caseId,
      status: 'solved',
      startedAt: current?.startedAt ?? now,
      solvedAt: now,
      elapsedSeconds: input.elapsedSeconds,
      hintsUsed: input.hintsUsed,
      score: summary.score,
      xpAwarded: summary.xp,
      coinsAwarded: summary.coins,
      culpritCorrect: summary.culpritCorrect,
      answers: input.answers,
      reward: summary,
      updatedAt: now,
    }

    await profileService.save(profile)
    await gameService.saveRun(run)
    return { profile, run, summary }
  },
}

export function blankNotebook(userId: string, caseId: string): Notebook {
  return emptyNotebook(userId, caseId)
}

export { isSupabaseConfigured }
