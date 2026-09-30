import { Avatar, LevelRing } from './Avatar'
import { BADGES } from '../game/badges'
import { progressFromXp } from '../game/ranks'
import { formatAgo } from '../lib/format'
import type { RankName } from '../types'

export function DetectiveProfile({
  username,
  avatarId,
  level,
  rank,
  xp,
  casesSolved,
  accuracy,
  leagueName,
  badgeIds,
  history,
}: {
  username: string
  avatarId: string
  level: number
  rank: RankName
  xp: number
  casesSolved: number
  accuracy: number
  leagueName: string | null
  badgeIds: string[]
  history: Array<{ id: string; text: string; createdAt: string }>
}) {
  const progress = progressFromXp(xp)
  const owned = BADGES.filter((badge) => badgeIds.includes(badge.id))
  return (
    <div>
      <div className="flex items-center gap-4">
        <LevelRing progress={progress.ratio} size={96}>
          <Avatar id={avatarId} />
        </LevelRing>
        <div>
          <h1 className="font-display text-5xl leading-none">{username}</h1>
          <p className="mt-2 text-sm text-gold">
            Nivel {level} · {rank}
          </p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-2">
        <Cell label="Casos resueltos" value={String(casesSolved)} />
        <Cell label="Precisión" value={casesSolved ? `${accuracy}%` : '—'} />
        <Cell label="Nivel" value={String(level)} />
        <Cell label="Liga actual" value={leagueName ?? 'Sin liga'} />
      </dl>
      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Insignias</h2>
        {owned.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Todavía no hay insignias en este expediente.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {owned.map((badge) => (
              <li key={badge.id} className="rounded-3xl border border-gold/40 bg-panel p-3">
                <p className="text-sm">{badge.name}</p>
                <p className="mt-1 text-xs text-muted">{badge.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Historial reciente</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">El archivo aún no tiene movimiento.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.slice(0, 8).map((item) => (
              <li key={item.id} className="rounded-3xl border border-line bg-panel px-4 py-3">
                <p className="text-sm">{item.text}</p>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-muted uppercase">{formatAgo(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line px-3 py-3">
      <dt className="text-[10px] tracking-[0.16em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 truncate font-display text-3xl leading-none">{value}</dd>
    </div>
  )
}
