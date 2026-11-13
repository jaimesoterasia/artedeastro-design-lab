/* artedeastro.com: testimonios y eventos (desde datos.js), formulario de testimonio, aparición al bajar,
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

  // Testimonios
  const tBox = $('#testimonios-lista');
  if (tBox) {
    const ts = [...(DATOS.testimonios || [])].filter(t => t && t.texto).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
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
  }

  // Formulario de testimonio (testimonio.html)
  const form = $('#tform');
  if (form) {
    const txt = $('#t-texto'), count = $('#t-count'), err = $('#t-err'), MIN = 30, MAX = 700;
    const upd = () => { count.textContent = `${txt.value.trim().length} / ${MAX}`; };
    txt.addEventListener('input', upd); upd();
    const mensaje = () => {
      const v = id => $(id).value.trim();
      return ['Hola Eva, te dejo mi testimonio para la web de artedeastro.', '',
        `Nombre para publicar: ${v('#t-nombre')}`,
        v('#t-ciudad') ? `Ciudad: ${v('#t-ciudad')}` : null,
        `Qué hice: ${v('#t-servicio')}`, '',
        `«${v('#t-texto')}»`, '',
        'Doy permiso para publicarlo en la web y las redes de artedeastro con el nombre indicado.'
      ].filter(x => x !== null).join('\n');
    };
    const valida = () => {
      const v = id => $(id).value.trim();
      if (!v('#t-nombre')) return ['#t-nombre', 'Escribe cómo quieres que aparezca tu nombre.'];
      if (!v('#t-servicio')) return ['#t-servicio', 'Elige qué hiciste con Eva.'];
      if (v('#t-texto').length < MIN) return ['#t-texto', `Cuéntalo con un poco más de detalle (mínimo ${MIN} caracteres).`];
      if (!$('#t-permiso').checked) return ['#t-permiso', 'Necesito tu permiso para poder publicarlo.'];
      return null;
    };
    const enviar = canal => {
      const e = valida();
      if (e) { err.textContent = e[1]; $(e[0]).focus(); return; }
      err.textContent = '';
      const msg = mensaje();
      if (canal === 'email') {
        const url = `mailto:artedeastrologia@gmail.com?subject=${encodeURIComponent('Mi testimonio para artedeastro')}&body=${encodeURIComponent(msg)}`;
        if (window.LAB_SIM) window.LAB_SIM('Email', msg); else location.href = url;
      } else abrirWA(msg, 'Testimonio por WhatsApp');
      form.hidden = true; $('#t-ok').hidden = false; $('#t-ok h2').focus();
    };
    form.addEventListener('submit', e => { e.preventDefault(); enviar('wa'); });
    $('#t-email').addEventListener('click', e => { e.preventDefault(); enviar('email'); });
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
    const flip = () => { const on = c.classList.toggle('flip'); c.setAttribute('aria-pressed', String(on)); };
    c.addEventListener('click', flip);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });
})();
