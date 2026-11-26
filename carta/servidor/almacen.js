/* Almacenes para probar el servidor de cobro sin infraestructura. Misma interfaz que se usará en producción:
   get(k), put(k, v, {ttl en segundos}), del(k), incr(k, n, {ttl}) → nuevo valor.
   En producción hay que usar una base con operaciones atómicas (D1 o Durable Objects): KV de Cloudflare es de consistencia eventual y no sirve para contar créditos. */

export function almacenMemoria() {
  const m = new Map(), vivo = (k) => { const e = m.get(k); if (!e) return null; if (e.t && e.t < Date.now()) { m.delete(k); return null; } return e; };
  return {
    async get(k) { const e = vivo(k); return e ? e.v : null; },
    async put(k, v, o) { m.set(k, { v, t: o && o.ttl ? Date.now() + o.ttl * 1000 : 0 }); },
    async del(k) { m.delete(k); },
    async incr(k, n, o) { const e = vivo(k), v = (e ? Number(e.v) || 0 : 0) + (n === undefined ? 1 : n); m.set(k, { v, t: e ? e.t : (o && o.ttl ? Date.now() + o.ttl * 1000 : 0) }); return v; },
    _m: m
  };
}

// Simulación en el navegador del laboratorio: se guarda en localStorage para que la compra de prueba sobreviva a recargar la página.
export function almacenLocal(prefijo) {
  const P = prefijo || 'ade_sim:';
  const leer = k => { try { const e = JSON.parse(localStorage.getItem(P + k)); if (!e) return null; if (e.t && e.t < Date.now()) { localStorage.removeItem(P + k); return null; } return e; } catch (x) { return null; } };
  const escribir = (k, e) => { try { localStorage.setItem(P + k, JSON.stringify(e)); } catch (x) { /* sin almacenamiento */ } };
  return {
    async get(k) { const e = leer(k); return e ? e.v : null; },
    async put(k, v, o) { escribir(k, { v, t: o && o.ttl ? Date.now() + o.ttl * 1000 : 0 }); },
    async del(k) { try { localStorage.removeItem(P + k); } catch (x) { /* sin almacenamiento */ } },
    async incr(k, n, o) { const e = leer(k), v = (e ? Number(e.v) || 0 : 0) + (n === undefined ? 1 : n); escribir(k, { v, t: e ? e.t : (o && o.ttl ? Date.now() + o.ttl * 1000 : 0) }); return v; }
  };
}
