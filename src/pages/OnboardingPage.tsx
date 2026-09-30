import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '../components/ui'
import { Crest } from '../components/brand'
import { useAuth } from '../context/AuthContext'

const SLIDES = [
  {
    title: 'Bienvenido a MysteryLeague.',
    body: 'Este cuartel guarda casos, rangos y una liga que se mueve cuando tú te mueves.',
    wash: 'radial-gradient(circle at 50% 20%, rgba(228,194,122,0.28), transparent 42%)',
  },
  {
    title: 'Resuelve misterios.',
    body: 'Lee la historia, marca sospechosos, ordena la noche y cierra el expediente.',
    wash: 'radial-gradient(circle at 20% 30%, rgba(225,29,72,0.32), transparent 46%)',
  },
  {
    title: 'Compite contra tus amigos.',
    body: 'La XP decide el rango. La precisión y la racha deciden quién mira desde arriba.',
    wash: 'radial-gradient(circle at 80% 20%, rgba(125,211,252,0.22), transparent 42%)',
  },
  {
    title: 'Únete a investigaciones grupales.',
    body: 'La mesa semanal reúne a tu círculo sobre el mismo caso. Cada cual firma su veredicto.',
    wash: 'radial-gradient(circle at 50% 80%, rgba(228,194,122,0.2), transparent 40%)',
  },
]

export function OnboardingPage() {
  const { profile, saveProfile } = useAuth()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  async function finish() {
    if (!profile) return
    setBusy(true)
    setError(null)
    try {
      await saveProfile({ ...profile, onboardingCompleted: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar.')
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-10 pb-8" style={{ background: slide.wash }}>
      <div className="flex gap-2" aria-hidden="true">
        {SLIDES.map((item, dot) => (
          <span key={item.title} className={dot === index ? 'h-1 flex-1 rounded-full bg-gold' : 'h-1 flex-1 rounded-full bg-white/15'} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.section
          key={slide.title}
          drag={reduce ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 && !last) setIndex((value) => value + 1)
            if (info.offset.x > 60 && index > 0) setIndex((value) => value - 1)
          }}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -16 }}
          className="flex flex-1 flex-col justify-end"
        >
          {index === 0 ? <Crest className="mb-8 h-20 w-20" /> : null}
          <p className="text-[11px] tracking-[0.32em] text-gold uppercase">0{index + 1}</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.9]">{slide.title}</h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-white/75">{slide.body}</p>
        </motion.section>
      </AnimatePresence>
      {error ? (
        <p className="mt-4 text-sm text-crimson" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-8 grid gap-3">
        {last ? (
          <Button type="button" disabled={busy} onClick={() => void finish()}>
            {busy ? 'Entrando…' : 'Comenzar investigación'}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
              Atrás
            </Button>
            <Button type="button" onClick={() => setIndex((value) => value + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
