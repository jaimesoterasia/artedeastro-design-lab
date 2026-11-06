/* Concepto B: barra de progreso, frases que se encienden y luz de vela. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.querySelector('.bar');
  if (bar) {
    const upd = () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }
  const lines = [...document.querySelectorAll('.line')];
  if (lines.length && !reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '-38% 0px -38% 0px' });
    lines.forEach(l => io.observe(l));
  } else lines.forEach(l => l.classList.add('in'));
  const glow = document.querySelector('.glow');
  if (glow && !reduce && matchMedia('(pointer:fine)').matches) {
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); });
    const loop = () => { x += (tx - x) * .08; y += (ty - y) * .08; glow.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); };
    loop();
  }
})();
