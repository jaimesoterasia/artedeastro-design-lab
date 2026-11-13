/* Comportamiento común de los prototipos del Design Lab.
   Nada de esto envía datos: los botones de reserva y contacto son simulaciones. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Aparición al hacer scroll
  const els = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e, i) => { e.style.transitionDelay = (e.dataset.delay || 0) + 'ms'; io.observe(e); });
  }

  // Menú móvil
  $$('[data-menu]').forEach(b => b.addEventListener('click', () => {
    const open = document.documentElement.classList.toggle('menu-open');
    b.setAttribute('aria-expanded', String(open));
  }));
  $$('[data-menu-close], .menu a').forEach(a => a.addEventListener('click', () => {
    document.documentElement.classList.remove('menu-open');
    $$('[data-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }));

  // Simulación de reserva / contacto
  const dlg = document.createElement('dialog');
  dlg.className = 'sim';
  dlg.innerHTML = `<p class="sim__tag">Simulación · Design Lab</p>
    <h2 class="sim__t"></h2>
    <p class="sim__d">En la web real, este botón abre WhatsApp con el mensaje ya escrito para Eva. Aquí no se envía nada.</p>
    <pre class="sim__msg"></pre>
    <button class="sim__x" type="button">Entendido</button>`;
  document.body.appendChild(dlg);
  const css = document.createElement('style');
  css.textContent = `.sim{border:0;border-radius:18px;padding:28px;max-width:min(92vw,440px);background:#fff;color:#141014;font:16px/1.5 system-ui,sans-serif;box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .sim::backdrop{background:rgba(20,16,20,.55);backdrop-filter:blur(3px)}
    .sim__tag{margin:0 0 10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8A5CF0;font-weight:600}
    .sim__t{margin:0 0 8px;font-size:22px;line-height:1.2}
    .sim__d{margin:0 0 14px;color:#4A423D}
    .sim__msg{margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#F6F1EA;white-space:pre-wrap;font:14px/1.45 ui-monospace,monospace}
    .sim__x{min-height:44px;padding:10px 22px;border-radius:999px;border:0;background:#141014;color:#fff;font:600 15px system-ui;cursor:pointer}
    .proto-tag{position:fixed;left:12px;bottom:12px;z-index:9999;padding:6px 12px;border-radius:999px;background:rgba(20,16,20,.82);color:#fff;font:600 11px/1 system-ui;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}`;
  document.head.appendChild(css);
  dlg.querySelector('.sim__x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $$('[data-sim]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    dlg.querySelector('.sim__t').textContent = b.dataset.simTitle || 'Solicitud por WhatsApp';
    dlg.querySelector('.sim__msg').textContent = b.dataset.sim;
    dlg.showModal();
  }));

  // Prototipos que comparten código con la web real: site.js llama a LAB_SIM en vez de abrir WhatsApp o el correo,
  // y los enlaces con data-wa se interceptan aquí.
  window.LAB_SIM = (titulo, msg) => {
    dlg.querySelector('.sim__t').textContent = titulo || 'Solicitud por WhatsApp';
    dlg.querySelector('.sim__msg').textContent = msg;
    dlg.showModal();
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-wa]');
    if (!a) return;
    e.preventDefault();
    window.LAB_SIM(a.textContent.replace('→', '').trim(), a.dataset.wa);
  }, true);

  // Etiqueta de prototipo
  const tag = document.createElement('span');
  tag.className = 'proto-tag';
  tag.textContent = 'Prototipo ' + (document.documentElement.dataset.concept || '') + ' · no es la web pública';
  document.body.appendChild(tag);
})();
