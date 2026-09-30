import { motion, useReducedMotion } from 'framer-motion'
import { Flame, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AVATARS, Avatar, LevelRing } from '../components/Avatar'
import { CreditChip } from '../components/CreditChip'
import { RankLadder, RankShield } from '../components/RankShield'
import { useAuth } from '../context/AuthContext'
import { useCosmetics } from '../context/CosmeticsContext'
import { useGame } from '../context/GameContext'
import { useProgress } from '../context/ProgressContext'
import { useSocial } from '../context/SocialContext'
import { caseById } from '../data/cases'
import { ACHIEVEMENTS, achievementState } from '../game/achievements'
import { RANK_LADDER, progressFromXp } from '../game/ranks'
import { frameRing, SHOP } from '../game/shop'
import { playerStats, rememberStreak } from '../game/stats'
import { formatAgo, formatDuration, formatNumber } from '../lib/format'
import { listGenerated } from '../services/studioStore'
import { loadBoard } from '../services/communityStore'
import { INVITE_MESSAGE, inviteUrl, whatsAppUrl } from '../social/logic'
import { CREDITS_NAME } from '../progress/currency'
import { STREAK_MILESTONES } from '../progress/streaks'

export function ProfilePage() {
  const { profile, saveProfile, signOut } = useAuth()
  const { runs } = useGame()
  const social = useSocial()
  const { wardrobe, equip } = useCosmetics()
  const progress = useProgress()
  const reduce = useReducedMotion()
  const [weeks, setWeeks] = useState(0)
  useEffect(() => {
    if (!profile) return
    rememberStreak(profile.streak)
    const leagueId = social.activeLeague?.id
    if (!leagueId) return
    void loadBoard(leagueId).then((board) => {
      const keys = new Set(board.posts.filter((post) => post.userId === profile.id).map((post) => post.weekKey))
      setWeeks(keys.size)
    })
  }, [profile, social.activeLeague?.id])

  if (!profile) return null
  const xp = progressFromXp(profile.xp)
  const wins = social.snapshot.seasons.filter((season) =>
    season.podium.some((entry) => entry.userId === profile.id && entry.place === 1),
  ).length
  const stats = playerStats({ profile, runs, leagueWins: wins })
  const perfectSilent = runs.some((run) => run.score === 100 && run.hintsUsed === 0)
  const earned = achievementState({
    badgeIds: profile.badgeIds,
    level: profile.level,
    friends: social.friends.length,
    posts: progress.communityPosts,
    perfectSilent,
    generated: listGenerated().length > 0,
  })
  const history = [
    ...social.snapshot.activities.filter((item) => item.userId === profile.id),
    ...runs
      .filter((run) => run.status === 'solved')
      .map((run) => ({
        id: run.id,
        text: `Cerraste ${caseById(run.caseId)?.title ?? 'un caso'}.`,
        createdAt: run.solvedAt ?? run.updatedAt,
      })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
  const rankIndex = RANK_LADDER.findIndex((step) => step.rank === profile.rank)
  const title = SHOP.find((item) => item.id === wardrobe.title)
  const legendary = ACHIEVEMENTS.filter((item) => item.tier === 'legendario' && earned.has(item.id))
  const specials = runs.filter((run) => run.status === 'solved' && (run.caseId.startsWith('evento-') || caseById(run.caseId)?.type === 'expediente'))
  const since = new Date(profile.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  const opera = wardrobe.card === 'tarjeta-opera'
  const noir = wardrobe.card === 'tarjeta-noir'

  return (
    <main className="px-4 pt-5 pb-10" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
      <motion.section
        className="relative overflow-hidden rounded-[32px] border border-gold/30 px-4 py-5"
        style={{
          background: opera
            ? 'linear-gradient(160deg,#4a1828,#120910)'
            : noir
              ? 'linear-gradient(160deg,#10141c,#07060a)'
              : 'linear-gradient(165deg,#2a2114,#100e16 46%,#07060a)',
        }}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Ficha de detective</p>
          <CreditChip amount={profile.coins} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={frameRing(wardrobe.frame)}>
            <LevelRing progress={xp.ratio} size={108}>
              <Avatar id={profile.avatarId} />
            </LevelRing>
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-5xl leading-none">{profile.username}</h1>
            <p className="mt-2 text-sm text-gold">{title?.name ?? 'Detective Novato'}</p>
            <p className="mt-1 text-xs text-muted">Nivel {profile.level} · {profile.rank}</p>
            <p className="mt-1 text-xs text-muted">{formatNumber(profile.xp)} XP · detective desde {since}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
            <span>Evolución</span>
            <span>
              {formatNumber(xp.into)} / {formatNumber(xp.need)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="xp-fill h-full rounded-full" style={{ width: `${Math.max(6, xp.ratio * 100)}%` }} />
          </div>
        </div>
        <p className="mt-3 text-[10px] tracking-[0.16em] text-muted uppercase">{CREDITS_NAME}</p>
      </motion.section>

      <section className="mt-4 rounded-[28px] border border-line bg-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-gold" /> Racha {profile.streak}
          </span>
          <span className="text-xs text-muted">Máxima {stats.bestStreak}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {STREAK_MILESTONES.map((step) => (
            <div key={step.days} className="text-center">
              <span className={profile.streak >= step.days ? 'block h-2 rounded-full bg-gold' : 'block h-2 rounded-full bg-white/10'} />
              <span className="mt-1 block text-[9px] text-muted">{step.days}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[28px] border border-line bg-black/30 p-4">
        <RankShield rank={progress.state.rank} points={progress.points} large />
        <div className="mt-4">
          <RankLadder current={progress.state.rank} />
        </div>
        <p className="mt-3 text-xs text-muted">El nivel mide experiencia. El rango mide cómo compites.</p>
        {progress.state.rankHistory.length > 1 ? (
          <ul className="mt-3 space-y-1">
            {progress.state.rankHistory.slice().reverse().slice(0, 4).map((mark) => (
              <li key={`${mark.rank}-${mark.at}`} className="flex justify-between text-xs text-muted">
                <span>{mark.rank}</span>
                <span>{formatAgo(mark.at)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ol className="mt-4 grid grid-cols-5 gap-1">
        {RANK_LADDER.map((step, index) => {
          const reached = index <= rankIndex
          return (
            <li key={step.rank} className="text-center">
              <span className={reached ? 'mx-auto block h-2 rounded-full bg-gold' : 'mx-auto block h-2 rounded-full bg-white/10'} />
              <span className={reached ? 'mt-1 block text-[9px] text-gold' : 'mt-1 block text-[9px] text-muted'}>{step.rank.slice(0, 3)}</span>
            </li>
          )
        })}
      </ol>

      <section className="mt-5">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Vitrina</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Vitrine label="Legendarias" value={String(legendary.length)} />
          <Vitrine label="Temporadas" value={String(wins)} />
          <Vitrine label="Especiales" value={String(specials.length)} />
        </div>
        <ul className="mt-3 space-y-2">
          {legendary.length === 0 ? <li className="text-sm text-muted">Las insignias legendarias aparecen cuando la ciudad deja de susurrar.</li> : null}
          {legendary.map((item) => (
            <li key={item.id} className="rounded-3xl border border-gold bg-gold/10 px-4 py-3 text-sm">
              {item.name}
            </li>
          ))}
        </ul>
      </section>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Casos resueltos" value={String(stats.casesSolved)} />
        <Stat label="Precisión global" value={profile.attempts ? `${stats.accuracy}%` : '—'} />
        <Stat label="Tiempo medio" value={stats.averageSeconds ? formatDuration(stats.averageSeconds) : '—'} />
        <Stat label="Ayudas usadas" value={String(stats.hintsUsed)} />
        <Stat label="Racha máxima" value={String(stats.bestStreak)} />
        <Stat label="Temporadas ganadas" value={String(stats.leagueWins)} />
        <Stat label="Casos comunitarios" value={String(weeks)} />
        <Stat label="Liga actual" value={social.activeLeague?.name ?? 'Sin liga'} />
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Link to="/expedientes" className="rounded-3xl border border-gold/40 bg-gold/10 px-3 py-3 text-center">Expedientes</Link>
        <Link to="/eventos" className="rounded-3xl border border-line px-3 py-3 text-center">Eventos</Link>
        <Link to="/evidencias" className="rounded-3xl border border-line px-3 py-3 text-center">Sala de evidencias</Link>
        <Link to="/misiones" className="rounded-3xl border border-line px-3 py-3 text-center">Misiones</Link>
        <Link to="/tienda" className="rounded-3xl border border-line px-3 py-3 text-center">Tienda</Link>
        <Link to="/identidad" className="rounded-3xl border border-line px-3 py-3 text-center">League ID</Link>
      </div>

      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Títulos</h2>
        <div className="rail mt-3 flex gap-2 overflow-x-auto">
          {SHOP.filter((item) => item.kind === 'titulo' && wardrobe.owned.includes(item.id)).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void equip(item)}
              className={wardrobe.title === item.id ? 'shrink-0 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-void' : 'shrink-0 rounded-full border border-line px-4 py-2 text-xs'}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Logros</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((item) => {
            const owned = earned.has(item.id)
            const hidden = item.tier !== 'visible' && !owned
            return (
              <li
                key={item.id}
                className={
                  owned && item.tier === 'legendario'
                    ? 'rounded-3xl border border-gold bg-gold/15 p-3'
                    : owned
                      ? 'rounded-3xl border border-gold/40 bg-panel p-3'
                      : 'rounded-3xl border border-line p-3 opacity-70'
                }
              >
                <p className="text-[10px] tracking-[0.14em] text-gold uppercase">
                  {item.tier === 'legendario' ? 'Legendario' : item.tier === 'oculto' ? 'Oculto' : 'Visible'}
                </p>
                <p className="mt-1 text-sm">{hidden ? '???' : item.name}</p>
                <p className="mt-1 text-xs text-muted">{hidden ? item.hint : item.description}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Historial</h2>
        <ul className="mt-3 space-y-2">
          {history.length === 0 ? <li className="text-sm text-muted">Todavía no hay movimiento.</li> : null}
          {history.map((item) => (
            <li key={item.id} className="rounded-3xl border border-line px-4 py-3">
              <p className="text-sm">{item.text}</p>
              <p className="mt-1 text-[10px] tracking-[0.16em] text-muted uppercase">{formatAgo(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Avatar</h2>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              aria-label={avatar.name}
              aria-pressed={profile.avatarId === avatar.id}
              onClick={() => void saveProfile({ ...profile, avatarId: avatar.id })}
              className={profile.avatarId === avatar.id ? 'overflow-hidden rounded-2xl ring-2 ring-gold' : 'overflow-hidden rounded-2xl opacity-70'}
            >
              <Avatar id={avatar.id} />
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-sm font-semibold text-[#06210f]"
        onClick={() => window.open(whatsAppUrl(`${INVITE_MESSAGE} ${inviteUrl(profile.inviteCode)}`), '_blank', 'noopener,noreferrer')}
      >
        Invitar por WhatsApp
      </button>
      <button type="button" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line px-3 py-3">
      <dt className="text-[10px] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 truncate font-display text-3xl leading-none">{value}</dd>
    </div>
  )
}

function Vitrine({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-gold/30 bg-gold/10 px-3 py-3 text-center">
      <p className="font-display text-4xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] tracking-[0.12em] text-muted uppercase">{label}</p>
    </article>
  )
}
