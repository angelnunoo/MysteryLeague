import type { ReactNode } from 'react'
import { cn } from '../lib/format'

const LOOKS: Record<string, { wash: string; ink: string }> = {
  lens: { wash: '#2a2118', ink: '#e4c27a' },
  seal: { wash: '#1d2430', ink: '#d5dde8' },
  coat: { wash: '#2a1720', ink: '#e7b4c0' },
  raven: { wash: '#172028', ink: '#9fd7d1' },
  key: { wash: '#241c12', ink: '#f0d7a2' },
  crown: { wash: '#2c220f', ink: '#f3e2ae' },
}

export const AVATARS = [
  { id: 'lens', name: 'Lupa' },
  { id: 'seal', name: 'Lacre' },
  { id: 'coat', name: 'Abrigo' },
  { id: 'raven', name: 'Cuervo' },
  { id: 'key', name: 'Llave' },
  { id: 'crown', name: 'Placa' },
]

function Mark({ id }: { id: string }) {
  if (id === 'seal') {
    return <path d="M24 18h16v8H24zM20 30h24v16H20z" />
  }
  if (id === 'coat') {
    return <path d="M32 14l14 10v22H18V24z" />
  }
  if (id === 'raven') {
    return <path d="M18 34c8-14 22-14 28 0-8 4-20 4-28 0zM30 28h4" />
  }
  if (id === 'key') {
    return <path d="M22 26a8 8 0 1 1 10 8l-2 2h-6v4h-4v4h-6V34z" />
  }
  if (id === 'crown') {
    return <path d="M16 40l6-16 10 10 10-10 6 16z" />
  }
  return (
    <>
      <circle cx="28" cy="28" r="10" fill="none" strokeWidth="3" />
      <path d="M35 35l8 8" />
    </>
  )
}

export function Avatar({ id, className }: { id: string; className?: string }) {
  const look = LOOKS[id] ?? LOOKS.lens
  return (
    <svg viewBox="0 0 64 64" className={cn('h-full w-full', className)} aria-hidden="true">
      <rect width="64" height="64" rx="22" fill={look.wash} />
      <g fill="none" stroke={look.ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <Mark id={id} />
      </g>
    </svg>
  )
}

export function LevelRing({
  progress,
  children,
  size = 92,
}: {
  progress: number
  children: ReactNode
  size?: number
}) {
  const stroke = 3
  const radius = (size - stroke) / 2 - 1
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(228,194,122,0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e4c27a"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-[7px] overflow-hidden rounded-[22px]">{children}</div>
    </div>
  )
}
