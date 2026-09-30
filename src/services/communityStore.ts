import { createId } from '../lib/format'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  assertContribution,
  type BoardPost,
  type ChapterProgress,
  type PostKind,
  type RoleId,
} from '../community/logic'

const KEY = 'ml-community'

interface Stored {
  posts: BoardPost[]
  progress: ChapterProgress[]
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { posts: [], progress: [] }
    const parsed = JSON.parse(raw) as Partial<Stored>
    return { posts: parsed.posts ?? [], progress: parsed.progress ?? [] }
  } catch {
    return { posts: [], progress: [] }
  }
}

function write(state: Stored) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export async function loadBoard(leagueId: string): Promise<Stored> {
  if (!isSupabaseConfigured || !supabase) {
    const state = read()
    return {
      posts: state.posts.filter((post) => post.leagueId === leagueId),
      progress: state.progress.filter((row) => row.leagueId === leagueId),
    }
  }
  const [posts, progress] = await Promise.all([
    supabase.from('community_posts').select('*').eq('league_id', leagueId).order('created_at', { ascending: true }),
    supabase.from('community_progress').select('*').eq('league_id', leagueId),
  ])
  if (posts.error) throw new Error(posts.error.message)
  if (progress.error) throw new Error(progress.error.message)
  return {
    posts: ((posts.data ?? []) as PostRow[]).map(fromPost),
    progress: ((progress.data ?? []) as ProgressRow[]).map((row) => ({
      userId: row.user_id,
      leagueId: row.league_id,
      chapter: row.chapter,
      updatedAt: row.updated_at,
    })),
  }
}

export async function publishPost(input: {
  leagueId: string
  weekKey: string
  userId: string
  username: string
  role: RoleId
  kind: PostKind
  body: string
}): Promise<boolean> {
  const text = input.body.trim().replace(/\s+/g, ' ')
  if (!supabase || !isSupabaseConfigured) {
    const state = read()
    assertContribution(state.posts, input.userId, input.weekKey, text)
    state.posts.push({
      id: createId(),
      leagueId: input.leagueId,
      weekKey: input.weekKey,
      userId: input.userId,
      username: input.username,
      role: input.role,
      kind: input.kind,
      body: text,
      scored: true,
      createdAt: new Date().toISOString(),
    })
    write(state)
    return true
  }
  const existing = await supabase
    .from('community_posts')
    .select('id, body, scored, user_id, week_key')
    .eq('league_id', input.leagueId)
    .eq('week_key', input.weekKey)
  if (existing.error) throw new Error(existing.error.message)
  const posts = ((existing.data ?? []) as Array<{ id: string; body: string; scored: boolean; user_id: string; week_key: string }>).map(
    (row) =>
      ({
        id: row.id,
        leagueId: input.leagueId,
        weekKey: row.week_key,
        userId: row.user_id,
        username: '',
        role: input.role,
        kind: input.kind,
        body: row.body,
        scored: row.scored,
        createdAt: '',
      }) satisfies BoardPost,
  )
  assertContribution(posts, input.userId, input.weekKey, text)
  const inserted = await supabase.from('community_posts').insert({
    id: createId(),
    league_id: input.leagueId,
    week_key: input.weekKey,
    user_id: input.userId,
    username: input.username,
    role: input.role,
    kind: input.kind,
    body: text,
    scored: true,
  })
  if (inserted.error) throw new Error(inserted.error.message)
  return true
}

export async function saveChapter(input: { userId: string; leagueId: string; chapter: number }): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    const state = read()
    const current = state.progress.find((row) => row.userId === input.userId && row.leagueId === input.leagueId)
    if (current) {
      current.chapter = Math.max(current.chapter, input.chapter)
      current.updatedAt = new Date().toISOString()
    } else {
      state.progress.push({ ...input, updatedAt: new Date().toISOString() })
    }
    write(state)
    return
  }
  const saved = await supabase.from('community_progress').upsert({
    user_id: input.userId,
    league_id: input.leagueId,
    chapter: input.chapter,
    updated_at: new Date().toISOString(),
  })
  if (saved.error) throw new Error(saved.error.message)
}

interface PostRow {
  id: string
  league_id: string
  week_key: string
  user_id: string
  username: string
  role: RoleId
  kind: PostKind
  body: string
  scored: boolean
  created_at: string
}

interface ProgressRow {
  user_id: string
  league_id: string
  chapter: number
  updated_at: string
}

function fromPost(row: PostRow): BoardPost {
  return {
    id: row.id,
    leagueId: row.league_id,
    weekKey: row.week_key,
    userId: row.user_id,
    username: row.username,
    role: row.role,
    kind: row.kind,
    body: row.body,
    scored: row.scored,
    createdAt: row.created_at,
  }
}
