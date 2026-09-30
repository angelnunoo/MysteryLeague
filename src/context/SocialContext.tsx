import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { pulseNotices } from '../game/pulse'
import { loadSocial, subscribeSocial, connectInvite, joinLeagueCode } from '../services/socialStore'
import {
  badgeForPrize,
  buildBoard,
  emptySnapshot,
  friendIds,
  noticesFor,
  personById,
  type League,
  type Notice,
  type Person,
  type SocialSnapshot,
} from '../social/logic'

interface SocialContextValue {
  snapshot: SocialSnapshot
  ready: boolean
  error: string | null
  clearError: () => void
  notices: Notice[]
  friends: Person[]
  activeLeague: League | null
  weeklyPlace: number | null
  run: (task: () => Promise<void>) => Promise<void>
  redeem: (kind: 'user' | 'league', code: string) => Promise<boolean>
  focusLeague: (leagueId: string) => Promise<void>
  enableNotices: () => Promise<boolean>
  reload: () => Promise<void>
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth()
  const [snapshot, setSnapshot] = useState<SocialSnapshot>(emptySnapshot())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const profileRef = useRef(profile)
  profileRef.current = profile
  const seen = useRef(new Set<string>())
  const primed = useRef(false)

  const reload = useCallback(async () => {
    if (!user) return
    setSnapshot(await loadSocial(user.id))
    setReady(true)
  }, [user])

  useEffect(() => {
    if (!user) {
      setSnapshot(emptySnapshot())
      setReady(false)
      primed.current = false
      seen.current.clear()
      return
    }
    let alive = true
    void loadSocial(user.id)
      .then((next) => {
        if (!alive) return
        setSnapshot(next)
        setReady(true)
      })
      .catch((reason: unknown) => {
        if (!alive) return
        setError(reason instanceof Error ? reason.message : 'No se pudo abrir el círculo.')
        setReady(true)
      })
    const stop = subscribeSocial(user.id, () => {
      void loadSocial(user.id)
        .then((next) => {
          if (alive) setSnapshot(next)
        })
        .catch(() => undefined)
    })
    return () => {
      alive = false
      stop()
    }
  }, [user])

  useEffect(() => {
    const current = profileRef.current
    if (!current || !ready) return
    const earned = snapshot.seasons
      .flatMap((season) => season.podium)
      .filter((entry) => entry.userId === current.id)
      .map((entry) => badgeForPrize(entry.prize))
    const missing = [...new Set(earned)].filter((id) => !current.badgeIds.includes(id))
    if (missing.length === 0) return
    void saveProfile({ ...current, badgeIds: [...current.badgeIds, ...missing] })
  }, [snapshot, ready, saveProfile])

  useEffect(() => {
    if (!profile || !ready) return
    const list = noticesFor(snapshot, profile.id)
    if (!primed.current) {
      primed.current = true
      for (const notice of list) seen.current.add(notice.id)
      return
    }
    for (const notice of list) {
      if (seen.current.has(notice.id)) continue
      seen.current.add(notice.id)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        new Notification(notice.title, { body: notice.body, icon: '/pwa-192.png' })
      }
    }
  }, [snapshot, profile, ready])

  const redeem = useCallback(
    async (kind: 'user' | 'league', code: string) => {
      const current = profileRef.current
      if (!user || !current) return false
      try {
        if (kind === 'user') await connectInvite(user.id, code)
        else {
          const leagueId = await joinLeagueCode(user.id, code)
          await saveProfile({ ...profileRef.current!, activeLeagueId: leagueId })
        }
        setSnapshot(await loadSocial(user.id))
        setError(null)
        return true
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo usar la invitación.')
        return false
      }
    },
    [saveProfile, user],
  )

  useEffect(() => {
    if (!user || !profile?.onboardingCompleted) return
    const raw = sessionStorage.getItem('ml-pending')
    if (!raw) return
    sessionStorage.removeItem('ml-pending')
    try {
      const pending = JSON.parse(raw) as { kind?: 'user' | 'league'; code?: string }
      if ((pending.kind === 'user' || pending.kind === 'league') && pending.code) {
        void redeem(pending.kind, pending.code)
      }
    } catch {
      sessionStorage.removeItem('ml-pending')
    }
  }, [profile?.onboardingCompleted, redeem, user])

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setError(null)
      try {
        await task()
        if (user) setSnapshot(await loadSocial(user.id))
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo completar.')
      }
    },
    [user],
  )

  const focusLeague = useCallback(
    async (leagueId: string) => {
      const current = profileRef.current
      if (!current || current.activeLeagueId === leagueId) return
      await saveProfile({ ...current, activeLeagueId: leagueId })
    },
    [saveProfile],
  )

  const value = useMemo<SocialContextValue>(() => {
    const mine = profile?.id
    const friends = mine
      ? friendIds(snapshot, mine)
          .map((id) => personById(snapshot, id))
          .filter((person): person is Person => Boolean(person))
      : []
    const activeLeague =
      snapshot.leagues.find((league) => league.id === profile?.activeLeagueId) ?? snapshot.leagues[0] ?? null
    const season = activeLeague
      ? snapshot.seasons.find((item) => item.leagueId === activeLeague.id && item.status === 'active')
      : undefined
    const members = activeLeague
      ? snapshot.people.filter((person) =>
          snapshot.members.some((member) => member.leagueId === activeLeague.id && member.userId === person.id),
        )
      : []
    const weeklyPlace =
      season && mine
        ? (buildBoard({
            people: members,
            season,
            seasons: snapshot.seasons,
            scores: snapshot.scores,
            mode: 'semanal',
          }).find((row) => row.person.id === mine)?.place ?? null)
        : null
    return {
      snapshot,
      ready,
      error,
      clearError: () => setError(null),
      notices: mine
        ? [...pulseNotices(snapshot, mine, profile?.badgeIds ?? []), ...noticesFor(snapshot, mine)].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          )
        : [],
      friends,
      activeLeague,
      weeklyPlace,
      run,
      redeem,
      focusLeague,
      enableNotices: async () => {
        if (typeof Notification === 'undefined') return false
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      },
      reload,
    }
  }, [error, focusLeague, profile?.activeLeagueId, profile?.badgeIds, profile?.id, ready, redeem, reload, run, snapshot])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial() {
  const value = useContext(SocialContext)
  if (!value) throw new Error('useSocial debe usarse dentro de SocialProvider.')
  return value
}
