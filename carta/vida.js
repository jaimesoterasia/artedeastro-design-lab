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

  // ---- Cielo con estrellas (lienzo fijo, bajo el contenido) ----
  const cv = document.createElement('canvas'); cv.className = 'estrellas'; cv.setAttribute('aria-hidden', 'true'); document.body.insertBefore(cv, document.body.firstChild);
  const cx = cv.getContext('2d');
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
    if (fugaz) { const f = fugaz; const k = f.t / f.d; cx.save(); cx.lineCap = 'round'; const g = cx.createLinearGradient(f.x, f.y, f.x - f.vx * 90, f.y - f.vy * 90); g.addColorStop(0, `rgba(251,235,221,${(.9 * (1 - k)).toFixed(3)})`); g.addColorStop(1, 'rgba(251,235,221,0)'); cx.strokeStyle = g; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(f.x - f.vx * 90, f.y - f.vy * 90); cx.stroke(); cx.restore(); }
  }
  function bucle(t) {
    if (!visible) { tAnt = 0; return; }
    const dt = tAnt ? Math.min((t - tAnt) / 1000, .1) : .016; tAnt = t;
    px += (tpx - px) * .04; py += (tpy - py) * .04;
    if (fugaz) { fugaz.x += fugaz.vx * dt * 60; fugaz.y += fugaz.vy * dt * 60; fugaz.t += dt; if (fugaz.t >= fugaz.d) fugaz = null; }
    else { proxFugaz -= dt; if (proxFugaz <= 0) { proxFugaz = 7 + Math.random() * 9; const dir = Math.random() < .5 ? 1 : -1; fugaz = { x: dir > 0 ? Math.random() * W * .5 : W * .5 + Math.random() * W * .5, y: Math.random() * H * .35, vx: dir * (5 + Math.random() * 3), vy: 2.2 + Math.random() * 1.8, t: 0, d: .9 + Math.random() * .5 }; } }
    pintarCielo(t); requestAnimationFrame(bucle);
  }
  medir(); addEventListener('resize', medir);
  if (!reduce) {
    addEventListener('pointermove', e => { tpx = (e.clientX / innerWidth - .5) * 2; tpy = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(bucle); });
    requestAnimationFrame(bucle);
  } else addEventListener('scroll', () => pintarCielo(0), { passive: true });

  // ---- Destello al descubrir la carta ----
  function destello(el) {
    if (reduce || !el) return;
    const fx = document.createElement('canvas'); fx.className = 'destello'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx);
    const d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight; fx.width = w * d; fx.height = h * d; const g = fx.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    const col = ['247,183,145', '251,235,221', '229,87,158', '247,227,200'];
    const ps = Array.from({ length: 84 }, () => { const a = Math.random() * 6.2832, v = 1.4 + Math.random() * 5.2; return { a, v, r: .8 + Math.random() * 2.6, c: col[Math.floor(Math.random() * col.length)], d: .9 + Math.random() * .9, o: Math.random() * .8 }; });
    const t0 = performance.now();
    (function paso(t) {
      const s = (t - t0) / 1000; const b = el.getBoundingClientRect(), x0 = b.left + b.width / 2, y0 = b.top + b.height / 2;
      g.clearRect(0, 0, w, h);
      const k = s / 1.5; if (k < 1) { const rr = b.width * (.4 + k * 1.5); const gr = g.createRadialGradient(x0, y0, rr * .55, x0, y0, rr); gr.addColorStop(0, 'rgba(247,183,145,0)'); gr.addColorStop(.8, `rgba(247,227,200,${(.32 * (1 - k)).toFixed(3)})`); gr.addColorStop(1, 'rgba(247,227,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x0, y0, rr, 0, 6.2832); g.fill(); }
      let vivo = false;
      for (const p of ps) { const q = s / p.d; if (q >= 1) continue; vivo = true; const r = p.v * 60 * (1 - Math.pow(1 - q, 3)) * (b.width / 330) + b.width * .12; const x = x0 + Math.cos(p.a) * r * (1 + p.o * .25), y = y0 + Math.sin(p.a) * r * 1.25 - q * 14; g.fillStyle = `rgba(${p.c},${(.95 * (1 - q)).toFixed(3)})`; g.beginPath(); g.arc(x, y, p.r * (1 - q * .5), 0, 6.2832); g.fill(); }
      if (vivo || k < 1) requestAnimationFrame(paso); else fx.remove();
    })(t0);
  }

  // ---- Entrada del mazo en cascada y tensión al elegir ----
  const baraja = $('baraja');
  if (baraja && !reduce) { baraja.classList.add('entra'); baraja.querySelectorAll('.carta-dorso').forEach((b, i) => b.style.setProperty('--i', i)); setTimeout(() => baraja.classList.remove('entra'), 2600); }
  // los hijos del resultado aparecen por capas
  document.querySelectorAll('#revela > *').forEach((el, i) => el.style.setProperty('--k', Math.min(i, 6)));

  // ---- Aparición al hacer scroll ----
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    document.querySelectorAll('.como h2, .como-cols > div, .legal').forEach(el => { el.classList.add('rv'); io.observe(el); });
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
    const d = asegurar(id), n = d.col.length;
    $('mb-n').textContent = n;
    $('mb-t').lastChild.textContent = n === 1 ? ' carta descubierta de 22' : ' cartas descubiertas de 22';
    $('mb-racha').textContent = d.racha >= 2 ? `${d.racha} días seguidos con tu carta.` : 'Hoy empiezas tu baraja. Vuelve mañana para descubrir otra.';
    $('mb-grid').innerHTML = ARC.map((c, i) => d.col.includes(i)
      ? `<li class="ok${i === id ? ' hoy' : ''}" title="${c.num} · ${c.nombre}"><img src="${miniatura(i)}" alt="${c.num}, ${c.nombre}${i === id ? ', tu carta de hoy' : ''}" width="56" height="94" draggable="false"></li>`
      : `<li class="vacia" aria-label="Carta ${c.num}, aún sin descubrir"><span aria-hidden="true">${c.num}</span></li>`).join('');
    caja.hidden = false;
    cuentaAtras(); barra();
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
    if (!barra.on) { barra.on = true; const q = () => { if (!pend) { pend = true; requestAnimationFrame(calc); } }; addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); $('b-enviar2') && $('b-enviar2').addEventListener('click', () => $('b-enviar').click()); }
    calc();
  }

  window.ADE_VIDA = { pintar, destello };
})();
