import { ArrowDown, ArrowUp, ChevronLeft, Clock, NotebookPen, Star } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NotebookSheet } from '../components/NotebookSheet'
import { ResultsScreen } from '../components/ResultsScreen'
import { Button } from '../components/ui'
import { useGame } from '../context/GameContext'
import { CASE_TYPE_META, caseById } from '../data/cases'
import { puzzleOrder } from '../game/shuffle'
import { formatDuration } from '../lib/format'
import type { RewardSummary } from '../types'

type Phase = 'brief' | 'board' | 'accuse' | 'results'
type Tab = 'historia' | 'sospechosos' | 'pruebas' | 'testimonios' | 'cronologia' | 'pistas'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'historia', label: 'Historia' },
  { id: 'sospechosos', label: 'Sospechosos' },
  { id: 'pruebas', label: 'Pruebas' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'cronologia', label: 'Cronología' },
  { id: 'pistas', label: 'Pistas' },
]

export function CasePage() {
  const { caseId = '' } = useParams()
  const mystery = caseById(caseId)
  const navigate = useNavigate()
  const { ready, runs, ensureRun, updateRun, notebookFor, saveNotebook, completeCase } = useGame()
  const run = runs.find((item) => item.caseId === caseId)
  const [phase, setPhase] = useState<Phase>('brief')
  const [tab, setTab] = useState<Tab>('historia')
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sequence, setSequence] = useState<string[]>([])
  const [culpritId, setCulpritId] = useState<string | null>(null)
  const [motiveId, setMotiveId] = useState<string | null>(null)
  const [methodId, setMethodId] = useState<string | null>(null)
  const [confirmHint, setConfirmHint] = useState(false)
  const [liveSummary, setLiveSummary] = useState<RewardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)
  const opened = useRef(false)
  const elapsedRef = useRef(0)

  useEffect(() => {
    elapsedRef.current = elapsed
  }, [elapsed])

  useEffect(() => {
    if (!ready || opened.current) return
    opened.current = true
    if (run?.status === 'solved') setPhase('results')
    if (run) setElapsed(run.elapsedSeconds)
  }, [ready, run])

  useEffect(() => {
    if (!run || hydrated.current) return
    hydrated.current = true
    setElapsed(run.elapsedSeconds)
  }, [run])

  useEffect(() => {
    if (!mystery) return
    if (phase !== 'board' && phase !== 'accuse') return
    if (run) return
    void ensureRun(mystery.id)
  }, [ensureRun, mystery, phase, run])

  useEffect(() => {
    if (phase !== 'board' && phase !== 'accuse') return
    if (run?.status === 'solved') return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase, run?.status])

  useEffect(() => {
    if (!run || run.status === 'solved') return
    if (phase !== 'board' && phase !== 'accuse') return
    const timer = window.setInterval(() => {
      void updateRun({
        ...run,
        elapsedSeconds: elapsedRef.current,
        updatedAt: new Date().toISOString(),
      })
    }, 10000)
    return () => window.clearInterval(timer)
  }, [phase, run, updateRun])

  useEffect(() => {
    if (!mystery || phase !== 'accuse' || sequence.length > 0) return
    setSequence(
      puzzleOrder(
        mystery.timeline.map((event) => event.id),
        mystery.solution.sequence,
        mystery.id,
      ),
    )
  }, [mystery, phase, sequence.length])

  const persistNotebook = useCallback(
    (notebook: Parameters<typeof saveNotebook>[0]) => saveNotebook(notebook),
    [saveNotebook],
  )

  if (!ready) {
    return <p className="px-5 pt-16 text-sm text-muted">Abriendo el expediente…</p>
  }

  if (!mystery) {
    return (
      <div className="px-5 pt-16">
        <p>Ese expediente no está en el archivo.</p>
        <Button className="mt-6" type="button" onClick={() => navigate('/biblioteca')}>
          Volver a la biblioteca
        </Button>
      </div>
    )
  }

  const summary = liveSummary ?? run?.reward ?? null
  const solved = run?.status === 'solved'
  const hintsUsed = run?.hintsUsed ?? 0
  const notebook = notebookFor(mystery.id)
  const meta = CASE_TYPE_META[mystery.type]

  async function revealHint() {
    if (!run || solved) return
    await updateRun({
      ...run,
      hintsUsed: run.hintsUsed + 1,
      elapsedSeconds: elapsedRef.current,
      updatedAt: new Date().toISOString(),
    })
    setConfirmHint(false)
  }

  function move(index: number, direction: -1 | 1) {
    setSequence((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  async function submit() {
    if (!mystery || !culpritId || !motiveId || !methodId) return
    setSaving(true)
    setError(null)
    try {
      const reward = await completeCase({
        caseId: mystery.id,
        answers: { culpritId, motiveId, methodId, sequence },
        elapsedSeconds: elapsed,
        hintsUsed,
      })
      setLiveSummary(reward)
      setPhase('results')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cerrar el caso.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh" style={{ background: mystery.cover }}>
      <div className="min-h-dvh bg-gradient-to-b from-black/25 via-[#07060a]/92 to-[#07060a]">
        <header
          className="sticky top-0 z-20 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15"
              onClick={() => navigate(-1)}
              aria-label="Volver"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-[0.22em] text-gold uppercase">{meta.label}</p>
              <h1 className="truncate font-display text-2xl leading-none">{mystery.title}</h1>
            </div>
            <p className="flex items-center gap-1 text-sm text-gold">
              <Clock className="h-4 w-4" />
              {formatDuration(elapsed)}
            </p>
          </div>
        </header>

        {phase === 'brief' ? (
          <div className="px-5 pt-8 pb-10">
            <p className="text-xs tracking-[0.28em] text-gold uppercase">
              {mystery.location} · {mystery.year}
            </p>
            <h2 className="mt-3 font-display text-5xl leading-none">{mystery.subtitle}</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-white/80">
              {mystery.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Button
              full
              className="mt-8"
              type="button"
              onClick={() => {
                setPhase('board')
              }}
            >
              {run ? 'Continuar investigación' : 'Abrir investigación'}
            </Button>
          </div>
        ) : null}

        {phase === 'board' ? (
          <div className="pb-36">
            <div className="rail flex gap-2 overflow-x-auto px-4 py-4">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={
                    tab === item.id
                      ? 'shrink-0 rounded-full bg-gold px-4 py-2 text-sm text-void'
                      : 'shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80'
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="space-y-3 px-4">
              {tab === 'historia'
                ? mystery.story.map((paragraph) => (
                    <p key={paragraph} className="rounded-3xl border border-white/10 bg-black/30 p-4 text-sm leading-6">
                      {paragraph}
                    </p>
                  ))
                : null}
              {tab === 'sospechosos'
                ? mystery.suspects.map((suspect) => {
                    const marked = notebook.markedSuspects.includes(suspect.id)
                    return (
                      <article key={suspect.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-3xl leading-none">{suspect.name}</h3>
                            <p className="mt-1 text-xs tracking-[0.16em] text-gold uppercase">
                              {suspect.role} · {suspect.age}
                            </p>
                          </div>
                          {marked ? <Star className="h-4 w-4 fill-gold text-gold" /> : null}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/80">{suspect.summary}</p>
                        <p className="mt-3 text-sm text-white/60">Coartada: {suspect.alibi}</p>
                      </article>
                    )
                  })
                : null}
              {tab === 'pruebas'
                ? mystery.evidence.map((item) => {
                    const marked = notebook.markedEvidence.includes(item.id)
                    return (
                      <article key={item.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] tracking-[0.2em] text-gold uppercase">{item.tag}</p>
                          {marked ? <Star className="h-4 w-4 fill-gold text-gold" /> : null}
                        </div>
                        <h3 className="mt-2 font-display text-3xl leading-none">{item.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/80">{item.detail}</p>
                      </article>
                    )
                  })
                : null}
              {tab === 'testimonios'
                ? mystery.testimonies.map((item) => {
                    const suspect = mystery.suspects.find((person) => person.id === item.suspectId)
                    return (
                      <blockquote key={item.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs tracking-[0.16em] text-gold uppercase">{suspect?.name}</p>
                        <p className="mt-3 font-display text-2xl leading-snug italic">“{item.quote}”</p>
                        <p className="mt-3 text-sm text-white/60">{item.note}</p>
                      </blockquote>
                    )
                  })
                : null}
              {tab === 'cronologia'
                ? mystery.timeline.map((event, index) => (
                    <article key={event.id} className="flex gap-3 rounded-3xl border border-white/10 bg-black/30 p-4">
                      <span className="font-display text-2xl text-gold">{index + 1}</span>
                      <div>
                        <p className="text-xs tracking-[0.16em] text-muted uppercase">{event.time}</p>
                        <p className="mt-1 text-sm leading-6">{event.text}</p>
                      </div>
                    </article>
                  ))
                : null}
              {tab === 'pistas' ? (
                <div className="space-y-3">
                  {mystery.hints.slice(0, hintsUsed).map((hint, index) => (
                    <p key={hint} className="rounded-3xl border border-gold/30 bg-gold/10 p-4 text-sm">
                      Ayuda {index + 1}. {hint}
                    </p>
                  ))}
                  {hintsUsed < mystery.hints.length && !solved ? (
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm leading-6 text-white/75">
                        Cada ayuda resta 4 puntos. Quedan {mystery.hints.length - hintsUsed}.
                      </p>
                      {confirmHint ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button type="button" variant="danger" onClick={() => void revealHint()}>
                            Consultar
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setConfirmHint(false)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button className="mt-4" type="button" variant="panel" onClick={() => setConfirmHint(true)}>
                          Pedir ayuda
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No quedan ayudas por abrir.</p>
                  )}
                </div>
              ) : null}
            </div>
            <div
              className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-2 gap-2 border-t border-white/10 bg-[#0c0b12]/92 px-4 pt-3 backdrop-blur-xl"
              style={{ paddingBottom: 'calc(0.8rem + env(safe-area-inset-bottom))' }}
            >
              <Button type="button" variant="panel" onClick={() => setNotebookOpen(true)}>
                <NotebookPen className="h-4 w-4" /> Libreta
              </Button>
              {solved ? (
                <Button type="button" onClick={() => setPhase('results')}>
                  Ver veredicto
                </Button>
              ) : (
                <Button type="button" onClick={() => setPhase('accuse')}>
                  Resolver
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {phase === 'accuse' && !solved ? (
          <div className="space-y-6 px-4 pt-6 pb-12">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Cierre</p>
              <h2 className="mt-2 font-display text-4xl leading-none">El veredicto no se repite.</h2>
              <p className="mt-3 text-sm text-white/70">Responde las cuatro preguntas. El tiempo sigue corriendo.</p>
            </div>
            <ChoiceBlock
              legend="Culpable"
              value={culpritId}
              options={mystery.suspects.map((suspect) => ({ id: suspect.id, label: suspect.name }))}
              onChange={setCulpritId}
            />
            <ChoiceBlock legend="Motivo" value={motiveId} options={mystery.motives} onChange={setMotiveId} />
            <ChoiceBlock legend="Método" value={methodId} options={mystery.methods} onChange={setMethodId} />
            <fieldset>
              <legend className="text-xs tracking-[0.18em] text-muted uppercase">Secuencia de acontecimientos</legend>
              <ol className="mt-3 space-y-2">
                {sequence.map((id, index) => {
                  const event = mystery.timeline.find((item) => item.id === id)
                  return (
                    <li key={id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <span className="w-6 font-display text-xl text-gold">{index + 1}</span>
                      <p className="flex-1 text-sm">
                        <span className="text-muted">{event?.time}</span> {event?.text}
                      </p>
                      <button type="button" className="grid h-10 w-10 place-items-center" aria-label="Subir" onClick={() => move(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" className="grid h-10 w-10 place-items-center" aria-label="Bajar" onClick={() => move(index, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </li>
                  )
                })}
              </ol>
            </fieldset>
            {error ? (
              <p className="text-sm text-crimson" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="ghost" onClick={() => setPhase('board')}>
                Seguir mirando
              </Button>
              <Button
                type="button"
                disabled={!culpritId || !motiveId || !methodId || sequence.length !== mystery.timeline.length || saving}
                onClick={() => void submit()}
              >
                {saving ? 'Cerrando…' : 'Entregar'}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'results' && summary ? (
          <ResultsScreen
            mystery={mystery}
            summary={summary}
            onLibrary={() => navigate('/')}
            onReview={() => setPhase('board')}
          />
        ) : null}

        {notebookOpen ? (
          <NotebookSheet
            notebook={notebook}
            suspects={mystery.suspects}
            evidence={mystery.evidence}
            onClose={() => setNotebookOpen(false)}
            onSave={persistNotebook}
          />
        ) : null}
      </div>
    </div>
  )
}

function ChoiceBlock({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: Array<{ id: string; label: string }>
  value: string | null
  onChange: (id: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-xs tracking-[0.18em] text-muted uppercase">{legend}</legend>
      <div className="mt-3 grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={
              value === option.id
                ? 'min-h-12 rounded-2xl border border-gold bg-gold/15 px-4 text-left text-sm'
                : 'min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-sm'
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
