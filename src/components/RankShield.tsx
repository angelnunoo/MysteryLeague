import { COMPETITIVE_RANKS, rankProgress, type CompetitiveRankName } from '../progress/competitive'

const TONE: Record<CompetitiveRankName, string> = {
  Bronce: '#a97142',
  Plata: '#d5dde8',
  Oro: '#e4c27a',
  Platino: '#7ec8c3',
  Diamante: '#d7ecff',
  Maestro: '#e7b4c0',
  Leyenda: '#f6e7c1',
}

export function RankShield({ rank, points, large = false }: { rank: CompetitiveRankName; points: number; large?: boolean }) {
  const tone = TONE[rank]
  const progress = rankProgress(points)
  const size = large ? 92 : 64
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 72" width={size} height={size + 8} aria-hidden="true" className="rank-rise shrink-0">
        <path d="M32 4l22 8v22c0 16-10 28-22 34C20 62 10 50 10 34V12z" fill="#120e16" stroke={tone} strokeWidth="2" />
        <path d="M32 14l12 4v12c0 8-5 15-12 18-7-3-12-10-12-18V18z" fill={tone} opacity="0.9" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[0.22em] text-muted uppercase">Rango competitivo</p>
        <p className="font-display text-3xl leading-none" style={{ color: tone }}>
          {rank}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${Math.max(6, progress.ratio * 100)}%`, background: tone }} />
        </div>
        <p className="mt-1 text-[10px] text-muted">
          {progress.next ? `${progress.into} / ${progress.need} hacia ${progress.next}` : 'Cima de la liga'}
        </p>
      </div>
    </div>
  )
}

export function RankLadder({ current }: { current: CompetitiveRankName }) {
  const index = COMPETITIVE_RANKS.indexOf(current)
  return (
    <ol className="grid grid-cols-7 gap-1">
      {COMPETITIVE_RANKS.map((rank, step) => (
        <li key={rank} className="text-center">
          <span
            className="mx-auto block h-2 rounded-full"
            style={{ background: step <= index ? TONE[rank] : 'rgba(255,255,255,0.08)' }}
          />
          <span className={step <= index ? 'mt-1 block text-[8px] text-ink' : 'mt-1 block text-[8px] text-muted'}>
            {rank.slice(0, 3)}
          </span>
        </li>
      ))}
    </ol>
  )
}
