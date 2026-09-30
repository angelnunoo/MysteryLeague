import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { emptyProgress, normalizeProgress, type ProgressState } from '../progress/state'
import type { LeagueIdentity } from '../leagueId/identity'

const KEY = 'ml-progress'
const ID_KEY = 'ml-league-id'

function readAll(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function loadProgress(userId: string): ProgressState {
  return normalizeProgress(readAll()[userId] ?? emptyProgress())
}

export function saveProgressLocal(userId: string, state: ProgressState): void {
  const all = readAll()
  all[userId] = state
  localStorage.setItem(KEY, JSON.stringify(all))
}

export async function pullProgress(userId: string): Promise<ProgressState | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const result = await supabase.from('progress_states').select('payload').eq('user_id', userId).maybeSingle()
  if (result.error || !result.data) return null
  return normalizeProgress(result.data.payload)
}

export async function saveProgress(userId: string, state: ProgressState): Promise<void> {
  saveProgressLocal(userId, state)
  if (!isSupabaseConfigured || !supabase) return
  const saved = await supabase.from('progress_states').upsert({
    user_id: userId,
    payload: state,
    updated_at: new Date().toISOString(),
  })
  if (saved.error && !/does not exist|schema cache/i.test(saved.error.message)) {
    throw new Error(saved.error.message)
  }
}

export function pickRicher(local: ProgressState, remote: ProgressState | null): ProgressState {
  if (!remote) return local
  if (remote.claimed.length > local.claimed.length) return remote
  if (remote.dossierRead > local.dossierRead) return remote
  return local
}

export async function saveLeagueIdentity(identity: LeagueIdentity): Promise<void> {
  const all = readIdentities()
  all[identity.userId] = identity
  localStorage.setItem(ID_KEY, JSON.stringify(all))
  if (!isSupabaseConfigured || !supabase) return
  const saved = await supabase.from('league_identities').upsert({
    user_id: identity.userId,
    universe: identity.universe,
    apps: identity.apps,
    payload: identity,
    updated_at: new Date().toISOString(),
  })
  if (saved.error && !/does not exist|schema cache/i.test(saved.error.message)) {
    throw new Error(saved.error.message)
  }
}

function readIdentities(): Record<string, LeagueIdentity> {
  try {
    const raw = localStorage.getItem(ID_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LeagueIdentity>
  } catch {
    return {}
  }
}
