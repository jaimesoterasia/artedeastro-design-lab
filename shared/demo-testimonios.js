/* Solo en el Design Lab: con ?demo en la dirección, rellena testimonios de EJEMPLO para ver cómo queda el diseño.
   No son opiniones reales y nunca se publican en artedeastro.com. */
(() => {
  if (!new URLSearchParams(location.search).has('demo') || !window.ARTEDEASTRO_DATOS) return;
  const t = 'Texto de ejemplo para ver el diseño. Aquí irá, palabra por palabra, lo que escriba una clienta real sobre su sesión con Eva.';
  window.ARTEDEASTRO_DATOS.testimonios = [
    { texto: t, nombre: 'Ejemplo 1', ciudad: 'Barcelona', servicio: 'Carta natal completa', fecha: '2026-11' },
    { texto: 'Ejemplo corto: así se ve un testimonio de dos líneas.', nombre: 'Ejemplo 2', ciudad: '', servicio: 'Coaching astral', fecha: '2026-11' },
    { texto: t + ' Un poco más largo, para comprobar cómo se comporta la tarjeta cuando la clienta escribe varias frases seguidas.', nombre: 'Ejemplo 3', ciudad: 'Girona', servicio: 'Un evento', fecha: '2026-10' },
    { texto: t, nombre: 'Ejemplo 4', ciudad: 'Online', servicio: 'Acompañamiento continuado', fecha: '2026-10' }
  ];
  const tag = document.createElement('p');
  tag.textContent = 'Vista de ejemplo del Design Lab: estos testimonios no son reales.';
  tag.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;margin:0;padding:8px 14px;border-radius:999px;background:#A4161A;color:#fff;font:600 12px system-ui';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(tag));
  if (document.body) document.body.appendChild(tag);
})();
