import { useState } from 'react'
import { CreditChip } from '../components/CreditChip'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { MISSIONS } from '../progress/missions'
import { Flame } from 'lucide-react'

export function MissionsPage() {
  const { profile } = useAuth()
  const { claimMission, missionClaimed, missionReady, state } = useProgress()
  const [error, setError] = useState<string | null>(null)
  if (!profile) return null

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Cada día, cada semana</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Misiones</h1>
        </div>
        <CreditChip amount={profile.coins} compact />
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-sm">
        <Flame className="h-4 w-4 text-gold" /> Racha de {profile.streak} días
      </p>
      {state.streakNotice ? <p className="mt-2 text-sm text-muted">{state.streakNotice}</p> : null}
      {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
      {(['diaria', 'semanal'] as const).map((cadence) => (
        <section key={cadence} className="mt-6">
          <h2 className="text-xs tracking-[0.18em] text-muted uppercase">{cadence === 'diaria' ? 'Hoy' : 'Esta semana'}</h2>
          <ul className="mt-3 space-y-3">
            {MISSIONS.filter((mission) => mission.cadence === cadence).map((mission) => {
              const claimed = missionClaimed(mission)
              const ready = missionReady(mission)
              return (
                <li key={mission.id} className="rounded-[28px] border border-line bg-panel p-4">
                  <p className="text-sm">{mission.title}</p>
                  <p className="mt-1 text-xs text-muted">{mission.detail}</p>
                  <p className="mt-2 text-[10px] tracking-[0.14em] text-gold uppercase">
                    +{mission.xp} XP · +{mission.credits} créditos
                  </p>
                  <button
                    type="button"
                    disabled={claimed || !ready}
                    className="mt-3 min-h-10 rounded-full bg-gold px-4 text-xs font-semibold text-void disabled:opacity-40"
                    onClick={() => {
                      setError(null)
                      void claimMission(mission).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo reclamar.'))
                    }}
                  >
                    {claimed ? 'Reclamada' : ready ? 'Reclamar' : 'En curso'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}
