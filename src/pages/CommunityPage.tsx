import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DOSSIER, openChapterCount } from '../community/dossier'
import {
  CONTRIBUTION_CAP,
  POST_KINDS,
  ROLES,
  roleFor,
  roleMeta,
  scoredCount,
  weekKey,
  type PostKind,
} from '../community/logic'
import { useAuth } from '../context/AuthContext'
import { useSocial } from '../context/SocialContext'
import { markChapterSeen } from '../game/pulse'
import { isoWeek } from '../lib/format'
import { loadBoard, publishPost, saveChapter } from '../services/communityStore'
import type { BoardPost } from '../community/logic'

export function CommunityPage() {
  const { user, profile, saveProfile } = useAuth()
  const social = useSocial()
  const reduce = useReducedMotion()
  const league = social.activeLeague
  const week = isoWeek()
  const unlocked = openChapterCount(week)
  const [chapter, setChapter] = useState(unlocked)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [read, setRead] = useState(1)
  const [kind, setKind] = useState<PostKind>('prueba')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    markChapterSeen(unlocked)
  }, [unlocked])

  useEffect(() => {
    if (!league) return
    let alive = true
    void loadBoard(league.id)
      .then((board) => {
        if (!alive) return
        setPosts(board.posts)
        const mine = board.progress.find((row) => row.userId === user?.id)
        if (mine) setRead(mine.chapter)
      })
      .catch((reason: unknown) => {
        if (alive) setError(reason instanceof Error ? reason.message : 'El tablón no responde.')
      })
    return () => {
      alive = false
    }
  }, [league, user?.id])

  if (!user || !profile) return null
  if (!league) {
    return (
      <main className="px-4 pt-6" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Caso comunitario</p>
        <h1 className="mt-2 font-display text-5xl leading-none">La mesa está vacía.</h1>
        <p className="mt-3 text-sm text-muted">El expediente semanal se abre dentro de una liga. Funda una o entra con un código.</p>
        <Link to="/liga" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-gold px-5 text-sm font-semibold text-void">
          Ir a la liga
        </Link>
      </main>
    )
  }

  const mesa = league
  const detective = user
  const ficha = profile
  const memberIds = social.snapshot.members.filter((member) => member.leagueId === mesa.id).map((member) => member.userId)
  const role = roleFor(memberIds.length ? memberIds : [detective.id], detective.id, week)
  const key = weekKey(mesa.id, week)
  const mine = scoredCount(posts, detective.id, key)
  const current = DOSSIER.chapters[chapter - 1] ?? DOSSIER.chapters[0]
  const events = DOSSIER.timeline.slice(0, unlocked + 1)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      await publishPost({
        leagueId: mesa.id,
        weekKey: key,
        userId: detective.id,
        username: ficha.username,
        role,
        kind,
        body,
      })
      await saveProfile({ ...ficha, coins: ficha.coins + 12 })
      const board = await loadBoard(mesa.id)
      setPosts(board.posts)
      setBody('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo publicar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="px-4 pt-4 pb-8" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
      <motion.section
        className="relative overflow-hidden rounded-[32px] px-5 py-6"
        style={{ background: DOSSIER.cover }}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="film pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="text-[10px] tracking-[0.34em] text-gold uppercase">Caso comunitario · {league.name}</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.9]">{DOSSIER.title}</h1>
          <p className="mt-3 max-w-[18rem] text-sm text-ink/80">{DOSSIER.subtitle}</p>
          <p className="mt-4 text-xs tracking-[0.16em] text-gold uppercase">
            {DOSSIER.location} · {DOSSIER.year}
          </p>
        </div>
      </motion.section>

      <section className="mt-4 rounded-[28px] border border-line bg-panel/80 p-4">
        <p className="text-[10px] tracking-[0.22em] text-muted uppercase">Rol de esta semana</p>
        <p className="mt-1 font-display text-4xl leading-none">{roleMeta(role).name}</p>
        <p className="mt-2 text-sm text-muted">{roleMeta(role).blurb}</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {ROLES.map((meta) => {
            const active = meta.id === role
            return (
              <li key={meta.id} className={active ? 'rounded-2xl border border-gold bg-gold/10 px-3 py-2' : 'rounded-2xl border border-line px-3 py-2 opacity-60'}>
                <p className="text-xs">{meta.name}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-[11px] text-muted">Los roles rotan cada semana. Nadie se queda con la misma silla.</p>
      </section>

      <div className="rail mt-4 flex gap-2 overflow-x-auto">
        {DOSSIER.chapters.map((item) => {
          const locked = item.index > unlocked
          const active = item.index === chapter
          return (
            <button
              key={item.index}
              type="button"
              disabled={locked}
              onClick={() => {
                setChapter(item.index)
                void saveChapter({ userId: detective.id, leagueId: mesa.id, chapter: item.index }).then(() =>
                  setRead((currentRead) => Math.max(currentRead, item.index)),
                )
              }}
              className={
                active
                  ? 'min-w-36 rounded-3xl border border-gold bg-gold px-4 py-3 text-left text-void'
                  : 'min-w-36 rounded-3xl border border-line px-4 py-3 text-left disabled:opacity-40'
              }
            >
              <span className="block text-[10px] tracking-[0.16em] uppercase">{locked ? 'Cerrado' : item.kicker}</span>
              <span className="mt-1 block font-display text-2xl leading-none">{item.title}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Capítulo {unlocked} de {DOSSIER.chapters.length} abierto esta semana. Tu lectura va por el {read}.
      </p>

      {current ? (
        <article className="mt-4">
          <p className="text-[10px] tracking-[0.22em] text-gold uppercase">{current.kicker}</p>
          <h2 className="font-display text-5xl leading-none">{current.title}</h2>
          {current.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-4 text-[15px] leading-7 text-ink/90">
              {paragraph}
            </p>
          ))}
        </article>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-4xl leading-none">Línea temporal</h2>
        <ol className="mt-4 space-y-0">
          {events.map((event, index) => (
            <li key={event.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
              <div className="text-right">
                <p className="text-xs text-gold">{event.time}</p>
              </div>
              <div className={index === events.length - 1 ? 'pb-2' : 'border-l border-gold/40 pb-5 pl-4'}>
                <p className="text-sm leading-6">{event.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl leading-none">Tablón</h2>
          <p className="text-[11px] text-muted">
            {mine}/{CONTRIBUTION_CAP} puntuables
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">Pruebas, teorías, sospechosos e hipótesis. Las tres primeras de la semana dejan créditos. El resto espera.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => void onSubmit(event)}>
          <div className="grid grid-cols-4 gap-1 rounded-full border border-line p-1">
            {POST_KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={kind === item.id ? 'min-h-10 rounded-full bg-gold text-[11px] font-semibold text-void' : 'min-h-10 rounded-full text-[11px] text-muted'}
                onClick={() => setKind(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="block" htmlFor="aportacion">
            <span className="sr-only">Aportación</span>
            <textarea
              id="aportacion"
              value={body}
              maxLength={280}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Qué has visto que los demás aún no"
              className="min-h-28 w-full resize-none rounded-3xl border border-line bg-panel px-4 py-3 text-base outline-none"
            />
          </label>
          {error ? <p className="text-sm text-crimson">{error}</p> : null}
          <button type="submit" disabled={sending || mine >= CONTRIBUTION_CAP} className="min-h-12 w-full rounded-full bg-gold text-sm font-semibold text-void disabled:opacity-50">
            Publicar en la mesa
          </button>
        </form>
        <ul className="mt-4 space-y-3">
          {posts.length === 0 ? <li className="text-sm text-muted">El tablón espera la primera nota.</li> : null}
          {[...posts].reverse().map((post) => (
            <li key={post.id} className="rounded-[28px] border border-line bg-black/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs tracking-[0.14em] text-gold uppercase">
                  {POST_KINDS.find((item) => item.id === post.kind)?.label} · {roleMeta(post.role).name}
                </p>
                {post.scored && post.weekKey === key ? <span className="text-[10px] text-muted">Puntúa</span> : null}
              </div>
              <p className="mt-2 text-sm leading-6">{post.body}</p>
              <p className="mt-2 text-xs text-muted">{post.username}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
