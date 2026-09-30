import { motion, useReducedMotion } from 'framer-motion'
import { Award, Check, Coins, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { badgeById } from '../game/badges'
import { formatDuration, formatNumber } from '../lib/format'
import type { MysteryCase, RewardSummary } from '../types'
import { Button } from './ui'

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const [current, setCurrent] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setCurrent(value)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 900)
      setCurrent(Math.round(value * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduce, value])

  return <>{current}</>
}

function Row({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <span className={ok ? 'mt-0.5 text-gold' : 'mt-0.5 text-crimson'}>
        {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-sm text-white/60">{label}</p>
        <p className="text-sm">{detail}</p>
      </div>
    </li>
  )
}

export function ResultsScreen({
  mystery,
  summary,
  onLibrary,
  onReview,
}: {
  mystery: MysteryCase
  summary: RewardSummary
  onLibrary: () => void
  onReview: () => void
}) {
  const culprit = mystery.suspects.find((item) => item.id === mystery.solution.culpritId)
  const motive = mystery.motives.find((item) => item.id === mystery.solution.motiveId)
  const method = mystery.methods.find((item) => item.id === mystery.solution.methodId)
  const rankedUp = summary.previousRank !== summary.newRank
  const closed = summary.culpritCorrect

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80">
      <div
        className="relative left-1/2 min-h-dvh w-full max-w-[480px] -translate-x-1/2 px-5 py-8"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(225,29,72,0.35), transparent 36%), radial-gradient(circle at 50% 18%, rgba(228,194,122,0.2), transparent 28%), #07060a',
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-16 h-40">
          {Array.from({ length: 16 }, (_, index) => (
            <motion.span
              key={index}
              className="absolute top-24 left-1/2 h-1.5 w-1.5 rounded-full bg-gold"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], x: (index - 8) * 18, y: -160 - (index % 4) * 24 }}
              transition={{ duration: 1.6, delay: index * 0.03 }}
            />
          ))}
        </div>
        <p className="text-center text-[11px] tracking-[0.42em] text-gold uppercase">Veredicto</p>
        <motion.h1
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-3 text-center font-display text-6xl leading-none"
        >
          {closed ? 'Caso cerrado' : 'Pistas sueltas'}
        </motion.h1>
        <p className="mt-3 text-center text-sm text-white/70">{mystery.title}</p>
        <div className="mx-auto mt-8 grid h-40 w-40 place-items-center rounded-full border border-gold/50 bg-black/40 shadow-[0_0_60px_rgba(228,194,122,0.18)]">
          <div className="text-center">
            <p className="font-display text-6xl leading-none">
              <CountUp value={summary.score} />
            </p>
            <p className="text-[10px] tracking-[0.28em] text-gold uppercase">Puntos</p>
          </div>
        </div>
        {rankedUp ? (
          <p className="mt-6 text-center font-display text-3xl text-gold">Ascenso a {summary.newRank}</p>
        ) : null}
        <ul className="mt-8 space-y-2">
          <Row
            ok={summary.culpritCorrect}
            label="Culpable"
            detail={summary.culpritCorrect ? 'Has señalado a la mano correcta.' : `Era ${culprit?.name ?? 'otro'}.`}
          />
          <Row
            ok={summary.motiveCorrect}
            label="Motivo"
            detail={summary.motiveCorrect ? 'El móvil encaja.' : motive?.label ?? 'Motivo distinto.'}
          />
          <Row
            ok={summary.methodCorrect}
            label="Método"
            detail={summary.methodCorrect ? 'El cómo es exacto.' : method?.label ?? 'Método distinto.'}
          />
          <Row
            ok={summary.sequenceCorrect === summary.sequenceTotal}
            label="Secuencia"
            detail={`${summary.sequenceCorrect} de ${summary.sequenceTotal} acontecimientos en su sitio.`}
          />
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-2xl border border-white/10 px-4 py-3">Tiempo {formatDuration(summary.elapsedSeconds)} · +{summary.timeBonus}</p>
          <p className="rounded-2xl border border-white/10 px-4 py-3">Ayudas {summary.hintsUsed} · −{summary.hintPenalty}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <p className="rounded-2xl bg-gold px-4 py-4 text-void">
            <span className="block text-[10px] tracking-[0.2em] uppercase">XP</span>
            <span className="font-display text-4xl leading-none">+{formatNumber(summary.xp)}</span>
          </p>
          <p className="flex items-end justify-between rounded-2xl border border-gold/40 px-4 py-4">
            <span>
              <span className="block text-[10px] tracking-[0.2em] text-gold uppercase">Créditos</span>
              <span className="font-display text-4xl leading-none">+{formatNumber(summary.coins)}</span>
            </span>
            <Coins className="h-5 w-5 text-gold" />
          </p>
        </div>
        {summary.badgesUnlocked.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {summary.badgesUnlocked.map((id) => {
              const badge = badgeById(id)
              if (!badge) return null
              return (
                <li key={id} className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
                  <Award className="h-5 w-5 text-gold" />
                  <span>
                    <span className="block text-sm">{badge.name}</span>
                    <span className="block text-xs text-white/60">{badge.description}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
        <blockquote className="mt-6 font-display text-2xl leading-snug text-white/90 italic">{mystery.epilogue}</blockquote>
        <div className="mt-8 grid gap-3">
          <Button type="button" onClick={onLibrary}>
            Volver al cuartel
          </Button>
          <Button type="button" variant="ghost" onClick={onReview}>
            Revisar el expediente
          </Button>
        </div>
      </div>
    </div>
  )
}
