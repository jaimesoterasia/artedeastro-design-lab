/* Cielo de hoy: consulta la tabla generada con efemérides (cielo-datos.js). Sin servidor y sin datos de la persona.
   Si la fecha queda fuera de la tabla, devuelve null y la web no muestra el cielo (mejor nada que algo inexacto). */
(() => {
  const SIGNOS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
  const D = window.CIELO;
  const buscar = (lista, min) => { let lo = 0, hi = lista.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (lista[m][0] <= min) { r = m; lo = m + 1; } else hi = m - 1; } return r; };

  function fase(min) {
    const i = buscar(D.fases, min); if (i < 0 || i >= D.fases.length - 1) return null;
    const [t0, q] = D.fases[i], [t1] = D.fases[i + 1];
    const ang = (q * 90 + 90 * (min - t0) / (t1 - t0)) % 360;           // 0 nueva, 90 cuarto creciente, 180 llena, 270 cuarto menguante
    const cerca = a => { const d = Math.abs(((ang - a + 540) % 360) - 180); return d <= 7.5; };   // ±7,5° ≈ ±15 horas
    if (cerca(0)) return { ang, nombre: 'luna nueva' };
    if (cerca(90)) return { ang, nombre: 'cuarto creciente' };
    if (cerca(180)) return { ang, nombre: 'luna llena' };
    if (cerca(270)) return { ang, nombre: 'cuarto menguante' };
    if (ang < 90) return { ang, nombre: 'luna creciente' };
    if (ang < 180) return { ang, nombre: 'gibosa creciente' };
    if (ang < 270) return { ang, nombre: 'gibosa menguante' };
    return { ang, nombre: 'luna menguante' };
  }

  window.cieloDeHoy = (fecha = new Date()) => {
    if (!D) return null;
    const min = Math.floor(fecha.getTime() / 60000);
    if (min < D.desde || min > D.hasta - 60 * 24 * 40) return null;
    const il = buscar(D.luna, min), is = buscar(D.sol, min), f = fase(min);
    if (il < 0 || is < 0 || !f) return null;
    const siguienteLuna = D.luna[il + 1] ? D.luna[il + 1][0] : null;
    return {
      luna: SIGNOS[D.luna[il][1]],
      sol: SIGNOS[D.sol[is][1]],
      fase: f.nombre,
      ang: f.ang,
      cambiaHoy: siguienteLuna !== null && (siguienteLuna - min) < 60 * 12,   // la Luna cambia de signo en las próximas 12 h
      siguienteLuna: siguienteLuna !== null ? SIGNOS[D.luna[il + 1][1]] : null
    };
  };
})();
