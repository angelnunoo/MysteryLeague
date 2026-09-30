import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Splash } from '../components/brand'
import { useAuth } from '../context/AuthContext'
import { useSocial } from '../context/SocialContext'

export function InvitePage({ kind }: { kind: 'user' | 'league' }) {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { loading, user, profile } = useAuth()
  const { redeem, error } = useSocial()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (loading || !code || started.current) return
    if (!user || !profile?.onboardingCompleted) {
      sessionStorage.setItem('ml-pending', JSON.stringify({ kind, code }))
      navigate(user ? '/onboarding' : '/registro', { replace: true })
      return
    }
    started.current = true
    void redeem(kind, code).then((ok) => {
      if (ok) navigate(kind === 'user' ? '/social?tab=amigos' : '/liga', { replace: true })
      else setFailed(true)
    })
  }, [code, kind, loading, navigate, profile?.onboardingCompleted, redeem, user])

  if (failed) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-4xl leading-none">La invitación no encaja.</p>
          <p className="mt-3 text-sm text-crimson">{error}</p>
          <button type="button" className="mt-6 text-sm text-gold" onClick={() => navigate('/')}>
            Volver al cuartel
          </button>
        </div>
      </main>
    )
  }
  return <Splash />
}
