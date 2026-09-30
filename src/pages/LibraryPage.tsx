import { useState } from 'react'
import { CaseCard } from '../components/CaseCard'
import { useGame } from '../context/GameContext'
import { CASES, CASE_TYPE_META } from '../data/cases'
import { listGenerated } from '../services/studioStore'
import type { CaseType } from '../types'

const TYPES: Array<CaseType | 'todos'> = ['todos', 'rapido', 'normal', 'complejo', 'expediente']
const STATUS = ['todos', 'nuevos', 'curso', 'cerrados'] as const

export function LibraryPage() {
  const { runs } = useGame()
  const [type, setType] = useState<(typeof TYPES)[number]>('todos')
  const [status, setStatus] = useState<(typeof STATUS)[number]>('todos')

  const visible = [...CASES, ...listGenerated()].filter((mystery) => {
    if (type !== 'todos' && mystery.type !== type) return false
    const run = runs.find((item) => item.caseId === mystery.id)
    if (status === 'nuevos') return !run
    if (status === 'curso') return run?.status === 'in_progress'
    if (status === 'cerrados') return run?.status === 'solved'
    return true
  })

  return (
    <main className="px-4 pt-6" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Archivo</p>
      <h1 className="font-display text-5xl leading-none">Biblioteca</h1>
      <p className="mt-3 text-sm text-muted">Cuatro temperaturas de caso. Elige según el tiempo que tengas.</p>
      <div className="rail mt-5 flex gap-2 overflow-x-auto">
        {TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={chip(type === item)}
          >
            {item === 'todos' ? 'Todos' : CASE_TYPE_META[item].label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {STATUS.map((item) => (
          <button key={item} type="button" onClick={() => setStatus(item)} className={chip(status === item)}>
            {item === 'todos' ? 'Todo' : item === 'nuevos' ? 'Nuevos' : item === 'curso' ? 'En curso' : 'Cerrados'}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-4">
        {visible.length === 0 ? <p className="text-sm text-muted">No hay expedientes con ese filtro.</p> : null}
        {visible.map((mystery) => (
          <CaseCard key={mystery.id} mystery={mystery} run={runs.find((run) => run.caseId === mystery.id)} />
        ))}
      </div>
    </main>
  )
}

function chip(active: boolean): string {
  return active
    ? 'shrink-0 rounded-full bg-gold px-4 py-2 text-sm text-void'
    : 'shrink-0 rounded-full border border-line px-4 py-2 text-sm text-muted'
}
