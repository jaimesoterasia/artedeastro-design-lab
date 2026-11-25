/* Mazo de «La carta de hoy · artedeastro»: 22 arcanos mayores propios, tema «Amanecer» (aspiracional y sensible).
   Línea fina en hueso cálido sobre un cielo de ciruela a rosa, con una luz melocotón y el degradado del logo en el borde.
   Conserva de la marca: la estrella de cuatro puntas, el ojo y el degradado. No reproduce ninguna lámina del Tarot de Thoth. */
(() => {
  const LINEA = '#FBEBDD', TINTA = '#141014';
  const STAR = 'M50 12 C53 40 60 47 88 50 C60 53 53 60 50 88 C47 60 40 53 12 50 C40 47 47 40 50 12Z';
  const COR = '#F4734F', ROS = '#E5579E', VIO = '#A65CF2';
  const HALOS = [[ROS, VIO], [COR, VIO], [VIO, ROS], [ROS, COR], [COR, ROS], [VIO, COR]];
  const FINO = .9;                                   // grosor relativo de la línea
  const L = (w = 2.4, o = 1) => `fill="none" stroke="${LINEA}" stroke-opacity="${o}" stroke-width="${(w * FINO).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"`;
  const P = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f = n => (+n).toFixed(1);
  const circ = (cx, cy, r, w, o, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${L(w, o)} ${extra}/>`;
  const dot = (x, y, r, o = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${LINEA}" fill-opacity="${o}"/>`;
  const star = (cx, cy, s, o = 1) => `<path d="${STAR}" transform="translate(${f(cx - 50 * s)} ${f(cy - 50 * s)}) scale(${s})" fill="${LINEA}" fill-opacity="${o}"/>`;
  const eye = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})"><path d="M-62 0 Q0 -50 62 0 Q0 50 -62 0Z" ${L(2.6 / s)}/><circle r="19" ${L(2.6 / s)}/><circle r="7" fill="${LINEA}"/></g>`;
  const rayos = (cx, cy, r0, r1, n, o = 1, w = 1.8, off = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + off, [x0, y0] = P(cx, cy, r0, a), [x1, y1] = P(cx, cy, r1, a); return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" ${L(w, o)}/>`; }).join('');
  const orbita = (r = 198, o = .4) => circ(280, 410, r, 1.2, o, 'stroke-dasharray="1.5 9"');
  let lid = 0;
  const luna = (cx, cy, R, ix, iy, r, w = 2.8) => { const n = ++lid, c = (x, y, q) => `M${x - q} ${y} a${q} ${q} 0 1 0 ${2 * q} 0 a${q} ${q} 0 1 0 ${-2 * q} 0Z`, O = c(cx, cy, R), I = c(ix, iy, r);
    return `<defs><clipPath id="lu${n}a"><path clip-rule="evenodd" d="M0 0H560V940H0Z ${I}"/></clipPath><clipPath id="lu${n}b"><path d="${O}"/></clipPath></defs><path d="${O}" ${L(w)} clip-path="url(#lu${n}a)"/><path d="${I}" ${L(w)} clip-path="url(#lu${n}b)"/>`; };

  const ARTE = [
    /* 0 El Loco */ () => { const pts = []; for (let t = 0; t < 7.4 * Math.PI; t += 0.1) pts.push(P(280, 410, 6 + t * 6.4, t - Math.PI / 2));
      return orbita() + `<polyline points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${L(2.6)}/>` + star(pts[pts.length - 1][0], pts[pts.length - 1][1], .5) + dot(280, 410, 4) + dot(150, 250, 3) + dot(420, 590, 3) + star(130, 600, .28, .8) + star(440, 220, .3, .8); },
    /* I El Mago */ () => orbita() + `<path d="M280 410 C330 340 440 340 440 410 C440 480 330 480 280 410 C230 340 120 340 120 410 C120 480 230 480 280 410Z" ${L(2.6)}/>` + star(280, 410, .66) + circ(280, 410, 150, 1.2, .35) + [[150, 235], [410, 235], [150, 585], [410, 585]].map(([x, y]) => star(x, y, .26, .85)).join('') + dot(280, 250, 3.4) + dot(280, 570, 3.4),
    /* II La Sacerdotisa */ () => orbita() + luna(185, 410, 92, 224, 410, 78) + luna(375, 410, 92, 336, 410, 78) + circ(280, 410, 58, 2.6) + circ(280, 410, 40, 1.2, .5) + star(280, 410, .42) + star(280, 262, .3, .9) +
      [0, 1, 2].map(i => `<path d="M${200 + i * 0} ${540 + i * 26} q20 -14 40 0 t40 0 t40 0 t40 0" ${L(1.8, .85 - i * .18)}/>`).join('') + dot(280, 250, 3),
    /* III La Emperatriz */ () => { let p = ''; for (let i = 0; i < 8; i++) p += `<path d="M0 -26 C20 -66 20 -112 0 -148 C-20 -112 -20 -66 0 -26Z" transform="translate(280 410) rotate(${i * 45})" ${L(2.2)}/>`;
      for (let i = 0; i < 8; i++) p += `<path d="M0 -24 C10 -44 10 -62 0 -78 C-10 -62 -10 -44 0 -24Z" transform="translate(280 410) rotate(${i * 45 + 22.5})" ${L(1.4, .6)}/>`;
      return orbita() + p + circ(280, 410, 22, 2.2) + star(280, 410, .4) + rayos(280, 410, 166, 184, 24, .45, 1.2); },
    /* IV El Emperador */ () => { const T = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].map(a => P(280, 420, 140, a));
      return circ(280, 410, 176, 2.2) + circ(280, 410, 190, 1.2, .4, 'stroke-dasharray="1.5 9"') + `<polygon points="${T.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${L(2.6)}/>` + circ(280, 440, 66, 1.4, .6) + star(280, 440, .55) + dot(280, 250, 3); },
    /* V El Hierofante */ () => { const col = x => `<rect x="${x}" y="300" width="30" height="250" ${L(2.4)}/><rect x="${x - 10}" y="290" width="50" height="12" rx="3" ${L(2)}/><rect x="${x - 10}" y="548" width="50" height="12" rx="3" ${L(2)}/>`;
      return col(172) + col(358) + `<path d="M187 290 A93 93 0 0 1 373 290" ${L(2.4)}/>` + circ(280, 392, 52, 2.2) + circ(280, 392, 70, 1.2, .4) + star(280, 392, .5) + [0, 1, 2].map(i => `<line x1="${170 - i * 14}" y1="${580 + i * 16}" x2="${390 + i * 14}" y2="${580 + i * 16}" ${L(1.8, .8 - i * .2)}/>`).join('') + star(280, 236, .26, .85); },
    /* VI Los Amantes */ () => orbita() + circ(238, 410, 102, 2.6) + circ(322, 410, 102, 2.6) + `<path d="M280 322 A102 102 0 0 1 280 498 A102 102 0 0 1 280 322Z" ${L(1.4, .6)}/>` + star(280, 410, .5) + star(196, 410, .24, .8) + star(364, 410, .24, .8) + dot(280, 300, 3.4) + dot(280, 520, 3.4),
    /* VII El Carro */ () => { const w = [280, 490], R = 96; let sp = rayos(w[0], w[1], 16, R, 8, .9, 2);
      const arc = Array.from({ length: 5 }, (_, i) => { const a = Math.PI + (i + .5) / 5 * Math.PI, [x, y] = P(280, 330, 136, a); return star(x, y, .2, .9); }).join('');
      return orbita(206) + `<path d="M144 330 A136 136 0 0 1 416 330" ${L(2.2, .9)}/>` + arc + `<line x1="280" y1="270" x2="280" y2="394" ${L(1.6, .6)}/>` + circ(w[0], w[1], R, 2.6) + circ(w[0], w[1], R - 16, 1.2, .5) + sp + circ(w[0], w[1], 16, 2) + star(280, 330, .4) + dot(280, 600, 3); },
    /* VIII Ajuste */ () => { const pan = (cx, y) => `<line x1="${cx}" y1="300" x2="${cx - 44}" y2="${y}" ${L(1.5, .8)}/><line x1="${cx}" y1="300" x2="${cx + 44}" y2="${y}" ${L(1.5, .8)}/><path d="M${cx - 56} ${y} Q${cx} ${y + 52} ${cx + 56} ${y}Z" ${L(2.4)}/>`;
      return orbita(196) + `<line x1="280" y1="262" x2="280" y2="560" ${L(2.4)}/><line x1="176" y1="300" x2="384" y2="300" ${L(2.6)}/>` + circ(280, 300, 11, 2.2) + pan(176, 430) + pan(384, 430) + `<line x1="214" y1="566" x2="346" y2="566" ${L(2.4)}/>` + star(280, 236, .34) + dot(176, 300, 3.4) + dot(384, 300, 3.4); },
    /* IX El Ermitaño */ () => { const H = Array.from({ length: 6 }, (_, i) => P(280, 400, 116, i / 6 * Math.PI * 2 - Math.PI / 2));
      return rayos(280, 400, 130, 164, 12, .6, 1.5, -Math.PI / 2) + `<polygon points="${H.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${L(2.6)}/>` + circ(280, 400, 78, 1.2, .45) + star(280, 400, 1.0) + `<line x1="280" y1="520" x2="280" y2="650" ${L(2.2)}/><line x1="262" y1="650" x2="298" y2="650" ${L(2)}/>` + dot(280, 232, 3); },
    /* X Fortuna */ () => { const c = [280, 410]; return circ(...c, 168, 2.6) + circ(...c, 150, 1.4, .6) + rayos(...c, 40, 150, 8, .9, 2.2) + circ(...c, 40, 2.4) + star(c[0], c[1], .4) +
      Array.from({ length: 24 }, (_, i) => { const [x, y] = P(c[0], c[1], 196, i / 24 * Math.PI * 2); return dot(x, y, i % 2 ? 2.2 : 3.6, i % 2 ? .6 : 1); }).join('') + Array.from({ length: 8 }, (_, i) => { const [x, y] = P(c[0], c[1], 168, i / 8 * Math.PI * 2 + Math.PI / 8); return `<circle cx="${f(x)}" cy="${f(y)}" r="9" ${L(2)}/>`; }).join(''); },
    /* XI Fuerza Vital */ () => { let r = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, [x0, y0] = P(280, 410, 76, a), [x1, y1] = P(280, 410, 176, a + .5), [xm, ym] = P(280, 410, 134, a + .05); r += `<path d="M${f(x0)} ${f(y0)} Q${f(xm)} ${f(ym)} ${f(x1)} ${f(y1)}" ${L(2, .9)}/>`; }
      return orbita(200) + r + circ(280, 410, 66, 2.6) + circ(280, 410, 44, 1.2, .5) + star(280, 410, .5); },
    /* XII El Colgado */ () => orbita() + `<line x1="170" y1="268" x2="390" y2="268" ${L(2.8)}/><line x1="280" y1="268" x2="280" y2="326" ${L(2)}/><path d="M196 326 L364 326 L280 506Z" ${L(2.6)}/>` + circ(280, 560, 26, 2.2) + star(280, 392, .5) + dot(170, 268, 3.4) + dot(390, 268, 3.4) + star(130, 600, .26, .8) + star(440, 600, .26, .8),
    /* XIII Muerte */ () => { const leaf = d => `<path d="M0 0 C16 -22 44 -24 56 -10 C42 4 16 8 0 0Z" transform="translate(280 292) scale(${d} 1) rotate(${d > 0 ? -18 : 18})" ${L(2)}/>`;
      return orbita() + circ(280, 440, 98, 2.6) + `<path d="M280 342 L270 392 L292 424 L274 470 L286 538" ${L(2, .85)}/>` + `<line x1="280" y1="342" x2="280" y2="262" ${L(2.4)}/>` + leaf(1) + leaf(-1) + [[190, 590], [250, 612], [330, 600], [380, 580]].map(([x, y], i) => dot(x, y, 3 - i * .2, .8)).join('') + star(280, 226, .28); },
    /* XIV Arte */ () => orbita() + `<path d="M196 290 C196 366 364 366 364 430 C364 494 196 494 196 566" ${L(2.6)}/><path d="M364 290 C364 366 196 366 196 430 C196 494 364 494 364 566" ${L(2.6)}/>` + circ(196, 290, 12, 2) + circ(364, 290, 12, 2) + circ(196, 566, 12, 2) + circ(364, 566, 12, 2) + star(280, 428, .5) + star(280, 230, .26, .85) + star(280, 620, .26, .85),
    /* XV El Diablo */ () => { let c = ''; for (let i = 0; i < 4; i++) { const cx = 280 + (i % 2 ? 26 : -26), cy = 290 + i * 78, ex = i === 2 ? 'stroke-dasharray="190 60"' : '';
        c += `<ellipse cx="${cx}" cy="${cy}" rx="62" ry="38" transform="rotate(${i % 2 ? -32 : 32} ${cx} ${cy})" ${L(2.5)} ${ex}/>`; }
      return orbita() + c + star(280, 214, .3) + dot(190, 600, 3) + dot(372, 610, 3) + circ(280, 410, 150, 1.2, .3); },
    /* XVI La Torre */ () => `<path d="M222 568 V300 H238 V274 H262 V300 H298 V274 H322 V300 H338 V568Z" ${L(2.6)}/><path d="M262 568 V500 A18 18 0 0 1 298 500 V568" ${L(1.8, .8)}/><rect x="266" y="360" width="28" height="44" rx="14" ${L(1.8, .8)}/><path d="M168 214 L252 336 L226 346 L312 480" ${L(2.8)}/>` + [[150, 250], [188, 190], [330, 520], [352, 470]].map(([x, y], i) => dot(x, y, 3 + (i % 2), .85)).join('') + `<line x1="190" y1="568" x2="370" y2="568" ${L(2.2)}/>` + star(380, 250, .3, .85),
    /* XVII La Estrella */ () => { const c = [280, 410], Q = Array.from({ length: 8 }, (_, i) => P(c[0], c[1], 150, i / 8 * Math.PI * 2 - Math.PI / 2));
      return circ(...c, 175, 1.4, .5) + circ(...c, 118, 1.4, .45) + circ(...c, 64, 1.6, .6) + `<polygon points="${[0, 3, 6, 1, 4, 7, 2, 5].map(i => f(Q[i][0]) + ',' + f(Q[i][1])).join(' ')}" ${L(2.4)}/>` + star(c[0], c[1], 1.15) +
        Array.from({ length: 16 }, (_, i) => { const [x, y] = P(c[0], c[1], 175, i / 16 * Math.PI * 2); return dot(x, y, i % 2 ? 2.4 : 3.6, i % 2 ? .6 : 1); }).join('') + star(130, 180, .32, .9) + star(440, 200, .26, .8) + star(430, 630, .3, .8); },
    /* XVIII La Luna */ () => orbita() + luna(270, 410, 132, 322, 388, 108) + eye(300, 412, .72) + dot(...P(280, 410, 198, -.9), 6) + circ(...P(280, 410, 198, -.9).map(f), 12, 1.4, .6) + star(430, 250, .3, .8) + star(140, 640, .3, .8) + star(440, 610, .24, .7),
    /* XIX El Sol */ () => { const c = [280, 410]; return circ(...c, 196, 1.2, .45, 'stroke-dasharray="1.5 9"') + rayos(...c, 96, 182, 24, .9, 2) + rayos(...c, 96, 138, 48, .55, 1.4) + circ(...c, 86, 2.6) + circ(...c, 100, 1.4, .5) + eye(c[0], c[1], 1.05) + star(120, 170, .3, .8) + star(450, 660, .3, .8); },
    /* XX El Eón */ () => { let r = ''; for (let i = 0; i < 9; i++) { const a = -Math.PI + (i + .5) / 9 * Math.PI, [x0, y0] = P(280, 420, 118, a), [x1, y1] = P(280, 420, i % 2 ? 176 : 200, a); r += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" ${L(1.8, .9)}/>`; }
      return r + `<path d="M204 580 V430 A76 76 0 0 1 356 430 V580" ${L(2.6)}/><path d="M232 580 V434 A48 48 0 0 1 328 434 V580" ${L(1.6, .7)}/>` + star(280, 440, .5) + [0, 1, 2].map(i => `<line x1="${196 - i * 12}" y1="${594 + i * 16}" x2="${364 + i * 12}" y2="${594 + i * 16}" ${L(1.8, .85 - i * .2)}/>`).join('') + star(280, 232, .28) + orbita(); },
    /* XXI El Universo */ () => { let g = ''; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2, x = 280 + 118 * Math.cos(t), y = 410 + 176 * Math.sin(t), tang = Math.atan2(176 * Math.cos(t), -118 * Math.sin(t)) * 180 / Math.PI;
        g += `<path d="M0 0 C5 -8 14 -8 20 0 C14 8 5 8 0 0Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(tang + (i % 2 ? 24 : -24))})" ${L(1.5, .85)}/>`; }
      return `<ellipse cx="280" cy="410" rx="118" ry="176" ${L(1.4, .55)}/>` + g + star(280, 410, .9) + circ(280, 410, 52, 1.2, .45) + star(280, 204, .26, .9) + star(280, 616, .26, .9) + star(124, 410, .26, .85) + star(436, 410, .26, .85); }
  ];

  let uid = 0;
  const caja = (halo, cuerpo, esReverso) => { const u = ++uid; return `<svg viewBox="0 0 560 940" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>
    <linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a3a"/><stop offset=".55" stop-color="#4b2850"/><stop offset="1" stop-color="#7e4560"/></linearGradient>
    <linearGradient id="e${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E3C8"/><stop offset=".5" stop-color="#D8B48C"/><stop offset="1" stop-color="#F7E3C8"/></linearGradient>
    <radialGradient id="h${u}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F7B791" stop-opacity=".66"/><stop offset=".5" stop-color="${halo[1]}" stop-opacity=".28"/><stop offset="1" stop-color="${halo[1]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="d${u}" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#F6B08A" stop-opacity=".5"/><stop offset="1" stop-color="#F6B08A" stop-opacity="0"/></radialGradient>
    <filter id="n${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0"/></filter>
    <clipPath id="k${u}"><rect x="1.5" y="1.5" width="557" height="937" rx="30"/></clipPath></defs>
    <g clip-path="url(#k${u})"><rect width="560" height="940" fill="url(#b${u})"/><rect width="560" height="940" fill="url(#d${u})"/><circle cx="280" cy="${esReverso ? 470 : 448}" r="266" fill="url(#h${u})"/><rect width="560" height="940" filter="url(#n${u})" opacity=".07"/></g>
    <rect x="1.5" y="1.5" width="557" height="937" rx="30" fill="none" stroke="url(#e${u})" stroke-width="2.4"/>
    <rect x="18" y="18" width="524" height="904" rx="20" ${L(1.2, .3)}/>
    ${[[34, 34], [526, 34], [34, 906], [526, 906]].map(([x, y]) => `<path d="${STAR}" transform="translate(${x - 6} ${y - 6}) scale(.12)" fill="${LINEA}" fill-opacity=".7"/>`).join('')}
    ${cuerpo}</svg>`; };
  const ramita = (x, y, dir) => { let l = ''; [[12, -1], [26, 1], [40, -1], [54, 1]].forEach(([dx, side]) => { l += `<path d="M0 0 C4 -7 12 -7 17 0 C12 7 4 7 0 0Z" transform="translate(${x + dir * dx} ${y + side * 3 - 1}) rotate(${(dir > 0 ? 0 : 180) + side * -38})" fill="${LINEA}" fill-opacity=".62"/>`; });
    return `<path d="M${x} ${y} Q${x + dir * 30} ${y - 4} ${x + dir * 66} ${y + 1}" ${L(1.2, .65)}/>` + l; };
  const SERIF = "'Cormorant Garamond',Georgia,serif", SANS = "'DM Sans',Arial,sans-serif", HEB = "'Noto Serif Hebrew','Times New Roman',serif";
  const textoSVG = t => `<text x="${t.x}" y="${t.y}" text-anchor="${t.anchor || 'middle'}" font-family="${t.fam}" font-weight="${t.w}" font-style="${t.st || 'normal'}" font-size="${t.size}" letter-spacing="${t.ls}" fill="${LINEA}" fill-opacity="${t.o}" style="font-variant-numeric:lining-nums">${t.s}</text>`;
  const textosDe = d => [
    { x: 280, y: 94, s: d.num, size: 34, o: .95, ls: 12, fam: SERIF, w: 500 },
    { x: 512, y: 98, s: d.heb, size: 32, o: .75, ls: 0, fam: HEB, w: 400, anchor: 'end' },
    { x: 280, y: 842, s: d.nombre, size: 54, o: 1, ls: 1, fam: SERIF, w: 500, st: 'italic' },
    { x: 280, y: 886, s: d.astro.toUpperCase(), size: 16, o: .7, ls: 9, fam: SANS, w: 600 }
  ];
  const decor = () => `<line x1="236" y1="118" x2="324" y2="118" ${L(1, .5)}/>` + ramita(206, 790, -1) + ramita(354, 790, 1) + `<circle cx="280" cy="790" r="3" fill="${LINEA}" fill-opacity=".8"/>`;

  window.CARTAS = {
    n: 22, SERIF, SANS, LINEA,
    textos: id => textosDe(window.ARCANOS[id]),
    /** Carta completa (con textos), para la pantalla */
    cara: id => { const d = window.ARCANOS[id]; const s = caja(HALOS[id % HALOS.length], `<g transform="translate(0 38)">${ARTE[id]()}</g>` + decor() + textosDe(d).map(textoSVG).join(''), false);
      return s.replace('role="img">', `role="img" aria-label="Carta ${d.num}, ${d.nombre}: ${d.simbolo}">`); },
    /** Sin textos, para dibujarla en un lienzo (las fuentes de la página no entran en una imagen SVG) */
    caraSinTexto: id => caja(HALOS[id % HALOS.length], `<g transform="translate(0 38)">${ARTE[id]()}</g>` + decor(), false),
    reverso: () => { const u = ++uid; const c = (r, w, o, ex = '') => circ(280, 470, r, w, o, ex);
      return caja([ROS, VIO], c(176, 1.2, .5) + c(130, 1.2, .35) + c(192, 1.2, .4, 'stroke-dasharray="1.5 9"') +
        `<defs><linearGradient id="lg${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COR}"/><stop offset=".5" stop-color="${ROS}"/><stop offset="1" stop-color="${VIO}"/></linearGradient></defs><circle cx="280" cy="470" r="96" fill="url(#lg${u})"/>` +
        `<path d="${STAR}" transform="translate(${280 - 50 * 1.85} ${470 - 50 * 1.85}) scale(1.85)" fill="${TINTA}"/>` + [[35, 35], [65, 35], [35, 65], [65, 65]].map(([x, y]) => `<circle cx="${280 + (x - 50) * 1.85}" cy="${470 + (y - 50) * 1.85}" r="5.3" fill="${TINTA}"/>`).join('') +
        textoSVG({ x: 280, y: 132, s: 'artedeastro', size: 40, o: .92, ls: 9, fam: SERIF, w: 500, st: 'italic' }) + textoSVG({ x: 280, y: 826, s: 'LA CARTA DE HOY', size: 15, o: .66, ls: 10, fam: SANS, w: 600 }), true)
        .replace('role="img">', 'role="img" aria-label="Carta boca abajo con la estrella de artedeastro">'); }
  };
})();
