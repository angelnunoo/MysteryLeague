export const CONTRIBUTION_CAP = 3

export const ROLES = [
  { id: 'analista', name: 'Analista', blurb: 'Ordena las pruebas y separa el ruido.' },
  { id: 'interrogador', name: 'Interrogador', blurb: 'Aprieta el testimonio hasta que suene hueco.' },
  { id: 'forense', name: 'Especialista forense', blurb: 'Lee el cuerpo, el objeto y la hora.' },
  { id: 'coordinador', name: 'Coordinador', blurb: 'Convierte la mesa en una sola hipótesis.' },
] as const

export type RoleId = (typeof ROLES)[number]['id']
export type PostKind = 'prueba' | 'teoria' | 'sospechoso' | 'hipotesis'

export const POST_KINDS: Array<{ id: PostKind; label: string }> = [
  { id: 'prueba', label: 'Prueba' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'sospechoso', label: 'Sospechoso' },
  { id: 'hipotesis', label: 'Hipótesis' },
]

export interface BoardPost {
  id: string
  leagueId: string
  weekKey: string
  userId: string
  username: string
  role: RoleId
  kind: PostKind
  body: string
  scored: boolean
  createdAt: string
}

export interface ChapterProgress {
  userId: string
  leagueId: string
  chapter: number
  updatedAt: string
}

export function weekKey(leagueId: string, week: number): string {
  return `${leagueId}:${week}`
}

export function roleFor(memberIds: string[], userId: string, week: number): RoleId {
  const ordered = [...memberIds].sort((a, b) => a.localeCompare(b))
  const index = Math.max(0, ordered.indexOf(userId))
  return ROLES[(index + week) % ROLES.length]?.id ?? 'analista'
}

export function roleMeta(id: RoleId) {
  return ROLES.find((role) => role.id === id) ?? ROLES[0]
}

export function scoredCount(posts: BoardPost[], userId: string, key: string): number {
  return posts.filter((post) => post.userId === userId && post.weekKey === key && post.scored).length
}

export function assertContribution(posts: BoardPost[], userId: string, key: string, body: string): void {
  const text = body.trim().replace(/\s+/g, ' ')
  if (text.length < 20 || text.length > 280) {
    throw new Error('La aportación necesita entre 20 y 280 caracteres.')
  }
  const twin = posts.some(
    (post) => post.weekKey === key && post.body.trim().replace(/\s+/g, ' ').toLowerCase() === text.toLowerCase(),
  )
  if (twin) throw new Error('Esa nota ya está en el tablón.')
  if (scoredCount(posts, userId, key) >= CONTRIBUTION_CAP) {
    throw new Error('Esta semana ya cerraste tus 3 aportaciones puntuables.')
  }
}
