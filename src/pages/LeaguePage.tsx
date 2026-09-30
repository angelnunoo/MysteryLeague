import { motion, useReducedMotion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AVATARS, Avatar } from '../components/Avatar'
import { Button, Field, TextArea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useSocial } from '../context/SocialContext'
import { formatNumber } from '../lib/format'
import { acceptLeagueInvite, createLeague, declineLeagueInvite, inviteToLeague, joinLeagueCode } from '../services/socialStore'
import {
  WEEKLY_CAP,
  buildBoard,
  currentWeekScore,
  daysLeft,
  leagueUrl,
  weekTotal,
  whatsAppUrl,
  type BoardMode,
  type Prize,
  type Standing,
} from '../social/logic'

const BOARDS: Array<{ id: BoardMode; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensual', label: 'Mensual' },
  { id: 'historica', label: 'Histórica' },
]

const PRIZE_COLOR: Record<Prize, string> = {
  oro: '#e4c27a',
  plata: '#d5d7de',
  bronce: '#c4845a',
}

export function LeaguePage() {
  const { user, profile } = useAuth()
  const social = useSocial()
  const [mode, setMode] = useState<BoardMode>('general')
  const [ceremony, setCeremony] = useState(true)
  if (!user || !profile) return null
  const league = social.activeLeague
  const season = league
    ? social.snapshot.seasons.find((item) => item.leagueId === league.id && item.status === 'active')
    : undefined
  const members = league
    ? social.snapshot.people.filter((person) =>
        social.snapshot.members.some((member) => member.leagueId === league.id && member.userId === person.id),
      )
    : []
  const board =
    league && season
      ? buildBoard({
          people: members,
          season,
          seasons: social.snapshot.seasons,
          scores: social.snapshot.scores,
          mode,
        })
      : []
  const mine = board.find((row) => row.person.id === user.id)
  const week = season ? currentWeekScore(social.snapshot.scores, season, user.id) : undefined
  const weekPoints = week ? weekTotal(week) : 0
  const closed = league
    ? social.snapshot.seasons.filter((item) => item.leagueId === league.id && item.status === 'closed')
    : []
  const prizeSeason = closed.find(
    (item) =>
      item.podium.some((entry) => entry.userId === user.id) && !localStorage.getItem(`ml-prize-${item.id}`),
  )
  const prize = prizeSeason?.podium.find((entry) => entry.userId === user.id)
  const invites = social.snapshot.leagueInvites.filter((invite) => invite.toId === user.id && invite.status === 'pending')

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Temporada de 4 semanas</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Liga</h1>
      <Link to="/comunidad" className="mt-4 block rounded-[28px] border border-gold/40 bg-gold/10 px-4 py-4">
        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Esta semana</p>
        <p className="mt-1 font-display text-3xl leading-none">Caso comunitario</p>
        <p className="mt-2 text-xs text-muted">Un expediente. Toda la mesa. Tres aportaciones que puntúan.</p>
      </Link>
      {social.error ? (
        <p className="mt-4 text-sm text-crimson" role="alert">
          {social.error}
        </p>
      ) : null}
      {invites.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {invites.map((invite) => {
            const name = social.snapshot.leagues.find((item) => item.id === invite.leagueId)?.name ?? 'Una liga'
            return (
              <li key={invite.id} className="rounded-3xl border border-gold/40 bg-gold/10 p-4">
                <p className="text-sm">{name} te invita a la mesa.</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    className="min-h-10 flex-1"
                    onClick={() =>
                      void social.run(async () => {
                        const leagueId = await acceptLeagueInvite(user.id, invite.id)
                        await social.focusLeague(leagueId)
                      })
                    }
                  >
                    Unirme
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-10 flex-1" onClick={() => void social.run(() => declineLeagueInvite(user.id, invite.id))}>
                    Ahora no
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
      {!league || !season ? (
        <Founding />
      ) : (
        <>
          <section className="mt-5 overflow-hidden rounded-[32px] border border-line bg-[radial-gradient(circle_at_top,#3a2b16_0%,#120f16_46%,#07060a_100%)] p-4">
            <div className="flex items-center gap-3">
              <span className="h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-gold/50">
                <Avatar id={league.avatarId} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-4xl leading-none">{league.name}</h2>
                <p className="mt-1 text-xs text-muted">
                  Temporada {season.number} · cierra en {daysLeft(season.endsAt)} días · {members.length}/{league.maxMembers}
                </p>
              </div>
            </div>
            {league.description ? <p className="mt-3 text-sm text-muted">{league.description}</p> : null}
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
                <span>Semana</span>
                <span>
                  {weekPoints} / {WEEKLY_CAP}
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                <Bar value={week?.rapido ?? 0} max={WEEKLY_CAP} color="#e4c27a" />
                <Bar value={week?.especial ?? 0} max={WEEKLY_CAP} color="#9fd7d1" />
                <Bar value={week?.expediente ?? 0} max={WEEKLY_CAP} color="#e7b4c0" />
                <Bar value={week?.objetivo ?? 0} max={WEEKLY_CAP} color="#f0d7a2" />
              </div>
              <p className="mt-2 text-[11px] text-muted">Rápido 60 · Especial 100 · Expediente 100 · Objetivo 40. Cada uno, una vez por semana.</p>
            </div>
            {mine ? (
              <p className="mt-4 font-display text-3xl leading-none text-gold">
                #{mine.place} · {formatNumber(mine.points)} pts
              </p>
            ) : null}
          </section>
          <Podium rows={board} />
          <div className="mt-4 grid grid-cols-4 gap-1 rounded-full border border-line p-1">
            {BOARDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={mode === item.id ? 'min-h-10 rounded-full bg-gold text-[11px] font-semibold text-void' : 'min-h-10 rounded-full text-[11px] text-muted'}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <ol className="mt-4 space-y-2">
            {board.map((row) => (
              <li
                key={row.person.id}
                className={
                  row.person.id === user.id
                    ? 'flex items-center gap-3 rounded-3xl border border-gold bg-gold/10 px-3 py-2'
                    : 'flex items-center gap-3 rounded-3xl border border-line px-3 py-2'
                }
              >
                <span className="w-8 font-display text-2xl" style={{ color: row.prize ? PRIZE_COLOR[row.prize] : undefined }}>
                  {row.place}
                </span>
                <span className="h-10 w-10 overflow-hidden rounded-2xl">
                  <Avatar id={row.person.avatarId} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{row.person.username}</span>
                <span className="font-display text-2xl">{formatNumber(row.points)}</span>
              </li>
            ))}
          </ol>
          <Share leagueCode={league.inviteCode} />
          <InviteFriends leagueId={league.id} />
          {social.snapshot.leagues.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {social.snapshot.leagues.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === league.id ? 'rounded-full bg-gold px-3 py-2 text-xs text-void' : 'rounded-full border border-line px-3 py-2 text-xs'}
                  onClick={() => void social.focusLeague(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
          <Founding compact />
          {closed.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Historial</h2>
              <ul className="mt-3 space-y-2">
                {closed
                  .slice()
                  .reverse()
                  .map((item) => (
                    <li key={item.id} className="rounded-3xl border border-line px-4 py-3">
                      <p className="font-display text-2xl leading-none">Temporada {item.number}</p>
                      <p className="mt-2 text-sm text-muted">
                        {item.podium.length === 0
                          ? 'Nadie puntuó.'
                          : item.podium
                              .map((entry) => {
                                const name = social.snapshot.people.find((person) => person.id === entry.userId)?.username ?? 'Detective'
                                return `${entry.prize} ${name}`
                              })
                              .join(' · ')}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
      {ceremony && prize && prizeSeason ? (
        <Ceremony
          prize={prize.prize}
          onClose={() => {
            localStorage.setItem(`ml-prize-${prizeSeason.id}`, '1')
            setCeremony(false)
          }}
        />
      ) : null}
    </main>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  if (value <= 0) return null
  return <span style={{ width: `${(value / max) * 100}%`, background: color }} />
}

function Podium({ rows }: { rows: Standing[] }) {
  const reduce = useReducedMotion()
  const slots = [rows[1], rows[0], rows[2]]
  const heights = [104, 148, 84]
  return (
    <div className="mt-4 grid grid-cols-3 items-end gap-2">
      {slots.map((row, index) => {
        const prize: Prize = index === 1 ? 'oro' : index === 0 ? 'plata' : 'bronce'
        return (
          <motion.div
            key={row?.person.id ?? prize}
            className="flex flex-col items-center"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index === 1 ? 0.15 : 0, type: 'spring', stiffness: 180, damping: 18 }}
          >
            {row ? (
              <>
                <span className="mb-2 h-12 w-12 overflow-hidden rounded-full ring-2" style={{ borderColor: PRIZE_COLOR[prize], boxShadow: `0 0 24px ${PRIZE_COLOR[prize]}55` }}>
                  <Avatar id={row.person.avatarId} />
                </span>
                <p className="max-w-full truncate text-center text-[11px]">{row.person.username}</p>
              </>
            ) : (
              <p className="mb-2 text-[11px] text-muted">Vacío</p>
            )}
            <div
              className="mt-2 flex w-full items-end justify-center rounded-t-2xl text-xs font-semibold tracking-[0.16em] uppercase"
              style={{ height: heights[index], background: `linear-gradient(180deg, ${PRIZE_COLOR[prize]}, transparent)` }}
            >
              <span className="pb-3">{prize}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function Share({ leagueCode }: { leagueCode: string }) {
  return (
    <button
      type="button"
      className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-[#06210f]"
      onClick={() => {
        const text = `Únete a mi liga en MysteryLeague ${leagueUrl(leagueCode)}`
        window.open(whatsAppUrl(text), '_blank', 'noopener,noreferrer')
      }}
    >
      Invitar a la liga por WhatsApp
    </button>
  )
}

function InviteFriends({ leagueId }: { leagueId: string }) {
  const { user } = useAuth()
  const social = useSocial()
  const [friendId, setFriendId] = useState(social.friends[0]?.id ?? '')
  if (!user || social.friends.length === 0) return null
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!friendId) return
        void social.run(() => inviteToLeague(user.id, leagueId, friendId))
      }}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Amigo</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-panel px-3 text-sm"
          value={friendId}
          onChange={(event) => setFriendId(event.target.value)}
        >
          {social.friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.username}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="panel" className="min-h-12">
        Invitar
      </Button>
    </form>
  )
}

function Founding({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const social = useSocial()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarId, setAvatarId] = useState('seal')
  const [maxMembers, setMaxMembers] = useState(12)
  const [code, setCode] = useState('')
  if (!user) return null
  const detective = user

  function onCreate(event: FormEvent) {
    event.preventDefault()
    void social.run(async () => {
      const leagueId = await createLeague({ userId: detective.id, name, description, avatarId, maxMembers })
      await social.focusLeague(leagueId)
    })
  }

  function onJoin(event: FormEvent) {
    event.preventDefault()
    void social.run(async () => {
      const leagueId = await joinLeagueCode(detective.id, code)
      await social.focusLeague(leagueId)
    })
  }

  return (
    <div className={compact ? 'mt-6 space-y-4' : 'mt-5 space-y-4'}>
      {!compact ? <p className="text-sm text-muted">Crea una mesa o entra con un código. La temporada dura 4 semanas y el podio queda en el archivo.</p> : null}
      <form className="space-y-3 rounded-[28px] border border-line bg-panel p-4" onSubmit={onCreate}>
        <h2 className="font-display text-3xl leading-none">{compact ? 'Otra liga' : 'Crear liga'}</h2>
        <Field label="Nombre" name="liga" value={name} onChange={(event) => setName(event.target.value)} required />
        <TextArea label="Descripción" name="descripcion" value={description} onChange={(event) => setDescription(event.target.value)} />
        <div>
          <p className="mb-2 text-xs tracking-[0.18em] text-muted uppercase">Avatar</p>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                aria-label={avatar.name}
                aria-pressed={avatarId === avatar.id}
                className={avatarId === avatar.id ? 'overflow-hidden rounded-2xl ring-2 ring-gold' : 'overflow-hidden rounded-2xl opacity-70'}
                onClick={() => setAvatarId(avatar.id)}
              >
                <Avatar id={avatar.id} />
              </button>
            ))}
          </div>
        </div>
        <Field
          label="Máximo de detectives"
          name="cupo"
          type="number"
          min={2}
          max={50}
          value={maxMembers}
          onChange={(event) => setMaxMembers(Number(event.target.value))}
        />
        <Button type="submit" full>
          Fundar liga
        </Button>
      </form>
      <form className="space-y-3 rounded-[28px] border border-line p-4" onSubmit={onJoin}>
        <h2 className="font-display text-3xl leading-none">Unirse</h2>
        <Field label="Código" name="codigo" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" />
        <Button type="submit" variant="ghost" full>
          Entrar con código
        </Button>
      </form>
    </div>
  )
}

function Ceremony({ prize, onClose }: { prize: Prize; onClose: () => void }) {
  const reduce = useReducedMotion()
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/75 px-6">
      <motion.div
        className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#120f16] p-6 text-center"
        initial={reduce ? false : { scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
      >
        <motion.div
          className="mx-auto grid h-28 w-28 place-items-center rounded-full text-xs tracking-[0.2em] uppercase"
          style={{ background: `radial-gradient(circle, ${PRIZE_COLOR[prize]}, transparent 70%)`, color: PRIZE_COLOR[prize] }}
          animate={reduce ? undefined : { rotate: [0, -6, 6, 0], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        >
          {prize}
        </motion.div>
        <h2 className="mt-4 font-display text-5xl leading-none">Premio de temporada</h2>
        <p className="mt-3 text-sm text-muted">La insignia exclusiva ya está en tu expediente.</p>
        <Button type="button" className="mt-6" full onClick={onClose}>
          Recoger
        </Button>
      </motion.div>
    </div>
  )
}
