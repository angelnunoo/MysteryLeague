import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface Wardrobe {
  owned: string[]
  frame: string
  background: string
  card: string
  theme: string
  title: string
}

const FREE: Wardrobe = {
  owned: ['avatar-lupa', 'tarjeta-clasica', 'tema-noche', 'titulo-novato'],
  frame: '',
  background: '',
  card: 'tarjeta-clasica',
  theme: 'tema-noche',
  title: 'titulo-novato',
}

const KEY = 'ml-wardrobe'

function readAll(): Record<string, Wardrobe> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, Wardrobe>
  } catch {
    return {}
  }
}

export function loadWardrobe(userId: string): Wardrobe {
  const stored = readAll()[userId]
  if (!stored) return { ...FREE, owned: [...FREE.owned] }
  return {
    ...FREE,
    ...stored,
    title: stored.title || FREE.title,
    owned: [...new Set([...FREE.owned, ...(stored.owned ?? [])])],
  }
}

export async function saveWardrobe(userId: string, wardrobe: Wardrobe): Promise<void> {
  const all = readAll()
  all[userId] = wardrobe
  localStorage.setItem(KEY, JSON.stringify(all))
  if (!isSupabaseConfigured || !supabase) return
  const row = {
    user_id: userId,
    owned: wardrobe.owned,
    frame: wardrobe.frame,
    background: wardrobe.background,
    card: wardrobe.card,
    theme: wardrobe.theme,
    title: wardrobe.title,
  }
  let saved = await supabase.from('wardrobes').upsert(row)
  if (saved.error && /title/i.test(saved.error.message)) {
    const { title: _title, ...legacy } = row
    saved = await supabase.from('wardrobes').upsert(legacy)
  }
  if (saved.error && !/does not exist|schema cache/i.test(saved.error.message)) {
    throw new Error(saved.error.message)
  }
}
