export interface StreakMilestone {
  days: number
  credits: number
  badge?: string
  item?: string
  label: string
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, credits: 15, badge: 'racha-3', label: 'Tres noches seguidas' },
  { days: 7, credits: 30, badge: 'racha-7', item: 'marco-bruma', label: 'Una semana en el archivo' },
  { days: 15, credits: 45, badge: 'racha-15', item: 'marco-epico', label: 'Quince días sin soltar el caso' },
  { days: 30, credits: 70, badge: 'racha-30', item: 'fondo-oficina', label: 'Un mes de investigación' },
  { days: 60, credits: 100, badge: 'racha-60', item: 'marco-leyenda', label: 'Sesenta días de racha' },
  { days: 100, credits: 160, badge: 'racha-100', item: 'titulo-leyenda', label: 'Cien días. La ciudad ya te conoce.' },
]

export const STREAK_BREAK_COPY =
  'La racha descansó. Puedes encender otra cuando quieras: lo que ya ganaste se queda contigo.'
