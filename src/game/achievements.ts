export type AchievementTier = 'visible' | 'oculto' | 'legendario'

export interface Achievement {
  id: string
  name: string
  description: string
  tier: AchievementTier
  hint: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primer-caso', name: 'Primer expediente', description: 'Cierras tu primer caso.', tier: 'visible', hint: '' },
  { id: 'precision', name: 'Deducción perfecta', description: 'Aciertas el caso entero.', tier: 'visible', hint: '' },
  { id: 'veloz', name: 'Relámpago', description: 'Cierras dentro del tiempo.', tier: 'visible', hint: '' },
  { id: 'aportacion', name: 'Voz en la mesa', description: 'Publicas en el caso comunitario.', tier: 'visible', hint: '' },
  { id: 'racha-3', name: 'Tres noches', description: 'Mantén una racha de 3 días.', tier: 'visible', hint: '' },
  { id: 'archivo-negro', name: 'Archivo negro', description: 'Generas un caso que pasa el validador.', tier: 'oculto', hint: 'Hay una sala donde los casos nacen.' },
  { id: 'circulo', name: 'Mesa compartida', description: 'Investigas con al menos un amigo.', tier: 'oculto', hint: 'Alguien tiene que sentarse a tu lado.' },
  { id: 'silencio-absoluto', name: 'Sin red', description: 'Cierras un caso a 100 sin pistas.', tier: 'oculto', hint: 'La ayuda es una muleta.' },
  { id: 'mitico', name: 'Nombre en el mármol', description: 'Alcanza el nivel 15.', tier: 'legendario', hint: 'Queda lejos. Se nota.' },
  { id: 'liga-oro', name: 'Liga de oro', description: 'Cierras una temporada en lo alto.', tier: 'legendario', hint: 'El podio no se presta.' },
  { id: 'comisario', name: 'La ciudad es tuya', description: 'Alcanza el rango Comisario.', tier: 'legendario', hint: 'El último rango no se anuncia.' },
]

export function achievementState(input: {
  badgeIds: string[]
  level: number
  friends: number
  posts: number
  perfectSilent: boolean
  generated: boolean
}): Set<string> {
  const earned = new Set(input.badgeIds)
  if (input.posts > 0) earned.add('aportacion')
  if (input.friends > 0) earned.add('circulo')
  if (input.perfectSilent) earned.add('silencio-absoluto')
  if (input.generated) earned.add('archivo-negro')
  if (input.level >= 15) earned.add('mitico')
  return earned
}
