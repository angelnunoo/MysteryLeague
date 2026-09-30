import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AVATAR_OF, SHOP, type ShopItem } from '../game/shop'
import { loadWardrobe, saveWardrobe, type Wardrobe } from '../services/cosmeticsStore'
import type { Profile } from '../types'
import { useAuth } from './AuthContext'

interface CosmeticsValue {
  wardrobe: Wardrobe
  buy: (item: ShopItem) => Promise<void>
  equip: (item: ShopItem) => Promise<void>
  grant: (itemId: string) => Promise<void>
}

const CosmeticsContext = createContext<CosmeticsValue | null>(null)

export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const { user, profile, saveProfile } = useAuth()
  const [wardrobe, setWardrobe] = useState<Wardrobe>(loadWardrobe('local'))
  const wardrobeRef = useRef(wardrobe)
  wardrobeRef.current = wardrobe

  useEffect(() => {
    if (!user) return
    setWardrobe(loadWardrobe(user.id))
  }, [user])

  const persist = useCallback(
    async (next: Wardrobe) => {
      if (!user) return
      setWardrobe(next)
      await saveWardrobe(user.id, next)
    },
    [user],
  )

  const buy = useCallback(
    async (item: ShopItem) => {
      if (!user || !profile) return
      if (item.eventId && !wardrobe.owned.includes(item.id)) {
        throw new Error('Este objeto solo se desbloquea en su evento.')
      }
      if (wardrobe.owned.includes(item.id)) {
        await equipOwned(item, wardrobe, profile, saveProfile, persist)
        return
      }
      if (profile.coins < item.price) throw new Error('No tienes créditos suficientes.')
      const next = applyEquip({ ...wardrobe, owned: [...wardrobe.owned, item.id] }, item)
      const avatarId = AVATAR_OF[item.id]
      await saveProfile({
        ...profile,
        coins: profile.coins - item.price,
        avatarId: avatarId ?? profile.avatarId,
      })
      await persist(next)
    },
    [persist, profile, saveProfile, user, wardrobe],
  )

  const equip = useCallback(
    async (item: ShopItem) => {
      if (!profile) return
      if (!wardrobe.owned.includes(item.id)) throw new Error('Aún no está en tu colección.')
      await equipOwned(item, wardrobe, profile, saveProfile, persist)
    },
    [persist, profile, saveProfile, wardrobe],
  )

  const grant = useCallback(
    async (itemId: string) => {
      if (!user) return
      const current = wardrobeRef.current
      if (current.owned.includes(itemId)) return
      const next = { ...current, owned: [...current.owned, itemId] }
      wardrobeRef.current = next
      setWardrobe(next)
      await saveWardrobe(user.id, next)
    },
    [user],
  )

  const value = useMemo(() => ({ wardrobe, buy, equip, grant }), [buy, equip, grant, wardrobe])
  return <CosmeticsContext.Provider value={value}>{children}</CosmeticsContext.Provider>
}

async function equipOwned(
  item: ShopItem,
  wardrobe: Wardrobe,
  profile: Profile,
  saveProfile: (profile: Profile) => Promise<void>,
  persist: (next: Wardrobe) => Promise<void>,
) {
  const next = applyEquip(wardrobe, item)
  await persist(next)
  const avatarId = AVATAR_OF[item.id]
  if (avatarId && avatarId !== profile.avatarId) await saveProfile({ ...profile, avatarId })
}

function applyEquip(wardrobe: Wardrobe, item: ShopItem): Wardrobe {
  if (item.kind === 'marco') return { ...wardrobe, frame: item.id }
  if (item.kind === 'fondo') return { ...wardrobe, background: item.id }
  if (item.kind === 'tarjeta') return { ...wardrobe, card: item.id }
  if (item.kind === 'tema') return { ...wardrobe, theme: item.id }
  if (item.kind === 'titulo') return { ...wardrobe, title: item.id }
  return wardrobe
}

export function useCosmetics() {
  const value = useContext(CosmeticsContext)
  if (!value) throw new Error('useCosmetics debe usarse dentro de CosmeticsProvider.')
  return value
}

export function itemById(id: string): ShopItem | undefined {
  return SHOP.find((item) => item.id === id)
}
