import { Coins } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CREDITS_SHORT } from '../progress/currency'
import { formatNumber } from '../lib/format'

export function CreditChip({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const previous = useRef(amount)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (amount > previous.current) {
      setPulse(true)
      const timer = window.setTimeout(() => setPulse(false), 900)
      previous.current = amount
      return () => window.clearTimeout(timer)
    }
    previous.current = amount
  }, [amount])

  return (
    <span
      className={pulse ? 'credit-pop inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-xs' : 'inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs'}
      title={CREDITS_SHORT}
    >
      <Coins className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
      {compact ? null : <span className="text-[10px] tracking-[0.14em] text-gold uppercase">Créditos</span>}
      <span className="font-semibold">{formatNumber(amount)}</span>
    </span>
  )
}
