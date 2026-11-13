/* artedeastro.com: testimonios (de datos.js y de la hoja de Eva) y eventos, formulario de testimonio, aparición al bajar,
   menú, WhatsApp, el ojo que sigue al cursor y las cartas que se giran. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DATOS = window.ARTEDEASTRO_DATOS || { testimonios: [], eventos: [] };
  const WA_NUM = '34686156081';
  const waUrl = msg => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
  // En el Design Lab, LAB_SIM muestra el mensaje en vez de abrir WhatsApp.
  const abrirWA = (msg, titulo) => window.LAB_SIM ? window.LAB_SIM(titulo || 'WhatsApp', msg) : window.open(waUrl(msg), '_blank', 'noopener');

  // Los enlaces con data-wa abren WhatsApp con el mensaje ya escrito para Eva.
  $$('a[data-wa]').forEach(a => { a.href = waUrl(a.dataset.wa); });

  const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
  const fechaLarga = f => { const [y, m, d] = String(f).split('-').map(Number); return d ? `${d} ${MESES[m - 1]} ${y}` : `${MESES[m - 1]} ${y}`; };
  const COLORES = ['var(--rosa)', 'var(--sol)', 'var(--coral)', 'var(--violeta)'];

  // Eventos en los que ya ha participado Eva
  const evBox = $('#eventos-pasados');
  if (evBox) {
    const evs = [...(DATOS.eventos || [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    evBox.hidden = !evs.length;
    $('.past__list', evBox).innerHTML = evs.map(e => `
      <article class="gig" data-reveal>
        <div class="gig__pics${(e.imagenes || []).length > 1 ? '' : ' gig__pics--uno'}">${(e.imagenes || []).slice(0, 2).map(i => `<img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy">`).join('')}</div>
        <div class="gig__txt">
          <span class="tag gig__date">${esc(fechaLarga(e.fecha))}</span>
          <h4>${esc(e.nombre)}</h4>
          <p class="gig__place">${esc(e.lugar)}</p>
          <p>${esc(e.texto)}</p>
          ${(e.etiquetas || []).length ? `<ul class="gig__tags">${e.etiquetas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        </div>
      </article>`).join('');
  }

  // Los testimonios llegan a una hoja de Google de Eva (formulario) y la web lee los que ella aprueba (CSV publicado de la pestaña «Publicados»).
  const FORM = {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSekBFgitJhjUsAJu3um8CDKRe5rb1cGYYTJJ_WLseidb5XXbg/formResponse',
    nombre: 'entry.371104245', servicio: 'entry.992830489', ciudad: 'entry.409808187', texto: 'entry.106277205', permiso: 'entry.508048393'
  };
  const CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-qCRgn1H4XPyViVs0lbnm9LhxA2lPtf1jjyneq6STZJek052dC3VvmFjLkw-DtF7jlq4048u5_siF/pub?gid=424129028&single=true&output=csv';

  const parseCSV = t => {
    const rows = []; let r = [], c = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { r.push(c); c = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; rows.push(r); r = []; }
      else c += ch;
    }
    if (c !== '' || r.length) { r.push(c); rows.push(r); }
    return rows;
  };
  // La hoja da la fecha como «11/13/2026 18:22:05» (mes/día/año) o ISO; la web la usa solo para ordenar.
  const fechaISO = f => {
    if (/^\d+(\.\d+)?$/.test(String(f || '').trim())) return new Date(Math.round((Number(f) - 25569) * 864e5)).toISOString().slice(0, 10); // número de serie de la hoja
    const m = String(f || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    return String(f || '').slice(0, 10);
  };
  const leerAprobados = async () => {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(CSV, { signal: ctl.signal });
      if (!res.ok) return [];
      const rows = parseCSV(await res.text());
      return rows.slice(1).map(r => ({ nombre: (r[0] || '').trim(), servicio: (r[1] || '').trim(), ciudad: (r[2] || '').trim(), texto: (r[3] || '').trim(), fecha: fechaISO(r[4]) }))
        .filter(t => t.nombre && t.texto);
    } catch (e) { return []; } finally { clearTimeout(to); }
  };

  // Testimonios
  const tBox = $('#testimonios-lista');
  const pintaTestimonios = (lista, tardio) => {
    const ts = [...lista].filter(t => t && t.texto).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    const invitacion = ts.length
      ? `<a class="invite" href="testimonio.html" data-reveal><span class="invite__q" aria-hidden="true">“</span><strong>¿Has hecho una sesión conmigo?</strong><span>Cuéntalo con tus palabras →</span></a>`
      : `<div class="invite invite--solo" data-reveal>
           <span class="invite__q" aria-hidden="true">“</span>
           <div><strong>Este espacio es para tus palabras.</strong>
           <p>Si ya has hecho una sesión conmigo o has pasado por uno de mis eventos, me encantará que cuentes cómo fue. Lo leeré antes de publicarlo.</p></div>
           <a class="btn btn--alt" href="testimonio.html">Dejar mi testimonio →</a>
         </div>`;
    tBox.classList.toggle('testis__grid--vacio', !ts.length);
    tBox.innerHTML = ts.map((t, i) => `
      <figure class="testi" style="--c:${COLORES[i % COLORES.length]}" data-reveal>
        <blockquote>${esc(t.texto)}</blockquote>
        <figcaption><b>${esc(t.nombre)}</b>${t.ciudad ? `<span>${esc(t.ciudad)}</span>` : ''}${t.servicio ? `<small>${esc(t.servicio)}</small>` : ''}</figcaption>
      </figure>`).join('') + invitacion;
    // Lo pintado después de cargar no pasa por el observador del scroll: se muestra directamente.
    if (tardio) $$('[data-reveal]', tBox).forEach(e => e.classList.add('in'));
  };
  if (tBox) {
    const propios = (DATOS.testimonios || []).filter(t => t && t.texto);
    pintaTestimonios(propios, false);
    leerAprobados().then(ap => { if (ap.length) pintaTestimonios([...propios, ...ap], true); });
  }

  // Formulario de testimonio (testimonio.html)
  const form = $('#tform');
  if (form) {
    const txt = $('#t-texto'), count = $('#t-count'), err = $('#t-err'), btnEnviar = $('#t-enviar'), MIN = 30, MAX = 700;
    const abierta = Date.now();
    const upd = () => { count.textContent = `${txt.value.trim().length} / ${MAX}`; };
    txt.addEventListener('input', upd); upd();
    const v = id => $(id).value.trim();
    const valida = () => {
      if (!v('#t-nombre')) return ['#t-nombre', 'Escribe cómo quieres que aparezca tu nombre.'];
      if (!v('#t-servicio')) return ['#t-servicio', 'Elige qué hiciste con Eva.'];
      if (v('#t-texto').length < MIN) return ['#t-texto', `Cuéntalo con un poco más de detalle (mínimo ${MIN} caracteres).`];
      if (!$('#t-permiso').checked) return ['#t-permiso', 'Necesito tu permiso para poder publicarlo.'];
      return null;
    };
    const textoPermiso = () => 'Sí. Doy permiso a artedeastro para publicar este testimonio, con el nombre indicado, en su web y sus redes. Aceptado desde artedeastro.com el ' + new Date().toISOString().slice(0, 10) + '.';
    const mensaje = () => ['Hola Eva, te dejo mi testimonio para la web de artedeastro.', '',
      `Nombre para publicar: ${v('#t-nombre')}`,
      v('#t-ciudad') ? `Ciudad: ${v('#t-ciudad')}` : null,
      `Qué hice: ${v('#t-servicio')}`, '',
      `«${v('#t-texto')}»`, '',
      'Doy permiso para publicarlo en la web y las redes de artedeastro con el nombre indicado.'
    ].filter(x => x !== null).join('\n');
    const hecho = () => { form.hidden = true; $('#t-ok').hidden = false; $('#t-ok h2').focus(); };
    const fallo = () => {
      err.innerHTML = 'No hemos podido enviarlo ahora mismo. Inténtalo de nuevo en un momento o mándaselo a Eva por <a href="' + waUrl(mensaje()) + '" target="_blank" rel="noopener">WhatsApp</a>.';
    };
    // Envía el testimonio al formulario de Google de Eva (no hay servidor propio).
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const e1 = valida();
      if (e1) { err.textContent = e1[1]; $(e1[0]).focus(); return; }
      err.textContent = '';
      if ($('#t-web') && $('#t-web').value) { hecho(); return; }                   // campo trampa para bots
      if (Date.now() - abierta < 4000) { err.textContent = 'Un momento: revisa tu texto y vuelve a pulsar enviar.'; return; }
      const campos = { [FORM.nombre]: v('#t-nombre'), [FORM.servicio]: v('#t-servicio'), [FORM.ciudad]: v('#t-ciudad'), [FORM.texto]: v('#t-texto'), [FORM.permiso]: textoPermiso() };
      // En el Design Lab no se envía nada: solo se enseña lo que recibiría la hoja de Eva.
      if (window.LAB_SIM) { window.LAB_SIM('Testimonio enviado a la hoja de Eva', Object.values(campos).join('\n\n')); hecho(); return; }
      btnEnviar.disabled = true; const antes = btnEnviar.textContent; btnEnviar.textContent = 'Enviando…';
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
      try {
        await fetch(FORM.url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(campos), signal: ctl.signal });
        hecho();
      } catch (x) { fallo(); }
      finally { clearTimeout(to); btnEnviar.disabled = false; btnEnviar.textContent = antes; }
    });
    // Alternativa por correo, por si el envío no funciona
    $('#t-email').addEventListener('click', e => {
      e.preventDefault();
      const e1 = valida();
      if (e1) { err.textContent = e1[1]; $(e1[0]).focus(); return; }
      err.textContent = '';
      const url = `mailto:artedeastrologia@gmail.com?subject=${encodeURIComponent('Mi testimonio para artedeastro')}&body=${encodeURIComponent(mensaje())}`;
      if (window.LAB_SIM) window.LAB_SIM('Email', mensaje()); else location.href = url;
      hecho();
    });
    $('#t-otro').addEventListener('click', () => { form.reset(); upd(); form.hidden = false; $('#t-ok').hidden = true; $('#t-nombre').focus(); });
  }

  // Aparición al hacer scroll
  const els = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => { e.style.transitionDelay = (e.dataset.delay || 0) + 'ms'; io.observe(e); });
  }

  // Menú
  const btn = document.querySelector('[data-menu]');
  const setMenu = open => {
    document.documentElement.classList.toggle('menu-open', open);
    if (btn) { btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Cerrar' : 'Menú'; }
  };
  if (btn) btn.addEventListener('click', () => setMenu(!document.documentElement.classList.contains('menu-open')));
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // El ojo sigue al cursor
  const pupil = document.querySelector('#pupil'), eye = document.querySelector('.eye');
  if (pupil && eye && !reduce) addEventListener('pointermove', e => {
    const r = eye.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx), d = Math.min(9, Math.hypot(e.clientX - cx, e.clientY - cy) / 30);
    pupil.setAttribute('transform', `translate(${Math.cos(a) * d} ${Math.sin(a) * d * .6})`);
  });

  // Las cartas de sesiones se giran al tocarlas
  $$('.card').forEach(c => {
    const enlace = c.querySelector('.card__cta');
    const flip = () => {
      const on = c.classList.toggle('flip'); c.setAttribute('aria-pressed', String(on));
      if (enlace) enlace.tabIndex = on ? 0 : -1; // el botón del reverso solo se alcanza con teclado cuando la carta está girada
    };
    // Pulsar el botón del reverso abre WhatsApp sin girar la carta
    c.addEventListener('click', e => { if (e.target.closest('.card__cta')) return; flip(); });
    c.addEventListener('keydown', e => {
      if (e.target.closest('.card__cta')) return; // Enter sobre el botón lo activa; no gira la carta
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  });
})();
