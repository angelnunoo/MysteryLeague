import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { useSocial } from '../context/SocialContext'
import { markRead, openTypingChannel, sendMessage } from '../services/socialStore'
import { conversationWith, isFriend, personById } from '../social/logic'

export function ChatPage() {
  const { friendId = '' } = useParams()
  const { user } = useAuth()
  const social = useSocial()
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const channel = useRef<ReturnType<typeof openTypingChannel> | null>(null)
  const idle = useRef<number | undefined>(undefined)
  const friend = personById(social.snapshot, friendId)
  const conversation = user ? conversationWith(social.snapshot, user.id, friendId) : undefined
  const messages = conversation
    ? social.snapshot.messages.filter((message) => message.conversationId === conversation.id)
    : []
  const friends = user ? isFriend(social.snapshot, user.id, friendId) : false

  useEffect(() => {
    if (!user || !friends) return
    void markRead(user.id, friendId).then(() => social.reload())
  }, [friendId, friends, messages.length, social.reload, user])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages.length, typing])

  useEffect(() => {
    if (!user || !conversation) return
    const opened = openTypingChannel(conversation.id, user.id, (_from, active) => setTyping(active))
    channel.current = opened
    return () => opened.close()
  }, [conversation?.id, user])

  if (!user) return null
  const detective = user

  function onType(value: string) {
    setDraft(value)
    channel.current?.push(true)
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => channel.current?.push(false), 1200)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const text = draft
    setDraft('')
    channel.current?.push(false)
    void social.run(() => sendMessage(detective.id, friendId, text))
  }

  return (
    <main className="flex h-dvh flex-col">
      <header
        className="flex items-center gap-3 border-b border-white/10 px-3 py-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <Link to="/social?tab=chat" className="grid h-11 w-11 place-items-center" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="h-10 w-10 overflow-hidden rounded-2xl">
          <Avatar id={friend?.avatarId ?? 'lens'} />
        </span>
        <div>
          <h1 className="text-sm">{friend?.username ?? 'Detective'}</h1>
          <p className="text-xs text-gold">{typing ? 'está escribiendo…' : friends ? 'En línea en la mesa' : 'Fuera del círculo'}</p>
        </div>
      </header>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {!friends ? <p className="text-sm text-muted">El chat privado es solo entre amigos.</p> : null}
        {messages.map((message) => {
          const mine = message.senderId === user.id
          return (
            <p
              key={message.id}
              className={
                mine
                  ? 'ml-auto max-w-[80%] rounded-3xl rounded-br-md bg-gold px-4 py-2 text-sm text-void'
                  : 'mr-auto max-w-[80%] rounded-3xl rounded-bl-md bg-panel px-4 py-2 text-sm'
              }
            >
              {message.body}
            </p>
          )
        })}
        {typing ? <p className="text-xs tracking-[0.16em] text-gold uppercase">está escribiendo…</p> : null}
      </div>
      {social.error ? <p className="px-4 text-sm text-crimson">{social.error}</p> : null}
      <form
        className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        onSubmit={onSubmit}
      >
        <label className="sr-only" htmlFor="mensaje">
          Mensaje
        </label>
        <input
          id="mensaje"
          value={draft}
          maxLength={500}
          disabled={!friends}
          placeholder={friends ? 'Escribe a tu amigo' : 'No disponible'}
          onChange={(event) => onType(event.target.value)}
          className="min-h-12 flex-1 rounded-full border border-line bg-panel px-4 text-base outline-none"
        />
        <button type="submit" className="grid h-12 w-12 place-items-center rounded-full bg-gold text-void" aria-label="Enviar" disabled={!friends || !draft.trim()}>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </main>
  )
}
