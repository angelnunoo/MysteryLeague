export type ShopKind = 'marco' | 'avatar' | 'fondo' | 'tarjeta' | 'tema' | 'titulo'

export type ShopTier = 'basico' | 'epico' | 'legendario'

export interface ShopItem {
  id: string
  kind: ShopKind
  name: string
  description: string
  price: number
  swatch: string
  tier?: ShopTier
  eventId?: string
}

export const SHOP: ShopItem[] = [
  { id: 'marco-bruma', kind: 'marco', name: 'Marco de bruma', description: 'Un filo fino para empezar la placa.', price: 20, swatch: '#c8bba8', tier: 'basico' },
  { id: 'marco-oro', kind: 'marco', name: 'Marco de oro', description: 'Un aro de placa para el retrato.', price: 30, swatch: '#e4c27a', tier: 'basico' },
  { id: 'marco-noche', kind: 'marco', name: 'Marco de humo', description: 'El retrato se hunde en negro.', price: 30, swatch: '#9aa4b2', tier: 'basico' },
  { id: 'marco-epico', kind: 'marco', name: 'Marco del claustro', description: 'Piedra negra y un hilo de carmín.', price: 60, swatch: '#8a3d52', tier: 'epico' },
  { id: 'marco-leyenda', kind: 'marco', name: 'Marco de Ravenhill', description: 'Oro viejo. Solo lo lleva quien insiste.', price: 120, swatch: '#f6e7c1', tier: 'legendario' },
  { id: 'avatar-lupa', kind: 'avatar', name: 'Lupa', description: 'La mirada de archivo. Ya es tuya.', price: 0, swatch: '#e4c27a' },
  { id: 'avatar-cuervo', kind: 'avatar', name: 'Cuervo carmesí', description: 'Un ave de otro distrito.', price: 40, swatch: '#e11d48' },
  { id: 'fondo-anden', kind: 'fondo', name: 'Andén', description: 'Vapor y farol al fondo del cuartel.', price: 35, swatch: '#6a4a28' },
  { id: 'fondo-archivo', kind: 'fondo', name: 'Archivo verde', description: 'Lámparas bajas sobre el fieltro.', price: 35, swatch: '#1d3a32' },
  { id: 'fondo-ciudad', kind: 'fondo', name: 'Ciudad nocturna', description: 'Azoteas, lluvia y una ventana encendida.', price: 40, swatch: '#1a2744' },
  { id: 'fondo-oficina', kind: 'fondo', name: 'Oficina de detective', description: 'Persiana, humo y un flexo.', price: 40, swatch: '#3a2a18' },
  { id: 'fondo-mansion', kind: 'fondo', name: 'Mansión misteriosa', description: 'Escalera, retratos y una vela.', price: 55, swatch: '#3a1830' },
  { id: 'fondo-laboratorio', kind: 'fondo', name: 'Laboratorio forense', description: 'Vidrio, verde y silencio.', price: 55, swatch: '#12352e' },
  { id: 'fondo-biblioteca', kind: 'fondo', name: 'Biblioteca antigua', description: 'Estanterías que no acaban.', price: 55, swatch: '#4a3018' },
  { id: 'tarjeta-clasica', kind: 'tarjeta', name: 'Tarjeta clásica', description: 'Cartulina oscura, filo de oro.', price: 0, swatch: '#14121c' },
  { id: 'tarjeta-opera', kind: 'tarjeta', name: 'Tarjeta de ópera', description: 'Carmín y letra grande.', price: 45, swatch: '#6a2438' },
  { id: 'tarjeta-noir', kind: 'tarjeta', name: 'Tarjeta noir', description: 'Contraste alto, casi un fotograma.', price: 45, swatch: '#10141c' },
  { id: 'tema-noche', kind: 'tema', name: 'Noche de archivo', description: 'El tema de la casa.', price: 0, swatch: '#07060a' },
  { id: 'tema-carmesi', kind: 'tema', name: 'Carmesí', description: 'La ciudad se tiñe de telón.', price: 50, swatch: '#e7b4c0' },
  { id: 'titulo-novato', kind: 'titulo', name: 'Detective Novato', description: 'El primer nombre de la placa.', price: 0, swatch: '#a3988c' },
  { id: 'titulo-coartadas', kind: 'titulo', name: 'Maestro de las Coartadas', description: 'Nadie te cuenta la misma hora dos veces.', price: 40, swatch: '#e4c27a' },
  { id: 'titulo-fantasma', kind: 'titulo', name: 'Inspector Fantasma', description: 'Entras en la sala y el rumor se calla.', price: 55, swatch: '#9aa4b2' },
  { id: 'titulo-secretos', kind: 'titulo', name: 'Cazador de Secretos', description: 'El margen del documento siempre miente.', price: 70, swatch: '#8a3d52' },
  { id: 'titulo-leyenda', kind: 'titulo', name: 'Leyenda del Misterio', description: 'El archivo ya te cita.', price: 120, swatch: '#f6e7c1', tier: 'legendario' },
  { id: 'marco-espectros', kind: 'marco', name: 'Marco de espectros', description: 'Solo durante la noche de Halloween.', price: 0, swatch: '#c46b1a', tier: 'epico', eventId: 'halloween' },
  { id: 'fondo-polo', kind: 'fondo', name: 'Nieve del polo', description: 'Un blanco que no es inocente.', price: 0, swatch: '#d7e4ef', tier: 'epico', eventId: 'navidad' },
  { id: 'tarjeta-crucero', kind: 'tarjeta', name: 'Tarjeta de cubierta', description: 'Sal y un sello de oro.', price: 0, swatch: '#1a4a62', tier: 'epico', eventId: 'verano' },
  { id: 'titulo-diamante', kind: 'titulo', name: 'Guardián del Diamante', description: 'Las doce campanadas te pertenecen.', price: 0, swatch: '#d7ecff', tier: 'legendario', eventId: 'ano-nuevo' },
  { id: 'marco-archivo', kind: 'marco', name: 'Marco del estreno', description: 'La primera noche del cuartel.', price: 0, swatch: '#e4c27a', tier: 'epico', eventId: 'estreno' },
]

export const AVATAR_OF: Record<string, string> = {
  'avatar-lupa': 'lens',
  'avatar-cuervo': 'raven',
}

export const KIND_LABEL: Record<ShopKind, string> = {
  marco: 'Marcos',
  avatar: 'Avatares',
  fondo: 'Fondos',
  tarjeta: 'Tarjetas',
  tema: 'Temas',
  titulo: 'Títulos',
}

export const TIER_LABEL: Record<ShopTier, string> = {
  basico: 'Básico',
  epico: 'Épico',
  legendario: 'Legendario',
}

export function frameRing(frame: string): string {
  if (frame === 'marco-oro' || frame === 'marco-archivo') return 'rounded-full ring-4 ring-gold shadow-[0_0_24px_rgba(228,194,122,0.45)]'
  if (frame === 'marco-noche' || frame === 'marco-bruma') return 'rounded-full ring-4 ring-white/25'
  if (frame === 'marco-epico' || frame === 'marco-espectros') return 'rounded-full ring-4 ring-crimson shadow-[0_0_24px_rgba(225,29,72,0.35)]'
  if (frame === 'marco-leyenda') return 'rounded-full ring-4 ring-[#f6e7c1] shadow-[0_0_28px_rgba(246,231,193,0.55)]'
  return ''
}
