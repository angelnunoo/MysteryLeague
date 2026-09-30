export interface DossierChapter {
  index: number
  title: string
  kicker: string
  paragraphs: string[]
}

export interface DossierClue {
  id: string
  time: string
  text: string
}

export const DOSSIER = {
  id: 'tren-2310',
  title: 'El tren de las 23:10',
  subtitle: 'Nadie bajó en la estación que figuraba en el billete.',
  location: 'Línea del norte, vagón 4',
  year: '1931',
  cover:
    'radial-gradient(circle at 18% 0%, #6a4a28 0%, #1a1210 38%, #07060a 72%)',
  chapters: [
    {
      index: 1,
      title: 'El andén',
      kicker: 'Capítulo I',
      paragraphs: [
        'A las 23:10 el expreso del norte sale con cuatro minutos de retraso. En el andén queda un maletín sin dueño y un revisor que jura haber visto bajar a un hombre con el abrigo del revés.',
        'El maletín contiene un horario tachado, una llave de compartimento y una entrada de ópera para esa misma noche. La función ya había empezado cuando el tren arrancó.',
        'Tres pasajeros discuten en el vagón 4. Ninguno admite haber tocado el maletín. El revisor anota la hora y cierra la puerta del coche.',
      ],
    },
    {
      index: 2,
      title: 'El compartimento',
      kicker: 'Capítulo II',
      paragraphs: [
        'En el compartimento 4-C hay un hombre muerto, sentado como si durmiera. No hay sangre. La ventanilla está cerrada por dentro y el pestillo no tiene marcas.',
        'El forense del pueblo siguiente dirá que la muerte ocurrió antes de la salida. Alguien lo sentó después, le arregló el cuello y apagó la luz.',
        'Sobre la rejilla del equipaje falta una maleta que el revisor recuerda de color burdeos. En su lugar hay un abrigo húmedo, aunque no llueve desde el mediodía.',
      ],
    },
    {
      index: 3,
      title: 'La carta',
      kicker: 'Capítulo III',
      paragraphs: [
        'Entre el forro del abrigo aparece una carta sin firma. Cita el andén, la hora y una frase: «Si el tren sale, el contrato muere con él.»',
        'El muerto iba a firmar esa noche la venta de un teatro. Dos de los pasajeros salen en el contrato. El tercero solo tenía un billete de ida hasta la estación anterior.',
        'La tinta de la carta está fresca. No pudo escribirse en la ciudad de origen. Alguien la redactó a bordo, con el muerto ya en el asiento.',
      ],
    },
    {
      index: 4,
      title: 'El freno',
      kicker: 'Capítulo IV',
      paragraphs: [
        'El freno de emergencia del vagón 4 se accionó a las 23:06, cuatro minutos antes de la salida oficial. El convoy aún estaba en el andén. Nadie avisó al maquinista.',
        'Ese tirón basta para explicar el abrigo húmedo: el portador cruzó el vapor de la locomotora al volver al coche. Y basta para explicar el maletín: lo dejaron fuera para que el revisor mirara al andén, no al compartimento.',
        'La mesa tiene ya el horario, la llave, la carta y el freno. Falta decidir quién sostuvo la mano del muerto mientras el tren empezaba a moverse.',
      ],
    },
  ] satisfies DossierChapter[],
  timeline: [
    { id: 'salida', time: '23:06', text: 'Alguien tira del freno. El tren sigue en el andén.' },
    { id: 'maletin', time: '23:08', text: 'El maletín queda solo. El revisor mira hacia fuera.' },
    { id: 'luz', time: '23:09', text: 'Se apaga la luz del compartimento 4-C.' },
    { id: 'marcha', time: '23:10', text: 'El expreso sale. El pestillo está cerrado por dentro.' },
    { id: 'abrigo', time: '23:14', text: 'Aparece el abrigo húmedo donde iba la maleta burdeos.' },
    { id: 'carta', time: '23:40', text: 'La carta del forro aún mancha los dedos de quien la lee.' },
  ] satisfies DossierClue[],
}

export function openChapterCount(week: number): number {
  return (Math.abs(week) % DOSSIER.chapters.length) + 1
}
