import { useEffect } from 'react'
import { CaseCard } from '../components/CaseCard'
import { useGame } from '../context/GameContext'
import { weeklyCases } from '../data/cases'
import { markWeekSeen } from '../game/pulse'
import { countdownToNextMonday, isoWeek } from '../lib/format'

export function WeeklyPage() {
  const { runs } = useGame()
  const cases = weeklyCases()
  useEffect(() => {
    markWeekSeen(isoWeek())
  }, [])
  return (
    <main className="px-4 pt-6" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Mesa semanal</p>
      <h1 className="font-display text-5xl leading-none">Casos de esta semana</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        La mesa cambia en {countdownToNextMonday()}. Misma investigación para todo el círculo. El veredicto es tuyo.
      </p>
      <div className="mt-6 space-y-4">
        {cases.map((mystery) => (
          <CaseCard key={mystery.id} mystery={mystery} run={runs.find((run) => run.caseId === mystery.id)} />
        ))}
      </div>
    </main>
  )
}
