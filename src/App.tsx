import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Splash } from './components/brand'
import { useAuth } from './context/AuthContext'
import { useCosmetics } from './context/CosmeticsContext'
import { CasePage } from './pages/CasePage'
import { CommunityPage } from './pages/CommunityPage'
import { ChatPage } from './pages/ChatPage'
import { DetectivePage } from './pages/DetectivePage'
import { ForgotPage, LoginPage, RegisterPage, ResetPage } from './pages/AuthPages'
import { HomePage } from './pages/HomePage'
import { InvitePage } from './pages/InvitePage'
import { LeaguePage } from './pages/LeaguePage'
import { LibraryPage } from './pages/LibraryPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { SocialPage } from './pages/SocialPage'
import { EvidencePage } from './pages/EvidencePage'
import { EventsPage } from './pages/EventsPage'
import { ExpedienteReaderPage, ExpedientesPage } from './pages/ExpedientePage'
import { IdentityPage } from './pages/IdentityPage'
import { LiveLayer } from './components/LiveLayer'
import { MissionsPage } from './pages/MissionsPage'
import { StudioPage } from './pages/StudioPage'
import { WeeklyPage } from './pages/WeeklyPage'

function GuestGate({ children }: { children: ReactNode }) {
  const { loading, user, profile, recovery } = useAuth()
  if (loading || (user && !profile)) return <Splash />
  if (recovery) return <Navigate to="/restablecer" replace />
  if (user && profile && !profile.onboardingCompleted) return <Navigate to="/onboarding" replace />
  if (user && profile?.onboardingCompleted) return <Navigate to="/" replace />
  return children
}

function OnboardingGate() {
  const { loading, user, profile } = useAuth()
  if (loading || (user && !profile)) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.onboardingCompleted) return <Navigate to="/" replace />
  return <OnboardingPage />
}

function AppGate() {
  const { loading, user, profile, recovery } = useAuth()
  if (loading || (user && !profile)) return <Splash />
  if (recovery) return <Navigate to="/restablecer" replace />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (!profile.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <AppShell />
}

export function App() {
  const { wardrobe } = useCosmetics()
  return (
    <div className="fog min-h-dvh text-ink" data-theme={wardrobe.theme} data-bg={wardrobe.background || 'fondo-void'}>
      <div className="stage-bg relative mx-auto min-h-dvh w-full max-w-[480px] bg-void shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative z-10">
          <LiveLayer />
          <Routes>
            <Route path="/login" element={<GuestGate><LoginPage /></GuestGate>} />
            <Route path="/registro" element={<GuestGate><RegisterPage /></GuestGate>} />
            <Route path="/recuperar" element={<GuestGate><ForgotPage /></GuestGate>} />
            <Route path="/restablecer" element={<ResetPage />} />
            <Route path="/onboarding" element={<OnboardingGate />} />
            <Route path="/i/:code" element={<InvitePage kind="user" />} />
            <Route path="/l/:code" element={<InvitePage kind="league" />} />
            <Route element={<AppGate />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/biblioteca" element={<LibraryPage />} />
              <Route path="/casos/:caseId" element={<CasePage />} />
              <Route path="/semanales" element={<WeeklyPage />} />
              <Route path="/liga" element={<LeaguePage />} />
              <Route path="/comunidad" element={<CommunityPage />} />
              <Route path="/tienda" element={<ShopPage />} />
              <Route path="/sala" element={<StudioPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/social/chat/:friendId" element={<ChatPage />} />
              <Route path="/u/:username" element={<DetectivePage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/expedientes" element={<ExpedientesPage />} />
              <Route path="/expedientes/:dossierId" element={<ExpedienteReaderPage />} />
              <Route path="/eventos" element={<EventsPage />} />
              <Route path="/misiones" element={<MissionsPage />} />
              <Route path="/evidencias" element={<EvidencePage />} />
              <Route path="/identidad" element={<IdentityPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
