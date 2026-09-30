import { DOSSIER, openChapterCount } from '../community/dossier'
import { isoWeek } from '../lib/format'
import type { Notice, SocialSnapshot } from '../social/logic'
import { personById } from '../social/logic'

const SEEN = 'ml-pulse'

interface Seen {
  chapter?: number
  week?: number
}

function seen(): Seen {
  try {
    return JSON.parse(localStorage.getItem(SEEN) ?? '{}') as Seen
  } catch {
    return {}
  }
}

export function markChapterSeen(chapter: number) {
  const current = seen()
  localStorage.setItem(SEEN, JSON.stringify({ ...current, chapter }))
}

export function markWeekSeen(week: number) {
  const current = seen()
  localStorage.setItem(SEEN, JSON.stringify({ ...current, week }))
}

export function pulseNotices(snapshot: SocialSnapshot, userId: string, badgeIds: string[]): Notice[] {
  const now = new Date().toISOString()
  const flags = seen()
  const notices: Notice[] = []
  const chapter = openChapterCount(isoWeek())
  if (flags.chapter !== chapter) {
    notices.push({
      id: `caso-${chapter}`,
      title: 'Caso comunitario',
      body: `${DOSSIER.chapters[chapter - 1]?.title ?? DOSSIER.title} ya está en la mesa.`,
      href: '/comunidad',
      createdAt: now,
    })
  }
  const week = isoWeek()
  if (flags.week !== week) {
    notices.push({
      id: `semana-${week}`,
      title: 'Nuevo caso',
      body: 'La mesa semanal ha cambiado.',
      href: '/semanales',
      createdAt: now,
    })
  }
  const day = Date.now() - 36 * 60 * 60 * 1000
  for (const activity of snapshot.activities) {
    if (activity.userId === userId) continue
    if (new Date(activity.createdAt).getTime() < day) continue
    const name = personById(snapshot, activity.userId)?.username ?? 'Un amigo'
    notices.push({
      id: `vivo-${activity.userId}`,
      title: 'Amigo conectado',
      body: `${name} ha vuelto a la investigación.`,
      href: `/u/${name}`,
      createdAt: activity.createdAt,
    })
    break
  }
  const prize = snapshot.seasons.find(
    (season) => season.status === 'closed' && season.podium.some((entry) => entry.userId === userId) && !localStorage.getItem(`ml-prize-${season.id}`),
  )
  if (prize) {
    notices.push({
      id: `temporada-${prize.id}`,
      title: 'Resultado de temporada',
      body: 'El podio ya está cerrado. Pasa a recogerlo.',
      href: '/liga',
      createdAt: prize.endsAt,
    })
    if (badgeIds.some((id) => id.startsWith('liga-'))) {
      notices.push({
        id: `insignia-${prize.id}`,
        title: 'Insignia',
        body: 'Hay una insignia de liga nueva en tu expediente.',
        href: '/perfil',
        createdAt: prize.endsAt,
      })
    }
  }
  return notices
}
