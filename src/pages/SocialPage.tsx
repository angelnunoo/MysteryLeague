import { useState, type FormEvent } from 'react'
import { Award, Ban, Bell, Search, Swords, UserMinus, UserPlus, ArrowUp } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Button, Field } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { useSocial } from '../context/SocialContext'
import { formatAgo } from '../lib/format'
import {
  acceptRequest,
  blockUser,
  declineRequest,
  removeFriend,
  searchPeople,
  sendRequest,
} from '../services/socialStore'
import {
  INVITE_MESSAGE,
  conversationWith,
  inviteUrl,
  personById,
  unreadMessages,
  whatsAppUrl,
  type Activity,
  type Person,
} from '../social/logic'

const TABS = [
  { id: 'actividad', label: 'Actividad' },
  { id: 'amigos', label: 'Amigos' },
  { id: 'chat', label: 'Chat' },
  { id: 'avisos', label: 'Avisos' },
] as const

export function SocialPage() {
  const { profile } = useAuth()
  const social = useSocial()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((item) => item.id === params.get('tab')) ? (params.get('tab') ?? 'actividad') : 'actividad'
  if (!profile) return null

  return (
    <main className="px-4 pt-6 pb-8" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Círculo</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="font-display text-5xl leading-none">Social</h1>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-[#06210f]"
          onClick={() => {
            const text = `${INVITE_MESSAGE} ${inviteUrl(profile.inviteCode)}`
            window.open(whatsAppUrl(text), '_blank', 'noopener,noreferrer')
          }}
        >
          Invitar por WhatsApp
        </button>
      </div>
      <p className="mt-3 text-xs tracking-[0.18em] text-muted uppercase">Código {profile.inviteCode}</p>
      {social.error ? (
        <p className="mt-4 text-sm text-crimson" role="alert">
          {social.error}
        </p>
      ) : null}
      <div className="mt-5 grid grid-cols-4 gap-1 rounded-full border border-line p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              tab === item.id
                ? 'min-h-10 rounded-full bg-gold text-xs font-semibold text-void'
                : 'min-h-10 rounded-full text-xs text-muted'
            }
            onClick={() => setParams(item.id === 'actividad' ? {} : { tab: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'actividad' ? <Feed /> : null}
      {tab === 'amigos' ? <Friends /> : null}
      {tab === 'chat' ? <Chats /> : null}
      {tab === 'avisos' ? <Notices /> : null}
    </main>
  )
}

function Feed() {
  const { profile } = useAuth()
  const { runs } = useGame()
  const { snapshot, friends } = useSocial()
  if (!profile) return null
  const allowed = new Set([profile.id, ...friends.map((friend) => friend.id)])
  const published = snapshot.activities.filter((item) => allowed.has(item.userId))
  const earliest =
    published
      .filter((item) => item.userId === profile.id && item.kind === 'case_solved')
      .reduce((min, item) => (item.createdAt < min ? item.createdAt : min), '9999')
  const remembered: Activity[] = runs
    .filter((run) => run.status === 'solved' && (run.solvedAt ?? run.updatedAt) < earliest)
    .map((run) => ({
      id: `run-${run.id}`,
      userId: profile.id,
      kind: 'case_solved',
      text: `${profile.username} resolvió un caso.`,
      createdAt: run.solvedAt ?? run.updatedAt,
    }))
  const items = [...published, ...remembered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (items.length === 0) {
    return <p className="mt-8 text-sm text-muted">Cuando tú o tus amigos resolváis un caso, el movimiento aparecerá aquí.</p>
  }
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </ul>
  )
}

function FeedCard({ item }: { item: Activity }) {
  const { snapshot } = useSocial()
  const person = personById(snapshot, item.userId)
  const Icon = item.kind === 'level_up' ? ArrowUp : item.kind === 'badge' ? Award : Swords
  return (
    <li className="flex gap-3 rounded-[28px] border border-line bg-panel p-3">
      <Link to={person ? `/u/${person.username}` : '/social'} className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
        <Avatar id={person?.avatarId ?? 'lens'} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{item.text}</p>
        <p className="mt-1 flex items-center gap-1 text-[10px] tracking-[0.16em] text-muted uppercase">
          <Icon className="h-3 w-3 text-gold" aria-hidden="true" />
          {formatAgo(item.createdAt)}
        </p>
      </div>
    </li>
  )
}

function Friends() {
  const { user, profile } = useAuth()
  const social = useSocial()
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)
  if (!user || !profile) return null
  const detective = user
  const incoming = social.snapshot.requests.filter((request) => request.toId === detective.id && request.status === 'pending')

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    setSearching(true)
    try {
      setFound(await searchPeople(detective.id, query, social.snapshot))
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mt-5 space-y-5">
      <form className="flex items-end gap-2" onSubmit={(event) => void onSearch(event)}>
        <div className="min-w-0 flex-1">
          <Field label="Buscar detectives" name="buscar" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre" />
        </div>
        <Button type="submit" className="mb-0.5 min-h-12 px-4" disabled={searching} aria-label="Buscar">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {found.length > 0 ? (
        <ul className="space-y-2">
          {found.map((person) => {
            const friend = social.friends.some((item) => item.id === person.id)
            const pending = social.snapshot.requests.some(
              (request) =>
                request.status === 'pending' &&
                ((request.fromId === user.id && request.toId === person.id) ||
                  (request.fromId === person.id && request.toId === user.id)),
            )
            return (
              <li key={person.id} className="flex items-center gap-3 rounded-3xl border border-line px-3 py-2">
                <Link to={`/u/${person.username}`} className="h-11 w-11 overflow-hidden rounded-2xl">
                  <Avatar id={person.avatarId} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{person.username}</p>
                  <p className="text-xs text-muted">
                    Nv {person.level} · {person.rank}
                  </p>
                </div>
                {friend ? (
                  <span className="text-xs text-gold">Amigos</span>
                ) : (
                  <Button
                    type="button"
                    variant="panel"
                    className="min-h-10 px-3"
                    disabled={pending}
                    onClick={() => void social.run(() => sendRequest(user.id, person.id))}
                  >
                    <UserPlus className="h-4 w-4" /> {pending ? 'Enviada' : 'Añadir'}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
      {incoming.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Solicitudes</h2>
          <ul className="mt-3 space-y-2">
            {incoming.map((request) => {
              const person = personById(social.snapshot, request.fromId)
              return (
                <li key={request.id} className="rounded-3xl border border-line p-3">
                  <p className="text-sm">{person?.username ?? 'Detective'} quiere unirse a tu investigación.</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" className="min-h-10 flex-1" onClick={() => void social.run(() => acceptRequest(user.id, request.id))}>
                      Aceptar
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-10 flex-1" onClick={() => void social.run(() => declineRequest(user.id, request.id))}>
                      Rechazar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="text-xs tracking-[0.18em] text-muted uppercase">Tus amigos</h2>
        {social.friends.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aún no hay nadie en tu mesa. Busca un nombre o invita por WhatsApp.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {social.friends.map((friend) => (
              <li key={friend.id} className="flex items-center gap-3 rounded-3xl border border-line px-3 py-2">
                <Link to={`/u/${friend.username}`} className="h-11 w-11 overflow-hidden rounded-2xl">
                  <Avatar id={friend.avatarId} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{friend.username}</p>
                  <p className="text-xs text-muted">
                    {friend.casesSolved} casos · {friend.accuracy}%
                  </p>
                </div>
                <Link to={`/social/chat/${friend.id}`} className="text-xs tracking-[0.14em] text-gold uppercase">
                  Chat
                </Link>
                <button type="button" aria-label={`Eliminar a ${friend.username}`} className="grid h-10 w-10 place-items-center text-muted" onClick={() => void social.run(() => removeFriend(user.id, friend.id))}>
                  <UserMinus className="h-4 w-4" />
                </button>
                <button type="button" aria-label={`Bloquear a ${friend.username}`} className="grid h-10 w-10 place-items-center text-crimson" onClick={() => void social.run(() => blockUser(user.id, friend.id))}>
                  <Ban className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Chats() {
  const { user } = useAuth()
  const { snapshot, friends } = useSocial()
  if (!user) return null
  const rows = friends
    .map((friend) => {
      const conversation = conversationWith(snapshot, user.id, friend.id)
      const messages = conversation ? snapshot.messages.filter((message) => message.conversationId === conversation.id) : []
      const latest = messages[messages.length - 1]
      const unread = conversation ? unreadMessages(snapshot, user.id, conversation.id) : 0
      return { friend, latest, unread }
    })
    .sort((a, b) => (b.latest?.createdAt ?? '').localeCompare(a.latest?.createdAt ?? ''))
  if (rows.length === 0) return <p className="mt-8 text-sm text-muted">El chat privado se abre cuando tienes amigos.</p>
  return (
    <ul className="mt-5 space-y-2">
      {rows.map((row) => (
        <li key={row.friend.id}>
          <Link to={`/social/chat/${row.friend.id}`} className="flex items-center gap-3 rounded-3xl border border-line px-3 py-3">
            <span className="h-11 w-11 overflow-hidden rounded-2xl">
              <Avatar id={row.friend.avatarId} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{row.friend.username}</span>
              <span className="block truncate text-xs text-muted">{row.latest?.body ?? 'Sin mensajes'}</span>
            </span>
            {row.unread > 0 ? (
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1 text-xs font-semibold text-void">{row.unread}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Notices() {
  const { notices, enableNotices } = useSocial()
  const [armed, setArmed] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')
  return (
    <div className="mt-5">
      <Button
        type="button"
        variant="panel"
        full
        onClick={() => void enableNotices().then((ok) => setArmed(ok))}
      >
        <Bell className="h-4 w-4" /> {armed ? 'Avisos activos' : 'Activar notificaciones'}
      </Button>
      {notices.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No hay solicitudes, invitaciones ni mensajes sin leer.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link to={notice.href} className="block rounded-3xl border border-line bg-panel px-4 py-3">
                <p className="text-sm font-semibold">{notice.title}</p>
                <p className="mt-1 text-sm text-muted">{notice.body}</p>
                <p className="mt-2 text-[10px] tracking-[0.16em] text-muted uppercase">{formatAgo(notice.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
