/* artedeastro.com · medición y consentimiento de cookies.
   - Cada herramienta solo existe si tiene su identificador abajo. Con todos vacíos no se carga nada y no se muestra ningún aviso.
   - Cloudflare Web Analytics no usa cookies: cuenta visitas sin consentimiento.
   - Google Analytics, Microsoft Clarity y el píxel de Meta usan cookies: solo se cargan si la persona los acepta.
   - La política de cookies (cookies.html) lee la lista de abajo, así que siempre dice lo que de verdad está activo. */
(() => {
  'use strict';

  // ← Aquí se pegan los identificadores (ver docs/medicion-web.md). Vacío = herramienta apagada.
  const CONFIG = Object.assign({
    CF_TOKEN: '',     // Cloudflare Web Analytics (token del sitio)
    GA4_ID: '',       // Google Analytics 4, formato G-XXXXXXXXXX
    CLARITY_ID: '',   // Microsoft Clarity, id del proyecto
    PIXEL_ID: ''      // Píxel de Meta, id numérico
  }, window.ADE_CONFIG || {});

  // En el Design Lab no se carga ninguna etiqueta real: solo se enseña lo que haría. «?cookies» activa una demostración.
  const LAB = !!window.LAB_SIM;
  const DEMO = LAB && /[?&]cookies\b/.test(location.search);
  if (DEMO) Object.assign(CONFIG, { GA4_ID: 'G-DEMO', CLARITY_ID: 'demo', PIXEL_ID: '0000' });

  const HERRAMIENTAS = [
    { id: 'cf', cfg: 'CF_TOKEN', cat: 'estadística', consent: false, nombre: 'Cloudflare Web Analytics', prov: 'Cloudflare, Inc.',
      fin: 'Contar visitas y páginas vistas de forma agregada. No usa cookies ni identifica a nadie.', cookies: 'Ninguna', url: 'https://www.cloudflare.com/privacypolicy/' },
    { id: 'ga4', cfg: 'GA4_ID', cat: 'medicion', consent: true, nombre: 'Google Analytics 4', prov: 'Google Ireland Ltd.',
      fin: 'Estadísticas de uso: páginas vistas, de dónde llegas, tipo de dispositivo, país aproximado y clics en WhatsApp.', cookies: '_ga y _ga_* (hasta 13 meses)', url: 'https://policies.google.com/privacy' },
    { id: 'clarity', cfg: 'CLARITY_ID', cat: 'medicion', consent: true, nombre: 'Microsoft Clarity', prov: 'Microsoft Corporation',
      fin: 'Mapas de calor y grabaciones anónimas de la navegación para mejorar la web. Los campos de los formularios se ocultan.', cookies: '_clck (1 año) y _clsk (1 día)', url: 'https://privacy.microsoft.com/privacystatement' },
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
    if (cargado.meta || cargado.ga4) vistaPagina();
  };
  const borrarCookies = () => {
    const host = location.hostname, partes = host.split('.');
    const dominios = ['', host, '.' + host, '.' + partes.slice(-2).join('.')];
    document.cookie.split(';').map(x => x.split('=')[0].trim()).filter(n => /^(_ga|_fb|_clck|_clsk|CLID|MR|SM$|ANONCHK)/.test(n))
      .forEach(n => dominios.forEach(d => { document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + (d ? ';domain=' + d : ''); }));
  };

  // ---- Eventos (solo se envían a lo que esté cargado; nunca llevan datos personales) ----
  const EVENTOS = {
    whatsapp: { meta: ['track', 'Contact'], ga: 'generate_lead', cl: 'whatsapp' },
    ver_sesiones: { meta: ['track', 'ViewContent'], ga: 'view_item_list', cl: 'ver_sesiones' },
    testimonio_enviado: { meta: ['trackCustom', 'TestimonioEnviado'], ga: 'testimonio_enviado', cl: 'testimonio' },
    instagram: { meta: ['trackCustom', 'ClicInstagram'], ga: 'clic_instagram', cl: 'instagram' },
    email: { meta: ['trackCustom', 'ClicEmail'], ga: 'clic_email', cl: 'email' }
  };
  const track = (nombre, p) => {
    const e = EVENTOS[nombre]; if (!e) return;
    if (LAB) { if (Object.keys(cargado).some(k => k !== 'cf')) console.info('[medición simulada] evento', nombre, p || {}); return; }
    if (cargado.meta && window.fbq) window.fbq(e.meta[0], e.meta[1], p || {});
    if (cargado.ga4 && window.gtag) window.gtag('event', e.ga, Object.assign({ canal: nombre }, p || {}));
    if (cargado.clarity && window.clarity) window.clarity('event', e.cl);
  };
  window.adeTrack = track;
  const vistaPagina = () => { if (/sesiones(\.html)?$/.test(location.pathname)) track('ver_sesiones'); };

  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (/wa\.me\//.test(h)) {
      const sec = a.closest('section,footer'), m = (a.dataset.wa || '').match(/Lectura:\s*([^\n]+)/);
      track('whatsapp', { lugar: (sec && (sec.id || sec.className.split(' ')[0])) || 'pagina', servicio: m ? m[1].trim().slice(0, 60) : undefined });
    } else if (/instagram\.com/.test(h)) track('instagram');
    else if (/^mailto:/.test(h)) track('email');
  }, true);

  // ---- Aviso de cookies ----
  const CSS = `
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
  let caja = null;
  const cerrar = () => { if (caja) { caja.remove(); caja = null; } };
  const decidir = (c, recargar) => {
    const antes = leer();
    guardar(c); cerrar();
    const quita = antes && ((antes.medicion && !c.medicion) || (antes.publicidad && !c.publicidad));
    if (quita) { borrarCookies(); if (!LAB) location.reload(); return; }
    aplicar(c);
  };
  const lista = cat => conCookies.filter(h => h.cat === cat).map(h => h.nombre).join(', ');
  const mostrar = (abrirAjustes) => {
    if (caja) caja.remove();
    if (!document.getElementById('ade-ck-css')) { const s = document.createElement('style'); s.id = 'ade-ck-css'; s.textContent = CSS; document.head.appendChild(s); }
    const actual = leer() || {};
    caja = document.createElement('div'); caja.className = 'ade-ck'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-labelledby', 'ade-ck-t'); caja.setAttribute('aria-modal', 'false');
    const opciones = `<fieldset class="ade-ck__o">
      ${tiene('medicion') ? `<label><input type="checkbox" id="ade-m" ${actual.medicion ? 'checked' : ''}><span><b>Medición</b>Estadísticas de visitas y de uso de la web (${lista('medicion')}).</span></label>` : ''}
      ${tiene('publicidad') ? `<label><input type="checkbox" id="ade-p" ${actual.publicidad ? 'checked' : ''}><span><b>Publicidad</b>Mide mis anuncios y permite mostrarlos a quien ya ha visitado la web (${lista('publicidad')}).</span></label>` : ''}
    </fieldset>`;
    caja.innerHTML = `<h2 id="ade-ck-t">Tú decides</h2>
      <p>${abrirAjustes ? 'Elige qué quieres permitir. Puedes cambiarlo cuando quieras.' : 'Para saber cuánta gente visita la web y mejorar mis anuncios uso herramientas de medición y de publicidad. Solo se activan si las aceptas.'} <a href="${LAB ? 'https://artedeastro.com/cookies.html' : 'cookies.html'}">Más información</a></p>
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

  // ---- Política de cookies: tabla con lo que de verdad está activo ----
  const pintarPolitica = () => {
    const box = document.getElementById('ade-herramientas'); if (!box) return;
    box.innerHTML = HERRAMIENTAS.length
      ? HERRAMIENTAS.map(h => `<h3>${h.nombre}</h3><ul><li><strong>Quién:</strong> ${h.prov.replace(/\.$/, '')}. <a href="${h.url}" rel="noopener">Su política de privacidad</a>.</li><li><strong>Para qué:</strong> ${h.fin}</li><li><strong>Cookies:</strong> ${h.cookies}</li><li><strong>Cuándo se activa:</strong> ${h.consent ? 'solo si lo aceptas' : 'siempre, porque no usa cookies ni identifica a nadie'}</li></ul>`).join('')
      : '<p>Ahora mismo no hay ninguna herramienta de medición ni de publicidad activa en esta web.</p>';
  };

  // ---- Arranque ----
  const arrancar = () => {
    pintarPolitica();
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
