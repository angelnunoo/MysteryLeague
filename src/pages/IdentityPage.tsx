import { useAuth } from '../context/AuthContext'
import { useSocial } from '../context/SocialContext'
import { LEAGUE_APPS, LEAGUE_UNIVERSE, toLeagueIdentity } from '../leagueId/identity'
import { formatNumber } from '../lib/format'

export function IdentityPage() {
  const { profile } = useAuth()
  const { friends } = useSocial()
  if (!profile) return null
  const identity = toLeagueIdentity({
    userId: profile.id,
    username: profile.username,
    avatarId: profile.avatarId,
    createdAt: profile.createdAt,
    level: profile.level,
    credits: profile.coins,
    badgeIds: profile.badgeIds,
    friends: friends.map((friend) => ({ id: friend.id, username: friend.username })),
    casesSolved: profile.casesSolved,
    accuracy: profile.accuracy,
    streak: profile.streak,
  })

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">{LEAGUE_UNIVERSE}</p>
      <h1 className="mt-1 font-display text-5xl leading-none">League ID</h1>
      <p className="mt-3 text-sm text-muted">
        Tu placa ya guarda la forma de un perfil global. PlayLeague, BeatLeague y DrinkLeague podrán leerla sin cambiar MysteryLeague.
      </p>
      <section className="mt-5 rounded-[32px] border border-gold/30 bg-panel p-4">
        <p className="font-display text-4xl leading-none">{identity.displayName}</p>
        <p className="mt-2 text-xs text-muted">Nivel {identity.global.level} · {formatNumber(identity.global.credits)} créditos</p>
        <p className="mt-1 text-xs text-muted">
          {identity.global.badges.length} {identity.global.badges.length === 1 ? 'insignia' : 'insignias'} · {identity.global.friends.length}{' '}
          {identity.global.friends.length === 1 ? 'amigo' : 'amigos'}
        </p>
      </section>
      <ul className="mt-4 space-y-2">
        {LEAGUE_APPS.map((app) => (
          <li key={app.id} className="rounded-3xl border border-line px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">{app.name}</p>
              <p className={app.live ? 'text-[10px] tracking-[0.14em] text-gold uppercase' : 'text-[10px] tracking-[0.14em] text-muted uppercase'}>
                {app.live ? 'Conectada' : 'Lista'}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted">{app.line}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
