import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { weeklyCases } from '../data/cases'
import { withProgress } from '../game/ranks'
import { toLeagueIdentity } from '../leagueId/identity'
import { missionDone, missionKey, MISSIONS, type MissionDef } from '../progress/missions'
import { competitivePoints } from '../progress/competitive'
import { settle } from '../progress/settle'
import { emptyProgress, type ProgressState } from '../progress/state'
import { createId } from '../lib/format'
import { loadBoard } from '../services/communityStore'
import { loadProgress, pickRicher, pullProgress, saveLeagueIdentity, saveProgress } from '../services/progressStore'
import { useAuth } from './AuthContext'
import { useCosmetics } from './CosmeticsContext'
import { useGame } from './GameContext'
import { useSocial } from './SocialContext'

export interface CreditGain {
  id: string
  amount: number
  reason: string
}

interface ProgressValue {
  state: ProgressState
  points: number
  gains: CreditGain[]
  rankUp: string | null
  communityPosts: number
  dismissGain: (id: string) => void
  dismissRank: () => void
  dismissStreak: () => void
  readChapter: (chapter: number) => Promise<void>
  addTheory: (text: string) => Promise<void>
  claimMission: (mission: MissionDef) => Promise<void>
  missionReady: (mission: MissionDef) => boolean
  missionClaimed: (mission: MissionDef) => boolean
}

const ProgressContext = createContext<ProgressValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth()
  const { runs, notebooks } = useGame()
  const social = useSocial()
  const { grant } = useCosmetics()
  const [state, setState] = useState<ProgressState>(emptyProgress())
  const [hydrated, setHydrated] = useState(false)
  const [gains, setGains] = useState<CreditGain[]>([])
  const [rankUp, setRankUp] = useState<string | null>(null)
  const [communityPosts, setCommunityPosts] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const profileRef = useRef(profile)
  profileRef.current = profile
  const skipCoins = useRef(0)
  const seenCoins = useRef<number | null>(null)

  const announce = useCallback((amount: number, reason: string) => {
    if (amount <= 0) return
    skipCoins.current += amount
    setGains((current) => [...current, { id: createId(), amount, reason }].slice(-4))
  }, [])

  useEffect(() => {
    if (!user) {
      setHydrated(false)
      return
    }
    let active = true
    setHydrated(false)
    const local = loadProgress(user.id)
    stateRef.current = local
    setState(local)
    void pullProgress(user.id).then((remote) => {
      if (!active) return
      const chosen = pickRicher(stateRef.current, remote)
      stateRef.current = chosen
      setState(chosen)
      setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!profile || !social.activeLeague) {
      setCommunityPosts(0)
      return
    }
    let active = true
    void loadBoard(social.activeLeague.id).then((board) => {
      if (!active) return
      setCommunityPosts(board.posts.filter((post) => post.userId === profile.id).length)
    })
    return () => {
      active = false
    }
  }, [profile, social.activeLeague])

  const eventSolved = useMemo(
    () => runs.filter((run) => run.status === 'solved' && run.caseId.startsWith('evento-')).map((run) => run.caseId),
    [runs],
  )

  const seasonWinIds = useMemo(() => {
    if (!profile) return []
    return social.snapshot.seasons
      .filter((season) => season.podium.some((entry) => entry.userId === profile.id && entry.place === 1))
      .map((season) => season.id)
  }, [profile, social.snapshot.seasons])

  const signature = [
    hydrated,
    profile?.id,
    profile?.level,
    profile?.streak,
    profile?.accuracy,
    profile?.casesSolved,
    profile?.badgeIds.join(','),
    seasonWinIds.join(','),
    social.weeklyPlace ?? '',
    communityPosts,
    eventSolved.join(','),
    state.dossierRead,
  ].join('|')

  useEffect(() => {
    if (!hydrated || !user || !profileRef.current) return
    const currentProfile = profileRef.current
    const result = settle(stateRef.current, {
      level: currentProfile.level,
      streak: currentProfile.streak,
      accuracy: currentProfile.accuracy,
      casesSolved: currentProfile.casesSolved,
      badgeIds: currentProfile.badgeIds,
      seasonWinIds,
      weeklyPlace: social.weeklyPlace,
      communityPosts,
      eventSolved,
      createdAt: currentProfile.createdAt,
    })
    if (!result.changed) return
    stateRef.current = result.state
    setState(result.state)
    if (result.rankUp) setRankUp(result.rankUp)
    void (async () => {
      await saveProgress(user.id, result.state)
      const latest = profileRef.current
      if (!latest) return
      if (result.credits > 0 || result.badges.length > 0) {
        const badgeIds = [...new Set([...latest.badgeIds, ...result.badges])]
        announce(result.credits, result.reason)
        await saveProfile(withProgress({ ...latest, coins: latest.coins + result.credits, badgeIds }))
      }
      for (const itemId of result.items) await grant(itemId)
    })()
  }, [announce, communityPosts, eventSolved, grant, hydrated, saveProfile, seasonWinIds, signature, social.weeklyPlace, user])

  useEffect(() => {
    if (!profile || !hydrated) return
    if (seenCoins.current == null) {
      seenCoins.current = profile.coins
      return
    }
    let delta = profile.coins - seenCoins.current
    seenCoins.current = profile.coins
    if (delta <= 0) return
    const skipped = Math.min(skipCoins.current, delta)
    skipCoins.current -= skipped
    delta -= skipped
    if (delta > 0) {
      setGains((current) => [...current, { id: createId(), amount: delta, reason: 'Investigación' }].slice(-4))
    }
  }, [hydrated, profile])

  const readChapter = useCallback(
    async (chapter: number) => {
      if (!user || !profile) return
      const current = stateRef.current
      if (chapter > current.dossierRead + 1 || chapter < 1) return
      const claimed = new Set(current.claimed)
      const key = `capitulo-${chapter}`
      let credits = 0
      if (chapter > current.dossierRead && !claimed.has(key)) {
        claimed.add(key)
        credits = 10
      }
      const next = { ...current, dossierRead: Math.max(current.dossierRead, chapter), claimed: [...claimed] }
      stateRef.current = next
      setState(next)
      await saveProgress(user.id, next)
      if (credits > 0) {
        announce(credits, `Capítulo ${chapter}`)
        await saveProfile({ ...profile, coins: profile.coins + credits })
      }
    },
    [announce, profile, saveProfile, user],
  )

  const addTheory = useCallback(
    async (text: string) => {
      if (!user) return
      const clean = text.trim()
      if (clean.length < 8) throw new Error('La teoría necesita un poco más de cuerpo.')
      const current = stateRef.current
      const next = { ...current, theories: [clean, ...current.theories].slice(0, 12) }
      stateRef.current = next
      setState(next)
      await saveProgress(user.id, next)
    },
    [user],
  )

  const claimMission = useCallback(
    async (mission: MissionDef) => {
      if (!user || !profile) return
      const key = missionKey(mission)
      if (stateRef.current.missionClaims.includes(key)) return
      const weeklyIds = weeklyCases().map((item) => item.id)
      if (!missionDone(mission, { runs, notebooks, weeklyIds, communityPosts })) {
        throw new Error('Esta misión sigue abierta.')
      }
      const next = { ...stateRef.current, missionClaims: [...stateRef.current.missionClaims, key] }
      stateRef.current = next
      setState(next)
      await saveProgress(user.id, next)
      if (mission.item) await grant(mission.item)
      announce(mission.credits, mission.title)
      await saveProfile(withProgress({ ...profile, xp: profile.xp + mission.xp, coins: profile.coins + mission.credits }))
    },
    [announce, communityPosts, grant, notebooks, profile, runs, saveProfile, user],
  )

  const missionReady = useCallback(
    (mission: MissionDef) => {
      const weeklyIds = weeklyCases().map((item) => item.id)
      return missionDone(mission, { runs, notebooks, weeklyIds, communityPosts })
    },
    [communityPosts, notebooks, runs],
  )

  const missionClaimed = useCallback(
    (mission: MissionDef) => state.missionClaims.includes(missionKey(mission)),
    [state.missionClaims],
  )

  const dismissGain = useCallback((id: string) => {
    setGains((current) => current.filter((gain) => gain.id !== id))
  }, [])

  const dismissRank = useCallback(() => setRankUp(null), [])

  const dismissStreak = useCallback(() => {
    if (!user) return
    const next = { ...stateRef.current, streakNotice: null }
    stateRef.current = next
    setState(next)
    void saveProgress(user.id, next)
  }, [user])

  useEffect(() => {
    if (!profile) return
    const identity = toLeagueIdentity({
      userId: profile.id,
      username: profile.username,
      avatarId: profile.avatarId,
      createdAt: profile.createdAt,
      level: profile.level,
      credits: profile.coins,
      badgeIds: profile.badgeIds,
      friends: social.friends.map((friend) => ({ id: friend.id, username: friend.username })),
      casesSolved: profile.casesSolved,
      accuracy: profile.accuracy,
      streak: profile.streak,
    })
    void saveLeagueIdentity(identity)
  }, [profile, social.friends])

  const points = profile
    ? competitivePoints({
        accuracy: profile.accuracy,
        casesSolved: profile.casesSolved,
        leagueWins: seasonWinIds.length,
        weeklyPlace: social.weeklyPlace,
        eventClears: eventSolved.length,
        communityPosts,
        dossierRead: state.dossierRead,
      })
    : 0

  const value = useMemo<ProgressValue>(
    () => ({
      state,
      points,
      gains,
      rankUp,
      communityPosts,
      dismissGain,
      dismissRank,
      dismissStreak,
      readChapter,
      addTheory,
      claimMission,
      missionReady,
      missionClaimed,
    }),
    [
      addTheory,
      claimMission,
      communityPosts,
      dismissGain,
      dismissRank,
      dismissStreak,
      gains,
      missionClaimed,
      missionReady,
      points,
      rankUp,
      readChapter,
      state,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress debe usarse dentro de ProgressProvider.')
  return value
}

export { MISSIONS }
