/* La carta de hoy · artedeastro. Vida de la página: cielo con estrellas, destello al descubrir la carta, racha, baraja propia y cuenta atrás.
   Todo ocurre en el navegador: la racha y las cartas descubiertas se guardan solo en este dispositivo (localStorage) y no se envían a ningún sitio. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }, del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } } };
  const fecha = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const hoy = () => fecha(new Date());
  const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return fecha(d); };
  const ARC = window.ARCANOS, C = window.CARTAS;
  document.documentElement.classList.add('vida');
  const evento = (n, p) => { try { if (window.adeTrack) window.adeTrack(n, p); } catch (e) { /* sin medición */ } };

  // ---- Cielo con estrellas (lienzo fijo, bajo el contenido) ----
  const cv = document.createElement('canvas'); cv.className = 'estrellas'; cv.setAttribute('aria-hidden', 'true'); document.body.insertBefore(cv, document.body.firstChild);
  const cx = cv.getContext('2d');
  const chispas = [];
  let W = 0, H = 0, dpr = 1, estrellas = [], fugaz = null, px = 0, py = 0, tpx = 0, tpy = 0, visible = true, tAnt = 0, proxFugaz = 4;
  const COLORES = ['251,235,221', '247,227,200', '247,183,145', '255,255,255'];
  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(70, Math.min(170, Math.round(W * H / 6500)));
    estrellas = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .55 + Math.random() * 1.45, a: .45 + Math.random() * .55, v: .4 + Math.random() * 1.6, f: Math.random() * 6.28, z: .15 + Math.random() * .85, c: COLORES[Math.floor(Math.random() * COLORES.length)] }));
    pintarCielo(performance.now());
  }
  function pintarCielo(t) {
    cx.clearRect(0, 0, W, H); const s = t / 1000, sy = (scrollY || 0);
    for (const e of estrellas) {
      const a = reduce ? e.a * .8 : e.a * (.5 + .5 * Math.sin(s * e.v + e.f));
      let x = e.x + px * e.z * 16, y = ((e.y - sy * e.z * .06 + px * 0) % H + H) % H + py * e.z * 10;
      cx.beginPath(); cx.arc(x, y, e.r, 0, 6.2832); cx.fillStyle = `rgba(${e.c},${a.toFixed(3)})`; cx.fill();
      if (e.r > 1.2) { cx.fillStyle = `rgba(${e.c},${(a * .18).toFixed(3)})`; cx.beginPath(); cx.arc(x, y, e.r * 3.2, 0, 6.2832); cx.fill(); }
    }
    for (let i = chispas.length - 1; i >= 0; i--) { const c = chispas[i]; const q = c.t / c.d; if (q >= 1) { chispas.splice(i, 1); continue; } const a = (1 - q) * .85; cx.fillStyle = `rgba(${c.c},${a.toFixed(3)})`; cx.beginPath(); cx.arc(c.x, c.y, c.r * (1 - q * .6), 0, 6.2832); cx.fill(); cx.fillStyle = `rgba(${c.c},${(a * .2).toFixed(3)})`; cx.beginPath(); cx.arc(c.x, c.y, c.r * 3.4, 0, 6.2832); cx.fill(); }
    if (fugaz) { const f = fugaz; const k = f.t / f.d; cx.save(); cx.lineCap = 'round'; const g = cx.createLinearGradient(f.x, f.y, f.x - f.vx * 90, f.y - f.vy * 90); g.addColorStop(0, `rgba(251,235,221,${(.9 * (1 - k)).toFixed(3)})`); g.addColorStop(1, 'rgba(251,235,221,0)'); cx.strokeStyle = g; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(f.x - f.vx * 90, f.y - f.vy * 90); cx.stroke(); cx.restore(); }
  }
  function bucle(t) {
    if (!visible) { tAnt = 0; return; }
    const dt = tAnt ? Math.min((t - tAnt) / 1000, .1) : .016; tAnt = t;
    px += (tpx - px) * .04; py += (tpy - py) * .04;
    for (const c of chispas) { c.t += dt; c.x += c.vx * dt * 60; c.y += c.vy * dt * 60; c.vy += .012; }
    if (fugaz) { fugaz.x += fugaz.vx * dt * 60; fugaz.y += fugaz.vy * dt * 60; fugaz.t += dt; if (fugaz.t >= fugaz.d) fugaz = null; }
    else { proxFugaz -= dt; if (proxFugaz <= 0) { proxFugaz = 7 + Math.random() * 9; const dir = Math.random() < .5 ? 1 : -1; fugaz = { x: dir > 0 ? Math.random() * W * .5 : W * .5 + Math.random() * W * .5, y: Math.random() * H * .35, vx: dir * (5 + Math.random() * 3), vy: 2.2 + Math.random() * 1.8, t: 0, d: .9 + Math.random() * .5 }; } }
    pintarCielo(t); requestAnimationFrame(bucle);
  }
  medir(); addEventListener('resize', medir);
  if (!reduce) {
    let ultima = 0;
    addEventListener('pointermove', e => {
      tpx = (e.clientX / innerWidth - .5) * 2; tpy = (e.clientY / innerHeight - .5) * 2;
      if (e.pointerType === 'mouse' && e.timeStamp - ultima > 38 && chispas.length < 46) { ultima = e.timeStamp; chispas.push({ x: e.clientX + (Math.random() - .5) * 8, y: e.clientY + (Math.random() - .5) * 8, vx: (Math.random() - .5) * .8, vy: -.2 - Math.random() * .6, r: .8 + Math.random() * 1.8, t: 0, d: .7 + Math.random() * .7, c: COLORES[Math.floor(Math.random() * 3)] }); }
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(bucle); });
    requestAnimationFrame(bucle);
  } else addEventListener('scroll', () => pintarCielo(0), { passive: true });

  // ---- Destello al descubrir la carta ----
  function destello(el) {
    if (reduce || !el) return;
    const fx = document.createElement('canvas'); fx.className = 'destello'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx);
    const d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight; fx.width = w * d; fx.height = h * d; const g = fx.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    const col = ['247,183,145', '251,235,221', '229,87,158', '247,227,200'];
    const ps = Array.from({ length: 190 }, (_, i) => { const a = Math.random() * 6.2832, v = 1.2 + Math.random() * 6.4; return { a, v, r: .8 + Math.random() * 3, c: col[Math.floor(Math.random() * col.length)], d: 1 + Math.random() * 1.1, o: Math.random() * .8, est: i % 6 === 0 }; });
    const estrella4 = (x, y, r) => { g.beginPath(); g.moveTo(x, y - r * 2.4); g.quadraticCurveTo(x, y, x + r * 2.4, y); g.quadraticCurveTo(x, y, x, y + r * 2.4); g.quadraticCurveTo(x, y, x - r * 2.4, y); g.quadraticCurveTo(x, y, x, y - r * 2.4); g.fill(); };
    try { if (navigator.vibrate) navigator.vibrate([16, 50, 30]); } catch (e) { /* sin vibración */ }
    const t0 = performance.now();
    (function paso(t) {
      const s = (t - t0) / 1000; const b = el.getBoundingClientRect(), x0 = b.left + b.width / 2, y0 = b.top + b.height / 2;
      g.clearRect(0, 0, w, h);
      if (s < .45) { g.fillStyle = `rgba(255,238,222,${(.34 * (1 - s / .45)).toFixed(3)})`; g.fillRect(0, 0, w, h); }       // fogonazo de luz
      for (let n = 0; n < 2; n++) { const k = (s - n * .22) / 1.7; if (k > 0 && k < 1) { const rr = b.width * (.4 + k * (n ? 2.3 : 1.7)); const gr = g.createRadialGradient(x0, y0, rr * .6, x0, y0, rr); gr.addColorStop(0, 'rgba(247,183,145,0)'); gr.addColorStop(.82, `rgba(${n ? '229,87,158' : '247,227,200'},${(.4 * (1 - k)).toFixed(3)})`); gr.addColorStop(1, 'rgba(247,227,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x0, y0, rr, 0, 6.2832); g.fill(); } }
      let vivo = s < 1.9;
      for (const p of ps) { const q = s / p.d; if (q >= 1) continue; vivo = true; const r = p.v * 62 * (1 - Math.pow(1 - q, 3)) * (b.width / 330) + b.width * .12; const x = x0 + Math.cos(p.a) * r * (1 + p.o * .25), y = y0 + Math.sin(p.a) * r * 1.25 - q * 14; g.fillStyle = `rgba(${p.c},${(.95 * (1 - q)).toFixed(3)})`; if (p.est) estrella4(x, y, p.r * (1 - q * .4)); else { g.beginPath(); g.arc(x, y, p.r * (1 - q * .5), 0, 6.2832); g.fill(); } }
      if (vivo) requestAnimationFrame(paso); else fx.remove();
    })(t0);
  }

  // ---- Entrada del mazo en cascada y tensión al elegir ----
  const baraja = $('baraja');
  if (baraja && !reduce) { baraja.classList.add('entra'); baraja.querySelectorAll('.carta-dorso').forEach((b, i) => b.style.setProperty('--i', i)); setTimeout(() => baraja.classList.remove('entra'), 2600); }
  // los hijos del resultado aparecen por capas
  document.querySelectorAll('#revela > *').forEach((el, i) => el.style.setProperty('--k', Math.min(i, 6)));

  // ---- Mazo magnético: las cartas se elevan al acercarte, como si respondieran ----
  if (baraja && !reduce) {
    const cartas = () => baraja.querySelectorAll('.carta-dorso');
    const mover = x => { cartas().forEach(c => { const r = c.getBoundingClientRect(), d = Math.abs(x - (r.left + r.width / 2)), m = Math.max(0, 1 - d / 190), q = m * m; c.style.setProperty('--m', (q * 46).toFixed(1) + 'px'); c.style.setProperty('--s', (1 + q * .13).toFixed(3)); }); };
    const quitar = () => cartas().forEach(c => { c.style.removeProperty('--m'); c.style.removeProperty('--s'); });
    baraja.addEventListener('pointermove', e => { if (!baraja.classList.contains('eligiendo') && !baraja.classList.contains('entra')) mover(e.clientX); }, { passive: true });
    baraja.addEventListener('pointerleave', quitar);
    baraja.addEventListener('pointerdown', e => { try { if (e.target.closest('.carta-dorso') && navigator.vibrate) navigator.vibrate(14); } catch (x) { /* sin vibración */ } });
  }

  // ---- La carta descubierta se inclina con el puntero y brilla como un foil ----
  const escena = document.querySelector('.escena');
  if (escena && !reduce) {
    escena.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return; const r = escena.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      escena.style.setProperty('--ty', (x * 18).toFixed(2) + 'deg'); escena.style.setProperty('--tx', (-y * 14).toFixed(2) + 'deg');
      escena.style.setProperty('--sx', ((x + .5) * 100).toFixed(1) + '%'); escena.style.setProperty('--sy', ((y + .5) * 100).toFixed(1) + '%'); escena.classList.add('inclina');
    });
    escena.addEventListener('pointerleave', () => { escena.classList.remove('inclina'); ['--tx', '--ty', '--sx', '--sy'].forEach(p => escena.style.removeProperty(p)); });
  }

  // ---- La Luna de hoy, con su fase real ----
  (function luna() {
    const c = window.cieloDeHoy && window.cieloDeHoy(), caja = $('luna-hoy'); if (!c || typeof c.ang !== 'number' || !caja) return;
    const a = c.ang, cre = a < 180, b = cre ? a : 360 - a, rx = Math.abs(Math.cos(b * Math.PI / 180)) * 40, barrido = b < 90 ? 0 : 1;
    const luz = b < 2 ? '' : `<path d="M50 10A40 40 0 0 1 50 90A${rx.toFixed(2)} 40 0 0 ${barrido} 50 10Z" fill="url(#lunaLuz)"${cre ? '' : ' transform="translate(100 0) scale(-1 1)"'}/>`;
    caja.innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="Fase de la Luna de hoy: ${c.fase}"><defs><radialGradient id="lunaLuz" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#FFF6EA"/><stop offset=".6" stop-color="#F7E3C8"/><stop offset="1" stop-color="#F7B791"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="rgba(20,10,30,.55)" stroke="rgba(247,227,200,.35)" stroke-width="1"/>${luz}</svg>`;
    caja.hidden = false;
  })();

  // ---- Aparición al hacer scroll ----
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    document.querySelectorAll('.como h2, .tile, .legal, .ej-texto, .movil, .se-foto, .se-texto').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }

  // ---- Ejemplo de lectura: la IA «escribe» cuando llega a la vista ----
  (function demo() {
    const ia = $('ej-ia'), fin = $('ej-fin'); if (!ia || !fin) return;
    const span = ia.querySelector('span'), txt = span.textContent;
    if (reduce || !('IntersectionObserver' in window)) { fin.classList.add('vista'); return; }
    span.textContent = ' '; fin.classList.remove('vista');
    const io2 = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io2.disconnect(); evento('ejemplo_visto'); let i = 0; ia.classList.add('escribiendo'); const paso = () => { i += 2; span.textContent = txt.slice(0, i); if (i < txt.length) setTimeout(paso, 22); else { ia.classList.remove('escribiendo'); fin.classList.add('vista'); } }; setTimeout(paso, 500); }, { threshold: .6 });
    io2.observe($('ej-ia'));
  })();

  // ---- Enlaces a Eva (el botón del resultado lo completa ritual.js con la carta) ----
  const WA_EVA = '34686156081';
  const eva2 = $('b-eva2');
  if (eva2) {
    eva2.href = window.ADE_LAB ? '#' : `https://wa.me/${WA_EVA}?text=` + encodeURIComponent('Hola Eva, he visto La carta de hoy y me gustaría hablar contigo.');
    eva2.addEventListener('click', e => { if (window.ADE_LAB) { e.preventDefault(); $('eva2-estado').textContent = 'Simulación del laboratorio: en la web real se abre WhatsApp con Eva y el mensaje ya escrito.'; } });   // el evento «whatsapp» lo envía medicion.js
  }

  // ---- Racha y baraja propia ----
  const KEY = 'adv';
  const datos = () => { const d = store.get(KEY); return d && Array.isArray(d.col) ? d : { last: null, racha: 0, col: [] }; };
  function asegurar(id) {
    const d = datos();
    if (d.last !== hoy()) { d.racha = d.last === ayer() ? (d.racha || 0) + 1 : 1; d.last = hoy(); }
    if (!d.col.includes(id)) d.col.push(id);
    store.set(KEY, d); return d;
  }
  const urls = {};
  const miniatura = id => urls[id] || (urls[id] = URL.createObjectURL(new Blob([C.caraSinTexto(id).replace('<svg ', '<svg width="560" height="940" ')], { type: 'image/svg+xml' })));
  function pintar(id) {
    const caja = $('mi-baraja'); if (!caja) return;
    const eraNueva = !datos().col.includes(id), d = asegurar(id), n = d.col.length;
    $('mb-n').textContent = n;
    $('mb-t').lastChild.textContent = n === 1 ? ' carta descubierta de 22' : ' cartas descubiertas de 22';
    $('mb-racha').textContent = d.racha >= 2 ? `${d.racha} días seguidos con tu carta.` : 'Hoy empiezas tu baraja. Vuelve mañana para descubrir otra.';
    $('mb-grid').innerHTML = ARC.map((c, i) => d.col.includes(i)
      ? `<li class="ok${i === id ? ' hoy' : ''}${i === id && eraNueva ? ' nueva' : ''}" title="${c.num} · ${c.nombre}"><img src="${miniatura(i)}" alt="${c.num}, ${c.nombre}${i === id ? ', tu carta de hoy' : ''}" width="56" height="94" draggable="false"></li>`
      : `<li class="vacia" aria-label="Carta ${c.num}, aún sin descubrir"><span aria-hidden="true">${c.num}</span></li>`).join('');
    caja.hidden = false;
    document.body.classList.add('con-carta');
    if (!pintar.medido) { pintar.medido = true; evento('baraja_vista', { cartas: n, racha: d.racha >= 7 ? '7+' : d.racha >= 4 ? '4-6' : d.racha >= 2 ? '2-3' : '1' }); }
    chips(id);
    cuentaAtras(); barra();
  }
  // Lo que viaja hacia tu IA: la carta, el cielo de hoy y tu pregunta (se ve en el panel de la lectura profunda)
  function chips(id) {
    const a = $('fc-carta'), b = $('fc-cielo'), p = $('fc-preg'), campo = $('ia-pregunta'); if (!a || !b || !p) return;
    const c = window.cieloDeHoy && window.cieloDeHoy(), d = ARC[id];
    a.textContent = `${d.nombre} · ${d.num}`;
    b.textContent = c ? `Luna en ${c.luna} · Sol en ${c.sol}` : 'Cielo de hoy';
    const pr = () => { const v = campo ? campo.value.trim() : ''; p.textContent = v ? '«' + v + '»' : 'Tu pregunta (opcional)'; };
    pr(); if (campo && !campo.dataset.chip) { campo.dataset.chip = '1'; campo.addEventListener('input', pr); }
  }
  $('mb-borrar') && $('mb-borrar').addEventListener('click', () => { store.del(KEY); const id = (store.get('adh') || {}).c; if (Number.isInteger(id)) pintar(id); const e = $('mb-estado'); if (e) e.textContent = 'Tu baraja se ha borrado de este navegador. Hoy empieza de nuevo.'; });

  // ---- Cuenta atrás hasta la próxima carta ----
  let reloj = null;
  function cuentaAtras() {
    const m = $('manana'); if (!m) return;
    const f = () => {
      const ahora = new Date(), sig = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1), mins = Math.max(0, Math.ceil((sig - ahora) / 60000));
      if (fecha(ahora) !== (store.get('adh') || {}).f) { m.innerHTML = 'Ya puedes sacar otra carta. <a href="" id="m-otra">Sacar la carta de hoy</a>'; clearInterval(reloj); return; }
      const h = Math.floor(mins / 60), mm = mins % 60;
      m.textContent = h ? `Tu próxima carta llega en ${h} h ${mm} min.` : `Tu próxima carta llega en ${mm} min.`;
    };
    f(); clearInterval(reloj); reloj = setInterval(f, 30000);
  }

  // ---- Barra de envío fija en el móvil ----
  let pend = false;
  function barra() {
    const b = $('barra'), res = $('resultado'), ac = document.querySelector('.acciones'); if (!b || !ac) return;
    const tapables = ['ia-copiar', 'ia-pregunta', 'ia-abrir', 'b-eva', 'mb-borrar'].map($).filter(Boolean);
    const calc = () => {
      pend = false; const movil = innerWidth <= 760, r = ac.getBoundingClientRect(), zona = innerHeight - 110;
      const tapa = tapables.some(el => { if (el.offsetParent === null) return false; const q = el.getBoundingClientRect(); return q.bottom > zona && q.top < innerHeight; });
      b.hidden = !(movil && !res.hidden && r.bottom < 0 && !tapa);
    };
    if (!barra.on) { barra.on = true; const q = () => { if (!pend) { pend = true; requestAnimationFrame(calc); } }; addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); $('b-enviar2') && $('b-enviar2').addEventListener('click', () => { $('b-enviar').dataset.lugar = 'barra'; $('b-enviar').click(); }); }
    calc();
  }

  window.ADE_VIDA = { pintar, destello };
})();
