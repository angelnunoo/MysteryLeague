import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Crest } from '../components/brand'
import { Button, Field } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getRememberMe } from '../lib/storage'
import { validateEmail, validatePassword, validateUsername } from '../lib/format'

function AuthFrame({
  title,
  lede,
  children,
}: {
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col justify-end px-5 pt-16 pb-8">
      <Crest className="h-14 w-14" />
      <p className="mt-6 text-[11px] tracking-[0.38em] text-gold uppercase">Investiga. Descubre. Compite.</p>
      <h1 className="mt-3 font-display text-5xl leading-none">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{lede}</p>
      <div className="mt-8">{children}</div>
    </main>
  )
}

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(getRememberMe)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setError(emailError ?? passwordError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password, remember)
      navigate('/')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="El cuartel está cerrado." lede="Entra con tu expediente. Sin sesión no hay casos, ni liga, ni libreta.">
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {notice ? <p className="text-sm text-gold">{notice}</p> : null}
        {!configured ? (
          <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            Archivo local en este dispositivo. Añade las claves de Supabase para sincronizar la liga.
          </p>
        ) : null}
        <Field label="Correo" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label className="flex min-h-11 items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            className="h-5 w-5 accent-gold"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Recordarme en este dispositivo
        </label>
        {error ? (
          <p className="text-sm text-crimson" role="alert">
            {error}
          </p>
        ) : null}
        <Button full type="submit" disabled={busy}>
          {busy ? 'Abriendo…' : 'Entrar en el cuartel'}
        </Button>
      </form>
      <p className="mt-6 flex justify-between text-sm">
        <Link className="text-gold" to="/registro">
          Crear expediente
        </Link>
        <Link className="text-muted" to="/recuperar">
          He olvidado la contraseña
        </Link>
      </p>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const usernameError = validateUsername(username)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (usernameError || emailError || passwordError) {
      setError(usernameError ?? emailError ?? passwordError)
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const status = await signUp({ username, email, password })
      if (status === 'confirm_email') {
        setNotice('Revisa tu correo para confirmar el expediente. Después podrás entrar.')
        return
      }
      navigate('/onboarding')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el expediente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Abre tu expediente." lede="Empiezas en nivel 1, con 0 XP, rango Aprendiz, cero casos y la racha en blanco.">
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Nombre de usuario" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <Field label="Correo" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Field label="Contraseña" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        {error ? (
          <p className="text-sm text-crimson" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? <p className="text-sm text-gold">{notice}</p> : null}
        <Button full type="submit" disabled={busy}>
          {busy ? 'Creando…' : 'Crear expediente'}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link className="text-gold" to="/login">
          Ya tengo expediente
        </Link>
      </p>
    </AuthFrame>
  )
}

export function ForgotPage() {
  const { requestPasswordReset, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localReset, setLocalReset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const mode = await requestPasswordReset(email)
      if (mode === 'local') {
        setLocalReset(true)
        setNotice('Este archivo es local. Elige una contraseña nueva para ese correo.')
      } else {
        setNotice('Te hemos enviado un enlace para elegir una contraseña nueva.')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar el enlace.')
    } finally {
      setBusy(false)
    }
  }

  async function onLocalReset(event: FormEvent) {
    event.preventDefault()
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword({ email, password })
      navigate('/login', { state: { notice: 'Contraseña actualizada. Ya puedes entrar.' } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Recupera el acceso." lede="Te devolvemos al cuartel sin abrir los expedientes de nadie más.">
      {localReset ? (
        <form className="space-y-4" onSubmit={(event) => void onLocalReset(event)}>
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? (
            <p className="text-sm text-crimson" role="alert">
              {error}
            </p>
          ) : null}
          <Button full type="submit" disabled={busy}>
            Guardar contraseña
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Correo" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {error ? (
            <p className="text-sm text-crimson" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <Button full type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link className="text-gold" to="/login">
          Volver a entrar
        </Link>
      </p>
    </AuthFrame>
  )
}

export function ResetPage() {
  const { updatePassword, recovery, user } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ready = recovery || Boolean(user)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword({ password })
      navigate('/')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      title="Nueva contraseña."
      lede={ready ? 'Elige una clave que no hayas usado en otro archivo.' : 'Abre el enlace del correo para continuar.'}
    >
      {ready ? (
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? (
            <p className="text-sm text-crimson" role="alert">
              {error}
            </p>
          ) : null}
          <Button full type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      ) : (
        <Link className="text-gold" to="/recuperar">
          Pedir un enlace nuevo
        </Link>
      )}
    </AuthFrame>
  )
}
