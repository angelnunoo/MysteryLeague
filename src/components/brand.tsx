export function Crest({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="34" cy="34" r="18" fill="none" stroke="#E4C27A" strokeWidth="3" />
      <path d="M47 47 L66 66" stroke="#E4C27A" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 36h12M34 30v12" stroke="#E4C27A" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 70h56" stroke="#E4C27A" strokeWidth="1.5" opacity="0.7" />
    </svg>
  )
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <Crest className="mx-auto h-20 w-20" />
        <p className="mt-6 font-display text-5xl leading-none">MysteryLeague</p>
        <p className="mt-4 text-[11px] tracking-[0.42em] text-gold uppercase">Investiga. Descubre. Compite.</p>
      </div>
    </div>
  )
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <Crest className="h-9 w-9" />
      <div>
        <p className="font-display text-2xl leading-none">MysteryLeague</p>
        <p className="mt-1 text-[10px] tracking-[0.32em] text-gold uppercase">Investiga. Descubre. Compite.</p>
      </div>
    </div>
  )
}
