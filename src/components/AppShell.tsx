import { House, Library, Trophy, UserRound, Users } from 'lucide-react'
import { NavLink, Outlet, useMatch } from 'react-router-dom'
import { useSocial } from '../context/SocialContext'
import { cn } from '../lib/format'

const LINKS = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/biblioteca', label: 'Casos', icon: Library, end: false },
  { to: '/liga', label: 'Liga', icon: Trophy, end: false },
  { to: '/social', label: 'Social', icon: Users, end: false },
  { to: '/perfil', label: 'Perfil', icon: UserRound, end: false },
]

export function AppShell() {
  const playing = useMatch('/casos/:caseId')
  const chat = useMatch('/social/chat/:friendId')
  const dossier = useMatch('/expedientes/:dossierId')
  const hideNav = Boolean(playing || chat || dossier)
  const { notices } = useSocial()
  return (
    <>
      <div className={hideNav ? '' : 'pb-28'}>
        <Outlet />
      </div>
      {hideNav ? null : (
        <nav
          className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10 bg-[#0c0b12]/90 px-2 pt-2 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(0.55rem + env(safe-area-inset-bottom))' }}
          aria-label="Principal"
        >
          <ul className="grid grid-cols-5">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] tracking-wide',
                      isActive ? 'text-gold' : 'text-muted',
                    )
                  }
                >
                  <span className="relative">
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                    {link.to === '/social' && notices.length > 0 ? (
                      <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-crimson px-1 text-[9px] text-white">
                        {notices.length > 9 ? '9+' : notices.length}
                      </span>
                    ) : null}
                  </span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
