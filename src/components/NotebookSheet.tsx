import { Plus, Star, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Hypothesis, Notebook } from '../types'
import { createId } from '../lib/format'
import { Button } from './ui'

export function NotebookSheet({
  notebook,
  suspects,
  evidence,
  onClose,
  onSave,
}: {
  notebook: Notebook
  suspects: Array<{ id: string; name: string }>
  evidence: Array<{ id: string; title: string }>
  onClose: () => void
  onSave: (notebook: Notebook) => Promise<void>
}) {
  const [draft, setDraft] = useState(notebook)
  const [hypothesis, setHypothesis] = useState('')
  const [saved, setSaved] = useState(false)
  const draftRef = useRef(draft)
  const onSaveRef = useRef(onSave)
  draftRef.current = draft
  onSaveRef.current = onSave

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void onSaveRef.current({ ...draft, updatedAt: new Date().toISOString() }).then(() => {
        setSaved(true)
        window.setTimeout(() => setSaved(false), 1200)
      })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [draft])

  useEffect(() => {
    return () => {
      void onSaveRef.current({ ...draftRef.current, updatedAt: new Date().toISOString() })
    }
  }, [])

  function toggle(list: 'markedSuspects' | 'markedEvidence', id: string) {
    setDraft((current) => {
      const has = current[list].includes(id)
      return {
        ...current,
        [list]: has ? current[list].filter((item) => item !== id) : [...current[list], id],
      }
    })
  }

  function addHypothesis() {
    const text = hypothesis.trim()
    if (!text) return
    const next: Hypothesis = { id: createId(), text, createdAt: new Date().toISOString() }
    setDraft((current) => ({ ...current, hypotheses: [next, ...current.hypotheses] }))
    setHypothesis('')
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60" role="presentation">
      <button className="absolute inset-0" aria-label="Cerrar libreta" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 left-1/2 flex max-h-[88dvh] w-full max-w-[480px] -translate-x-1/2 flex-col rounded-t-[28px] border border-white/10 bg-[#100e16]"
        role="dialog"
        aria-labelledby="notebook-title"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p id="notebook-title" className="font-display text-3xl leading-none">
              Libreta
            </p>
            <p className="mt-1 text-xs tracking-[0.18em] text-gold uppercase">{saved ? 'Guardado' : 'Guardado automático'}</p>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-line" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 overflow-y-auto px-5 pb-8">
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.18em] text-muted uppercase">Notas</span>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-32 w-full resize-none rounded-2xl border border-line bg-panel px-4 py-3 text-base"
              placeholder="Lo que no quieres olvidar…"
            />
          </label>
          <section>
            <h3 className="text-xs tracking-[0.18em] text-muted uppercase">Sospechosos marcados</h3>
            <ul className="mt-3 space-y-2">
              {suspects.map((suspect) => {
                const marked = draft.markedSuspects.includes(suspect.id)
                return (
                  <li key={suspect.id}>
                    <button
                      type="button"
                      aria-pressed={marked}
                      onClick={() => toggle('markedSuspects', suspect.id)}
                      className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-line px-4 text-left"
                    >
                      {suspect.name}
                      <Star className={marked ? 'h-4 w-4 fill-gold text-gold' : 'h-4 w-4 text-muted'} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section>
            <h3 className="text-xs tracking-[0.18em] text-muted uppercase">Pruebas importantes</h3>
            <ul className="mt-3 space-y-2">
              {evidence.map((item) => {
                const marked = draft.markedEvidence.includes(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={marked}
                      onClick={() => toggle('markedEvidence', item.id)}
                      className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-line px-4 text-left"
                    >
                      {item.title}
                      <Star className={marked ? 'h-4 w-4 fill-gold text-gold' : 'h-4 w-4 text-muted'} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section>
            <h3 className="text-xs tracking-[0.18em] text-muted uppercase">Hipótesis</h3>
            <div className="mt-3 flex gap-2">
              <input
                value={hypothesis}
                onChange={(event) => setHypothesis(event.target.value)}
                className="min-h-12 flex-1 rounded-2xl border border-line bg-panel px-4"
                placeholder="Si esto es cierto…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addHypothesis()
                  }
                }}
              />
              <Button type="button" aria-label="Añadir hipótesis" onClick={addHypothesis} className="px-4">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {draft.hypotheses.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
                  <p className="flex-1 text-sm">{item.text}</p>
                  <button
                    type="button"
                    aria-label="Eliminar hipótesis"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        hypotheses: current.hypotheses.filter((entry) => entry.id !== item.id),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
