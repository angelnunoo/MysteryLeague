import { Anchor, Clock, Drama, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CASE_TYPE_META } from '../data/cases'
import type { CaseRun, MysteryCase } from '../types'

function Emblem({ name }: { name: MysteryCase['emblem'] }) {
  const className = 'h-8 w-8 text-gold'
  if (name === 'clock') return <Clock className={className} />
  if (name === 'mask') return <Drama className={className} />
  if (name === 'anchor') return <Anchor className={className} />
  return <FolderOpen className={className} />
}

export function CaseCard({
  mystery,
  run,
  compact = false,
}: {
  mystery: MysteryCase
  run?: CaseRun
  compact?: boolean
}) {
  const meta = CASE_TYPE_META[mystery.type]
  const label = !run ? 'Sin abrir' : run.status === 'in_progress' ? 'En curso' : run.culpritCorrect ? 'Resuelto' : 'Incompleto'
  return (
    <Link
      to={`/casos/${mystery.id}`}
      className={compact ? 'block w-[78%] shrink-0 snap-start' : 'block'}
    >
      <article
        className="relative overflow-hidden rounded-[28px] border border-white/10 p-4"
        style={{ background: mystery.cover, minHeight: compact ? 210 : 240 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="relative flex h-full min-h-[190px] flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="rounded-full border border-gold/40 bg-black/30 px-3 py-1 text-[10px] tracking-[0.22em] text-gold uppercase">
              {meta.label}
            </span>
            <Emblem name={mystery.emblem} />
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-white/70 uppercase">{label}</p>
            <h3 className="mt-1 font-display text-4xl leading-none text-white">{mystery.title}</h3>
            <p className="mt-2 text-sm text-white/75">{mystery.subtitle}</p>
          </div>
        </div>
      </article>
    </Link>
  )
}
