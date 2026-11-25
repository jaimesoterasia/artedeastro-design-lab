/* La carta de hoy · artedeastro. Capa 1: carta, cielo de hoy, frase, carta compartible y puente a Eva. Sin IA, sin servidor y sin registro. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ARC = window.ARCANOS, C = window.CARTAS;
  const WA = '34686156081';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (n, p) => { try { if (window.adeTrack) window.adeTrack(n, p); } catch (e) { /* sin medición */ } };
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }, del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } } };
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const rnd = n => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); } };
  const ROOT = new URL(window.ADE_ROOT || './', location.href);
  const urlCarta = id => new URL(id + '/', ROOT).href;
  const TEXTO_ENVIO = 'Te he sacado una carta. ¿Quieres saber cuál te toca a ti?';

  // ---- Cielo de hoy ----
  const cieloTexto = () => { const c = window.cieloDeHoy && window.cieloDeHoy(); return c ? `Hoy la Luna está en ${c.luna} · ${c.fase}` : null; };

  // ---- Origen: una amiga que comparte su carta ----
  const params = new URLSearchParams(location.search);
  const deAmiga = (() => { const v = window.ADE_CARTA !== undefined ? window.ADE_CARTA : params.get('c'); const n = Number(v); return v !== null && v !== '' && Number.isInteger(n) && n >= 0 && n < ARC.length ? n : null; })();
  const ORIGEN = deAmiga !== null ? 'amiga' : (params.get('o') || 'directo');
  if (params.has('nueva')) store.del('adh');                  // solo para pruebas: permite sacar otra carta

  if (deAmiga !== null) {
    $('inv-carta').innerHTML = C.cara(deAmiga);
    $('inv-nombre').textContent = `Ha salido ${ARC[deAmiga].nombre}.`;
    $('invitacion').hidden = false;
  }
  const ctxt = cieloTexto();
  if (ctxt) { $('cielo-hoy').textContent = ctxt; $('cielo-hoy').hidden = false; }

  // ---- Mazo ----
  const baraja = $('baraja');
  const dorsoSVG = C.reverso().replace(/<text[\s\S]*?<\/text>/g, '').replace('<svg ', '<svg width="560" height="940" ');
  const dorsoURL = URL.createObjectURL(new Blob([dorsoSVG], { type: 'image/svg+xml' }));
  for (let i = 0; i < ARC.length; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'carta-dorso';
    b.style.setProperty('--r', ((i - 10.5) * 1.25).toFixed(2) + 'deg'); b.style.setProperty('--y', (Math.pow(i - 10.5, 2) * .11).toFixed(1) + 'px');
    b.setAttribute('aria-label', `Carta boca abajo ${i + 1} de ${ARC.length}. Elegir esta carta`);
    b.innerHTML = `<img src="${dorsoURL}" alt="" width="132" height="222" draggable="false">`;
    baraja.appendChild(b);
  }
  const centrar = () => { baraja.scrollLeft = (baraja.scrollWidth - baraja.clientWidth) / 2; };
  addEventListener('load', centrar); requestAnimationFrame(centrar);
  baraja.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; const t = e.target.closest('.carta-dorso'); if (!t) return; const sib = e.key === 'ArrowRight' ? t.nextElementSibling : t.previousElementSibling; if (sib) { e.preventDefault(); sib.focus(); sib.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } });

  let hecha = false, actual = null;

  function mostrar(id, cieloTxt, animar) {
    actual = { id, cielo: cieloTxt };
    const d = ARC[id];
    baraja.classList.add('hecha'); baraja.setAttribute('aria-hidden', 'true'); baraja.querySelectorAll('button').forEach(b => { b.tabIndex = -1; });
    $('instr').hidden = true; document.querySelector('.hero .nota').hidden = true;
    $('dorso').innerHTML = `<img src="${dorsoURL}" alt="">`;
    $('frente').innerHTML = C.cara(id);
    $('r-nombre').textContent = d.nombre;
    $('r-frase').textContent = d.frase;
    $('r-cielo').textContent = cieloTxt ? cieloTxt.toUpperCase() : '';
    $('r-cielo').hidden = !cieloTxt;
    $('r-pregunta').textContent = d.pregunta;
    $('b-eva').href = window.ADE_LAB ? '#' : `https://wa.me/${WA}?text=` + encodeURIComponent(`Hola Eva, he sacado ${d.nombre} en La carta de hoy y me gustaría hablar contigo.`);
    const res = $('resultado'); res.hidden = false;
    const volteo = $('volteo'), revela = $('revela');
    if (animar && !reduce) {
      volteo.classList.remove('girada'); revela.classList.remove('visible');
      void volteo.offsetWidth;
      res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => volteo.classList.add('girada'), 450);
      setTimeout(() => { revela.classList.add('visible'); res.focus({ preventScroll: true }); }, 1900);
    } else {
      volteo.classList.add('girada'); revela.classList.add('visible');
      if (animar) { res.scrollIntoView({ block: 'start' }); res.focus({ preventScroll: true }); }
    }
  }

  baraja.addEventListener('click', e => {
    if (hecha || !e.target.closest('.carta-dorso')) return;
    hecha = true;
    const id = rnd(ARC.length), cieloTxt = cieloTexto();
    store.set('adh', { f: hoy(), c: id, cielo: cieloTxt });
    mostrar(id, cieloTxt, true);
    track('carta_sacada', { carta: ARC[id].nombre, origen: ORIGEN });
  });

  const guardada = store.get('adh');
  if (guardada && guardada.f === hoy() && Number.isInteger(guardada.c) && ARC[guardada.c]) { hecha = true; mostrar(guardada.c, guardada.cielo || null, false); }

  // ---- Compartir ----
  const estado = t => { $('estado').textContent = t || ''; };
  $('b-enviar').addEventListener('click', async () => {
    if (!actual) return;
    const url = urlCarta(actual.id); track('compartir', { carta: ARC[actual.id].nombre });
    if (navigator.share) { try { await navigator.share({ title: 'La carta de hoy · artedeastro', text: TEXTO_ENVIO, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    window.open('https://wa.me/?text=' + encodeURIComponent(TEXTO_ENVIO + ' ' + url), '_blank', 'noopener'); // abre WhatsApp para elegir a quién enviarla
  });
  const descargar = (blob, nombre) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  async function guardar(formato, btn) {
    if (!actual) return; if (btn) btn.disabled = true; estado('Preparando tu carta…'); track('guardar_imagen', { formato });
    try {
      const blob = await imagen(actual.id, formato, actual.cielo), nombre = 'carta-de-hoy-' + hoy() + (formato === 'cuadrado' ? '-cuadrada' : '') + '.png';
      const file = new File([blob], nombre, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'La carta de hoy' }); estado('Lista para compartir.'); return; } catch (e) { if (e && e.name === 'AbortError') { estado(''); return; } } }
      descargar(blob, nombre); estado('Imagen guardada. Ya puedes subirla a tus Stories.');
    } catch (e) { estado('No se ha podido crear la imagen. Haz una captura de pantalla de tu carta.'); }
    finally { if (btn) btn.disabled = false; }
  }
  $('b-guardar').addEventListener('click', () => guardar('historia', $('b-guardar')));
  $('b-cuadrado').addEventListener('click', e => { e.preventDefault(); guardar('cuadrado'); });
  $('b-eva').addEventListener('click', e => { if (window.ADE_LAB) { e.preventDefault(); estado('Simulación del laboratorio: en la web real se abre WhatsApp con Eva y el mensaje ya escrito.'); return; } track('whatsapp', { lugar: 'resultado' }); });

  // ---- Carta compartible en imagen (lienzo) ----
  const svgImg = svg => new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="560" height="940" ')); });
  const marco = (x, px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  function texto(x, s, px, py, size, op, ls, fam, w, st, anchor) {
    x.font = `${st || 'normal'} ${w} ${size}px ${fam}`; x.fillStyle = C.LINEA; x.globalAlpha = op; x.textBaseline = 'alphabetic';
    if (!ls) { x.textAlign = anchor === 'end' ? 'right' : 'center'; x.fillText(s, px, py); x.globalAlpha = 1; return; }
    const chars = [...s], ws = chars.map(ch => x.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
    let cx = anchor === 'end' ? px - total : px - total / 2; x.textAlign = 'left';
    chars.forEach((ch, i) => { x.fillText(ch, cx, py); cx += ws[i] + ls; }); x.globalAlpha = 1;
  }
  function lineas(x, s, ancho, ls = 0) { const out = []; let l = ''; s.split(' ').forEach(p => { const t = l ? l + ' ' + p : p; if (x.measureText(t).width + ls * (t.length - 1) > ancho && l) { out.push(l); l = p; } else l = t; }); if (l) out.push(l); return out; }
  async function imagen(id, formato, cieloTxt) {
    const d = ARC[id], hist = formato !== 'cuadrado', W = 1080, H = hist ? 1920 : 1080;
    try { await Promise.all([document.fonts.load('italic 500 60px "Cormorant Garamond"'), document.fonts.load('500 30px "Cormorant Garamond"'), document.fonts.load('600 20px "DM Sans"'), document.fonts.load('400 30px "Noto Serif Hebrew"')]); } catch (e) { /* sigue con las fuentes disponibles */ }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a3a'); g.addColorStop(.38, '#4b2850'); g.addColorStop(.72, '#7e4560'); g.addColorStop(1, '#c47a76'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const gy = hist ? 560 : H * .45, rg = x.createRadialGradient(W / 2, gy, 10, W / 2, gy, hist ? 640 : 560); rg.addColorStop(0, 'rgba(247,183,145,.30)'); rg.addColorStop(1, 'rgba(247,183,145,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    marco(x, 30, 30, W - 60, H - 60, 36); x.strokeStyle = 'rgba(247,227,200,.45)'; x.lineWidth = 1.5; x.stroke();
    const im = await svgImg(C.caraSinTexto(id));
    const cw = hist ? 500 : 430, cx = hist ? (W - cw) / 2 : 96, ch = cw * 940 / 560, cy = hist ? 372 : (H - ch) / 2, k = cw / 560;
    x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 50; x.shadowOffsetY = 30; x.drawImage(im, cx, cy, cw, ch); x.restore();
    C.textos(id).forEach(t => texto(x, t.s, cx + t.x * k, cy + t.y * k, t.size * k, t.o, t.ls * k, t.fam, t.w, t.st, t.anchor));
    if (hist) {
      texto(x, 'TU CARTA DE HOY', W / 2, 308, 22, .78, 10, C.SANS, 600);
      x.font = `italic 500 66px ${C.SERIF}`; const ls = lineas(x, d.frase, 880); ls.forEach((l, i) => texto(x, l, W / 2, 1306 + i * 68, 66, 1, 0, C.SERIF, 500, 'italic'));
      const yc = 1306 + ls.length * 68 + 16; if (cieloTxt) texto(x, cieloTxt.toUpperCase(), W / 2, yc, 20, .74, 7, C.SANS, 600);
      texto(x, 'artedeastro', W / 2, yc + (cieloTxt ? 66 : 20), 34, .95, 7, C.SERIF, 500, 'italic');
    } else {
      const mx = 800;
      texto(x, 'TU CARTA DE HOY', mx, 260, 19, .78, 8, C.SANS, 600);
      x.font = `italic 500 54px ${C.SERIF}`; const ls = lineas(x, d.frase, 400); ls.forEach((l, i) => texto(x, l, mx, 350 + i * 58, 54, 1, 0, C.SERIF, 500, 'italic'));
      const yc = 350 + ls.length * 58 + 26; if (cieloTxt) { x.font = `600 17px ${C.SANS}`; lineas(x, cieloTxt.toUpperCase(), 390, 5).forEach((l, i) => texto(x, l, mx, yc + i * 30, 17, .74, 5, C.SANS, 600)); }
      texto(x, 'artedeastro', mx, 860, 32, .95, 6, C.SERIF, 500, 'italic');
    }
    return new Promise((ok, mal) => cv.toBlob(b => b ? ok(b) : mal(new Error('sin imagen')), 'image/png'));
  }
  window.RITUAL = { imagen, mostrar, ARC };    // para pruebas
})();
