/* La carta de hoy · oferta, pago y lectura (Fase 3).
   INACTIVO en la web pública: solo se enciende en el Design Lab (window.ADE_LAB) o si la página define window.ADE_PAGO_API (dirección del servidor real).
   En el laboratorio no hay servidor: el mismo código del servidor (servidor/worker.js) se ejecuta dentro del navegador con una pasarela de prueba.
   No se cobra nada y no se envía nada a ningún sitio. */
(() => {
  'use strict';
  const LAB = !!window.ADE_LAB, API = window.ADE_PAGO_API || '';
  if (!LAB && !API) return;
  const $ = id => document.getElementById(id);
  const ARC = window.ARCANOS, APOYO = window.ARCANOS_APOYO || [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const evento = (n, p) => { try { if (window.adeTrack) window.adeTrack(n, p); } catch (e) { /* sin medición */ } };
  const eur = c => (c / 100).toFixed(2).replace('.', ',') + ' €';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }, del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } } };
  const PRECIOS = { lectura: 299, paquete3: 699, regalo: 399 };
  const NOMBRES = { lectura: 'Lectura profunda', paquete3: 'Paquete de 3 lecturas', regalo: 'Regalar una lectura' };
  const DESISTIMIENTO = 'Quiero que la lectura se me entregue ahora mismo y entiendo que, una vez entregada, pierdo el derecho de desistimiento.';

  // ---- Servidor: el real (ADE_PAGO_API) o el simulado dentro del navegador ----
  let sim = null;
  async function cargarSim() {
    const base = new URL(window.ADE_ROOT || './', location.href);
    const [w, a, l] = await Promise.all([import(new URL('servidor/worker.js', base).href), import(new URL('servidor/almacen.js', base).href), import(new URL('servidor/lector-sim.js', base).href)]);
    let sec = store.get('ads'); if (!sec) { sec = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join(''); store.set('ads', sec); }
    return { worker: w, env: { almacen: a.almacenLocal('ade_sim:'), SECRETO: sec, PASARELA: 'sim', LECTOR: l.crearLectorSim(ARC, APOYO), ORIGENES: [] } };
  }
  async function llamar(ruta, cuerpo, metodo) {
    metodo = metodo || 'POST';
    try {
      if (API) { const r = await fetch(API + ruta, { method: metodo, headers: { 'content-type': 'application/json' }, body: metodo === 'GET' ? undefined : JSON.stringify(cuerpo) }); return Object.assign({ status: r.status }, await r.json()); }
      if (!sim) sim = await cargarSim();
      const r = await sim.worker.default.fetch(new Request('https://sim.local' + ruta, { method: metodo, headers: { 'content-type': 'application/json' }, body: metodo === 'GET' ? undefined : JSON.stringify(cuerpo) }), sim.env);
      return Object.assign({ status: r.status }, await r.json());
    } catch (e) { return { status: 0, error: 'red', mensaje: 'No hemos podido conectar. No se ha cobrado nada.' }; }
  }

  // ---- Estado local (solo en este navegador) ----
  const llave = () => store.get('adk');
  const lecturaHoy = id => { const l = store.get('adl'); return l && l.f === hoy() && l.c === id ? l : null; };
  const regalo = (() => { const m = /^([\w-]+)\.([\w-]+)$/.exec(new URLSearchParams(location.search).get('regalo') || ''); if (!m) return null; let d = ''; try { const h = /(?:^|[#&])d=([^&]*)/.exec(location.hash); d = h ? decodeURIComponent(h[1]).slice(0, 120) : ''; } catch (e) { d = ''; } return { id: m[1], secreto: m[2], dedicatoria: d }; })();
  let carta = null, vistaOferta = false;

  // ---- Interfaz ----
  const cielo = () => { const c = window.cieloDeHoy && window.cieloDeHoy(); return c ? { luna: c.luna, sol: c.sol, fase: c.fase } : null; };
  const ancla = $('ia-propia'); if (!ancla) return;
  const oferta = document.createElement('div'); oferta.className = 'oferta'; oferta.id = 'oferta'; oferta.hidden = true;
  oferta.innerHTML = `
    <div class="of-cab"><p class="kicker">Tu lectura profunda</p>${LAB ? '<span class="of-sim">Simulación · no se cobra nada</span>' : ''}</div>
    <div id="of-pedir">
      <p class="of-muestra" id="of-muestra"></p>
      <p class="of-aviso" id="of-aviso">Esto es el comienzo de tu lectura.</p>
      <label class="campo" for="of-pregunta">¿Algo que quieras tener en cuenta? <span>(opcional)</span></label>
      <input class="entrada" id="of-pregunta" type="text" maxlength="200" autocomplete="off" placeholder="Por ejemplo: ¿qué necesito mirar hoy?">
      <div class="of-acciones"><button class="btn btn-primario" id="of-seguir" type="button"></button><button class="btn btn-sec" id="of-no" type="button">Ahora no</button></div>
      <p class="of-micro" id="of-micro">La escribe una IA con el estilo de artedeastro, no Eva. Pago único, sin suscripción, con IVA incluido.</p>
      <p class="of-alt"><a href="#ia-propia" id="of-gratis">Prefiero usar mi propia IA (gratis)</a></p>
      <p class="of-mas" id="of-mas"><button class="enl-btn" id="of-regalo" type="button">Regalar una lectura · ${eur(PRECIOS.regalo)}</button> · <button class="enl-btn" id="of-paquete" type="button">Paquete de 3 lecturas · ${eur(PRECIOS.paquete3)}</button> · <button class="enl-btn" id="of-recuperar" type="button">Ya tengo un código</button></p>
    </div>
    <div id="of-aviso-grave" class="of-grave" hidden></div>
    <p class="estado" id="of-estado" role="status" aria-live="polite"></p>`;
  ancla.parentNode.insertBefore(oferta, ancla);
  const lectura = document.createElement('div'); lectura.className = 'lectura-pro'; lectura.id = 'lectura-pro'; lectura.hidden = true;
  ancla.parentNode.insertBefore(lectura, ancla);
  const dlg = document.createElement('dialog'); dlg.className = 'pg'; dlg.id = 'dlg-pago'; dlg.setAttribute('aria-labelledby', 'pg-t'); document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  const estado = t => { $('of-estado').textContent = t || ''; };

  const refrescarOferta = () => {
    if (carta === null) return;
    const l = lecturaHoy(carta), k = llave();
    if (l) { oferta.hidden = true; pintarLectura(l.texto, l.codigo, l.restantes, false); return; }
    lectura.hidden = true; oferta.hidden = false;
    const a = APOYO[carta] || {}; $('of-muestra').textContent = (a.sentido || ARC[carta].frase) + ' …';
    const boton = $('of-seguir');
    if (regalo && !(k && k.regalo === regalo.id)) { boton.textContent = 'Abrir mi regalo'; boton.dataset.modo = 'regalo'; $('of-micro').textContent = 'Es un regalo: no pagas nada. La escribe una IA con el estilo de artedeastro, no Eva.'; }
    else if (k && k.restantes > 0) { boton.textContent = `Leer con mi paquete (quedan ${k.restantes})`; boton.dataset.modo = 'llave'; }
    else { boton.textContent = `Seguir leyendo · ${eur(PRECIOS.lectura)}`; boton.dataset.modo = 'pagar'; }
    $('of-aviso-grave').hidden = true; $('of-pedir').hidden = false;
    if (!vistaOferta && 'IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); vistaOferta = true; evento('oferta_vista', { producto: 'lectura', value: PRECIOS.lectura / 100, currency: 'EUR' }); } }, { threshold: .5 }); io.observe(oferta); }
  };

  // ---- Lectura ----
  function pintarLectura(texto, codigo, restantes, nueva) {
    oferta.hidden = true; lectura.hidden = false;
    const ps = String(texto).split(/\n{2,}/).map((p, i) => `<p style="--i:${nueva && !reduce ? i : 0}">${esc(p)}</p>`).join('');
    lectura.innerHTML = `
      <div class="of-cab"><p class="kicker">Tu lectura profunda · ${esc(ARC[carta].nombre)}</p>${LAB ? '<span class="of-sim">Simulación · lectura de prueba</span>' : ''}</div>
      <div class="lp ${nueva ? 'nueva' : ''}">${ps}</div>
      <div class="of-acciones"><button class="btn btn-primario" id="lp-copiar" type="button">Copiar mi lectura</button><button class="btn btn-sec" id="lp-enviar" type="button">Enviar mi carta a una amiga</button></div>
      <p class="estado" id="lp-estado" role="status" aria-live="polite"></p>
      ${codigo ? `<div class="codigo"><span>Tu código de compra</span><b>${esc(codigo)}</b><small>Guárdalo: sirve para recuperar tu lectura o tus créditos en otro móvil.</small></div>` : ''}
      ${restantes > 0 ? `<p class="of-micro">Te quedan ${restantes} ${restantes === 1 ? 'lectura' : 'lecturas'} para otros días.</p>` : ''}
      <p class="of-micro">Tu lectura se guarda solo en este navegador. Es una herramienta de reflexión, no una predicción.</p>`;
    $('lp-copiar').onclick = async () => { try { await navigator.clipboard.writeText(texto); $('lp-estado').textContent = 'Lectura copiada.'; } catch (e) { $('lp-estado').textContent = 'No se ha podido copiar. Selecciona el texto y cópialo a mano.'; } };
    $('lp-enviar').onclick = () => $('b-enviar') && $('b-enviar').click();
    if (nueva) lectura.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  async function leer(k, pregunta) {
    estado('Escribiendo tu lectura…'); $('of-seguir').disabled = true;
    const r = await llamar('/api/lectura', { llave: k.llave, carta, cielo: cielo(), pregunta });
    $('of-seguir').disabled = false; estado('');
    if (r.estado === 'ok') {
      store.set('adk', Object.assign({}, k, { restantes: r.restantes }));
      store.set('adl', { f: hoy(), c: carta, texto: r.texto, codigo: k.codigo, restantes: r.restantes });
      pintarLectura(r.texto, k.codigo, r.restantes, true); return true;
    }
    if (r.estado === 'acompanar') return acompanar(r.mensaje);
    if (r.reembolso) { store.del('adk'); refrescarOferta(); }
    estado(r.mensaje || 'No hemos podido escribir tu lectura ahora.');
    return false;
  }
  function acompanar(msg) { $('of-pedir').hidden = true; const g = $('of-aviso-grave'); g.hidden = false; g.innerHTML = `<p>${esc(msg)}</p>`; return false; }

  // ---- Diálogo de pago ----
  const abrir = html => { dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); const f = dlg.querySelector('input,button'); if (f) f.focus(); };
  const cerrarPaso = '<button class="enl-btn cerrar" type="button" data-cerrar aria-label="Cerrar">Cerrar</button>';
  dlg.addEventListener('click', e => { if (e.target.closest('[data-cerrar]')) dlg.close(); });

  function resumen(producto) {
    const pre = $('of-pregunta').value.trim();
    const regaloUi = producto === 'regalo';
    abrir(`${cerrarPaso}
      <p class="kicker">${LAB ? 'Simulación · no se cobra nada' : 'Pago seguro'}</p>
      <h3 id="pg-t">${esc(NOMBRES[producto])}</h3>
      <p class="pg-precio">${eur(PRECIOS[producto])} <small>IVA incluido · pago único, sin suscripción</small></p>
      <ul class="pg-lista">${producto === 'paquete3' ? '<li>3 lecturas profundas, una por cada carta de los próximos días.</li><li>Caducan a los 12 meses.</li>' : regaloUi ? '<li>Tu amiga saca su carta y recibe su lectura profunda sin pagar.</li><li>Tu dedicatoria viaja en el enlace y no se guarda en ningún sitio.</li>' : '<li>Una lectura de unas 400 palabras para tu carta de hoy.</li><li>Se guarda solo en este navegador.</li>'}<li>La escribe una IA con el estilo de artedeastro. <b>No es Eva.</b></li></ul>
      ${regaloUi ? '<label class="campo" for="pg-dedic">Unas palabras para ella <span>(hasta 120 caracteres)</span></label><input class="entrada" id="pg-dedic" maxlength="120" autocomplete="off" placeholder="Por ejemplo: Para que hoy te mires con calma.">' : ''}
      ${pre && !regaloUi ? `<p class="pg-nota">Tu pregunta («${esc(pre.slice(0, 60))}${pre.length > 60 ? '…' : ''}») se envía a la IA para escribir tu lectura y <b>no se guarda</b>.</p>` : ''}
      <label class="pg-check"><input type="checkbox" id="pg-ok"><span>${esc(DESISTIMIENTO)}</span></label>
      <div class="of-acciones"><button class="btn btn-primario" id="pg-pagar" type="button" disabled>Pagar · ${eur(PRECIOS[producto])}</button><button class="btn btn-sec" type="button" data-cerrar>Ahora no</button></div>
      <p class="of-micro">Si algo falla y no recibes tu lectura, te devolvemos el dinero automáticamente. Mayores de 18 años.</p>
      <p class="estado" id="pg-estado" role="status" aria-live="polite"></p>`);
    $('pg-ok').onchange = () => { $('pg-pagar').disabled = !$('pg-ok').checked; };
    $('pg-pagar').onclick = () => iniciarPago(producto, regaloUi ? ($('pg-dedic').value || '').trim().slice(0, 120) : '');
  }
  async function iniciarPago(producto, dedicatoria) {
    const pre = $('of-pregunta').value.trim(); $('pg-pagar').disabled = true; $('pg-estado').textContent = 'Preparando el pago…';
    const r = await llamar('/api/checkout', { producto, carta, pregunta: producto === 'regalo' ? '' : pre, consentimiento: true });
    if (r.estado === 'acompanar') { dlg.close(); acompanar(r.mensaje); return; }
    if (r.estado !== 'pendiente') { $('pg-estado').textContent = r.mensaje || 'No hemos podido abrir el pago. No se ha cobrado nada.'; $('pg-pagar').disabled = false; return; }
    evento('pago_iniciado', { producto, value: PRECIOS[producto] / 100, currency: 'EUR' });
    if (r.pasarela === 'stripe') { location.href = r.url; return; }
    pasarelaSim(r.pedido, producto, dedicatoria);
  }
  function pasarelaSim(pedido, producto, dedicatoria) {
    abrir(`${cerrarPaso}
      <p class="kicker sim-rojo">Pasarela de prueba · no se cobra nada</p>
      <h3 id="pg-t">${esc(NOMBRES[producto])} · ${eur(PRECIOS[producto])}</h3>
      <fieldset class="pg-tarjetas"><legend>Elige qué quieres probar</legend>
        <label><input type="radio" name="tj" value="ok" checked><span><b>Tarjeta de prueba 4242 4242 4242 4242</b> Pago correcto</span></label>
        <label><input type="radio" name="tj" value="rechazada"><span><b>Tarjeta 4000 0000 0000 0002</b> Pago rechazado</span></label>
        <label><input type="radio" name="tj" value="ok_fallo_entrega"><span><b>Pago correcto, pero la entrega falla</b> Prueba del reembolso automático</span></label>
      </fieldset>
      <div class="of-acciones"><button class="btn btn-primario" id="sg-pagar" type="button">Pagar ${eur(PRECIOS[producto])}</button><button class="btn btn-sec" type="button" data-cerrar>Cancelar</button></div>
      <p class="estado" id="pg-estado" role="status" aria-live="polite"></p>`);
    $('sg-pagar').onclick = async () => {
      const res = (dlg.querySelector('input[name=tj]:checked') || {}).value || 'ok';
      $('sg-pagar').disabled = true; $('pg-estado').textContent = 'Procesando el pago…';
      const p = await llamar('/api/sim/pagar', { pedido, resultado: res });
      if (p.estado === 'rechazada') { $('pg-estado').textContent = p.mensaje; $('sg-pagar').disabled = false; return; }
      if (p.estado !== 'pagado') { $('pg-estado').textContent = 'No hemos podido completar el pago. No se ha cobrado nada.'; $('sg-pagar').disabled = false; return; }
      completarPago(pedido, producto, dedicatoria);
    };
  }
  async function completarPago(pedido, producto, dedicatoria) {
    abrir(`${cerrarPaso}<h3 id="pg-t">Pago correcto</h3><p class="pg-nota" id="pg-estado" role="status">Recogiendo tu compra…</p>`);
    const c = await llamar('/api/canjear', { pedido });
    if (c.estado !== 'ok') { $('pg-estado').textContent = 'El pago está hecho pero no hemos podido recoger tu compra. Usa «Ya tengo un código» o escribe a Eva.'; return; }
    evento('pago_completado', { producto, value: PRECIOS[producto] / 100, currency: 'EUR' });
    if (c.regalo) { mostrarRegalo(c.regalo, c.codigo, dedicatoria); return; }
    const k = { llave: c.llave, codigo: c.codigo, restantes: c.restantes }; store.set('adk', k);
    dlg.close(); refrescarOferta(); await leer(k, $('of-pregunta').value.trim());
  }
  function mostrarRegalo(g, codigo, dedicatoria) {
    const url = new URL(location.href); url.search = '?regalo=' + g.id + '.' + g.secreto + '&o=regalo'; url.hash = dedicatoria ? 'd=' + encodeURIComponent(dedicatoria) : '';
    const enlace = url.href;
    evento('regalo_enviado', { producto: 'regalo' });
    abrir(`${cerrarPaso}
      <p class="kicker">Regalo listo</p><h3 id="pg-t">Envíale este enlace a tu amiga</h3>
      <p class="pg-nota">Cuando lo abra, sacará <b>su</b> carta y recibirá <b>su</b> lectura sin pagar. ${dedicatoria ? 'Tu dedicatoria va dentro del enlace.' : ''}</p>
      <input class="entrada" id="rg-url" readonly value="${esc(enlace)}" aria-label="Enlace del regalo">
      <div class="of-acciones"><button class="btn btn-primario" id="rg-copiar" type="button">Copiar el enlace</button><button class="btn btn-sec" id="rg-enviar" type="button">Enviar por WhatsApp</button></div>
      <p class="estado" id="pg-estado" role="status" aria-live="polite"></p>
      <div class="codigo"><span>Tu código de compra</span><b>${esc(codigo)}</b><small>Con él puedes recuperar este enlace si lo pierdes.</small></div>`);
    $('rg-copiar').onclick = async () => { try { await navigator.clipboard.writeText(enlace); $('pg-estado').textContent = 'Enlace copiado.'; } catch (e) { $('rg-url').select(); $('pg-estado').textContent = 'Cópialo a mano (Ctrl+C).'; } };
    $('rg-enviar').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent('Te regalo tu lectura de la carta de hoy ✦ ' + enlace), '_blank', 'noopener');
  }
  function recuperarUi() {
    abrir(`${cerrarPaso}<h3 id="pg-t">Recuperar mi compra</h3>
      <p class="pg-nota">Escribe el código que te dimos al pagar (tiene 12 letras y números).</p>
      <input class="entrada" id="rc-codigo" autocomplete="off" placeholder="ABCD-EFGH-JKMN" aria-label="Código de compra">
      <div class="of-acciones"><button class="btn btn-primario" id="rc-ir" type="button">Recuperar</button><button class="btn btn-sec" type="button" data-cerrar>Cerrar</button></div>
      <p class="estado" id="pg-estado" role="status" aria-live="polite"></p>`);
    $('rc-ir').onclick = async () => {
      const r = await llamar('/api/recuperar', { codigo: $('rc-codigo').value }); if (r.estado !== 'ok') { $('pg-estado').textContent = r.mensaje || 'No hemos podido recuperarla.'; return; }
      if (r.regalo) { mostrarRegalo(r.regalo, normalizar($('rc-codigo').value), ''); return; }
      store.set('adk', { llave: r.llave, codigo: normalizar($('rc-codigo').value), restantes: r.restantes }); dlg.close(); refrescarOferta();
      estado(r.restantes > 0 ? `Compra recuperada: te quedan ${r.restantes}.` : 'Compra recuperada. Ya no te quedan lecturas.');
    };
  }
  const normalizar = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');

  // ---- Eventos de la oferta ----
  $('of-seguir').onclick = async () => {
    const modo = $('of-seguir').dataset.modo, pre = $('of-pregunta').value.trim();
    if (modo === 'pagar') resumen('lectura');
    else if (modo === 'llave') { await leer(llave(), pre); }
    else if (modo === 'regalo' && regalo) {
      estado('Abriendo tu regalo…'); const r = await llamar('/api/regalo/abrir', { id: regalo.id, secreto: regalo.secreto });
      if (r.estado !== 'ok') { estado(r.mensaje || 'No hemos podido abrir el regalo.'); return; }
      evento('regalo_abierto', { producto: 'regalo' });
      const k = { llave: r.llave, codigo: '', restantes: r.restantes, regalo: regalo.id }; store.set('adk', k); await leer(k, pre);
    }
  };
  $('of-no').onclick = () => { oferta.classList.toggle('plegada'); $('of-no').textContent = oferta.classList.contains('plegada') ? 'Ver la lectura profunda' : 'Ahora no'; };
  $('of-paquete').onclick = () => resumen('paquete3');
  $('of-regalo').onclick = () => resumen('regalo');
  $('of-recuperar').onclick = recuperarUi;
  $('of-gratis').onclick = () => { const d = $('ia-propia'); if (d) { d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } };

  // ---- Banner del regalo para quien lo recibe, y reinicio de la simulación ----
  if (regalo) {
    const h = document.querySelector('.hero'); const b = document.createElement('div'); b.className = 'invitacion regalo-ban';
    b.innerHTML = `<div><p><strong>Una amiga te regala tu lectura de hoy.</strong>${regalo.dedicatoria ? `<br><span class="dedic">«${esc(regalo.dedicatoria)}»</span>` : ''}<br>Saca tu carta y ábrela.</p></div>`;
    if (h) h.insertBefore(b, h.firstChild);
  }
  if (LAB) {
    const r = document.createElement('div'); r.className = 'sim-barra'; r.innerHTML = 'Simulación de cobro · <button class="enl-btn" type="button" id="sim-reset">Reiniciar la simulación</button>'; document.body.appendChild(r);
    $('sim-reset').onclick = () => { try { Object.keys(localStorage).filter(k => k.startsWith('ade_sim:') || ['adk', 'adl', 'ads'].includes(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* sin almacenamiento */ } location.reload(); };
  }

  window.ADE_PAGO = { carta(id) { carta = id; refrescarOferta(); } };
})();
