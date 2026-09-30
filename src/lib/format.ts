export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function yesterdayISO(date = new Date()): string {
  const copy = new Date(date)
  copy.setDate(copy.getDate() - 1)
  return todayISO(copy)
}

export function isoWeek(date = new Date()): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function countdownToNextMonday(date = new Date()): string {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  const day = next.getDay()
  const daysUntil = day === 1 ? 7 : (8 - day) % 7
  next.setDate(next.getDate() + daysUntil)
  const hours = Math.max(1, Math.round((next.getTime() - date.getTime()) / 3600000))
  if (hours < 48) return `${hours} h`
  return `${Math.ceil(hours / 24)} días`
}

export function formatAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `ml_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return 'Introduce un correo válido.'
  return null
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username.trim())) {
    return 'El nombre debe tener de 3 a 16 caracteres: letras, números o _.'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña necesita al menos 8 caracteres.'
  return null
}
