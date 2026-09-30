import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { useProgress } from '../context/ProgressContext'
import { buildExhibits } from '../collection/exhibits'
import { RAVENHILL } from '../narrative/ravenhill'

const KINDS = ['todos', 'objeto', 'foto', 'documento', 'insignia'] as const

export function EvidencePage() {
  const { profile } = useAuth()
  const { runs } = useGame()
  const { state } = useProgress()
  const [kind, setKind] = useState<(typeof KINDS)[number]>('todos')
  const exhibits = useMemo(() => {
    if (!profile) return []
    return buildExhibits({
      solvedIds: runs.filter((run) => run.status === 'solved').map((run) => run.caseId),
      dossierRead: state.dossierRead,
      eventSolved: runs.filter((run) => run.status === 'solved' && run.caseId.startsWith('evento-')).map((run) => run.caseId),
      badgeIds: profile.badgeIds,
    })
  }, [profile, runs, state.dossierRead])
  if (!profile) return null
  const visible = exhibits.filter((item) => (kind === 'todos' ? true : item.kind === kind))
  const owned = exhibits.filter((item) => item.owned)
  const rare = owned.filter((item) => item.rare)

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Museo personal</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Evidencias</h1>
      <p className="mt-3 text-sm text-muted">
        {owned.length} piezas en la sala. {rare.length} raras. {state.dossierRead >= 20 ? `${RAVENHILL.title} está completo.` : `${RAVENHILL.title}: ${state.dossierRead}/20.`}
      </p>
      <div className="rail mt-4 flex gap-2 overflow-x-auto">
        {KINDS.map((item) => (
          <button key={item} type="button" onClick={() => setKind(item)} className={kind === item ? 'rounded-full bg-gold px-4 py-2 text-xs font-semibold text-void' : 'rounded-full border border-line px-4 py-2 text-xs capitalize'}>
            {item}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {visible.map((item) => (
          <li key={item.id} className={item.owned ? 'rounded-[28px] border border-gold/30 bg-panel p-3' : 'rounded-[28px] border border-line p-3 opacity-45'}>
            <p className="text-[10px] tracking-[0.14em] text-gold uppercase">{item.rare ? 'Rara' : item.kind}</p>
            <p className="mt-2 font-display text-2xl leading-none">{item.owned ? item.title : 'En el archivo'}</p>
            <p className="mt-2 text-xs text-muted">{item.owned ? item.detail : 'Se abre al cerrar el caso.'}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
