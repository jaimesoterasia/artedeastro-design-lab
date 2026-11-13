/* Contenido que cambia a menudo: testimonios y eventos.
   La web los pinta desde aquí; para añadir uno basta con copiar un bloque.

   TESTIMONIOS
   - Solo textos que la clienta haya enviado desde artedeastro.com/testimonio
     (o por escrito) dando permiso para publicarlos.
   - Pega el texto tal cual; como mucho, corrige erratas.
   - nombre: exactamente como pidió aparecer. ciudad: opcional ('' si no la dio).
   - servicio: Coaching astral · Carta natal resumida + sesión · Carta natal completa
     · Acompañamiento continuado · Evento · Otra cosa.
   - fecha: año y mes en que lo envió ('2026-11'). Se muestran del más nuevo al más antiguo.

   EVENTOS
   - fecha en formato '2026-10-04'. Se muestran del más nuevo al más antiguo.
   - imagenes: rutas dentro de img/. La primera va delante.
*/
window.ARTEDEASTRO_DATOS = {
  testimonios: [
    // { texto: 'Pega aquí el texto.', nombre: 'Laura M.', ciudad: 'Barcelona', servicio: 'Carta natal completa', fecha: '2026-11' },
  ],

  eventos: [
    {
      nombre: 'Giro al Alma',
      fecha: '2026-10-04',
      lugar: 'GIRO.BAR · Gràcia, Barcelona',
      texto: 'La primera edición, en un bar de vinilos y cócteles: lecturas de tarot en vivo toda la tarde, junto a la moda de Fandango Barcelona y las joyas de Artesana.',
      etiquetas: ['Vinilos', 'Cócteles', 'Tarot', 'Moda', 'Joyas'],
      imagenes: [
        { src: '../img/giro-flyer.jpg', alt: 'Cartel de Giro al Alma: un cóctel junto a un tocadiscos, domingo 4 de octubre desde las 17:00' },
        { src: '../img/giro-info.jpg', alt: 'Cartel de Giro al Alma con Fandango Barcelona, Artedeastrología y Artesana en GIRO.BAR' }
      ]
    }
  ]
};
