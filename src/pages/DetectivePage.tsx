import { useEffect, useState } from 'react'
import { ArrowLeft, Ban, UserPlus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DetectiveProfile } from '../components/DetectiveProfile'
import { Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { useSocial } from '../context/SocialContext'
import { caseById } from '../data/cases'
import { blockUser, lookupPerson, sendRequest } from '../services/socialStore'
import { isBlocked, isFriend, type Person } from '../social/logic'

export function DetectivePage() {
  const { username = '' } = useParams()
  const { user, profile } = useAuth()
  const { runs } = useGame()
  const social = useSocial()
  const [person, setPerson] = useState<Person | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const known =
      social.snapshot.people.find((item) => item.username.toLowerCase() === username.toLowerCase()) ??
      (profile?.username.toLowerCase() === username.toLowerCase()
        ? {
            id: profile.id,
            username: profile.username,
            avatarId: profile.avatarId,
            level: profile.level,
            rank: profile.rank,
            casesSolved: profile.casesSolved,
            accuracy: profile.accuracy,
            xp: profile.xp,
            badgeIds: profile.badgeIds,
            inviteCode: profile.inviteCode,
          }
        : undefined)
    if (known) {
      setPerson(known)
      setMissing(false)
      return
    }
    let alive = true
    void lookupPerson(username).then((found) => {
      if (!alive) return
      setPerson(found)
      setMissing(!found)
    })
    return () => {
      alive = false
    }
  }, [profile, social.snapshot.people, username])

  if (!user || !profile) return null
  if (missing || !person) {
    return (
      <main className="px-4 pt-6" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <Link to="/social" className="inline-flex items-center gap-2 text-sm text-muted">
          <ArrowLeft className="h-4 w-4" /> Social
        </Link>
        <p className="mt-8 text-sm text-muted">{missing ? 'No hay un detective con ese nombre.' : 'Abriendo expediente…'}</p>
      </main>
    )
  }

  const self = person.id === user.id
  const friend = isFriend(social.snapshot, user.id, person.id)
  const blocked = isBlocked(social.snapshot, user.id, person.id)
  const leagueName = self
    ? (social.activeLeague?.name ?? null)
    : (social.snapshot.leagues.find((league) =>
        social.snapshot.members.some((member) => member.leagueId === league.id && member.userId === person.id),
      )?.name ?? null)
  const activity = social.snapshot.activities
    .filter((item) => item.userId === person.id)
    .map((item) => ({ id: item.id, text: item.text, createdAt: item.createdAt }))
  const solved = self
    ? runs
        .filter((run) => run.status === 'solved')
        .map((run) => ({
          id: run.id,
          text: `Resolviste ${caseById(run.caseId)?.title ?? 'un caso'}.`,
          createdAt: run.solvedAt ?? run.updatedAt,
        }))
    : []
  const history = activity.length > 0 ? activity : solved

  return (
    <main className="px-4 pt-6 pb-8" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <Link to="/social" className="inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft className="h-4 w-4" /> Social
      </Link>
      <div className="mt-4">
        <DetectiveProfile
          username={person.username}
          avatarId={person.avatarId}
          level={person.level}
          rank={person.rank}
          xp={person.xp}
          casesSolved={person.casesSolved}
          accuracy={person.accuracy}
          leagueName={leagueName}
          badgeIds={person.badgeIds}
          history={history}
        />
      </div>
      {social.error ? <p className="mt-4 text-sm text-crimson">{social.error}</p> : null}
      {!self && !friend && !blocked ? (
        <Button type="button" className="mt-6" full onClick={() => void social.run(() => sendRequest(user.id, person.id))}>
          <UserPlus className="h-4 w-4" /> Enviar solicitud
        </Button>
      ) : null}
      {friend ? (
        <Link to={`/social/chat/${person.id}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-semibold text-void">
          Abrir chat
        </Link>
      ) : null}
      {!self && !blocked ? (
        <Button type="button" variant="danger" className="mt-3" full onClick={() => void social.run(() => blockUser(user.id, person.id))}>
          <Ban className="h-4 w-4" /> Bloquear
        </Button>
      ) : null}
    </main>
  )
}
