import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { caseById, weeklyCases } from '../data/cases'
import { rememberStreak } from '../game/stats'
import { LEGENDS } from '../game/legends'
import { createId } from '../lib/format'
import { blankNotebook, gameService, profileService, toDetectiveCard } from '../services/repository'
import { recordSolve } from '../services/socialStore'
import type { CaseRun, DetectiveCard, Notebook, ResolutionAnswers, RewardSummary } from '../types'
import { useAuth } from './AuthContext'

export interface LeagueRow extends DetectiveCard {
  position: number
  self: boolean
}

interface GameContextValue {
  runs: CaseRun[]
  notebooks: Notebook[]
  ready: boolean
  error: string | null
  league: LeagueRow[]
  ensureRun: (caseId: string) => Promise<CaseRun>
  updateRun: (run: CaseRun) => Promise<void>
  saveNotebook: (notebook: Notebook) => Promise<void>
  notebookFor: (caseId: string) => Notebook
  completeCase: (input: {
    caseId: string
    answers: ResolutionAnswers
    elapsedSeconds: number
    hintsUsed: number
  }) => Promise<RewardSummary>
}

const GameContext = createContext<GameContextValue | null>(null)

function buildLeague(me: DetectiveCard, remote: DetectiveCard[]): LeagueRow[] {
  const known = new Set(remote.map((card) => card.id))
  const legends = remote.length >= 8 ? [] : LEGENDS.filter((legend) => !known.has(legend.id))
  const merged = new Map<string, DetectiveCard>()
  for (const card of [...remote, ...legends]) {
    if (card.id !== me.id) merged.set(card.id, card)
  }
  merged.set(me.id, me)
  return [...merged.values()]
    .sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username, 'es'))
    .map((card, index) => ({ ...card, position: index + 1, self: card.id === me.id }))
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, profile, setProfile } = useAuth()
  const [runs, setRuns] = useState<CaseRun[]>([])
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [remote, setRemote] = useState<DetectiveCard[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRuns([])
      setNotebooks([])
      setRemote([])
      setReady(true)
      return
    }

    let active = true
    setReady(false)
    void gameService
      .load(user.id)
      .then((data) => {
        if (!active) return
        setRuns(data.runs)
        setNotebooks(data.notebooks)
        setError(null)
        setReady(true)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar la partida.')
        setReady(true)
      })

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!profile) return
    let active = true
    void profileService.leaderboard().then((cards) => {
      if (active) setRemote(cards)
    })
    return () => {
      active = false
    }
  }, [profile])

  const ensureRun = useCallback(
    async (caseId: string) => {
      if (!user) throw new Error('Inicia sesión para abrir un caso.')
      const existing = runs.find((run) => run.caseId === caseId)
      if (existing) return existing
      const now = new Date().toISOString()
      const run: CaseRun = {
        id: createId(),
        userId: user.id,
        caseId,
        status: 'in_progress',
        startedAt: now,
        solvedAt: null,
        elapsedSeconds: 0,
        hintsUsed: 0,
        score: null,
        xpAwarded: 0,
        coinsAwarded: 0,
        culpritCorrect: null,
        answers: null,
        reward: null,
        updatedAt: now,
      }
      await gameService.saveRun(run)
      setRuns((current) => [...current, run])
      return run
    },
    [runs, user],
  )

  const updateRun = useCallback(async (run: CaseRun) => {
    setRuns((current) => current.map((item) => (item.id === run.id ? run : item)))
    await gameService.saveRun(run)
  }, [])

  const saveNotebook = useCallback(async (notebook: Notebook) => {
    setNotebooks((current) => {
      const index = current.findIndex(
        (item) => item.userId === notebook.userId && item.caseId === notebook.caseId,
      )
      if (index === -1) return [...current, notebook]
      const copy = [...current]
      copy[index] = notebook
      return copy
    })
    await gameService.saveNotebook(notebook)
  }, [])

  const notebookFor = useCallback(
    (caseId: string) => {
      if (!user) return blankNotebook('local', caseId)
      return notebooks.find((item) => item.caseId === caseId) ?? blankNotebook(user.id, caseId)
    },
    [notebooks, user],
  )

  const completeCase = useCallback(
    async (input: {
      caseId: string
      answers: ResolutionAnswers
      elapsedSeconds: number
      hintsUsed: number
    }) => {
      if (!profile) throw new Error('Inicia sesión para cerrar el caso.')
      const result = await gameService.complete({
        profile,
        runs,
        ...input,
      })
      setProfile(result.profile)
      rememberStreak(result.profile.streak)
      setRuns((current) => {
        const rest = current.filter((run) => run.caseId !== result.run.caseId)
        return [...rest, result.run]
      })
      const mystery = caseById(input.caseId)
      if (mystery) {
        void recordSolve({
          userId: profile.id,
          username: result.profile.username,
          caseTitle: mystery.title,
          caseType: mystery.type,
          isWeekly: weeklyCases().some((item) => item.id === mystery.id),
          culpritCorrect: result.summary.culpritCorrect,
          previousLevel: profile.level,
          nextLevel: result.profile.level,
          badgeIds: result.summary.badgesUnlocked,
        }).catch(() => undefined)
      }
      return result.summary
    },
    [profile, runs, setProfile],
  )

  const league = useMemo(
    () => (profile ? buildLeague(toDetectiveCard(profile), remote) : []),
    [profile, remote],
  )

  const value = useMemo<GameContextValue>(
    () => ({
      runs,
      notebooks,
      ready,
      error,
      league,
      ensureRun,
      updateRun,
      saveNotebook,
      notebookFor,
      completeCase,
    }),
    [runs, notebooks, ready, error, league, ensureRun, updateRun, saveNotebook, notebookFor, completeCase],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame debe usarse dentro de GameProvider')
  return context
}
