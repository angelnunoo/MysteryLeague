import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { MysteryCase } from '../types'

const KEY = 'ml-generated'

export function listGenerated(): MysteryCase[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MysteryCase[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function generatedById(id: string): MysteryCase | undefined {
  return listGenerated().find((mystery) => mystery.id === id)
}

export async function saveGenerated(mystery: MysteryCase, userId: string): Promise<void> {
  const current = listGenerated().filter((item) => item.id !== mystery.id)
  localStorage.setItem(KEY, JSON.stringify([mystery, ...current].slice(0, 24)))
  if (!isSupabaseConfigured || !supabase) return
  const saved = await supabase.from('generated_cases').upsert({
    id: mystery.id,
    user_id: userId,
    payload: mystery,
  })
  if (saved.error) throw new Error(saved.error.message)
}
