export interface DossierChapter {
  number: number
  title: string
  summary: string
  paragraphs: string[]
}

export interface DossierPerson {
  id: string
  name: string
  role: string
  from: number
  note: string
}

export interface DossierClue {
  id: string
  title: string
  detail: string
  from: number
  kind: 'objeto' | 'foto' | 'documento'
}

export interface DossierBeat {
  id: string
  time: string
  text: string
  from: number
}

export const RAVENHILL = {
  id: 'ravenhill',
  title: 'La Orden de Ravenhill',
  subtitle: 'Una serie en veinte capítulos',
  location: 'Claustro de Ravenhill',
  cover: 'linear-gradient(165deg,#1a120c 0%,#3a1828 42%,#07060a 80%)',
  logline: 'Una orden secreta guarda el libro de las muertes sin cerrar. Alguien dentro decide que el siguiente nombre sea el tuyo.',
}

export const RAVEN_CHAPTERS: DossierChapter[] = [
  { number: 1, title: 'El sello negro', summary: 'Llega un sobre sin remitente y con el sello de un cuervo.', paragraphs: ['El sobre no trae nombre. Solo un sello de lacre negro y una pluma dibujada al margen.', 'Dentro hay una cita: claustro de Ravenhill, medianoche, no hables con el archivero.'] },
  { number: 2, title: 'La biblioteca sin polvo', summary: 'La biblioteca está demasiado limpia para ser antigua.', paragraphs: ['Las estanterías no tienen polvo. Alguien las usa cada noche.', 'Elias Voss te observa desde la escalera y no baja a saludar.'] },
  { number: 3, title: 'La mecenas llega tarde', summary: 'Irene Calder entra cuando el claustro ya debería estar cerrado.', paragraphs: ['Irene paga el tejado, las velas y el silencio.', 'Llega tarde y pregunta, antes que nada, si el libro sigue cerrado.'] },
  { number: 4, title: 'El nombre tachado', summary: 'En el margen hay un nombre borrado con prisa.', paragraphs: ['Una línea de tinta fresca tapa un apellido.', 'Debajo, con la lupa, se lee Calder. No Irene: un hermano.'] },
  { number: 5, title: 'La llave del ala oeste', summary: 'El ala oeste no está en el plano que te dieron.', paragraphs: ['El plano del claustro omite un pasillo.', 'La llave cuelga del llavero de Elias, marcada con una pluma.'] },
  { number: 6, title: 'El vigilante que no vio', summary: 'Mateo asegura que nadie cruzó el claustro.', paragraphs: ['Mateo Ruiz firma el parte de la noche.', 'Su farol, sin embargo, se apagó veinte minutos. Él dice que fue el viento.'] },
  { number: 7, title: 'Cera y plomo', summary: 'El sello no es cera de vela. Es una mezcla de archivo.', paragraphs: ['La forense aún no ha llegado, pero el sello ya habla.', 'Plomo molido y cera negra: la receta está en el cajón de Elias.'] },
  { number: 8, title: 'La lista de los vivos', summary: 'El libro no registra muertos. Registra a quien sigue.', paragraphs: ['La Orden no archiva cadáveres. Archiva testigos.', 'Tu nombre no está. Todavía.'] },
  { number: 9, title: 'La forense duda', summary: 'Lena Hart encuentra sangre que no es del margen.', paragraphs: ['La doctora Lena Hart pide el libro y no el cadáver, porque aún no hay cadáver.', 'Encuentra una mancha en el canto: sangre reciente, de alguien que hojeó con un corte en el dedo.'] },
  { number: 10, title: 'Medianoche en el claustro', summary: 'A las doce se apagan las velas a la vez.', paragraphs: ['No es el viento. Alguien cerró la llave del gas de las lámparas.', 'En la oscuridad, una puerta del ala oeste se abre sola.'] },
  { number: 11, title: 'Una carta sin remitente', summary: 'La segunda carta nombra a la hermana del coro.', paragraphs: ['La carta dice: no confíes en quien canta las completas.', 'La hermana Maren ensaya sola, con la puerta del coro entornada.'] },
  { number: 12, title: 'La hermana del coro', summary: 'Maren vio a Irene entrar en el ala oeste.', paragraphs: ['Maren no acusa. Describe.', 'Irene cruzó con un paño en la mano y salió sin él.'] },
  { number: 13, title: 'El libro que no se abre', summary: 'El cierre del libro responde a una frase, no a una llave.', paragraphs: ['Elias recita una fórmula y el cierre cede.', 'La frase está escrita al revés en el misal de Maren.'] },
  { number: 14, title: 'Sangre en el margen', summary: 'La mancha coincide con el corte de Irene.', paragraphs: ['Lena compara la mancha con un pañuelo del despacho de la mecenas.', 'Coincide. Irene hojeó el libro la noche del nombre tachado.'] },
  { number: 15, title: 'Tres campanadas', summary: 'El reloj del claustro se salta una hora.', paragraphs: ['Mateo jura que dio las once y luego la una.', 'Alguien necesitaba una hora que no existiera.'] },
  { number: 16, title: 'El pacto de Ravenhill', summary: 'La Orden protege a sus mecenas, no a la verdad.', paragraphs: ['Un acta antigua lo dice sin adorno: el nombre de quien paga no se lee en voz alta.', 'El hermano de Irene estaba en esa lista. Murió, y el acta lo llama ausencia.'] },
  { number: 17, title: 'La coartada del archivo', summary: 'Elias estaba en la biblioteca. Irene no.', paragraphs: ['Tres novicios vieron a Elias en la escalera a la hora hueca.', 'Nadie vio a Irene. El paño sigue sin aparecer.'] },
  { number: 18, title: 'Quién apagó las velas', summary: 'La llave del gas estaba en el despacho de la mecenas.', paragraphs: ['Mateo no tiene esa llave. Maren tampoco.', 'Irene la devuelve al amanecer, todavía fría.'] },
  { number: 19, title: 'La última página', summary: 'En la última página ya está escrito tu nombre, a lápiz.', paragraphs: ['No es tinta de la Orden. Es lápiz, reciente, con la misma presión que el nombre tachado.', 'Si no cierras el caso esta noche, el lápiz se pasa a tinta.'] },
  { number: 20, title: 'El cuervo declara', summary: 'Irene escribió los dos nombres. El de su hermano y el tuyo.', paragraphs: ['Irene no robó un secreto. Lo estaba reescribiendo.', 'Tachó a su hermano para heredar el silencio de la Orden y escribió el tuyo para que nadie leyera el acta.', 'El expediente se cierra cuando el lápiz sale del libro y el sello negro vuelve al cajón de quien nunca debió prestarlo.'] },
]

export const RAVEN_PEOPLE: DossierPerson[] = [
  { id: 'elias', name: 'Elias Voss', role: 'Archivero', from: 1, note: 'Guarda la llave y la fórmula. Su coartada de la hora hueca se sostiene.' },
  { id: 'irene', name: 'Irene Calder', role: 'Mecenas', from: 3, note: 'Paga el claustro. La sangre, el paño y la llave del gas vuelven a ella.' },
  { id: 'mateo', name: 'Mateo Ruiz', role: 'Vigilante', from: 6, note: 'Perdió una hora de luz. No tiene la llave del gas.' },
  { id: 'lena', name: 'Dra. Lena Hart', role: 'Forense', from: 9, note: 'Lee la sangre del margen. No estaba en el claustro la primera noche.' },
  { id: 'maren', name: 'Hermana Maren', role: 'Coro', from: 11, note: 'Vio el paño. Copia la fórmula sin saber para qué sirve.' },
]

export const RAVEN_CLUES: DossierClue[] = [
  { id: 'sello', title: 'Sello de cuervo', detail: 'Lacre negro con plomo molido.', from: 1, kind: 'objeto' },
  { id: 'plano', title: 'Plano incompleto', detail: 'El ala oeste no aparece.', from: 5, kind: 'documento' },
  { id: 'paño', title: 'Paño desaparecido', detail: 'Irene entra con él y sale sin él.', from: 12, kind: 'objeto' },
  { id: 'sangre', title: 'Mancha del canto', detail: 'Sangre reciente, compatible con Irene.', from: 14, kind: 'foto' },
  { id: 'acta', title: 'Acta del pacto', detail: 'El nombre de quien paga no se lee en voz alta.', from: 16, kind: 'documento' },
  { id: 'lapiz', title: 'Tu nombre a lápiz', detail: 'La última página ya te espera.', from: 19, kind: 'documento' },
]

export const RAVEN_TIMELINE: DossierBeat[] = [
  { id: 'sobre', time: 'Día 1', text: 'Llega el sobre con el sello negro.', from: 1 },
  { id: 'biblioteca', time: 'Día 2', text: 'La biblioteca está en uso.', from: 2 },
  { id: 'irene', time: 'Día 3', text: 'Irene pregunta por el libro.', from: 3 },
  { id: 'tacha', time: 'Día 4', text: 'Alguien tacha el apellido Calder.', from: 4 },
  { id: 'ala', time: 'Día 6', text: 'El farol de Mateo se apaga.', from: 6 },
  { id: 'gas', time: 'Día 10', text: 'Se apagan las velas a la vez.', from: 10 },
  { id: 'paño', time: 'Día 12', text: 'Maren ve el paño.', from: 12 },
  { id: 'hora', time: 'Día 15', text: 'El reloj se salta una hora.', from: 15 },
  { id: 'llave', time: 'Día 18', text: 'Irene devuelve la llave del gas.', from: 18 },
  { id: 'cierre', time: 'Día 20', text: 'El lápiz sale del libro.', from: 20 },
]

export function chapterByNumber(number: number): DossierChapter | undefined {
  return RAVEN_CHAPTERS.find((chapter) => chapter.number === number)
}
