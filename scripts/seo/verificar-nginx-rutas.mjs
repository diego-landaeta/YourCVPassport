#!/usr/bin/env node
/**
 * Comprueba nginx/yourcvpassport.com.produccion.conf SIN nginx (no hace falta tenerlo instalado):
 *
 *   1. Lint básico del fichero: llaves equilibradas, cada directiva acaba en «;», las location con
 *      nombre (@...) que se usan están definidas, las regex compilan, los snippets incluidos existen
 *      en nginx/ y ningún add_header cuelga de una location (rompería la herencia de las cabeceras
 *      de seguridad).
 *   2. Simula la decisión de nginx para una ruta (redirect map -> /index.html -> fichero/copia
 *      estática -> lista blanca de la SPA -> 404) leyendo los `map $ycp_redirect` y `$ycp_app_route`
 *      del propio .conf, y comprueba que CADA ruta de config/routeConfig.ts (en español e inglés)
 *      queda cubierta: por una copia estática (seo/static-meta.mjs), por la lista blanca o por una
 *      redirección. También cada copia estática y cada artículo del blog no deben caer en 404.
 *   3. Comprueba el código esperado de las URLs de la auditoría (hallazgos 01 y 12).
 *
 * Es una simulación del subconjunto de nginx que usa el fichero (map exacto + regex, en orden); no
 * sustituye a `nginx -t` ni a la batería de curl de nginx/README-static.md.
 *
 * Uso: node scripts/seo/verificar-nginx-rutas.mjs        (código de salida 1 si algo falla)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONF = join(raiz, 'nginx', 'yourcvpassport.com.produccion.conf');
const conf = readFileSync(CONF, 'utf8').replace(/\r\n/g, '\n');
const fallos = [];
const fallo = (m) => fallos.push(m);

// ---------- tokenizador mínimo de nginx ----------
/** Quita comentarios (# fuera de comillas) y devuelve el texto limpio. */
function sinComentarios(s) {
  let out = '';
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      out += c;
      if (c === q) q = null;
    } else if (c === '"' || c === "'") {
      q = c;
      out += c;
    } else if (c === '#') {
      while (i < s.length && s[i] !== '\n') i++;
      out += '\n';
    } else out += c;
  }
  if (q) fallo('comillas sin cerrar en el .conf');
  return out;
}
const limpio = sinComentarios(conf);

// ---------- 1) lint ----------
{
  let prof = 0;
  let q = null;
  for (const c of limpio) {
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '{') prof++;
    if (c === '}') { prof--; if (prof < 0) { fallo('llave } sin abrir'); break; } }
  }
  if (prof !== 0) fallo(`llaves desequilibradas (${prof})`);

  // Cada línea con contenido (fuera de strings multilínea) debe acabar en ; { o }
  limpio.split('\n').forEach((l, i) => {
    const t = l.trim();
    if (!t) return;
    if (!/[;{}]$/.test(t)) fallo(`línea ${i + 1} sin «;», «{» ni «}» al final: ${t.slice(0, 80)}`);
  });

  // location con nombre usadas y definidas
  const definidas = new Set([...limpio.matchAll(/location\s+(@\w+)\s*\{/g)].map((m) => m[1]));
  const usadas = new Set([...limpio.matchAll(/(?:=\s*|try_files[^;]*\s)(@\w+)\s*;/g)].map((m) => m[1]));
  for (const u of usadas) if (!definidas.has(u)) fallo(`se usa ${u} pero no hay «location ${u}»`);
  for (const d of definidas) if (!usadas.has(d)) fallo(`la location ${d} está definida y no se usa`);

  // snippets incluidos existen
  for (const m of limpio.matchAll(/include\s+snippets\/([\w.-]+)\s*;/g)) {
    if (!existsSync(join(raiz, 'nginx', m[1]))) fallo(`include snippets/${m[1]}: no existe nginx/${m[1]}`);
  }

  // add_header solo a nivel de server (profundidad 1 dentro de http implícito: dentro de «server {» pero no de «location»)
  const lineas = limpio.split('\n');
  let p = 0;
  const pila = [];
  for (const [i, l] of lineas.entries()) {
    const abre = /^\s*(\w+)[^{;]*\{\s*$/.exec(l);
    if (abre) pila.push(abre[1]);
    if (/^\s*add_header\b/.test(l) && pila.includes('location')) fallo(`línea ${i + 1}: add_header dentro de una location`);
    if (/^\s*\}\s*$/.test(l)) pila.pop();
    p += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
  }

  // «if» solo con return/rewrite dentro (uso seguro)
  for (const m of limpio.matchAll(/\bif\s*\([^)]*\)\s*\{([^}]*)\}/g)) {
    const cuerpo = m[1].trim();
    if (!/^(return\s|rewrite\s)/.test(cuerpo) || cuerpo.split(';').filter(Boolean).length !== 1) {
      fallo(`«if» con algo más que un return/rewrite: ${cuerpo.slice(0, 60)}`);
    }
  }
}

// ---------- lectura de los map ----------
function leerMap(variable) {
  const m = new RegExp(`map\\s+\\$uri\\s+\\$${variable}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(limpio);
  if (!m) { fallo(`no encuentro «map $uri $${variable}»`); return { exactas: new Map(), regex: [], def: '' }; }
  const entradas = [];
  const cuerpo = m[1];
  let tok = [];
  let cur = '';
  let q = null;
  let quoted = false;
  const fin = () => { if (cur !== '' || quoted) tok.push(cur); cur = ''; quoted = false; };
  for (const c of cuerpo) {
    if (q) { if (c === q) q = null; else cur += c; continue; }
    if (c === '"') { q = c; quoted = true; continue; }
    if (/\s/.test(c)) { fin(); continue; }
    if (c === ';') { fin(); if (tok.length === 2) entradas.push(tok); else if (tok.length) fallo(`entrada de map mal formada en ${variable}: ${tok.join(' | ')}`); tok = []; continue; }
    cur += c;
  }
  const exactas = new Map();
  const regex = [];
  let def = '';
  for (const [k, v] of entradas) {
    if (k === 'default') def = v;
    else if (k.startsWith('~')) {
      const ci = k.startsWith('~*');
      try { regex.push({ re: new RegExp(k.slice(ci ? 2 : 1), ci ? 'i' : ''), valor: v, clave: k }); }
      catch (e) { fallo(`regex inválida en ${variable}: ${k} (${e.message})`); }
    } else exactas.set(k, v);
  }
  return { exactas, regex, def };
}
function evaluar(mapa, uri) {
  if (mapa.exactas.has(uri)) return mapa.exactas.get(uri);
  for (const r of mapa.regex) {
    const m = r.re.exec(uri);
    if (m) return r.valor.replace(/\$(\w+)/g, (_, n) => (m.groups && m.groups[n] !== undefined ? m.groups[n] : ''));
  }
  return mapa.def;
}
const mapRedirect = leerMap('ycp_redirect');
const mapApp = leerMap('ycp_app_route');

// ---------- copias estáticas (lo que genera el build) ----------
const mod = await import(pathToFileURL(join(raiz, 'seo', 'static-meta.mjs')).href);
const copias = new Set(['/']);
for (const p of mod.STATIC_META_PAIRS) { copias.add(p.es); copias.add(p.en); }
for (const s of mod.STATIC_META_SINGLE) copias.add(s.path);
for (const a of mod.STATIC_META_ALIASES) copias.add(a.path);
const extraerPosts = (s) => JSON.parse(s.slice(s.indexOf('= [', s.indexOf('export const allPostsMeta')) + 2, s.lastIndexOf('\n];') + 2));
const posts = extraerPosts(readFileSync(join(raiz, 'content', 'posts', 'index.ts'), 'utf8').replace(/\r\n/g, '\n'));
const slugsBlog = { es: [], en: [] };
for (const p of posts) {
  const lang = p.lang === 'en' ? 'en' : 'es';
  slugsBlog[lang].push(p.slug);
  copias.add(`${lang === 'en' ? '/resources/blog' : '/recursos/blog'}/${p.slug}`);
}
// Carpetas intermedias: scripts/generate-static-meta.mjs les escribe el index.html genérico
const padres = new Set();
for (const p of [...copias]) {
  const partes = p.split('/').filter(Boolean);
  for (let i = 1; i < partes.length; i++) padres.add('/' + partes.slice(0, i).join('/'));
}
for (const p of padres) copias.add(p);

// ---------- simulación ----------
/** @returns {{status:number, via:string, to?:string}} */
function simular(uriCrudo) {
  const uri = uriCrudo.replace(/\/{2,}/g, '/');
  if (/\/\.(?!well-known\/)/.test(uri)) return { status: 403, via: 'archivo oculto' };
  const red = evaluar(mapRedirect, uri);
  if (red) return { status: 301, via: 'redirect', to: red };
  if (uri === '/index.html') return { status: 301, via: 'index.html', to: '/' };
  const mi = /^(\/.+)\/index\.html$/.exec(uri);
  if (mi) return { status: 301, via: 'index.html', to: mi[1] };
  if (uri === '/sitemap.xml') return { status: 200, via: 'proxy sitemap' };
  if (uri === '/api/mail-relay') return { status: 200, via: 'proxy mail-relay' };
  if (uri === '/robots.txt' || uri === '/favicon.ico') return { status: 200, via: 'fichero' };
  if (uri === '/404.html') return { status: 404, via: 'internal' };
  const sinBarra = uri.length > 1 ? uri.replace(/\/$/, '') : uri;
  if (copias.has(sinBarra)) return { status: 200, via: 'copia estática' };
  if (evaluar(mapApp, uri) === '1') return { status: 200, via: 'SPA (lista blanca)' };
  return { status: 404, via: '404.html' };
}

// ---------- 2) cobertura de config/routeConfig.ts ----------
const rc = readFileSync(join(raiz, 'config', 'routeConfig.ts'), 'utf8');
const rutas = [...rc.matchAll(/\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)',\s*componentName:\s*'(\w+)'/g)].map((m) => ({ en: '/' + m[1], es: '/' + m[2], c: m[3] }));
if (rutas.length < 25) fallo(`routeConfig.ts: solo he leído ${rutas.length} rutas (¿cambió el formato de pathMappings?)`);
const cobertura = { 'copia estática': 0, 'SPA (lista blanca)': 0, redirect: 0 };
const detalleRutas = [];
for (const r of rutas) {
  for (const ruta of new Set([r.en, r.es])) {
    const s = simular(ruta);
    const enCopia = copias.has(ruta);
    const enLista = evaluar(mapApp, ruta) === '1';
    if (s.status === 404 || s.status === 403) fallo(`routeConfig: ${ruta} (${r.c}) responde ${s.status}`);
    else if (s.status === 301) cobertura.redirect++;
    else if (s.via === 'copia estática') cobertura['copia estática']++;
    else cobertura['SPA (lista blanca)']++;
    // las que tienen copia estática también deberían estar en la lista blanca (red de seguridad), salvo las redirigidas
    if (s.status === 200 && enCopia && !enLista) detalleRutas.push(`${ruta}: solo cubierta por la copia estática (si el build la omite daría 404)`);
    if (s.status === 200 && !enCopia && !enLista) fallo(`${ruta}: ni copia ni lista blanca`);
  }
}

// copias estáticas y artículos: ninguno puede caer en 404 ni redirigir (salvo /recursos y /resources)
for (const c of copias) {
  const s = simular(c);
  if (s.status !== 200 && !['/recursos', '/resources'].includes(c)) fallo(`copia estática ${c} -> ${s.status} (${s.via}${s.to ? ' a ' + s.to : ''})`);
}
// carpetas intermedias que no son una ruta real (dejarían un soft 404 con el index.html genérico)
for (const p of padres) {
  if (!copiasPropias(p)) detalleRutas.push(`carpeta intermedia ${p}: recibe el index.html genérico (200); no es una ruta de la SPA`);
}
function copiasPropias(p) {
  return rutas.some((r) => r.en === p || r.es === p) || evaluar(mapApp, p) === '1' || ['/recursos', '/resources'].includes(p);
}
for (const p of padres) {
  if (!copiasPropias(p)) fallo(`carpeta intermedia ${p}: 200 con el index.html genérico y no es una ruta (soft 404)`);
}

// ---------- 3) códigos esperados (auditoría 25/10/2026) ----------
const esperado = [
  // [ruta, estado, destino de la redirección o nota]
  ['/', 200],
  ['/precios', 200], ['/pricing', 200], ['/producto/resumen', 200], ['/product/overview', 200],
  ['/empresas', 200], ['/companies', 200], ['/perfiles', 200], ['/profiles', 200],
  ['/recursos/blog', 200], ['/resources/blog', 200],
  [`/recursos/blog/${slugsBlog.es[0]}`, 200], [`/resources/blog/${slugsBlog.en[0]}`, 200],
  ['/cv/delsy-romero', 200], ['/login', 200], ['/signup', 200], ['/dashboard', 200], ['/dashboard/visas', 200],
  ['/admin', 200], ['/company/dashboard', 200], ['/comunidad', 200], ['/feed', 200], ['/feed/post/abc', 200],
  ['/empleos', 200], ['/jobs', 200], ['/es/empleos', 200], ['/mx/empleos', 200], ['/es/ofertas/enfermera-madrid-1a2b', 200],
  ['/gb/jobs/nurse-london-1a2b', 200], ['/alertas/baja', 200], ['/alerts/unsubscribe', 200],
  ['/sitemap.xml', 200], ['/robots.txt', 200],
  // límites documentados: la SPA decide
  ['/cv/no-existe-perfil-xyz123', 200], ['/jobs/123456789', 200], ['/empleos/no-existe', 200],
  // 404 reales
  ['/esta-pagina-no-existe-xyz', 404], ['/producto/inexistente', 404], ['/product/inexistente', 404],
  ['/recursos/blog/articulo-inexistente-xyz', 404], ['/resources/blog/no-such-post-xyz', 404],
  ['/PRECIOS', 404], ['/Precios', 404], ['/cv', 404], ['/alertas', 404], ['/talent-search', 404], ['/profiles/abc', 404],
  ['/api/loquesea', 404], ['/404', 404], ['/404.html', 404], ['/company-x', 404], ['/companiesx', 404], ['/dashboardx', 404],
  ['/zz/loquesea', 404], ['/es/pricing/extra', 301],
  // redirecciones
  ['/index.html', 301, '/'], ['/precios/index.html', 301, '/precios'], ['/recursos/blog/index.html', 301, '/recursos/blog'],
  ['/recursos', 301, '/recursos/blog'], ['/resources', 301, '/resources/blog'],
  ['/recursos/', 301, '/recursos/blog'], ['/resources/', 301, '/resources/blog'],
  ['/es/pricing', 301, '/precios'], ['/es/resources', 301, '/recursos/blog'], ['/en/resources', 301, '/resources/blog'],
  ['/nosotros/mision', 301, '/nosotros'], ['/en/empleos', 301, '/empleos'],
  // archivos ocultos
  ['/.env', 403],
];
let ok = 0;
const filas = [];
for (const [ruta, st, to] of esperado) {
  const s = simular(ruta);
  const bien = s.status === st && (!to || s.to === to);
  if (bien) ok++;
  else fallo(`esperado ${st}${to ? ' -> ' + to : ''} para ${ruta}, simulado ${s.status}${s.to ? ' -> ' + s.to : ''} (${s.via})`);
  filas.push(`${bien ? 'OK ' : 'MAL'} ${String(s.status).padStart(3)} ${ruta}${s.to ? ' -> ' + s.to : ''}  [${s.via}]`);
}

// ---------- salida ----------
console.log('==== nginx/yourcvpassport.com.produccion.conf: lint y cobertura de rutas ====');
console.log(`Rutas de routeConfig.ts: ${rutas.length} pares ES/EN -> cubiertas por copia estática: ${cobertura['copia estática']}, lista blanca: ${cobertura['SPA (lista blanca)']}, redirección: ${cobertura.redirect}`);
console.log(`Copias estáticas simuladas: ${copias.size} (${slugsBlog.es.length} artículos ES + ${slugsBlog.en.length} EN, ${padres.size} carpetas intermedias)`);
console.log(`Entradas map: $ycp_redirect ${mapRedirect.exactas.size} exactas + ${mapRedirect.regex.length} regex; $ycp_app_route ${mapApp.regex.length} regex`);
for (const l of filas) console.log(l);
if (detalleRutas.length) { console.log('\nNotas:'); for (const n of detalleRutas) console.log(' - ' + n); }
console.log(`\nCódigos esperados: ${ok}/${esperado.length}`);
if (fallos.length) {
  console.log(`\nRESULTADO: FALLA (${fallos.length})`);
  for (const f of fallos) console.log(' - ' + f);
  process.exit(1);
}
console.log('\nRESULTADO: OK');
