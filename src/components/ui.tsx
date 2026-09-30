import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/format'

export function Button({
  variant = 'gold',
  full = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'ghost' | 'danger' | 'panel'
  full?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'gold' && 'bg-gold text-void shadow-[0_8px_30px_rgba(228,194,122,0.18)]',
        variant === 'ghost' && 'border border-line bg-transparent text-ink',
        variant === 'danger' && 'bg-crimson text-white',
        variant === 'panel' && 'border border-line bg-panel text-ink',
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  const id = props.id ?? props.name
  return (
    <label className="block text-left" htmlFor={id}>
      <span className="mb-2 block text-xs tracking-[0.18em] text-muted uppercase">{label}</span>
      <input
        id={id}
        className="min-h-12 w-full rounded-2xl border border-line bg-panel px-4 text-base text-ink outline-none placeholder:text-muted/70"
        {...props}
      />
      {error ? (
        <span className="mt-2 block text-sm text-crimson" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = props.id ?? props.name
  return (
    <label className="block text-left" htmlFor={id}>
      <span className="mb-2 block text-xs tracking-[0.18em] text-muted uppercase">{label}</span>
      <textarea
        id={id}
        className="min-h-32 w-full resize-none rounded-2xl border border-line bg-panel px-4 py-3 text-base text-ink outline-none placeholder:text-muted/70"
        {...props}
      />
    </label>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-3xl border border-line bg-panel/90 p-4', className)}>{children}</section>
  )
}
