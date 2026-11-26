/* Lector SIMULADO: arma una lectura con plantillas a partir de los datos de la carta. NO usa IA.
   Sirve para probar el flujo de pago y entrega en el laboratorio. En la Fase 6 se sustituye por la IA real (mismo contrato:
   async ({carta, cielo, pregunta}) => texto). Las frases y notas de las cartas son textos de artedeastro pendientes de revisión de Eva. */

export function crearLectorSim(ARC, APOYO) {
  return async function lectorSim({ carta, cielo, pregunta }) {
    const d = ARC[carta], a = (APOYO && APOYO[carta]) || { kw: [], sentido: '', consejo: '', sombra: '' };
    if (!d) throw new Error('carta desconocida');
    const kw = (a.kw && a.kw.length ? a.kw : ['lo que importa']).slice(0, 3).map(s => s.toLowerCase());
    const lista = kw.length > 1 ? kw.slice(0, -1).join(', ') + ' y ' + kw[kw.length - 1] : kw[0];
    const c = cielo && cielo.luna ? cielo : null;
    const p1 = `${d.nombre} (${d.num}) en el Tarot de Thoth habla de ${lista}. ${a.sentido}`.trim();
    const p2 = c
      ? `Hoy la Luna está en ${c.luna}${c.fase ? ', en fase ' + c.fase : ''}, y el Sol en ${c.sol}. Con ese cielo, ${d.nombre} pide ir despacio y mirar qué te mueve de verdad antes de decidir nada.`
      : `Hoy no cruzo la carta con el cielo, así que la leo sola: ${d.nombre} pide ir despacio y mirar qué te mueve de verdad antes de decidir nada.`;
    const p3 = `${pregunta ? 'Sobre lo que me has contado, ' : 'En general, '}${a.consejo ? a.consejo.charAt(0).toLowerCase() + a.consejo.slice(1) : 'escucha lo que esta carta te recuerda'} ${a.sombra ? 'Y si algo se tuerce, suele aparecer como ' + a.sombra.charAt(0).toLowerCase() + a.sombra.slice(1).replace(/\.$/, '') + '.' : ''}`.replace(/\s+/g, ' ').trim();
    const p4 = `Una pequeña práctica para hoy: dedica diez minutos a escribir tres líneas sobre ${kw[0]}. No hace falta decidir nada; solo notar qué cambia cuando lo pones en palabras.`;
    const p5 = `Una pregunta para llevarte: ${d.pregunta}`;
    return [p1, p2, p3, p4, p5, 'Lectura de prueba del laboratorio, armada con plantillas (no es una IA). La versión real la escribirá una IA con el estilo de artedeastro y lo dirá aquí: «Lectura escrita por una IA con el estilo de artedeastro. No es Eva.»'].join('\n\n');
  };
}
