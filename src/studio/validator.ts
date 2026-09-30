import type { MysteryCase } from '../types'
import type { ValidationIssue, ValidationReport } from './model'

export function validateCase(mystery: MysteryCase): ValidationReport {
  const issues: ValidationIssue[] = []
  const suspectIds = new Set(mystery.suspects.map((suspect) => suspect.id))
  const evidenceIds = new Set(mystery.evidence.map((item) => item.id))
  const motiveIds = new Set(mystery.motives.map((item) => item.id))
  const methodIds = new Set(mystery.methods.map((item) => item.id))
  const timelineIds = mystery.timeline.map((event) => event.id)

  if (mystery.story.length < 2) issues.push({ level: 'error', message: 'La historia necesita al menos dos movimientos.' })
  if (mystery.suspects.length < 2) issues.push({ level: 'error', message: 'Hacen falta al menos dos sospechosos.' })
  if (!suspectIds.has(mystery.solution.culpritId)) {
    issues.push({ level: 'error', message: 'La solución señala a alguien que no está en el caso.' })
  }
  if (!motiveIds.has(mystery.solution.motiveId)) issues.push({ level: 'error', message: 'El motivo no existe.' })
  if (!methodIds.has(mystery.solution.methodId)) issues.push({ level: 'error', message: 'El método no existe.' })

  const sequence = mystery.solution.sequence
  if (new Set(sequence).size !== sequence.length) {
    issues.push({ level: 'error', message: 'La secuencia repite un hecho. La solución dejaría de ser única.' })
  }
  if (sequence.some((id) => !timelineIds.includes(id))) {
    issues.push({ level: 'error', message: 'La secuencia usa un hecho que no está en la línea temporal.' })
  }
  const times = sequence.map((id) => mystery.timeline.find((event) => event.id === id)?.time ?? '')
  const ordered = [...times].sort((a, b) => a.localeCompare(b))
  if (times.join() !== ordered.join()) {
    issues.push({ level: 'error', message: 'La secuencia no respeta el orden de las horas.' })
  }

  const decisive = mystery.evidence.filter((item) => item.tag === 'decisiva')
  if (decisive.length !== 1) {
    issues.push({ level: 'error', message: 'Debe haber una sola prueba decisiva. Si hay dos, hay dos soluciones.' })
  }
  const cleared = mystery.evidence.filter((item) => item.tag === 'descargo')
  const named = mystery.suspects.filter((suspect) =>
    cleared.some((item) => item.detail.includes(suspect.name) || item.detail.includes(suspect.id)),
  )
  const remaining = mystery.suspects.filter((suspect) => !named.some((item) => item.id === suspect.id))
  if (remaining.length !== 1 || remaining[0]?.id !== mystery.solution.culpritId) {
    issues.push({
      level: 'error',
      message: 'Los descargos no dejan un único culpable, o dejan a otro distinto del que marca la solución.',
    })
  }

  const culprit = mystery.suspects.find((suspect) => suspect.id === mystery.solution.culpritId)
  if (culprit && mystery.hints.some((hint) => hint.toLowerCase().includes(culprit.name.toLowerCase()))) {
    issues.push({ level: 'aviso', message: 'Una pista dice el nombre del culpable. Conviene velarlo.' })
  }
  if (mystery.evidence.some((item) => evidenceIds.size > 0 && item.detail.trim().length < 12)) {
    issues.push({ level: 'aviso', message: 'Hay una prueba demasiado corta para sostenerse.' })
  }

  const quotes = mystery.testimonies.map((item) => item.quote.trim().toLowerCase())
  if (new Set(quotes).size !== quotes.length) {
    issues.push({ level: 'error', message: 'Dos testimonios dicen lo mismo. Eso es una contradicción sin resolver.' })
  }
  for (const testimony of mystery.testimonies) {
    if (!suspectIds.has(testimony.suspectId)) {
      issues.push({ level: 'error', message: 'Un testimonio pertenece a un sospechoso que no existe.' })
    }
  }

  return { ok: issues.every((issue) => issue.level !== 'error'), issues }
}
