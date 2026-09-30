import type { MysteryCase } from '../types'

function build(input: {
  id: string
  title: string
  subtitle: string
  location: string
  year: string
  cover: string
  emblem: MysteryCase['emblem']
  synopsis: string
  story: string[]
  epilogue: string
  hints: string[]
  culpritId: string
  suspects: MysteryCase['suspects']
  evidence: MysteryCase['evidence']
  testimonies: MysteryCase['testimonies']
  timeline: MysteryCase['timeline']
  motives: MysteryCase['motives']
  methods: MysteryCase['methods']
  motiveId: string
  methodId: string
  sequence: string[]
}): MysteryCase {
  const { culpritId, motiveId, methodId, sequence, ...rest } = input
  return {
    type: 'rapido',
    baseXp: 140,
    baseCoins: 50,
    parSeconds: 480,
    ...rest,
    solution: { culpritId, motiveId, methodId, sequence },
  }
}

export const EVENT_CASES: MysteryCase[] = [
  build({
    id: 'evento-archivo',
    title: 'La lámpara del sótano',
    subtitle: 'Noche del archivo',
    location: 'Cuartel de MysteryLeague',
    year: '2026',
    cover: 'linear-gradient(145deg,#2a2114,#07060a)',
    emblem: 'folder',
    synopsis: 'Alguien encendió la lámpara del sótano después del cierre. El fichero de estreno no está donde debía.',
    story: [
      'El cuartel cerró a las diez. A las once la lámpara del sótano seguía caliente.',
      'El fichero de estreno, el que aún no tiene copia, apareció en la mesa de la forense con una página arrancada.',
    ],
    epilogue: 'La página no se perdió. Se escondió para que el estreno empezara con una mentira.',
    hints: ['La lámpara solo se enciende con la llave del archivero.', 'La forense no baja al sótano.'],
    culpritId: 'nilo',
    suspects: [
      { id: 'nilo', name: 'Nilo Serra', role: 'Archivero', age: 41, summary: 'Guarda la llave del sótano.', alibi: 'Dice que se fue a las diez.' },
      { id: 'vera', name: 'Vera Llull', role: 'Forense', age: 36, summary: 'Encontró el fichero en su mesa.', alibi: 'Estaba en el laboratorio, sin llave.' },
      { id: 'otelo', name: 'Otelo Marín', role: 'Conserje', age: 58, summary: 'Cierra las luces del patio.', alibi: 'Vio la lámpara y no bajó.' },
    ],
    evidence: [
      { id: 'lampara', title: 'Lámpara tibia', detail: 'El cristal aún quema a las once.', tag: 'decisiva' },
      { id: 'llave', title: 'Copia de la llave', detail: 'Solo Nilo tiene copia. El conserje usa otra puerta.', tag: 'acceso' },
      { id: 'pagina', title: 'Página arrancada', detail: 'El corte es limpio, de cúter de archivo.', tag: 'documento' },
    ],
    testimonies: [
      { id: 't1', suspectId: 'nilo', quote: 'Dejé la llave en el cajón.', note: 'El cajón estaba cerrado por dentro.' },
      { id: 't2', suspectId: 'vera', quote: 'El fichero ya estaba en mi mesa.', note: 'Ella no baja al sótano.' },
      { id: 't3', suspectId: 'otelo', quote: 'Vi luz y seguí con el patio.', note: 'No tiene la llave del sótano.' },
    ],
    timeline: [
      { id: 'cierra', time: '22:00', text: 'El cuartel cierra.' },
      { id: 'baja', time: '22:20', text: 'Alguien baja al sótano.' },
      { id: 'arranca', time: '22:40', text: 'Arrancan la página del fichero.' },
      { id: 'mesa', time: '23:00', text: 'El fichero aparece en la mesa de Vera.' },
    ],
    motives: [
      { id: 'estreno', label: 'Cambiar el relato del estreno' },
      { id: 'seguro', label: 'Cobrar un seguro' },
      { id: 'celos', label: 'Humillar a la forense' },
    ],
    methods: [
      { id: 'llave', label: 'Entrar con la llave del archivero y dejar el fichero' },
      { id: 'forzar', label: 'Forzar la puerta del sótano' },
      { id: 'patio', label: 'Colarse por el patio' },
    ],
    motiveId: 'estreno',
    methodId: 'llave',
    sequence: ['cierra', 'baja', 'arranca', 'mesa'],
  }),
  build({
    id: 'evento-espectros',
    title: 'La máscara del campanario',
    subtitle: 'Noche de los espectros',
    location: 'Campanario de Santa Bruma',
    year: '1931',
    cover: 'linear-gradient(145deg,#3a2208,#120c08)',
    emblem: 'mask',
    synopsis: 'En la procesión sobra una máscara. El campanero no baja, pero alguien tocó las diez con las manos equivocadas.',
    story: [
      'La procesión dejó el campanario a oscuras. A las diez sonó una campanada de más.',
      'La máscara del santo apareció en el suelo, con cera negra en el borde.',
    ],
    epilogue: 'No había espectro. Había alguien que necesitaba que la calle mirara hacia arriba.',
    hints: ['La cera negra es del cirio del sacristán.', 'El campanero tiene las manos limpias.'],
    culpritId: 'sacristan',
    suspects: [
      { id: 'sacristan', name: 'Don Isidro', role: 'Sacristán', age: 63, summary: 'Enciende los cirios negros.', alibi: 'Dice que estaba en la nave.' },
      { id: 'campanero', name: 'Luz Campanero', role: 'Campanera', age: 29, summary: 'Toca las horas.', alibi: 'Bajó antes de las diez.' },
      { id: 'mascara', name: 'Rita Sol', role: 'Devota', age: 44, summary: 'Llevaba la máscara del santo.', alibi: 'La entregó al llegar.' },
    ],
    evidence: [
      { id: 'cera', title: 'Cera negra', detail: 'El mismo cirio que solo enciende el sacristán.', tag: 'decisiva' },
      { id: 'soga', title: 'Soga floja', detail: 'La campana se tocó a mano, no con el mecanismo.', tag: 'método' },
      { id: 'mascara-suelo', title: 'Máscara en el suelo', detail: 'Cayó desde el rellano, no desde la calle.', tag: 'lugar' },
    ],
    testimonies: [
      { id: 't1', suspectId: 'sacristan', quote: 'No subí.', note: 'La cera de su cirio está en la máscara.' },
      { id: 't2', suspectId: 'campanero', quote: 'La dejé en silencio.', note: 'Sus manos no tienen cera.' },
      { id: 't3', suspectId: 'mascara', quote: 'Entregué la máscara en la puerta.', note: 'Varias devotas la vieron hacerlo.' },
    ],
    timeline: [
      { id: 'entrega', time: '21:10', text: 'Rita entrega la máscara.' },
      { id: 'sube', time: '21:40', text: 'Alguien sube con un cirio negro.' },
      { id: 'toca', time: '22:00', text: 'Una campanada de más.' },
      { id: 'cae', time: '22:05', text: 'La máscara cae al rellano.' },
    ],
    motives: [
      { id: 'desvio', label: 'Desviar la procesión del callejón' },
      { id: 'fe', label: 'Probar un milagro' },
      { id: 'venganza', label: 'Asustar a la campanera' },
    ],
    methods: [
      { id: 'cirio', label: 'Subir con el cirio y tocar la campana a mano' },
      { id: 'mecanismo', label: 'Forzar el mecanismo del reloj' },
      { id: 'calle', label: 'Lanzar la máscara desde la calle' },
    ],
    motiveId: 'desvio',
    methodId: 'cirio',
    sequence: ['entrega', 'sube', 'toca', 'cae'],
  }),
  build({
    id: 'evento-polo',
    title: 'El sello del trineo',
    subtitle: 'Robo en el polo',
    location: 'Estación polar',
    year: '1954',
    cover: 'linear-gradient(145deg,#d7e4ef,#1a2744)',
    emblem: 'folder',
    synopsis: 'El sello de lacre del correo polar desaparece antes del último trineo. La nieve de la puerta no tiene huellas nuevas.',
    story: [
      'El sello debía salir con el trineo de las seis. A las cinco ya no estaba en la caja fuerte.',
      'Fuera, la nieve está intacta. Quien lo tomó no salió.',
    ],
    epilogue: 'El robo fue de interior. El frío solo sirvió de coartada.',
    hints: ['La nieve intacta descarta al guía.', 'El operador de radio tiene cera en el guante.'],
    culpritId: 'radio',
    suspects: [
      { id: 'radio', name: 'Kenzo Abe', role: 'Operador de radio', age: 34, summary: 'Duerme junto a la caja.', alibi: 'Dice que no la abrió.' },
      { id: 'guia', name: 'Hanna Voss', role: 'Guía', age: 47, summary: 'Prepara el trineo fuera.', alibi: 'La nieve no tiene sus huellas de vuelta.' },
      { id: 'medico', name: 'Dr. Pell', role: 'Médico', age: 52, summary: 'Revisa el botiquín.', alibi: 'Estaba con un paciente.' },
    ],
    evidence: [
      { id: 'guante', title: 'Cera en el guante', detail: 'El lacre rojo mancha el guante de Kenzo.', tag: 'decisiva' },
      { id: 'nieve', title: 'Nieve intacta', detail: 'Nadie entró ni salió después de las cuatro.', tag: 'coartada' },
      { id: 'caja', title: 'Caja sin forzar', detail: 'Se abrió con la combinación.', tag: 'acceso' },
    ],
    testimonies: [
      { id: 't1', suspectId: 'radio', quote: 'La combinación la sé, pero no la usé.', note: 'Su guante dice otra cosa.' },
      { id: 't2', suspectId: 'guia', quote: 'Estuve fuera todo el rato.', note: 'La nieve lo confirma.' },
      { id: 't3', suspectId: 'medico', quote: 'No me moví del catre.', note: 'El paciente lo recuerda.' },
    ],
    timeline: [
      { id: 'cierre', time: '16:00', text: 'Se cierra la estación.' },
      { id: 'abre', time: '16:40', text: 'Alguien abre la caja.' },
      { id: 'esconde', time: '17:10', text: 'El sello se esconde en la radio.' },
      { id: 'falta', time: '17:50', text: 'El correo nota la falta.' },
    ],
    motives: [
      { id: 'mensaje', label: 'Retener un mensaje del continente' },
      { id: 'venta', label: 'Vender el sello' },
      { id: 'broma', label: 'Gastar una broma al guía' },
    ],
    methods: [
      { id: 'combinacion', label: 'Abrir la caja con la combinación' },
      { id: 'fuerza', label: 'Forzar la caja' },
      { id: 'fuera', label: 'Entrar desde la nieve' },
    ],
    motiveId: 'mensaje',
    methodId: 'combinacion',
    sequence: ['cierre', 'abre', 'esconde', 'falta'],
  }),
  build({
    id: 'evento-crucero',
    title: 'El camarote 12',
    subtitle: 'Crucero imperial',
    location: 'Cubierta B',
    year: '1928',
    cover: 'linear-gradient(145deg,#0e3a4a,#071018)',
    emblem: 'anchor',
    synopsis: 'El pasajero del camarote 12 no baja a cenar. La puerta está cerrada por dentro y la portilla no abre del todo.',
    story: [
      'La cena de gala empieza sin el joyero del camarote 12.',
      'Dentro, la caja de las perlas está vacía y el pestillo interior sigue echado.',
    ],
    epilogue: 'El mar no se llevó las perlas. Las bajó alguien que ya tenía llave de servicio.',
    hints: ['El pestillo se puede cerrar desde fuera con el gancho de camarote.', 'La doncella lleva ese gancho.'],
    culpritId: 'doncella',
    suspects: [
      { id: 'doncella', name: 'Inés Mar', role: 'Camarera', age: 27, summary: 'Tiene el gancho de los pestillos.', alibi: 'Dice que servía en el comedor.' },
      { id: 'joyero', name: 'Paul Klein', role: 'Joyero', age: 50, summary: 'Dueño de las perlas.', alibi: 'Estaba dentro... o eso parece.' },
      { id: 'oficial', name: 'Teniente Roux', role: 'Oficial', age: 38, summary: 'Ronda la cubierta.', alibi: 'Firmó el parte a las ocho.' },
    ],
    evidence: [
      { id: 'gancho', title: 'Gancho de pestillo', detail: 'Cierra por dentro sin estar dentro.', tag: 'decisiva' },
      { id: 'perlas', title: 'Estuche vacío', detail: 'Las perlas caben en un bolsillo de servicio.', tag: 'botín' },
      { id: 'parte', title: 'Parte de cubierta', detail: 'El oficial no estuvo en el pasillo B.', tag: 'coartada' },
    ],
    testimonies: [
      { id: 't1', suspectId: 'doncella', quote: 'No entré en el 12.', note: 'Su gancho huele a aceite de pestillo.' },
      { id: 't2', suspectId: 'joyero', quote: 'Me dormí antes de la cena.', note: 'El vaso de la mesilla no se tocó.' },
      { id: 't3', suspectId: 'oficial', quote: 'Mi ronda no pasa por el pasillo B.', note: 'El parte coincide.' },
    ],
    timeline: [
      { id: 'cena', time: '20:00', text: 'Empieza la cena de gala.' },
      { id: 'entra', time: '20:15', text: 'Alguien entra con llave de servicio.' },
      { id: 'cierra', time: '20:20', text: 'El pestillo queda echado desde fuera.' },
      { id: 'falta', time: '21:00', text: 'El joyero no aparece.' },
    ],
    motives: [
      { id: 'perlas', label: 'Quedarse las perlas antes del puerto' },
      { id: 'deuda', label: 'Cobrar una deuda del joyero' },
      { id: 'accidente', label: 'Un descuido del servicio' },
    ],
    methods: [
      { id: 'gancho', label: 'Entrar con llave de servicio y cerrar el pestillo con el gancho' },
      { id: 'portilla', label: 'Entrar por la portilla' },
      { id: 'fuerza', label: 'Forzar la puerta' },
    ],
    motiveId: 'perlas',
    methodId: 'gancho',
    sequence: ['cena', 'entra', 'cierra', 'falta'],
  }),
  build({
    id: 'evento-diamante',
    title: 'El diamante de las doce',
    subtitle: 'Año nuevo',
    location: 'Salón del reloj',
    year: '1946',
    cover: 'linear-gradient(145deg,#102033,#d7ecff)',
    emblem: 'clock',
    synopsis: 'Cuando el reloj da las doce, el diamante del centro de mesa ya no está. Todos miraban el champán.',
    story: [
      'El brindis tapa el salón durante un minuto.',
      'Al volver la vista, el diamante falta y el reloj marca las doce y un segundo.',
    ],
    epilogue: 'No hizo falta apagar las luces. Bastó con que todo el mundo mirara el mismo sitio.',
    hints: ['El camarero de la bandeja pasa junto al centro de mesa.', 'El anfitrión no se mueve del estrado.'],
    culpritId: 'camarero',
    suspects: [
      { id: 'camarero', name: 'Leo Vidal', role: 'Camarero', age: 31, summary: 'Lleva la bandeja del brindis.', alibi: 'Dice que no soltó la bandeja.' },
      { id: 'anfitrion', name: 'Clara Hess', role: 'Anfitriona', age: 46, summary: 'Dueña del diamante.', alibi: 'Estaba en el estrado, a la vista.' },
      { id: 'relojero', name: 'Mateo Quinn', role: 'Relojero', age: 60, summary: 'Ajusta el mecanismo.', alibi: 'Estaba detrás del reloj.' },
    ],
    evidence: [
      { id: 'bandeja', title: 'Fondo de la bandeja', detail: 'Hay un doble fondo con tela de joyero.', tag: 'decisiva' },
      { id: 'estrado', title: 'Estrado iluminado', detail: 'Clara no pudo acercarse sin que la vieran.', tag: 'coartada' },
      { id: 'mecanismo', title: 'Mecanismo intacto', detail: 'El relojero no salió de la caja del reloj.', tag: 'lugar' },
    ],
    testimonies: [
      { id: 't1', suspectId: 'camarero', quote: 'La bandeja no se separó de mis manos.', note: 'El doble fondo no necesita soltarla.' },
      { id: 't2', suspectId: 'anfitrion', quote: 'Lo vi hasta el brindis.', note: 'Cien invitados la vieron en el estrado.' },
      { id: 't3', suspectId: 'relojero', quote: 'No abrí la puerta de la caja.', note: 'El polvo del mecanismo está sin huellas nuevas.' },
    ],
    timeline: [
      { id: 'brindis', time: '23:59', text: 'Empieza el brindis.' },
      { id: 'pasa', time: '00:00', text: 'La bandeja pasa junto al diamante.' },
      { id: 'falta', time: '00:01', text: 'El diamante ya no está.' },
      { id: 'sale', time: '00:04', text: 'El camarero sale hacia la cocina.' },
    ],
    motives: [
      { id: 'piedra', label: 'Llevarse el diamante en el brindis' },
      { id: 'seguro', label: 'Cobrar el seguro del anfitrión' },
      { id: 'reloj', label: 'Sabotear el reloj' },
    ],
    methods: [
      { id: 'fondo', label: 'Esconderlo en el doble fondo de la bandeja' },
      { id: 'bolsillo', label: 'Guardarlo en el bolsillo del estrado' },
      { id: 'reloj', label: 'Meterlo en la caja del reloj' },
    ],
    motiveId: 'piedra',
    methodId: 'fondo',
    sequence: ['brindis', 'pasa', 'falta', 'sale'],
  }),
]

export function eventCaseById(id: string): MysteryCase | undefined {
  return EVENT_CASES.find((mystery) => mystery.id === id)
}
