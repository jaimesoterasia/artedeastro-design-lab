/* artedeastro · medición y consentimiento de cookies (versión 2: web de Eva + «La carta de hoy»).
   - Cada herramienta solo existe si tiene su identificador abajo. Con todos vacíos no se carga nada y no se muestra ningún aviso.
   - Cloudflare Web Analytics no usa cookies: cuenta visitas sin consentimiento (no admite eventos propios).
   - Google Analytics, Microsoft Clarity y el píxel de Meta usan cookies: solo se cargan, y solo reciben eventos, si la persona los acepta.
   - Los eventos solo llevan los campos permitidos de la lista EVENTOS: nunca texto escrito por la persona, ni nombres, ni correos.
   - La política de cookies (cookies.html) lee la lista de herramientas, así que siempre dice lo que de verdad está activo.
   - Este archivo sustituye al medicion.js de la web de Eva (rama `medicion-en-espera`) cuando se publique: lleva sus mismos eventos más los de la carta. */
(() => {
  'use strict';

  // ← Aquí se pegan los identificadores (ver docs/medicion-web.md). Vacío = herramienta apagada.
  const CONFIG = Object.assign({
    CF_TOKEN: '',     // Cloudflare Web Analytics (token del sitio)
    GA4_ID: '',       // Google Analytics 4, formato G-XXXXXXXXXX
    CLARITY_ID: '',   // Microsoft Clarity, id del proyecto
    PIXEL_ID: ''      // Píxel de Meta, id numérico
  }, window.ADE_CONFIG || {});

  // En el Design Lab no se carga ninguna etiqueta real: solo se enseña lo que haría.
  // «?cookies» activa el aviso de demostración y «?eventos» además un panel con cada evento y a dónde iría.
  const LAB = !!(window.LAB_SIM || window.ADE_LAB);
  const VER = LAB && /[?&]eventos\b/.test(location.search);
  const DEMO = LAB && /[?&](cookies|eventos)\b/.test(location.search);
  if (DEMO) Object.assign(CONFIG, { GA4_ID: 'G-DEMO', CLARITY_ID: 'demo', PIXEL_ID: '0000' });
  const TEMA = window.ADE_TEMA === 'amanecer' ? 'amanecer' : 'arte';
  const URL_COOKIES = LAB ? 'https://artedeastro.com/cookies.html' : '/cookies.html';

  const HERRAMIENTAS = [
    { id: 'cf', cfg: 'CF_TOKEN', cat: 'estadística', consent: false, nombre: 'Cloudflare Web Analytics', prov: 'Cloudflare, Inc.',
      fin: 'Contar visitas y páginas vistas de forma agregada. No usa cookies ni identifica a nadie.', cookies: 'Ninguna', url: 'https://www.cloudflare.com/privacypolicy/' },
    { id: 'ga4', cfg: 'GA4_ID', cat: 'medicion', consent: true, nombre: 'Google Analytics 4', prov: 'Google Ireland Ltd.',
      fin: 'Estadísticas de uso: páginas vistas, de dónde llegas, tipo de dispositivo, país aproximado, cartas sacadas, envíos a amigas y clics en WhatsApp.', cookies: '_ga y _ga_* (hasta 13 meses)', url: 'https://policies.google.com/privacy' },
    { id: 'clarity', cfg: 'CLARITY_ID', cat: 'medicion', consent: true, nombre: 'Microsoft Clarity', prov: 'Microsoft Corporation',
      fin: 'Mapas de calor y grabaciones anónimas de la navegación para mejorar la web. Los campos de los formularios y lo que escribes se ocultan.', cookies: '_clck (1 año) y _clsk (1 día)', url: 'https://privacy.microsoft.com/privacystatement' },
    { id: 'meta', cfg: 'PIXEL_ID', cat: 'publicidad', consent: true, nombre: 'Píxel de Meta', prov: 'Meta Platforms Ireland Ltd.',
      fin: 'Medir los anuncios de Instagram y Facebook y mostrárselos a quien ya ha visitado la web.', cookies: '_fbp (3 meses) y _fbc', url: 'https://www.facebook.com/privacy/policy/' }
  ].filter(h => CONFIG[h.cfg]);
  const conCookies = HERRAMIENTAS.filter(h => h.consent);

  const LS = 'ade_cookies';
  const leer = () => { try { const c = JSON.parse(localStorage.getItem(LS)); return c && c.v === 1 && Date.now() - c.t < 365 * 864e5 ? c : null; } catch (e) { return null; } };
  const guardar = c => { try { localStorage.setItem(LS, JSON.stringify(Object.assign({ v: 1, t: Date.now() }, c))); } catch (e) { /* sin almacenamiento */ } };
  const tiene = cat => conCookies.some(h => h.cat === cat);

  // ---- Carga de etiquetas ----
  const cargado = {};
  const script = (src, attrs) => {
    if (LAB) { console.info('[medición simulada] cargaría', src); return; }
    const s = document.createElement('script'); s.async = true; s.src = src;
    Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  };
  const cargar = id => {
    if (cargado[id]) return; cargado[id] = true;
    if (id === 'cf') script('https://static.cloudflareinsights.com/beacon.min.js', { defer: '', 'data-cf-beacon': JSON.stringify({ token: CONFIG.CF_TOKEN }) });
    if (id === 'ga4') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', CONFIG.GA4_ID);
      script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA4_ID));
    }
    if (id === 'clarity') {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      script('https://www.clarity.ms/tag/' + encodeURIComponent(CONFIG.CLARITY_ID));
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    }
    if (id === 'meta') {
      if (!window.fbq) {
        const n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!window._fbq) window._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      }
      script('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.PIXEL_ID); window.fbq('track', 'PageView');
    }
  };
  const aplicar = c => {
    if (c.medicion) HERRAMIENTAS.filter(h => h.cat === 'medicion').forEach(h => cargar(h.id));
    if (c.publicidad) HERRAMIENTAS.filter(h => h.cat === 'publicidad').forEach(h => cargar(h.id));
    if (cargado.meta || cargado.ga4 || cargado.clarity) vistaPagina();
    pintarPanel();
  };
  const borrarCookies = () => {
    const host = location.hostname, partes = host.split('.');
    const dominios = ['', host, '.' + host, '.' + partes.slice(-2).join('.')];
    document.cookie.split(';').map(x => x.split('=')[0].trim()).filter(n => /^(_ga|_fb|_clck|_clsk|CLID|MR|SM$|ANONCHK)/.test(n))
      .forEach(n => dominios.forEach(d => { document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + (d ? ';domain=' + d : ''); }));
  };

  // ---- Eventos ----
  // `ok` es la lista de campos permitidos: lo demás se descarta. Nunca texto libre, nombres ni correos.
  // Eventos de pago: solo se activarán cuando exista el cobro (Fase 3); aquí quedan definidos para medir el embudo completo.
  const EVENTOS = {
    // Web de Eva
    whatsapp:           { meta: ['track', 'Contact'], ga: 'generate_lead', cl: 'whatsapp', ok: ['lugar', 'servicio', 'carta'] },
    ver_sesiones:       { meta: ['track', 'ViewContent'], ga: 'view_item_list', cl: 'ver_sesiones', ok: [] },
    testimonio_enviado: { meta: ['trackCustom', 'TestimonioEnviado'], ga: 'testimonio_enviado', cl: 'testimonio', ok: [] },
    instagram:          { meta: ['trackCustom', 'ClicInstagram'], ga: 'clic_instagram', cl: 'instagram', ok: [] },
    email:              { meta: ['trackCustom', 'ClicEmail'], ga: 'clic_email', cl: 'email', ok: [] },
    // La carta de hoy
    visita_carta:       { meta: ['trackCustom', 'VisitaCarta'], ga: 'visita_carta', cl: 'visita_carta', ok: ['origen', 'canal', 'gen', 'vuelve'] },
    carta_sacada:       { meta: ['trackCustom', 'CartaSacada'], ga: 'carta_sacada', cl: 'carta_sacada', ok: ['carta', 'origen', 'gen'] },
    compartir:          { meta: ['trackCustom', 'Compartir'], ga: 'share', cl: 'compartir', ok: ['carta', 'method', 'lugar', 'gen'], fijos: { content_type: 'carta' } },
    guardar_imagen:     { meta: ['trackCustom', 'GuardarImagen'], ga: 'guardar_imagen', cl: 'guardar_imagen', ok: ['formato'] },
    ia_texto_copiado:   { meta: ['trackCustom', 'IATextoCopiado'], ga: 'ia_texto_copiado', cl: 'ia_texto_copiado', ok: ['carta', 'con_pregunta'] },
    ia_abrir:           { meta: ['trackCustom', 'IAAbrir'], ga: 'ia_abrir', cl: 'ia_abrir', ok: ['destino'] },
    ejemplo_visto:      { meta: ['trackCustom', 'EjemploVisto'], ga: 'ejemplo_visto', cl: 'ejemplo_visto', ok: [] },
    baraja_vista:       { meta: ['trackCustom', 'BarajaVista'], ga: 'baraja_vista', cl: 'baraja_vista', ok: ['cartas', 'racha'] },
    // Cobro (futuro)
    oferta_vista:       { meta: ['track', 'ViewContent'], ga: 'view_item', cl: 'oferta_vista', ok: ['producto', 'value', 'currency'] },
    pago_iniciado:      { meta: ['track', 'InitiateCheckout'], ga: 'begin_checkout', cl: 'pago_iniciado', ok: ['producto', 'value', 'currency'] },
    pago_completado:    { meta: ['track', 'Purchase'], ga: 'purchase', cl: 'pago_completado', ok: ['producto', 'value', 'currency'] },
    regalo_enviado:     { meta: ['trackCustom', 'RegaloEnviado'], ga: 'regalo_enviado', cl: 'regalo_enviado', ok: ['producto'] },
    regalo_abierto:     { meta: ['trackCustom', 'RegaloAbierto'], ga: 'regalo_abierto', cl: 'regalo_abierto', ok: ['producto'] }
  };
  const limpiar = (e, p) => {
    const o = {}; p = p || {};
    e.ok.forEach(k => {
      let v = p[k]; if (v === undefined || v === null) return;
      if (typeof v === 'string') v = v.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 40);
      else if (typeof v === 'number') { if (!isFinite(v)) return; }
      else if (typeof v !== 'boolean') return;
      if (v === '') return; o[k] = v;
    });
    return Object.assign(o, e.fijos || {});
  };
  window.ADE_EVENTOS = [];
  const track = (nombre, p) => {
    const e = EVENTOS[nombre]; if (!e) return;
    const datos = limpiar(e, p), activos = ['ga4', 'clarity', 'meta'].filter(k => cargado[k]);
    if (LAB) { window.ADE_EVENTOS.push({ t: Date.now(), nombre, datos, activos }); pintarPanel(); }
    if (LAB) { if (activos.length) console.info('[medición simulada] evento', nombre, datos); return; }
    if (cargado.meta && window.fbq) window.fbq(e.meta[0], e.meta[1], datos);
    if (cargado.ga4 && window.gtag) window.gtag('event', e.ga, Object.assign({ canal: nombre }, datos));
    if (cargado.clarity && window.clarity) window.clarity('event', e.cl);
  };
  window.adeTrack = track;
  // Cada visita a la carta se cuenta una vez, y solo si hay consentimiento (la carta deja su contexto en window.ADE_CTX)
  let visitaContada = false;
  const vistaPagina = () => {
    if (/sesiones(\.html)?$/.test(location.pathname)) track('ver_sesiones');
    if (window.ADE_CTX && !visitaContada) { visitaContada = true; track('visita_carta', window.ADE_CTX); }
  };

  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '', sec = a.closest('section,footer');
    if (a.dataset.ev === 'whatsapp' || /wa\.me\//.test(h)) {
      if (/wa\.me\/\?text=/.test(h)) return;                // «Enviar a una amiga» no es un contacto con Eva
      const m = (a.dataset.wa || '').match(/Lectura:\s*([^\n]+)/);
      track('whatsapp', { lugar: (sec && (sec.id || sec.className.split(' ')[0])) || 'pagina', servicio: m ? m[1].trim().slice(0, 60) : undefined });
    } else if (/instagram\.com/.test(h)) track('instagram');
    else if (/^mailto:/.test(h)) track('email');
  }, true);

  // ---- Aviso de cookies ----
  const CSS_ARTE = `
  .ade-ck{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:620px;margin:0 auto;padding:22px 24px;background:#FBF6EC;color:#141014;border:3px solid #141014;border-radius:22px;box-shadow:8px 8px 0 #141014;font:16px/1.5 'DM Sans',Arial,sans-serif}
  .ade-ck h2{margin:0 0 6px;font:800 28px/1 'Bricolage Grotesque',Impact,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:-.01em}
  .ade-ck p{margin:0 0 14px}.ade-ck a{color:inherit;text-underline-offset:3px}
  .ade-ck__b{display:flex;flex-wrap:wrap;gap:10px}
  .ade-ck button{flex:1 1 130px;min-height:46px;padding:0 16px;border:3px solid #141014;border-radius:999px;background:#FBF6EC;color:#141014;font:800 16px 'Bricolage Grotesque',Impact,sans-serif;font-stretch:75%;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;box-shadow:3px 3px 0 #141014}
  .ade-ck button.ade-si{background:#F6D54A}
  .ade-ck button:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 #141014}.ade-ck button:focus-visible,.ade-ck input:focus-visible{outline:3px solid #8A5CF0;outline-offset:2px}
  .ade-ck__o{margin:0 0 14px;padding:0;border:0;display:grid;gap:10px}
  .ade-ck__o label{display:flex;gap:12px;align-items:flex-start;font-size:15px;line-height:1.4}
  .ade-ck__o input{width:22px;height:22px;margin:2px 0 0;accent-color:#8A5CF0;flex:none}
  .ade-ck__o b{display:block}
  @media (max-width:520px){.ade-ck{padding:18px}.ade-ck h2{font-size:24px}}`;
  // Tema «Amanecer» (La carta de hoy): cristal oscuro; «Rechazar» y «Aceptar» con el mismo tamaño y peso
  const CSS_AMANECER = `
  .ade-ck{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:600px;margin:0 auto;padding:22px 24px;background:rgba(42,26,58,.96);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#FBEBDD;border:1px solid rgba(247,227,200,.5);border-radius:26px;box-shadow:0 24px 60px rgba(0,0,0,.5);font:16px/1.5 'DM Sans',system-ui,Arial,sans-serif}
  .ade-ck h2{margin:0 0 6px;font:italic 500 30px/1.05 'Cormorant Garamond',Georgia,serif}
  .ade-ck p{margin:0 0 14px;font-size:15px}.ade-ck a{color:#F7E3C8;text-underline-offset:3px}
  .ade-ck__b{display:flex;flex-wrap:wrap;gap:10px}
  .ade-ck button{flex:1 1 130px;min-height:48px;padding:0 16px;border:1.5px solid #F7E3C8;border-radius:999px;background:transparent;color:#FBEBDD;font:600 13px 'DM Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
  .ade-ck button.ade-si{background:linear-gradient(135deg,#F7B791,#E5579E);border-color:transparent;color:#2a1a3a}
  .ade-ck button:hover{filter:brightness(1.12)}.ade-ck button:focus-visible,.ade-ck input:focus-visible{outline:2px solid #F7B791;outline-offset:3px}
  .ade-ck__o{margin:0 0 14px;padding:0;border:0;display:grid;gap:10px}
  .ade-ck__o label{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.4}
  .ade-ck__o input{width:22px;height:22px;margin:2px 0 0;accent-color:#E5579E;flex:none}
  .ade-ck__o b{display:block}
  @media (max-width:520px){.ade-ck{padding:18px}.ade-ck h2{font-size:26px}}`;
  let caja = null;
  const cerrar = () => { if (caja) { caja.remove(); caja = null; } };
  const decidir = (c) => {
    const antes = leer();
    guardar(c); cerrar();
    const quita = antes && ((antes.medicion && !c.medicion) || (antes.publicidad && !c.publicidad));
    if (quita) { borrarCookies(); if (!LAB) location.reload(); return; }
    aplicar(c);
  };
  const lista = cat => conCookies.filter(h => h.cat === cat).map(h => h.nombre).join(', ');
  const mostrar = (abrirAjustes) => {
    if (caja) caja.remove();
    if (!document.getElementById('ade-ck-css')) { const s = document.createElement('style'); s.id = 'ade-ck-css'; s.textContent = TEMA === 'amanecer' ? CSS_AMANECER : CSS_ARTE; document.head.appendChild(s); }
    const actual = leer() || {};
    caja = document.createElement('div'); caja.className = 'ade-ck'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-labelledby', 'ade-ck-t'); caja.setAttribute('aria-modal', 'false');
    const opciones = `<fieldset class="ade-ck__o">
      ${tiene('medicion') ? `<label><input type="checkbox" id="ade-m" ${actual.medicion ? 'checked' : ''}><span><b>Medición</b>Estadísticas de visitas y de uso de la web (${lista('medicion')}).</span></label>` : ''}
      ${tiene('publicidad') ? `<label><input type="checkbox" id="ade-p" ${actual.publicidad ? 'checked' : ''}><span><b>Publicidad</b>Mide mis anuncios y permite mostrarlos a quien ya ha visitado la web (${lista('publicidad')}).</span></label>` : ''}
    </fieldset>`;
    caja.innerHTML = `<h2 id="ade-ck-t">Tú decides</h2>
      <p>${abrirAjustes ? 'Elige qué quieres permitir. Puedes cambiarlo cuando quieras.' : 'Para saber cuánta gente visita la web y mejorar mis anuncios uso herramientas de medición y de publicidad. Solo se activan si las aceptas. Nunca recogen lo que escribes.'} <a href="${URL_COOKIES}">Más información</a></p>
      ${abrirAjustes ? opciones : ''}
      <div class="ade-ck__b">${abrirAjustes
        ? '<button type="button" data-a="guardar" class="ade-si">Guardar mi elección</button>'
        : '<button type="button" data-a="no">Rechazar</button><button type="button" data-a="ajustes">Configurar</button><button type="button" data-a="si" class="ade-si">Aceptar todo</button>'}</div>`;
    caja.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'si') decidir({ medicion: tiene('medicion'), publicidad: tiene('publicidad') });
      else if (a === 'no') decidir({ medicion: false, publicidad: false });
      else if (a === 'ajustes') mostrar(true);
      else if (a === 'guardar') decidir({ medicion: !!(caja.querySelector('#ade-m') || {}).checked, publicidad: !!(caja.querySelector('#ade-p') || {}).checked });
    });
    document.body.appendChild(caja);
    const primero = caja.querySelector(abrirAjustes ? 'input,button' : 'button'); if (primero) primero.focus({ preventScroll: true });
  };

  // ---- Panel de eventos del laboratorio (solo con «?eventos»): enseña qué se mediría y a dónde iría ----
  let panel = null;
  function pintarPanel() {
    if (!VER) return;
    if (!panel) {
      const s = document.createElement('style'); s.textContent = `.ade-ev{position:fixed;z-index:2147482000;right:12px;top:78px;width:min(360px,calc(100vw - 24px));max-height:46vh;overflow:auto;padding:12px 14px;border-radius:16px;background:rgba(20,16,20,.94);color:#e9e2d8;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;border:1px solid rgba(255,255,255,.18)}
      .ade-ev h4{margin:0 0 6px;font:600 11px/1.3 system-ui;letter-spacing:.12em;text-transform:uppercase;color:#F7B791}.ade-ev .e{padding:5px 0;border-top:1px solid rgba(255,255,255,.1)}.ade-ev .n{color:#fff;font-weight:700}.ade-ev .ok{color:#7fe3a4}.ade-ev .no{color:#ff9b8a}.ade-ev button{margin-top:8px;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:600 11px system-ui;cursor:pointer}`;
      document.head.appendChild(s);
      panel = document.createElement('div'); panel.className = 'ade-ev'; panel.setAttribute('aria-live', 'polite'); document.body.appendChild(panel);
    }
    const c = leer(), est = !conCookies.length ? 'sin herramientas con cookies' : c ? (c.medicion || c.publicidad ? 'consentimiento dado' : 'rechazado') : 'sin decidir';
    const filas = window.ADE_EVENTOS.slice(-14).reverse().map(x => `<div class="e"><span class="n">${x.nombre}</span> ${JSON.stringify(x.datos)}<br>${x.activos.length ? `<span class="ok">→ ${x.activos.join(' · ').replace('ga4', 'GA4').replace('clarity', 'Clarity').replace('meta', 'Meta')} (simulado)</span>` : '<span class="no">no se envía: sin consentimiento</span>'}</div>`).join('');
    panel.innerHTML = `<h4>Eventos de medición · laboratorio</h4><div>Estado: <b>${est}</b>. Cloudflare cuenta la visita sin cookies, pero no recibe eventos.</div>${filas || '<div class="e">Aún no hay eventos.</div>'}<button type="button" id="ade-ev-reset">Borrar mi elección y recargar</button>`;
    const r = panel.querySelector('#ade-ev-reset'); if (r) r.onclick = () => { try { localStorage.removeItem(LS); } catch (e) { /* sin almacenamiento */ } location.reload(); };
  }

  // ---- Política de cookies: tabla con lo que de verdad está activo ----
  const pintarPolitica = () => {
    const box = document.getElementById('ade-herramientas'); if (!box) return;
    box.innerHTML = HERRAMIENTAS.length
      ? HERRAMIENTAS.map(h => `<h3>${h.nombre}</h3><ul><li><strong>Quién:</strong> ${h.prov.replace(/\.$/, '')}. <a href="${h.url}" rel="noopener">Su política de privacidad</a>.</li><li><strong>Para qué:</strong> ${h.fin}</li><li><strong>Cookies:</strong> ${h.cookies}</li><li><strong>Cuándo se activa:</strong> ${h.consent ? 'solo si lo aceptas' : 'siempre, porque no usa cookies ni identifica a nadie'}</li></ul>`).join('')
      : '<p>Ahora mismo no hay ninguna herramienta de medición ni de publicidad activa en esta web.</p>';
  };

  // ---- Arranque ----
  const arrancar = () => {
    pintarPolitica(); pintarPanel();
    HERRAMIENTAS.filter(h => !h.consent).forEach(h => cargar(h.id));          // sin cookies: no necesita consentimiento
    if (!conCookies.length) return;                                            // nada que consentir
    // Enlace para cambiar la elección, junto a «Cookies» en el pie de página
    const pie = document.querySelector('a[href$="cookies.html"]');
    if (pie && !document.querySelector('[data-cookies]')) {
      const l = document.createElement('a'); l.href = '#'; l.textContent = 'Ajustes de cookies'; l.setAttribute('data-cookies', '');
      l.addEventListener('click', e => { e.preventDefault(); mostrar(true); });
      if (pie.parentElement.tagName === 'SPAN') pie.after(document.createTextNode(' · '), l); else pie.after(l);
    }
    const c = leer();
    if (c) aplicar(c);
    else mostrar(false);
    if (DEMO) window.adeMedicion = { mostrar, leer };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
