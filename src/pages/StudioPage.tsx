import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { localCaseModel } from '../studio/model'
import { validateCase } from '../studio/validator'
import { saveGenerated } from '../services/studioStore'
import type { MysteryCase } from '../types'
import type { ValidationReport } from '../studio/model'

export function StudioPage() {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('Un teatro cerrado y una firma que no puede hacerse.')
  const [level, setLevel] = useState(4)
  const [minutes, setMinutes] = useState(20)
  const [mystery, setMystery] = useState<MysteryCase | null>(null)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    if (!user) return
    setBusy(true)
    setStatus(null)
    try {
      const draft = await localCaseModel.generate({ prompt, level, durationMinutes: minutes })
      const checked = validateCase(draft)
      setMystery(draft)
      setReport(checked)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!user || !mystery || !report?.ok) return
    setBusy(true)
    try {
      await saveGenerated(mystery, user.id)
      setStatus('Guardado en el archivo. Ya puedes abrirlo en la biblioteca.')
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : 'No se pudo guardar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Generador</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Sala de casos</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        El modelo local escribe historia, pruebas, testimonios, solución, nivel, duración y pistas. Un modelo de IA puede ocupar el mismo sitio. Nada se guarda si el validador encuentra una contradicción o más de una solución.
      </p>
      <label className="mt-5 block" htmlFor="brief">
        <span className="mb-2 block text-xs tracking-[0.18em] text-muted uppercase">Encargo</span>
        <textarea
          id="brief"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-28 w-full resize-none rounded-3xl border border-line bg-panel px-4 py-3 text-base outline-none"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs tracking-[0.16em] text-muted uppercase">
          Nivel
          <input type="number" min={1} max={50} value={level} onChange={(event) => setLevel(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-panel px-3 text-base text-ink normal-case" />
        </label>
        <label className="text-xs tracking-[0.16em] text-muted uppercase">
          Minutos
          <input type="number" min={8} max={90} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-panel px-3 text-base text-ink normal-case" />
        </label>
      </div>
      <button type="button" disabled={busy} onClick={() => void generate()} className="mt-4 min-h-12 w-full rounded-full bg-gold text-sm font-semibold text-void disabled:opacity-50">
        Generar y validar
      </button>
      {report ? (
        <section className="mt-5 rounded-[28px] border border-line p-4">
          <h2 className="font-display text-3xl leading-none">{report.ok ? 'Solución única' : 'No se sostiene'}</h2>
          <ul className="mt-3 space-y-2">
            {report.issues.length === 0 ? <li className="text-sm text-muted">Sin contradicciones. Una sola mano encaja.</li> : null}
            {report.issues.map((issue) => (
              <li key={issue.message} className={issue.level === 'error' ? 'text-sm text-crimson' : 'text-sm text-gold'}>
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {mystery ? (
        <article className="mt-4 rounded-[28px] border border-gold/30 bg-panel p-4">
          <p className="text-[10px] tracking-[0.18em] text-gold uppercase">
            Nivel {level} · {minutes} min · {mystery.hints.length} pistas
          </p>
          <h2 className="mt-2 font-display text-4xl leading-none">{mystery.title}</h2>
          <p className="mt-3 text-sm leading-6">{mystery.synopsis}</p>
          <p className="mt-3 text-xs text-muted">{mystery.evidence.length} pruebas · {mystery.testimonies.length} testimonios · {mystery.suspects.length} sospechosos</p>
        </article>
      ) : null}
      <button type="button" disabled={!report?.ok || busy} onClick={() => void save()} className="mt-4 min-h-12 w-full rounded-full border border-line text-sm disabled:opacity-40">
        Guardar en Supabase y en el archivo
      </button>
      {status ? <p className="mt-3 text-sm text-gold">{status}</p> : null}
      {mystery && report?.ok ? (
        <Link to={`/casos/${mystery.id}`} className="mt-3 inline-flex text-sm text-gold">
          Abrir el caso
        </Link>
      ) : null}
    </main>
  )
}
