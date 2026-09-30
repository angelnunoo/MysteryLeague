import { motion, useReducedMotion } from 'framer-motion'
import { CREDITS_NAME } from '../progress/currency'
import { useProgress } from '../context/ProgressContext'
import { formatNumber } from '../lib/format'

export function LiveLayer() {
  const { gains, dismissGain, rankUp, dismissRank, state, dismissStreak } = useProgress()
  const reduce = useReducedMotion()
  return (
    <>
      <div className="pointer-events-none fixed top-4 left-1/2 z-40 flex w-full max-w-[440px] -translate-x-1/2 flex-col gap-2 px-4">
        {gains.map((gain) => (
          <button
            key={gain.id}
            type="button"
            className="pointer-events-auto credit-pop rounded-full border border-gold/50 bg-[#14121c]/95 px-4 py-2 text-left text-sm shadow-lg"
            onClick={() => dismissGain(gain.id)}
          >
            <span className="text-gold">+{formatNumber(gain.amount)}</span> {CREDITS_NAME}
            <span className="mt-0.5 block text-[10px] tracking-[0.16em] text-muted uppercase">{gain.reason}</span>
          </button>
        ))}
      </div>
      {rankUp ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/70"
          onClick={dismissRank}
        >
          <motion.span
            className="absolute top-1/3 left-1/2 w-[min(100%,420px)] -translate-x-1/2 px-6 text-center"
            initial={reduce ? false : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <span className="block text-[10px] tracking-[0.32em] text-gold uppercase">Ascenso</span>
            <span className="mt-2 block font-display text-6xl leading-none text-ink">{rankUp}</span>
            <span className="mt-3 block text-sm text-muted">Tu nivel sigue siendo experiencia. Este escudo es la liga.</span>
          </motion.span>
        </button>
      ) : null}
      {state.streakNotice ? (
        <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 px-4">
          <div className="rounded-[28px] border border-line bg-[#14121c]/95 p-4 shadow-xl">
            <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Racha</p>
            <p className="mt-2 text-sm leading-relaxed">{state.streakNotice}</p>
            <button type="button" className="mt-3 text-xs tracking-[0.16em] text-gold uppercase" onClick={dismissStreak}>
              Empezar otra
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
