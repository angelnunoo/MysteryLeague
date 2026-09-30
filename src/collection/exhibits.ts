import { CASES } from '../data/cases'
import { EVENT_CASES } from '../data/eventCases'
import { RAVEN_CLUES } from '../narrative/ravenhill'

export interface Exhibit {
  id: string
  title: string
  detail: string
  kind: 'objeto' | 'foto' | 'documento' | 'insignia'
  rare: boolean
  owned: boolean
}

export function buildExhibits(input: {
  solvedIds: string[]
  dossierRead: number
  eventSolved: string[]
  badgeIds: string[]
}): Exhibit[] {
  const solved = new Set(input.solvedIds)
  const items: Exhibit[] = []

  for (const mystery of [...CASES, ...EVENT_CASES]) {
    const owned = solved.has(mystery.id)
    const decisive = mystery.evidence.find((item) => item.tag === 'decisiva') ?? mystery.evidence[0]
    if (!decisive) continue
    items.push({
      id: `${mystery.id}-objeto`,
      title: decisive.title,
      detail: `${mystery.title}. ${decisive.detail}`,
      kind: 'objeto',
      rare: mystery.type === 'expediente' || mystery.id.startsWith('evento-'),
      owned,
    })
    items.push({
      id: `${mystery.id}-doc`,
      title: `Acta · ${mystery.title}`,
      detail: mystery.synopsis,
      kind: 'documento',
      rare: mystery.type === 'expediente',
      owned,
    })
  }

  for (const clue of RAVEN_CLUES) {
    items.push({
      id: `raven-${clue.id}`,
      title: clue.title,
      detail: clue.detail,
      kind: clue.kind,
      rare: clue.from >= 16,
      owned: input.dossierRead >= clue.from,
    })
  }

  const legendary = input.badgeIds.filter((id) =>
    ['liga-oro', 'orden-ravenhill', 'racha-100', 'comisario', 'evento-diamante'].includes(id),
  )
  for (const id of legendary) {
    items.push({
      id: `badge-${id}`,
      title: 'Insignia de vitrina',
      detail: id,
      kind: 'insignia',
      rare: true,
      owned: true,
    })
  }

  if (input.eventSolved.length === 0 && items.every((item) => item.kind !== 'insignia')) {
    items.push({
      id: 'vitrina-vacia',
      title: 'Vitrina en espera',
      detail: 'Los eventos dejan insignias que no se compran.',
      kind: 'insignia',
      rare: true,
      owned: false,
    })
  }

  return items
}
