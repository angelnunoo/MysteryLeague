import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, isSupabaseConfigured, profileService } from '../services/repository'
import type { AuthUser, Profile } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  recovery: boolean
  configured: boolean
  signIn: (email: string, password: string, remember: boolean) => Promise<void>
  signUp: (input: { email: string; password: string; username: string }) => Promise<'session' | 'confirm_email'>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<'remote' | 'local'>
  updatePassword: (input: { email?: string; password: string }) => Promise<void>
  setProfile: (profile: Profile) => void
  saveProfile: (profile: Profile) => Promise<void>
  clearRecovery: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(() => window.location.hash.includes('type=recovery'))

  useEffect(() => {
    let active = true

    const applyUser = async (next: AuthUser | null) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        return
      }
      const loaded = await profileService.load(next)
      if (active) setProfile(loaded)
    }

    void authService
      .getSession()
      .then(async (session) => {
        if (!active) return
        await applyUser(session)
        if (active) setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = authService.onChange((event, next) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'INITIAL_SESSION') return
      void applyUser(next)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      recovery,
      configured: isSupabaseConfigured,
      async signIn(email, password, remember) {
        const next = await authService.signIn(email, password, remember)
        setUser(next)
        setProfile(await profileService.load(next))
      },
      async signUp(input) {
        const result = await authService.signUp(input)
        if (result.status === 'session') {
          setUser(result.user)
          setProfile(await profileService.load(result.user))
        }
        return result.status
      },
      async signOut() {
        await authService.signOut()
        setUser(null)
        setProfile(null)
        setRecovery(false)
      },
      requestPasswordReset: (email) => authService.requestPasswordReset(email),
      async updatePassword(input) {
        await authService.updatePassword(input)
        setRecovery(false)
      },
      setProfile,
      async saveProfile(next) {
        const saved = await profileService.save(next)
        setProfile(saved)
      },
      clearRecovery() {
        setRecovery(false)
      },
    }),
    [user, profile, loading, recovery],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
