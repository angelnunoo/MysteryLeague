import type { Badge } from '../types'

export const BADGES: Badge[] = [
  { id: 'primer-caso', name: 'Primer expediente', description: 'Cierras tu primer caso.' },
  { id: 'sin-pistas', name: 'Ojo clínico', description: 'Resuelves un caso sin ayudas.' },
  { id: 'precision', name: 'Deducción perfecta', description: 'Aciertas culpable, motivo, método y secuencia.' },
  { id: 'veloz', name: 'Relámpago', description: 'Cierras un caso dentro del tiempo de referencia.' },
  { id: 'expediente', name: 'Gran expediente', description: 'Resuelves un gran expediente.' },
  { id: 'coleccion', name: 'Archivo vivo', description: 'Completa un caso de cada tipo.' },
  { id: 'racha-3', name: 'Tres noches', description: 'Mantén una racha de 3 días.' },
  { id: 'racha-7', name: 'Semana en vela', description: 'Mantén una racha de 7 días.' },
  { id: 'racha-15', name: 'Quincena', description: 'Mantén una racha de 15 días.' },
  { id: 'racha-30', name: 'Mes en vela', description: 'Mantén una racha de 30 días.' },
  { id: 'racha-60', name: 'Dos lunas', description: 'Mantén una racha de 60 días.' },
  { id: 'racha-100', name: 'Cien noches', description: 'Mantén una racha de 100 días.' },
  { id: 'orden-ravenhill', name: 'La Orden', description: 'Cierras el expediente de Ravenhill.' },
  { id: 'evento-archivo', name: 'Noche del archivo', description: 'Cierras el caso del estreno.' },
  { id: 'evento-espectros', name: 'Espectro', description: 'Cierras el caso de Halloween.' },
  { id: 'evento-polo', name: 'Trineo', description: 'Cierras el caso de Navidad.' },
  { id: 'evento-crucero', name: 'Cubierta', description: 'Cierras el caso de verano.' },
  { id: 'evento-diamante', name: 'Doce campanadas', description: 'Cierras el caso de Año Nuevo.' },
  { id: 'investigador', name: 'Fin de la tutela', description: 'Alcanza el rango Investigador.' },
  { id: 'detective', name: 'Placa', description: 'Alcanza el rango Detective.' },
  { id: 'inspector', name: 'Despacho propio', description: 'Alcanza el rango Inspector.' },
  { id: 'comisario', name: 'La ciudad es tuya', description: 'Alcanza el rango Comisario.' },
  { id: 'liga-oro', name: 'Liga de oro', description: 'Cierras una temporada en el primer puesto.' },
  { id: 'liga-plata', name: 'Liga de plata', description: 'Cierras una temporada en el segundo puesto.' },
  { id: 'liga-bronce', name: 'Liga de bronce', description: 'Cierras una temporada en el tercer puesto.' },
]

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((badge) => badge.id === id)
}
