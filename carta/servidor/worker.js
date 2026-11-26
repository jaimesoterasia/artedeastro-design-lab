/* La carta de hoy · API de cobro (Fase 3, modo simulado).
   Es un módulo estándar de Cloudflare Workers (`export default { fetch(request, env) }`) que solo usa APIs web: funciona igual en un Worker
   y en el navegador (así se prueba en el Design Lab sin servidor real).

   Principios:
   - No se guardan textos de la persona (ni la pregunta, ni la lectura, ni la dedicatoria). Solo pedidos, créditos y contadores, sin datos personales.
   - El precio lo fija el servidor. El cliente nunca decide cuánto se cobra.
   - «Llave de acceso» firmada (HMAC): sin cuentas ni contraseñas. Se recupera con un código de compra.
   - Si no se puede entregar la lectura, se libera el crédito y, si no se ha entregado nada, se reembolsa solo.
   - Topes: pedidos y lecturas por persona y día, y gasto mensual de IA con corte automático.

   env (se inyecta desde fuera; los secretos nunca van en el repositorio):
     almacen   { get(k), put(k,v,{ttl}), del(k), incr(k,n,{ttl}) }   → en producción, D1 o Durable Objects (KV no es atómico)
     SECRETO   texto largo y aleatorio para firmar llaves y derivar códigos
     PASARELA  'sim' (pasarela de prueba) o 'stripe'
     STRIPE_SECRETO, STRIPE_WEBHOOK   solo con PASARELA='stripe'
     LECTOR    async ({carta, cielo, pregunta}) => texto      → Fase 6: la IA de verdad
     ORIGENES  lista de orígenes permitidos para CORS (vacío = cualquiera, solo para pruebas)
     URL_OK, URL_CANCELAR   a dónde vuelve la persona desde la pasarela real
     TOPE_IA_CENTS (por defecto 2000 = 20 €/mes), COSTE_LECTURA_CENTS (por defecto 4) */

export const PRODUCTOS = {
  lectura:  { nombre: 'Lectura profunda', precio: 299, creditos: 1 },
  paquete3: { nombre: 'Paquete de 3 lecturas', precio: 699, creditos: 3 },
  regalo:   { nombre: 'Regalo de una lectura', precio: 399, creditos: 1, regalo: true }
};
export const TEXTO_DESISTIMIENTO = 'Quiero que la lectura se me entregue ahora mismo y entiendo que, una vez entregada, pierdo el derecho de desistimiento.';
export const MENSAJE_ACOMPANAR = 'Siento que estés así. No tienes que pasarlo a solas. Si estás en España, puedes llamar al 024 (línea de atención a la conducta suicida) o al 112 si es una urgencia.';
const LIMITES = { pedidosDia: 5, lecturasDia: 8, recuperarDia: 10 };
const DIA = 86400, ANIO = 365 * DIA;

// ---------- utilidades ----------
const enc = new TextEncoder();
const aB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const aHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function hmac(secreto, datos) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(datos)));
}
const igual = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };   // tiempo constante
const aleatorio = n => aB64u(crypto.getRandomValues(new Uint8Array(n)));
const ALFA = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
async function derivarCodigo(env, pedido) {                      // «ABCD-EFGH-JKMN»: se deriva del pedido, no se guarda en claro
  const h = await hmac(env.SECRETO, 'codigo:' + pedido); let s = '';
  for (let i = 0; i < 12; i++) s += ALFA[h[i] % ALFA.length];
  return s.replace(/(.{4})(?=.)/g, '$1-');
}
const normCodigo = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');
async function derivarSecretoRegalo(env, pedido) { return aB64u((await hmac(env.SECRETO, 'regalo:' + pedido)).slice(0, 18)); }
const dia = () => new Date().toISOString().slice(0, 10), mes = () => new Date().toISOString().slice(0, 7);
async function persona(env, request) {                           // identificador desechable por día: no sirve para seguir a nadie de un día a otro
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'local';
  return aB64u((await hmac(env.SECRETO, 'persona:' + ip + ':' + dia())).slice(0, 10));
}
// Primer filtro de malestar grave (palabras). En producción se refuerza con la clasificación de la propia IA (Fase 6).
const MALESTAR = /(no quiero (seguir|vivir)|quitarme la vida|quitarme de en medio|suicid|hacerme da[ñn]o|no puedo m[aá]s|acabar con (todo|mi vida)|ganas de morir|no merece la pena vivir|desaparecer para siempre)/i;
export const hayMalestar = t => MALESTAR.test(String(t || '').normalize('NFC'));

function json(obj, status, env, request) {
  const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  const o = request && request.headers.get('origin');
  if (o && (!env.ORIGENES || !env.ORIGENES.length || env.ORIGENES.includes(o))) { h['access-control-allow-origin'] = o; h['vary'] = 'Origin'; }
  return new Response(JSON.stringify(obj), { status: status || 200, headers: h });
}

// ---------- llaves de acceso ----------
async function firmarLlave(env, pedido) {
  const carga = aB64u(enc.encode(JSON.stringify({ p: pedido, e: Math.floor(Date.now() / 1000) + ANIO })));
  return 'v1.' + carga + '.' + aB64u(await hmac(env.SECRETO, 'llave:' + carga));
}
async function leerLlave(env, llave) {
  const m = /^v1\.([\w-]+)\.([\w-]+)$/.exec(String(llave || '')); if (!m) return null;
  if (!igual(aB64u(await hmac(env.SECRETO, 'llave:' + m[1])), m[2])) return null;
  try { const c = JSON.parse(new TextDecoder().decode(deB64u(m[1]))); return c.e > Date.now() / 1000 ? c : null; } catch (e) { return null; }
}

// ---------- pasarelas ----------
async function crearPago(env, pedido, prod) {
  if (env.PASARELA === 'stripe') return crearSesionStripe(env, pedido, prod);
  return { pasarela: 'sim', pedido };                                   // la pasarela de prueba la dibuja la página
}
async function reembolsar(env, p, id) {
  if (p.estado === 'reembolsado') return;
  if (env.PASARELA === 'stripe' && p.pi) {                              // SIN PROBAR: necesita la cuenta de pruebas de Eva
    await fetch('https://api.stripe.com/v1/refunds', { method: 'POST', headers: { authorization: 'Bearer ' + env.STRIPE_SECRETO, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ payment_intent: p.pi }) });
  }
  p.estado = 'reembolsado'; await env.almacen.put('p:' + id, p, { ttl: 90 * DIA });
}
async function crearSesionStripe(env, pedido, prod) {                    // SIN PROBAR: necesita la cuenta de pruebas de Eva
  const f = new URLSearchParams({ mode: 'payment', locale: 'es', client_reference_id: pedido, success_url: env.URL_OK + (String(env.URL_OK).includes('?') ? '&' : '?') + 'pedido=' + pedido, cancel_url: env.URL_CANCELAR });
  f.set('line_items[0][quantity]', '1'); f.set('line_items[0][price_data][currency]', 'eur');
  f.set('line_items[0][price_data][unit_amount]', String(prod.precio)); f.set('line_items[0][price_data][product_data][name]', prod.nombre);
  f.set('custom_text[submit][message]', TEXTO_DESISTIMIENTO);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: 'Bearer ' + env.STRIPE_SECRETO, 'content-type': 'application/x-www-form-urlencoded' }, body: f });
  const s = await r.json(); if (!r.ok) throw new Error('stripe');
  return { pasarela: 'stripe', url: s.url };
}
export async function verificarFirmaStripe(cuerpo, cabecera, secreto, ahora = Date.now() / 1000) {
  const partes = {}; String(cabecera || '').split(',').forEach(x => { const i = x.indexOf('='); if (i > 0 && !(x.slice(0, i) in partes)) partes[x.slice(0, i)] = x.slice(i + 1); });
  if (!partes.t || !partes.v1 || Math.abs(ahora - Number(partes.t)) > 300) return false;
  return igual(aHex(await hmac(secreto, partes.t + '.' + cuerpo)), partes.v1);
}

// ---------- manejadores ----------
async function checkout(env, request, b) {
  const prod = PRODUCTOS[b.producto]; if (!prod) return [400, { error: 'producto' }];
  if (b.consentimiento !== true) return [400, { error: 'consentimiento', mensaje: 'Hace falta que aceptes la entrega inmediata para continuar.' }];
  if (hayMalestar(b.pregunta)) return [200, { estado: 'acompanar', mensaje: MENSAJE_ACOMPANAR }];   // sin oferta ni cobro
  const per = await persona(env, request), n = await env.almacen.incr('d:' + per + ':pedidos', 1, { ttl: DIA + 7200 });
  if (n > LIMITES.pedidosDia) return [429, { estado: 'limite', mensaje: 'Por hoy has llegado al máximo de compras. Mañana puedes seguir.' }];
  const id = aleatorio(12);
  const p = { producto: b.producto, estado: 'pendiente', creditos: prod.creditos, creado: Date.now(), regalo: !!prod.regalo };    // sin datos personales
  await env.almacen.put('p:' + id, p, { ttl: 90 * DIA });
  try { return [200, Object.assign({ estado: 'pendiente', pedido: id, producto: b.producto, precio: prod.precio }, await crearPago(env, id, prod))]; }
  catch (e) { return [502, { error: 'pasarela', mensaje: 'No hemos podido abrir el pago. No se ha cobrado nada.' }]; }
}
async function simPagar(env, b) {
  if (env.PASARELA !== 'sim') return [404, { error: 'no_existe' }];
  const p = await env.almacen.get('p:' + b.pedido); if (!p) return [404, { error: 'pedido' }];
  if (b.resultado === 'rechazada') return [200, { estado: 'rechazada', mensaje: 'La tarjeta de prueba ha sido rechazada. No se ha cobrado nada.' }];
  if (p.estado === 'pendiente') { p.estado = 'pagado'; if (b.resultado === 'ok_fallo_entrega') p.simFallo = true; await env.almacen.put('p:' + b.pedido, p, { ttl: 90 * DIA }); }
  return [200, { estado: 'pagado' }];
}
async function canjear(env, b) {
  const p = await env.almacen.get('p:' + b.pedido); if (!p) return [404, { error: 'pedido' }];
  if (p.estado !== 'pagado') return [402, { error: 'sin_pago', estado: p.estado }];
  const codigo = await derivarCodigo(env, b.pedido); await env.almacen.put('c:' + codigo, b.pedido, { ttl: 400 * DIA });
  if (p.regalo) return [200, { estado: 'ok', regalo: { id: b.pedido, secreto: await derivarSecretoRegalo(env, b.pedido) }, codigo }];   // quien paga solo recibe el enlace
  const usados = Number(await env.almacen.get('u:' + b.pedido)) || 0;
  return [200, { estado: 'ok', llave: await firmarLlave(env, b.pedido), codigo, restantes: Math.max(0, p.creditos - usados) }];
}
async function abrirRegalo(env, b) {
  const p = await env.almacen.get('p:' + b.id); if (!p || !p.regalo || p.estado === 'reembolsado') return [404, { error: 'regalo', mensaje: 'Este regalo no existe o ya no está disponible.' }];
  if (!igual(String(b.secreto || ''), await derivarSecretoRegalo(env, b.id))) return [403, { error: 'regalo', mensaje: 'Este enlace de regalo no es válido.' }];
  if (p.estado !== 'pagado') return [402, { error: 'sin_pago' }];
  const usados = Number(await env.almacen.get('u:' + b.id)) || 0;
  return [200, { estado: 'ok', llave: await firmarLlave(env, b.id), restantes: Math.max(0, p.creditos - usados) }];
}
async function recuperar(env, request, b) {
  const per = await persona(env, request), n = await env.almacen.incr('d:' + per + ':recuperar', 1, { ttl: DIA + 7200 });
  if (n > LIMITES.recuperarDia) return [429, { estado: 'limite', mensaje: 'Demasiados intentos hoy. Prueba mañana.' }];
  const id = await env.almacen.get('c:' + normCodigo(b.codigo)); if (!id) return [404, { error: 'codigo', mensaje: 'No encuentro ese código. Revisa que esté completo.' }];
  const p = await env.almacen.get('p:' + id); if (!p || p.estado !== 'pagado') return [404, { error: 'codigo', mensaje: 'Esa compra ya no está disponible.' }];
  if (p.regalo) return [200, { estado: 'ok', regalo: { id, secreto: await derivarSecretoRegalo(env, id) } }];
  const usados = Number(await env.almacen.get('u:' + id)) || 0;
  return [200, { estado: 'ok', llave: await firmarLlave(env, id), restantes: Math.max(0, p.creditos - usados) }];
}
async function lectura(env, request, b) {
  const c = await leerLlave(env, b.llave); if (!c) return [401, { error: 'llave', mensaje: 'Tu llave no es válida. Recupera tu compra con tu código.' }];
  const id = c.p, p = await env.almacen.get('p:' + id); if (!p || p.estado !== 'pagado') return [402, { error: 'sin_pago' }];
  const carta = Number(b.carta); if (!Number.isInteger(carta) || carta < 0 || carta > 21) return [400, { error: 'carta' }];
  if (hayMalestar(b.pregunta)) return [200, { estado: 'acompanar', mensaje: MENSAJE_ACOMPANAR }];                 // no se lee: se acompaña
  const per = await persona(env, request), nl = await env.almacen.incr('d:' + per + ':lecturas', 1, { ttl: DIA + 7200 });
  if (nl > LIMITES.lecturasDia) { await env.almacen.incr('d:' + per + ':lecturas', -1); return [429, { estado: 'limite', mensaje: 'Por hoy has llegado al máximo de lecturas. Tu crédito se conserva.' }]; }
  const tope = Number(env.TOPE_IA_CENTS || 2000), coste = Number(env.COSTE_LECTURA_CENTS || 4);
  const gasto = await env.almacen.incr('ia:' + mes(), coste, { ttl: 40 * DIA });
  if (gasto > tope) { await env.almacen.incr('ia:' + mes(), -coste); await env.almacen.incr('d:' + per + ':lecturas', -1); return [503, { estado: 'descansa', mensaje: 'Eva IA descansa por hoy. Tu carta y el cielo de hoy siguen aquí, y tu crédito se conserva.' }]; }
  const usados = await env.almacen.incr('u:' + id, 1, { ttl: 400 * DIA });                                           // reserva atómica del crédito
  if (usados > p.creditos) { await env.almacen.incr('u:' + id, -1); await env.almacen.incr('ia:' + mes(), -coste); return [409, { estado: 'sin_creditos', mensaje: 'Ya has usado todas las lecturas de esta compra.' }]; }
  try {
    if (p.simFallo) throw new Error('fallo de prueba');
    const texto = await env.LECTOR({ carta, cielo: b.cielo || null, pregunta: String(b.pregunta || '').slice(0, 200) });
    if (!texto || texto.length < 80) throw new Error('lectura vacía');
    return [200, { estado: 'ok', texto, restantes: Math.max(0, p.creditos - usados) }];                            // el texto no se guarda en ningún sitio
  } catch (e) {
    await env.almacen.incr('u:' + id, -1); await env.almacen.incr('ia:' + mes(), -coste);                            // se devuelve el crédito y el gasto
    const sinEntregas = (Number(await env.almacen.get('u:' + id)) || 0) === 0;
    if (sinEntregas) { await reembolsar(env, p, id); return [200, { estado: 'fallo', reembolso: true, mensaje: 'No hemos podido escribir tu lectura. Te hemos devuelto el dinero automáticamente.' }]; }
    return [200, { estado: 'fallo', reembolso: false, mensaje: 'No hemos podido escribir tu lectura ahora. Tu crédito se conserva: inténtalo de nuevo en un rato.' }];
  }
}
async function webhookStripe(env, request) {
  const cuerpo = await request.text();
  if (!env.STRIPE_WEBHOOK || !await verificarFirmaStripe(cuerpo, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK)) return [400, { error: 'firma' }];
  let ev; try { ev = JSON.parse(cuerpo); } catch (e) { return [400, { error: 'json' }]; }
  const o = ev.data && ev.data.object;
  if (ev.type === 'checkout.session.completed' && o && o.client_reference_id && o.payment_status === 'paid') {
    const p = await env.almacen.get('p:' + o.client_reference_id);
    if (p && p.estado === 'pendiente') { p.estado = 'pagado'; p.pi = o.payment_intent || ''; await env.almacen.put('p:' + o.client_reference_id, p, { ttl: 90 * DIA }); }   // idempotente
  }
  return [200, { recibido: true }];
}

export default {
  async fetch(request, env) {
    const u = new URL(request.url), ruta = u.pathname.replace(/\/+$/, '');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': request.headers.get('origin') || '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
    try {
      if (ruta === '/api/productos' && request.method === 'GET') return json({ productos: Object.fromEntries(Object.entries(PRODUCTOS).map(([k, v]) => [k, { nombre: v.nombre, precio: v.precio, creditos: v.creditos }])), iva: 0.21, texto_desistimiento: TEXTO_DESISTIMIENTO }, 200, env, request);
      if (ruta === '/api/webhook/stripe' && request.method === 'POST') { const [s, o] = await webhookStripe(env, request); return json(o, s, env, request); }
      if (request.method !== 'POST') return json({ error: 'metodo' }, 405, env, request);
      let b = {}; try { b = await request.json(); } catch (e) { return json({ error: 'json' }, 400, env, request); }
      const rutas = { '/api/checkout': () => checkout(env, request, b), '/api/sim/pagar': () => simPagar(env, b), '/api/canjear': () => canjear(env, b), '/api/regalo/abrir': () => abrirRegalo(env, b), '/api/recuperar': () => recuperar(env, request, b), '/api/lectura': () => lectura(env, request, b) };
      if (!rutas[ruta]) return json({ error: 'no_existe' }, 404, env, request);
      const [s, o] = await rutas[ruta](); return json(o, s, env, request);
    } catch (e) { return json({ error: 'interno', mensaje: 'Algo ha fallado. No se ha cobrado nada que no se haya mostrado.' }, 500, env, request); }
  }
};
