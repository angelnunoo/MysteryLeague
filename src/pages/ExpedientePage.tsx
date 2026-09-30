import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext'
import {
  RAVEN_CHAPTERS,
  RAVEN_CLUES,
  RAVEN_PEOPLE,
  RAVEN_TIMELINE,
  RAVENHILL,
  chapterByNumber,
} from '../narrative/ravenhill'

const TABS = ['Episodio', 'Cronología', 'Pruebas', 'Sospechosos', 'Resumen'] as const

export function ExpedientesPage() {
  const { state } = useProgress()
  const next = Math.min(20, state.dossierRead + 1)
  return (
    <main className="px-4 pt-6 pb-8" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Grandes expedientes</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Serie</h1>
      <Link to="/expedientes/ravenhill" className="mt-5 block overflow-hidden rounded-[32px] p-5" style={{ background: RAVENHILL.cover }}>
        <div className="film pointer-events-none absolute" />
        <p className="text-[10px] tracking-[0.24em] text-gold uppercase">{RAVENHILL.location}</p>
        <h2 className="mt-2 font-display text-5xl leading-none">{RAVENHILL.title}</h2>
        <p className="mt-3 text-sm text-ink/80">{RAVENHILL.logline}</p>
        <p className="mt-4 text-xs tracking-[0.16em] text-gold uppercase">Continuar · capítulo {next} de 20</p>
      </Link>
    </main>
  )
}

export function ExpedienteReaderPage() {
  const { dossierId } = useParams()
  const { state, readChapter, addTheory } = useProgress()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Episodio')
  const [chapter, setChapter] = useState(1)
  useEffect(() => {
    setChapter(Math.max(1, Math.min(20, state.dossierRead || 1)))
  }, [state.dossierRead])
  const [theory, setTheory] = useState('')
  const [error, setError] = useState<string | null>(null)
  if (dossierId !== RAVENHILL.id) {
    return (
      <main className="px-4 pt-8">
        <p>Ese expediente no está en el archivo.</p>
        <Link to="/expedientes" className="mt-4 inline-block text-gold">Volver</Link>
      </main>
    )
  }
  const current = chapterByNumber(chapter)
  const unlocked = state.dossierRead
  const people = RAVEN_PEOPLE.filter((person) => person.from <= Math.max(unlocked, chapter <= unlocked ? chapter : unlocked))
  const clues = RAVEN_CLUES.filter((clue) => clue.from <= unlocked)
  const beats = RAVEN_TIMELINE.filter((beat) => beat.from <= unlocked)

  return (
    <main className="min-h-dvh" style={{ background: RAVENHILL.cover }}>
      <div className="film pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <Link to="/expedientes" className="text-[10px] tracking-[0.22em] text-gold uppercase">Serie</Link>
        <h1 className="mt-2 font-display text-5xl leading-[0.9]">{RAVENHILL.title}</h1>
        <p className="mt-2 text-sm text-ink/75">{RAVENHILL.subtitle}</p>
        <div className="rail mt-4 flex gap-2 overflow-x-auto">
          {RAVEN_CHAPTERS.map((item) => {
            const open = item.number <= unlocked + 1
            return (
              <button
                key={item.number}
                type="button"
                disabled={!open}
                onClick={() => setChapter(item.number)}
                className={item.number === chapter ? 'shrink-0 rounded-full bg-gold px-3 py-2 text-xs font-semibold text-void' : 'shrink-0 rounded-full border border-white/20 px-3 py-2 text-xs disabled:opacity-40'}
              >
                {item.number}
              </button>
            )
          })}
        </div>
        <div className="rail mt-4 flex gap-2 overflow-x-auto">
          {TABS.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? 'shrink-0 text-xs tracking-[0.16em] text-gold uppercase' : 'shrink-0 text-xs tracking-[0.16em] text-muted uppercase'}>
              {item}
            </button>
          ))}
        </div>

        {tab === 'Episodio' && current ? (
          <article className="mt-5 rounded-[28px] border border-white/10 bg-black/50 p-5">
            <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Capítulo {current.number}</p>
            <h2 className="mt-2 font-display text-4xl leading-none">{current.title}</h2>
            {chapter > unlocked + 1 ? null : current.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-relaxed text-ink/90">{paragraph}</p>
            ))}
            {chapter === unlocked + 1 ? (
              <button type="button" className="mt-6 min-h-12 w-full rounded-full bg-gold text-sm font-semibold text-void" onClick={() => void readChapter(chapter)}>
                Guardar y seguir
              </button>
            ) : (
              <p className="mt-6 text-xs text-muted">Este episodio ya está en tu archivo.</p>
            )}
          </article>
        ) : null}

        {tab === 'Cronología' ? (
          <ol className="mt-5 space-y-3 border-l border-gold/40 pl-4">
            {beats.length === 0 ? <li className="text-sm text-muted">La cronología empieza cuando lees el primer capítulo.</li> : null}
            {beats.map((beat) => (
              <li key={beat.id}>
                <p className="text-[10px] tracking-[0.16em] text-gold uppercase">{beat.time}</p>
                <p className="text-sm">{beat.text}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {tab === 'Pruebas' ? (
          <ul className="mt-5 grid grid-cols-2 gap-2">
            {clues.length === 0 ? <li className="text-sm text-muted">Aún no hay pruebas en el mapa.</li> : null}
            {clues.map((clue) => (
              <li key={clue.id} className="rounded-3xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] tracking-[0.14em] text-gold uppercase">{clue.kind}</p>
                <p className="mt-1 text-sm">{clue.title}</p>
                <p className="mt-1 text-xs text-muted">{clue.detail}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === 'Sospechosos' ? (
          <ul className="mt-5 space-y-2">
            {people.length === 0 ? <li className="text-sm text-muted">El muro se llena con la serie.</li> : null}
            {people.map((person) => (
              <li key={person.id} className="rounded-[28px] border border-white/10 bg-black/40 p-4">
                <p className="font-display text-3xl leading-none">{person.name}</p>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-gold uppercase">{person.role}</p>
                <p className="mt-2 text-sm text-muted">{person.note}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === 'Resumen' ? (
          <section className="mt-5">
            <ol className="space-y-2">
              {RAVEN_CHAPTERS.filter((item) => item.number <= unlocked).map((item) => (
                <li key={item.number} className="rounded-3xl border border-white/10 px-4 py-3">
                  <p className="text-[10px] text-gold">Capítulo {item.number}</p>
                  <p className="text-sm">{item.summary}</p>
                </li>
              ))}
            </ol>
            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault()
                setError(null)
                void addTheory(theory)
                  .then(() => setTheory(''))
                  .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo guardar.'))
              }}
            >
              <label className="text-[10px] tracking-[0.16em] text-muted uppercase" htmlFor="teoria">Tu teoría</label>
              <textarea id="teoria" value={theory} onChange={(event) => setTheory(event.target.value)} className="mt-2 min-h-24 w-full rounded-3xl border border-line bg-black/40 p-4 text-sm" placeholder="Lo que la serie todavía no dice" />
              {error ? <p className="mt-2 text-sm text-crimson">{error}</p> : null}
              <button type="submit" className="mt-3 min-h-11 rounded-full bg-gold px-5 text-sm font-semibold text-void">Añadir a la serie</button>
            </form>
            <ul className="mt-4 space-y-2">
              {state.theories.map((item) => (
                <li key={item} className="rounded-3xl border border-gold/30 px-4 py-3 text-sm">{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  )
}
