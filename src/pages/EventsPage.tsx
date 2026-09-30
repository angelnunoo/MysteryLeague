import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { badgeById } from '../game/badges'
import { LEGENDS } from '../game/legends'
import { SHOP } from '../game/shop'
import { EVENTS, countdownLabel, eventPhase } from '../progress/events'

export function EventsPage() {
  const { profile } = useAuth()
  const { runs } = useGame()
  if (!profile) return null
  const solved = new Set(runs.filter((run) => run.status === 'solved').map((run) => run.caseId))

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Temporada limitada</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Eventos</h1>
      <ul className="mt-5 space-y-4">
        {EVENTS.map((event) => {
          const phase = eventPhase(event)
          const done = solved.has(event.caseId)
          const cosmetic = SHOP.find((item) => item.id === event.cosmeticId)
          const board = [
            ...LEGENDS.slice(0, 4).map((legend, index) => ({
              name: legend.username,
              points: 40 + ((legend.xp + event.id.length * 17) % 50) - index,
              self: false,
            })),
            { name: profile.username, points: done ? 100 : 0, self: true },
          ].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'es'))
          return (
            <li key={event.id} className="overflow-hidden rounded-[32px] border border-white/10" style={{ background: event.cover }}>
              <div className="bg-black/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] tracking-[0.22em] text-gold uppercase">{event.season}</p>
                  <p className="rounded-full border border-white/20 px-3 py-1 text-[10px] tracking-[0.14em] uppercase">{countdownLabel(event)}</p>
                </div>
                <h2 className="mt-2 font-display text-4xl leading-none">{event.name}</h2>
                <p className="mt-2 text-sm text-ink/80">{event.blurb}</p>
                <p className="mt-3 text-xs text-muted">Insignia {badgeById(event.badgeId)?.name ?? 'exclusiva'} · {cosmetic?.name ?? 'cosmético exclusivo'}</p>
                {phase === 'upcoming' ? (
                  <p className="mt-4 text-sm">El caso se abre cuando empiece la noche.</p>
                ) : (
                  <Link to={`/casos/${event.caseId}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-4 text-sm font-semibold text-void">
                    {done ? 'Revisar caso' : phase === 'past' ? 'Revivir archivo' : 'Entrar al caso'}
                  </Link>
                )}
                <ol className="mt-4 space-y-1">
                  {board.map((row, index) => (
                    <li key={row.name} className={row.self ? 'flex justify-between text-sm text-gold' : 'flex justify-between text-sm text-ink/70'}>
                      <span>#{index + 1} {row.name}</span>
                      <span>{row.points}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
