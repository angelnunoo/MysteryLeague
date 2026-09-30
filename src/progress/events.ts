export interface GameEvent {
  id: string
  name: string
  season: string
  blurb: string
  caseId: string
  badgeId: string
  cosmeticId: string
  start: string
  end: string
  cover: string
}

export const EVENTS: GameEvent[] = [
  {
    id: 'verano',
    name: 'Misterio en el Crucero Imperial',
    season: 'Verano',
    blurb: 'Un camarote cerrado y una cubierta que no cuadra.',
    caseId: 'evento-crucero',
    badgeId: 'evento-crucero',
    cosmeticId: 'tarjeta-crucero',
    start: '2026-06-15',
    end: '2026-08-31',
    cover: 'linear-gradient(160deg,#0e3a4a,#071018 60%,#c4a46a)',
  },
  {
    id: 'estreno',
    name: 'La Noche del Archivo',
    season: 'Estreno',
    blurb: 'El cuartel abre sus sótanos. Hay una lámpara que no debía estar encendida.',
    caseId: 'evento-archivo',
    badgeId: 'evento-archivo',
    cosmeticId: 'marco-archivo',
    start: '2026-09-20',
    end: '2026-10-14',
    cover: 'linear-gradient(160deg,#2a2114,#100e16 55%,#07060a)',
  },
  {
    id: 'halloween',
    name: 'Noche de los Espectros',
    season: 'Halloween',
    blurb: 'El campanario tiene una máscara de más.',
    caseId: 'evento-espectros',
    badgeId: 'evento-espectros',
    cosmeticId: 'marco-espectros',
    start: '2026-10-15',
    end: '2026-11-02',
    cover: 'linear-gradient(160deg,#3a2208,#120c08 60%,#e11d48)',
  },
  {
    id: 'navidad',
    name: 'Robo en el Polo Norte',
    season: 'Navidad',
    blurb: 'Alguien se llevó el sello del trineo antes del deshielo.',
    caseId: 'evento-polo',
    badgeId: 'evento-polo',
    cosmeticId: 'fondo-polo',
    start: '2026-12-15',
    end: '2027-01-06',
    cover: 'linear-gradient(160deg,#d7e4ef,#1a2744 55%,#8c1d2c)',
  },
  {
    id: 'ano-nuevo',
    name: 'El Diamante Desaparecido',
    season: 'Año Nuevo',
    blurb: 'A las doce falta una piedra y sobra una coartada.',
    caseId: 'evento-diamante',
    badgeId: 'evento-diamante',
    cosmeticId: 'titulo-diamante',
    start: '2026-12-28',
    end: '2027-01-05',
    cover: 'linear-gradient(160deg,#102033,#07060a 50%,#d7ecff)',
  },
]

export type EventPhase = 'active' | 'upcoming' | 'past'

export function eventPhase(event: GameEvent, now = new Date()): EventPhase {
  const start = new Date(`${event.start}T00:00:00`)
  const end = new Date(`${event.end}T23:59:59`)
  if (now < start) return 'upcoming'
  if (now > end) return 'past'
  return 'active'
}

export function activeEvent(now = new Date()): GameEvent | null {
  return EVENTS.find((event) => eventPhase(event, now) === 'active') ?? null
}

export function eventByCase(caseId: string): GameEvent | undefined {
  return EVENTS.find((event) => event.caseId === caseId)
}

export function countdownLabel(event: GameEvent, now = new Date()): string {
  const phase = eventPhase(event, now)
  const target = new Date(`${phase === 'upcoming' ? event.start : event.end}T23:59:59`)
  const ms = Math.max(0, target.getTime() - now.getTime())
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (phase === 'past') return 'Archivo cerrado'
  if (phase === 'upcoming') return days > 0 ? `Empieza en ${days} d` : `Empieza en ${hours} h`
  if (days > 0) return `${days} d ${hours} h`
  return `${Math.max(1, hours)} h`
}
