import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, ChevronRight, Flame, ScrollText, Swords, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, LevelRing } from '../components/Avatar'
import { CaseCard } from '../components/CaseCard'
import { CreditChip } from '../components/CreditChip'
import { RankShield } from '../components/RankShield'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { useProgress } from '../context/ProgressContext'
import { useSocial } from '../context/SocialContext'
import { DOSSIER, openChapterCount } from '../community/dossier'
import { CASES, caseById, weeklyCases } from '../data/cases'
import { progressFromXp } from '../game/ranks'
import { activeEvent, countdownLabel } from '../progress/events'
import { MISSIONS } from '../progress/missions'
import { RAVENHILL } from '../narrative/ravenhill'
import { formatNumber, isoWeek } from '../lib/format'

export function HomePage() {
  const { profile } = useAuth()
  const { runs, league, ready, error } = useGame()
  const { weeklyPlace, friends, activeLeague } = useSocial()
  const progressState = useProgress()
  const reduce = useReducedMotion()
  if (!profile) return null

  const xp = progressFromXp(profile.xp)
  const position = weeklyPlace ?? league.find((row) => row.self)?.position
  const active = runs
    .filter((run) => run.status === 'in_progress')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const activeCase = active ? caseById(active.caseId) : undefined
  const nextCase = CASES.find((mystery) => !runs.some((run) => run.caseId === mystery.id))
  const continueTo = activeCase ? `/casos/${activeCase.id}` : nextCase ? `/casos/${nextCase.id}` : '/biblioteca'
  const weekly = weeklyCases()
  const weeklyDone = weekly.filter((mystery) => runs.some((run) => run.caseId === mystery.id && run.status === 'solved')).length
  const event = activeEvent()
  const missions = MISSIONS.filter((mission) => !progressState.missionClaimed(mission)).slice(0, 3)

  return (
    <motion.main
      className="px-4 pt-6"
      style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      <motion.header variants={fade} className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] tracking-[0.38em] text-gold uppercase">MysteryLeague</p>
          <h1 className="font-display text-4xl leading-none">Cuartel</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/misiones" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs">
            <Flame className="h-3.5 w-3.5 text-gold" /> {profile.streak}
          </Link>
          <CreditChip amount={profile.coins} compact />
        </div>
      </motion.header>

      <motion.section variants={fade} className="mt-5">
        <Link to={continueTo} className="flex min-h-16 items-center justify-between rounded-[28px] bg-gold px-5 text-void">
          <span>
            <span className="block text-[10px] tracking-[0.22em] uppercase">Ahora</span>
            <span className="font-display text-3xl leading-none">Continuar investigación</span>
          </span>
          <Swords className="h-5 w-5" />
        </Link>
      </motion.section>

      <motion.section variants={fade} className="mt-4 overflow-hidden rounded-[32px] border border-gold/25 bg-panel p-4">
        <div className="flex items-center gap-4">
          <LevelRing progress={xp.ratio}>
            <Avatar id={profile.avatarId} />
          </LevelRing>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-4xl leading-none">{profile.username}</p>
            <p className="mt-2 text-xs tracking-[0.18em] text-gold uppercase">
              Nivel {profile.level} · {profile.rank}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <RankShield rank={progressState.state.rank} points={progressState.points} />
        </div>
      </motion.section>

      <motion.section variants={fade} className="mt-3 grid grid-cols-2 gap-2">
        <article className="rounded-3xl border border-line bg-black/30 px-4 py-3">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Semana</p>
          <p className="mt-1 font-display text-4xl leading-none">
            {weeklyDone}/{weekly.length}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="xp-fill h-full" style={{ width: `${(weeklyDone / Math.max(1, weekly.length)) * 100}%` }} />
          </div>
        </article>
        <Link to="/liga" className="rounded-3xl border border-line bg-black/30 px-4 py-3">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Liga</p>
          <p className="mt-1 truncate font-display text-3xl leading-none">{activeLeague?.name ?? 'Sin mesa'}</p>
          <p className="mt-1 text-xs text-gold">{position ? `#${position} esta semana` : 'Entra en una liga'}</p>
        </Link>
      </motion.section>

      {event ? (
        <motion.section variants={fade} className="mt-3">
          <Link to="/eventos" className="block overflow-hidden rounded-[28px] px-4 py-4" style={{ background: event.cover }}>
            <p className="text-[10px] tracking-[0.28em] text-gold uppercase">Evento activo</p>
            <p className="mt-1 font-display text-4xl leading-none">{event.name}</p>
            <p className="mt-2 text-xs">{countdownLabel(event)} · {event.blurb}</p>
          </Link>
        </motion.section>
      ) : null}

      <motion.section variants={fade} className="mt-4">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-display text-3xl leading-none">Misiones</h2>
          <Link to="/misiones" className="text-xs tracking-[0.16em] text-gold uppercase">
            Ver todas
          </Link>
        </div>
        <ul className="space-y-2">
          {missions.map((mission) => {
            const ready = progressState.missionReady(mission)
            return (
              <li key={mission.id} className="flex items-center justify-between rounded-3xl border border-line px-4 py-3">
                <span>
                  <span className="block text-sm">{mission.title}</span>
                  <span className="text-[10px] tracking-[0.14em] text-muted uppercase">{mission.cadence}</span>
                </span>
                <span className={ready ? 'text-xs text-gold' : 'text-xs text-muted'}>{ready ? 'Lista' : 'En curso'}</span>
              </li>
            )
          })}
        </ul>
      </motion.section>

      <motion.section variants={fade} className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/comunidad" className="rounded-[28px] px-4 py-4" style={{ background: DOSSIER.cover }}>
          <p className="text-[10px] tracking-[0.2em] text-gold uppercase">Comunitario</p>
          <p className="mt-1 font-display text-3xl leading-none">{DOSSIER.title}</p>
          <p className="mt-1 text-xs">Capítulo {openChapterCount(isoWeek())}</p>
        </Link>
        <Link to="/expedientes/ravenhill" className="rounded-[28px] px-4 py-4" style={{ background: RAVENHILL.cover }}>
          <p className="text-[10px] tracking-[0.2em] text-gold uppercase">Expediente</p>
          <p className="mt-1 font-display text-3xl leading-none">{RAVENHILL.title}</p>
          <p className="mt-1 text-xs">Capítulo {Math.min(20, progressState.state.dossierRead + 1)} de 20</p>
        </Link>
      </motion.section>

      <motion.section variants={fade} className="mt-4">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Círculo</h2>
          <Link to="/social" className="text-xs text-gold">
            Social
          </Link>
        </div>
        {friends.length === 0 ? (
          <Link to="/social" className="block rounded-3xl border border-line px-4 py-3 text-sm text-muted">
            Tu mesa espera compañía.
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {friends.slice(0, 5).map((friend) => (
              <Link key={friend.id} to={`/social/chat/${friend.id}`} className="h-12 w-12 overflow-hidden rounded-2xl" title={friend.username}>
                <Avatar id={friend.avatarId} />
              </Link>
            ))}
            <span className="text-xs text-muted">{friends.length} en la mesa</span>
          </div>
        )}
      </motion.section>

      {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}

      <motion.section variants={fade} className="mt-5">
        {activeCase ? (
          <CaseCard mystery={activeCase} run={active} />
        ) : nextCase ? (
          <CaseCard mystery={nextCase} run={runs.find((run) => run.caseId === nextCase.id)} />
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-panel-2 p-5">
            <p className="text-[10px] tracking-[0.24em] text-gold uppercase">Archivo</p>
            <h2 className="mt-2 font-display text-4xl leading-none">La biblioteca de temporada está en calma.</h2>
          </div>
        )}
      </motion.section>

      <motion.section variants={fade} className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-3xl leading-none">Esta semana</h2>
          <Link to="/semanales" className="text-xs tracking-[0.16em] text-gold uppercase">
            Ver mesa
          </Link>
        </div>
        <div className="rail -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
          {weekly.map((mystery) => (
            <CaseCard key={mystery.id} mystery={mystery} run={runs.find((run) => run.caseId === mystery.id)} compact />
          ))}
        </div>
      </motion.section>

      <motion.section variants={fade} className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Quick to="/biblioteca" icon={BookOpen} label="Biblioteca" />
        <Quick to="/liga" icon={Trophy} label="Liga" />
        <Quick to="/eventos" icon={ScrollText} label="Eventos" />
        <Quick to="/social" icon={Users} label="Social" />
      </motion.section>
      <p className="mt-4 text-center text-[10px] tracking-[0.18em] text-muted uppercase">
        {ready ? `${formatNumber(profile.casesSolved)} casos` : 'Cargando archivo'}
      </p>
    </motion.main>
  )
}

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

function Quick({ to, icon: Icon, label }: { to: string; icon: typeof BookOpen; label: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center justify-between rounded-3xl border border-line bg-panel px-4">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted" />
    </Link>
  )
}
