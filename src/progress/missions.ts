import type { CaseRun, Notebook } from '../types'
import { isoWeek, todayISO } from '../lib/format'

export type MissionCadence = 'diaria' | 'semanal'

export interface MissionDef {
  id: string
  cadence: MissionCadence
  title: string
  detail: string
  xp: number
  credits: number
  item?: string
}

export const MISSIONS: MissionDef[] = [
  { id: 'resolver-caso', cadence: 'diaria', title: 'Resolver 1 caso', detail: 'Cierra un expediente hoy.', xp: 25, credits: 15 },
  { id: 'tres-pistas', cadence: 'diaria', title: 'Encontrar 3 pistas', detail: 'Marca tres pruebas en la libreta.', xp: 15, credits: 10 },
  { id: 'deduccion-perfecta', cadence: 'diaria', title: 'Deducción perfecta', detail: 'Cierra un caso con 100 puntos.', xp: 40, credits: 25 },
  { id: 'tres-semanales', cadence: 'semanal', title: 'Los misterios de la semana', detail: 'Resuelve los casos de la mesa semanal.', xp: 80, credits: 40 },
  { id: 'comunitario', cadence: 'semanal', title: 'Caso comunitario', detail: 'Publica en el tablón de tu liga.', xp: 30, credits: 20 },
  { id: 'sin-ayudas', cadence: 'semanal', title: 'Sin ayudas', detail: 'Cierra un caso esta semana sin pistas.', xp: 50, credits: 30, item: 'titulo-fantasma' },
]

export function missionPeriod(mission: MissionDef, now = new Date()): string {
  if (mission.cadence === 'diaria') return todayISO(now)
  return `${now.getFullYear()}-W${isoWeek(now)}`
}

export function missionKey(mission: MissionDef, now = new Date()): string {
  return `${missionPeriod(mission, now)}:${mission.id}`
}

function sameWeek(iso: string, now: Date): boolean {
  const date = new Date(iso)
  return isoWeek(date) === isoWeek(now) && date.getFullYear() === now.getFullYear()
}

export function missionDone(
  mission: MissionDef,
  input: {
    runs: CaseRun[]
    notebooks: Notebook[]
    weeklyIds: string[]
    communityPosts: number
    now?: Date
  },
): boolean {
  const now = input.now ?? new Date()
  const today = todayISO(now)
  const solved = input.runs.filter((run) => run.status === 'solved' && run.solvedAt)
  if (mission.id === 'resolver-caso') return solved.some((run) => run.solvedAt?.startsWith(today))
  if (mission.id === 'tres-pistas') {
    return input.notebooks.some(
      (book) => book.markedEvidence.length >= 3 && book.updatedAt.startsWith(today),
    )
  }
  if (mission.id === 'deduccion-perfecta') {
    return solved.some((run) => run.solvedAt?.startsWith(today) && run.score === 100)
  }
  if (mission.id === 'tres-semanales') {
    return input.weeklyIds.length > 0 && input.weeklyIds.every((id) => solved.some((run) => run.caseId === id))
  }
  if (mission.id === 'comunitario') return input.communityPosts > 0
  if (mission.id === 'sin-ayudas') {
    return solved.some((run) => run.hintsUsed === 0 && run.solvedAt && sameWeek(run.solvedAt, now))
  }
  return false
}
