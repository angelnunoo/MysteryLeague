import { useState } from 'react'
import { AVATAR_OF, KIND_LABEL, SHOP, TIER_LABEL, type ShopKind } from '../game/shop'
import { CreditChip } from '../components/CreditChip'
import { useAuth } from '../context/AuthContext'
import { useCosmetics } from '../context/CosmeticsContext'
import { CREDITS_NAME } from '../progress/currency'

const KINDS: ShopKind[] = ['marco', 'avatar', 'fondo', 'tarjeta', 'tema', 'titulo']

export function ShopPage() {
  const { profile } = useAuth()
  const { wardrobe, buy } = useCosmetics()
  const [kind, setKind] = useState<ShopKind>('marco')
  const [error, setError] = useState<string | null>(null)
  if (!profile) return null
  const items = SHOP.filter((item) => item.kind === kind)

  return (
    <main className="px-4 pt-6 pb-10" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      <p className="text-[10px] tracking-[0.32em] text-gold uppercase">{CREDITS_NAME}</p>
      <div className="mt-1 flex items-end justify-between">
        <h1 className="font-display text-5xl leading-none">Tienda</h1>
        <CreditChip amount={profile.coins} />
      </div>
      <div className="rail mt-5 flex gap-2 overflow-x-auto">
        {KINDS.map((item) => (
          <button key={item} type="button" onClick={() => setKind(item)} className={kind === item ? 'rounded-full bg-gold px-4 py-2 text-xs font-semibold text-void' : 'rounded-full border border-line px-4 py-2 text-xs'}>
            {KIND_LABEL[item]}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const owned = wardrobe.owned.includes(item.id)
          const equipped =
            (item.kind === 'marco' && wardrobe.frame === item.id) ||
            (item.kind === 'fondo' && wardrobe.background === item.id) ||
            (item.kind === 'tarjeta' && wardrobe.card === item.id) ||
            (item.kind === 'tema' && wardrobe.theme === item.id) ||
            (item.kind === 'titulo' && wardrobe.title === item.id) ||
            (item.kind === 'avatar' && owned && profile.avatarId === (AVATAR_OF[item.id] ?? 'lens'))
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-[28px] border border-line bg-panel p-3">
              <span className="h-14 w-14 shrink-0 rounded-2xl" style={{ background: item.swatch }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{item.name}</span>
                <span className="mt-1 block text-xs text-muted">
                  {item.tier ? `${TIER_LABEL[item.tier]} · ` : ''}
                  {item.eventId ? 'Exclusivo de evento. ' : ''}
                  {item.description}
                </span>
              </span>
              <button
                type="button"
                className="min-h-10 rounded-full bg-gold px-3 text-xs font-semibold text-void disabled:opacity-50"
                disabled={equipped || (Boolean(item.eventId) && !owned)}
                onClick={() => {
                  setError(null)
                  void buy(item).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo comprar.'))
                }}
              >
                {equipped ? 'Puesto' : owned ? 'Poner' : item.eventId ? 'Evento' : item.price === 0 ? 'Tomar' : `${item.price}`}
              </button>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
