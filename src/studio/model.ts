import type { MysteryCase } from '../types'

export interface CaseBrief {
  prompt: string
  level: number
  durationMinutes: number
}

export interface ValidationIssue {
  level: 'error' | 'aviso'
  message: string
}

export interface ValidationReport {
  ok: boolean
  issues: ValidationIssue[]
}

/** Un modelo de IA debe devolver un MysteryCase con esta misma forma. */
export interface CaseModel {
  generate(brief: CaseBrief): Promise<MysteryCase>
}

const NAMES = [
  ['Irene Soler', 'irene', 'Archivista'],
  ['Mateo Quinn', 'mateo', 'Contable'],
  ['Nuria Bel', 'nuria', 'Cantante'],
] as const

const PLACES = ['el archivo de los sótanos', 'el camerino norte', 'el vagón correo', 'la sacristía cerrada']
const OBJECTS = ['un sello de lacre', 'una llave sin número', 'un vaso con poso dulce', 'un horario tachado']

function hash(text: string): number {
  let value = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function pick<T>(items: readonly T[], seed: number, shift: number): T {
  return items[(seed + shift) % items.length] as T
}

export const localCaseModel: CaseModel = {
  async generate(brief) {
    const seed = hash(brief.prompt.trim().toLowerCase() || 'mystery')
    const place = pick(PLACES, seed, 1)
    const object = pick(OBJECTS, seed, 3)
    const culprit = NAMES[seed % NAMES.length] ?? NAMES[0]
    const others = NAMES.filter((person) => person[1] !== culprit[1])
    const level = Math.min(50, Math.max(1, Math.round(brief.level) || 1))
    const minutes = Math.min(90, Math.max(8, Math.round(brief.durationMinutes) || 20))
    const type = minutes <= 10 ? 'rapido' : minutes <= 20 ? 'normal' : minutes <= 35 ? 'complejo' : 'expediente'
    const id = `gen-${seed.toString(16)}`
    const titleSeed = brief.prompt.trim().split(/\s+/).slice(0, 4).join(' ')
    const title = titleSeed.length >= 8 ? titleSeed : `El silencio de ${place}`

    return {
      id,
      title,
      subtitle: `Generado para nivel ${level}. Una sola mano encaja.`,
      type,
      location: place,
      year: '1928',
      cover: 'radial-gradient(circle at 80% 0%, #3a2430 0%, #120e16 46%, #07060a 80%)',
      emblem: 'folder',
      baseXp: 80 + level * 8,
      baseCoins: 20 + level * 2,
      parSeconds: minutes * 60,
      synopsis: `En ${place} aparece ${object}. Tres personas estuvieron a solas con él. Solo una pudo usarlo.`,
      story: [
        `El aviso llega de madrugada. En ${place} han encontrado ${object} junto a un cuerpo que todavía conserva el calor.`,
        `${others[0][0]} dice que se marchó antes. ${others[1][0]} dice que no entró. ${culprit[0]} admite haber estado, pero niega haber tocado nada.`,
        `El objeto solo funciona una vez. Quien lo usó dejó una marca que no se puede repetir. La hora del reloj de la sala no coincide con la del pasillo.`,
      ],
      epilogue: `${culprit[0]} esperó a que los otros dos se cruzaran en la puerta. Usó ${object}, cerró por dentro y salió por el registro que solo el personal conoce.`,
      suspects: [culprit, ...others].map(([name, personId, role], index) => ({
        id: personId,
        name,
        role,
        age: 28 + ((seed + index * 5) % 20),
        summary: index === 0 ? `Conoce ${place} mejor que nadie.` : 'Tiene una coartada que depende de otro testigo.',
        alibi: index === 0 ? 'Dice que estuvo en el pasillo, sin testigos.' : 'Lo vieron al otro lado de la puerta, un minuto tarde.',
      })),
      evidence: [
        {
          id: 'marca',
          title: 'La marca única',
          detail: `${object} solo pudo usarlo una persona. La marca corresponde a quien conoce el cierre.`,
          tag: 'decisiva',
        },
        {
          id: 'puerta',
          title: 'Puerta del otro',
          detail: `${others[0][0]} quedó al otro lado cuando el cierre sonó.`,
          tag: 'descargo',
        },
        {
          id: 'reloj',
          title: 'Reloj del pasillo',
          detail: `${others[1][0]} está en el pasillo cuando el reloj de la sala ya se ha parado.`,
          tag: 'descargo',
        },
      ],
      testimonies: [
        {
          id: 't1',
          suspectId: culprit[1],
          quote: 'Entré, miré y me fui. No toqué nada.',
          note: 'Admite presencia. Niega el objeto.',
        },
        {
          id: 't2',
          suspectId: others[0][1],
          quote: 'Oí el cierre desde fuera.',
          note: 'Lo sitúa fuera en el momento decisivo.',
        },
        {
          id: 't3',
          suspectId: others[1][1],
          quote: 'El reloj del pasillo aún andaba cuando yo pasé.',
          note: 'Su hora no coincide con la sala.',
        },
      ],
      timeline: [
        { id: 'entra', time: '21:10', text: 'Alguien entra y cierra.' },
        { id: 'marca', time: '21:14', text: 'El objeto se usa una sola vez.' },
        { id: 'sale', time: '21:18', text: 'La puerta vuelve a abrirse desde dentro.' },
      ],
      hints: [
        'El objeto no se puede usar dos veces.',
        'Dos coartadas dependen del reloj. Solo una sala está parada.',
        'Quien admite haber entrado es el único que conoce el cierre.',
      ],
      motives: [
        { id: 'contrato', label: 'Impedir una firma' },
        { id: 'deuda', label: 'Cobrar una deuda vieja' },
        { id: 'celos', label: 'Una escena de celos' },
      ],
      methods: [
        { id: 'objeto', label: 'El objeto de una sola vez' },
        { id: 'veneno', label: 'Un veneno lento' },
        { id: 'golpe', label: 'Un golpe a ciegas' },
      ],
      solution: {
        culpritId: culprit[1],
        motiveId: 'contrato',
        methodId: 'objeto',
        sequence: ['entra', 'marca', 'sale'],
      },
    }
  },
}
