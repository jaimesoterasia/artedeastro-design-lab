/* Concepto C: el ojo que sigue al cursor y las cartas que se giran. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pupil = document.querySelector('#pupil'), eye = document.querySelector('.eye');
  if (pupil && eye && !reduce) addEventListener('pointermove', e => {
    const r = eye.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx), d = Math.min(9, Math.hypot(e.clientX - cx, e.clientY - cy) / 30);
    pupil.setAttribute('transform', `translate(${Math.cos(a) * d} ${Math.sin(a) * d * .6})`);
  });
  document.querySelectorAll('.card').forEach(c => c.addEventListener('click', e => {
    if (e.target.closest('[data-sim]')) return;
    const on = c.classList.toggle('flip'); c.setAttribute('aria-pressed', String(on));
  }));
})();
