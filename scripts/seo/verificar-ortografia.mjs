#!/usr/bin/env node
/**
 * Verificador de la corrección ortográfica del blog en español (hallazgo 07).
 *
 * Compara, para CADA artículo, la versión original (git, por defecto HEAD) con la corregida (árbol de
 * trabajo) y exige:
 *
 *   1. Mismos ficheros: no se añade ni se borra ningún artículo.
 *   2. Artículos en inglés (lang "en"): idénticos byte a byte (salvo el final de línea CRLF/LF).
 *   3. Artículos en español, campo a campo (title, summary, content, meta_title, meta_description, category):
 *      tras quitar diacríticos (NFD + marcas combinantes: tildes, ñ -> n, ü -> u) y los signos ¿ ¡ de
 *      ORIGINAL y CORREGIDO, los dos textos son IDÉNTICOS carácter a carácter (mayúsculas y espacios incluidos).
 *      Cualquier letra, palabra, espacio o signo añadido, quitado o cambiado hace fallar la verificación.
 *   4. Los demás campos (id, slug, image_url, author_name, is_featured, published_at, lang) son idénticos, y
 *      también todas las URLs que aparecen dentro de los textos (imágenes y enlaces), sin tocar ni una letra.
 *   5. A nivel de líneas, solo cambian líneas de campos de texto o del cuerpo (content); la estructura del
 *      fichero no se altera.
 *   6. Cada palabra cambiada es una forma autorizada de scripts/seo/palabras-es.json (o termina en -ción/-sión);
 *      no hay palabras con tilde inventadas a mano.
 *   7. No queda ninguna palabra del diccionario sin corregir (salvo las contextuales, que se tratan aparte).
 *   8. Lo mismo para content/posts/index.ts (allPostsMeta) y content/blog-300-plan.json (entradas es).
 *   9. Coherencia: si en el original un artículo y su entrada de index.ts tenían el mismo título/descripción,
 *      siguen teniéndolos tras la corrección.
 *
 * Uso:
 *   node scripts/seo/verificar-ortografia.mjs                 # contra HEAD
 *   node scripts/seo/verificar-ortografia.mjs --base <ref>    # contra otro commit/rama
 *   node scripts/seo/verificar-ortografia.mjs --detalle       # una línea por artículo
 *   node scripts/seo/verificar-ortografia.mjs --json out.json # vuelca el resultado completo
 * Código de salida: 0 = todo correcto; 1 = alguna comprobación falla.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const BASE = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'HEAD';
const DETALLE = argv.includes('--detalle');
const JSON_OUT = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;

const dic = JSON.parse(readFileSync(join(raiz, 'scripts', 'seo', 'palabras-es.json'), 'utf8'));
const CAMPOS_TEXTO = ['title', 'summary', 'content', 'meta_title', 'meta_description', 'category'];
const CAMPOS_FIJOS = ['id', 'slug', 'image_url', 'author_name', 'is_featured', 'published_at', 'lang'];
const RE_PALABRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const RE_URL = /https?:\/\/[^\s)}"'`<>]+/g;

const eol = (s) => s.replace(/\r\n/g, '\n');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿¡]/g, '');
const sinDiacriticos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const git = (...a) => execFileSync('git', ['-C', raiz, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const base = (rel) => eol(git('show', `${BASE}:${rel}`));
const actual = (rel) => eol(readFileSync(join(raiz, rel), 'utf8'));

const fallos = [];
const avisos = [];
const fallo = (donde, msg) => fallos.push(`${donde}: ${msg}`);

// formas autorizadas como resultado de una corrección
const autorizadas = new Set(Object.values(dic.correcciones));
for (const c of Object.values(dic.contextuales)) {
  if (c.defecto) autorizadas.add(c.defecto);
  for (const r of c.reglas) if (r.usar) autorizadas.add(r.usar);
}
const esAutorizada = (w) => autorizadas.has(w.toLowerCase()) || /(ci|si)ón$/i.test(w);
const claveContextual = new Set(Object.keys(dic.contextuales));

function contexto(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `posición ${i}: «${a.slice(Math.max(0, i - 30), i + 40).replace(/\n/g, '\\n')}» vs «${b.slice(Math.max(0, i - 30), i + 40).replace(/\n/g, '\\n')}»`;
}

/** Compara un texto original y uno corregido. Devuelve nº de palabras cambiadas (o null si falla). */
function compararTexto(donde, o, n) {
  if (norm(o) !== norm(n)) {
    fallo(donde, 'tras quitar diacríticos y ¿¡ los textos NO son idénticos -> ' + contexto(norm(o), norm(n)));
    return null;
  }
  const urlsO = o.match(RE_URL) || [];
  const urlsN = n.match(RE_URL) || [];
  if (JSON.stringify(urlsO) !== JSON.stringify(urlsN)) {
    fallo(donde, 'las URLs del texto han cambiado');
    return null;
  }
  // el nº de ¿ ¡ ? ! tiene que coincidir con el original salvo ¿ ¡ añadidos (que se quitan en norm)
  const po = o.match(RE_PALABRA) || [];
  const pn = n.match(RE_PALABRA) || [];
  if (po.length !== pn.length) {
    fallo(donde, `distinto número de palabras (${po.length} vs ${pn.length})`);
    return null;
  }
  let cambiadas = 0;
  for (let i = 0; i < po.length; i++) {
    if (po[i] === pn[i]) continue;
    cambiadas++;
    if (sinDiacriticos(po[i]) !== sinDiacriticos(pn[i])) {
      fallo(donde, `palabra distinta «${po[i]}» -> «${pn[i]}»`);
      return null;
    }
    if (sinDiacriticos(po[i]) !== po[i]) {
      // el original ya tenía algún diacrítico y se ha cambiado: no se espera
      fallo(donde, `se ha modificado una palabra que ya tenía diacrítico «${po[i]}» -> «${pn[i]}»`);
      return null;
    }
    if (!esAutorizada(pn[i])) {
      fallo(donde, `forma no autorizada en el diccionario «${po[i]}» -> «${pn[i]}»`);
      return null;
    }
  }
  // 7) ninguna palabra del diccionario (no contextual) se queda sin corregir
  for (const w of pn) {
    const k = w.toLowerCase();
    if (w === sinDiacriticos(w) && !claveContextual.has(k) && Object.hasOwn(dic.correcciones, k)) {
      fallo(donde, `palabra del diccionario sin corregir: «${w}»`);
    }
  }
  return cambiadas;
}

/** Evalúa el fichero de un artículo (TypeScript trivial) y devuelve el objeto. */
function cargarPost(src, donde) {
  const js = src
    .replace(/^import .*$/m, '')
    .replace('const post: BlogPostData =', 'const post =')
    .replace('export default post;', 'return post;');
  try {
    return new Function(js)();
  } catch (e) {
    fallo(donde, 'no se puede evaluar el artículo: ' + e.message);
    return null;
  }
}

/** Solo pueden diferir líneas de campos de texto o del cuerpo. */
function comprobarLineas(donde, o, n, esLineaPermitida) {
  const lo = o.split('\n');
  const ln = n.split('\n');
  if (lo.length !== ln.length) {
    fallo(donde, `cambia el número de líneas (${lo.length} -> ${ln.length})`);
    return;
  }
  for (let i = 0; i < lo.length; i++) {
    if (lo[i] !== ln[i] && !esLineaPermitida(lo[i], i, lo)) {
      fallo(donde, `cambia una línea que no es de texto (línea ${i + 1}): ${lo[i].slice(0, 80)}`);
      return;
    }
  }
}

// ---------- listado de ficheros ----------
const relBase = git('ls-tree', '-r', '--name-only', BASE, 'content/posts').split('\n').filter(Boolean).sort();
const relActual = readdirSync(join(raiz, 'content', 'posts')).map((f) => `content/posts/${f}`).sort();
if (JSON.stringify(relBase) !== JSON.stringify(relActual)) {
  fallo('content/posts', 'la lista de ficheros no coincide con la del original');
}

const porArticulo = {}; // slug -> {fichero, palabras}
const campoPorSlug = {}; // para la coherencia con index.ts
let es = 0;
let en = 0;
let enIntactos = 0;

for (const rel of relBase) {
  if (!rel.endsWith('.ts') || rel.endsWith('/index.ts') || rel.endsWith('/types.ts')) continue;
  const o = base(rel);
  const n = actual(rel);
  const lang = /^  lang: "(\w+)",$/m.exec(o)?.[1];
  if (lang !== 'en' && lang !== 'es') { fallo(rel, `lang desconocido: ${lang}`); continue; }
  if (lang === 'en') {
    en++;
    if (o !== n) fallo(rel, 'artículo en inglés modificado');
    else enIntactos++;
    continue;
  }
  es++;
  const po = cargarPost(o, rel);
  const pn = cargarPost(n, rel);
  if (!po || !pn) continue;
  // líneas: solo campos de texto o cuerpo
  const lineasO = o.split('\n');
  const iniContent = lineasO.findIndex((l) => l.startsWith('  content: `'));
  const finContent = lineasO.findIndex((l, i) => i > iniContent && l.startsWith('  image_url:'));
  comprobarLineas(rel, o, n, (linea, i) =>
    (i >= iniContent && i < finContent) || /^  (title|summary|meta_title|meta_description|category): /.test(linea));
  // campos fijos
  for (const k of CAMPOS_FIJOS) if (po[k] !== pn[k]) fallo(rel, `cambia el campo ${k}`);
  if (JSON.stringify(Object.keys(po)) !== JSON.stringify(Object.keys(pn))) fallo(rel, 'cambian las claves del objeto');
  // campos de texto
  let total = 0;
  for (const k of CAMPOS_TEXTO) {
    const c = compararTexto(`${rel} [${k}]`, po[k], pn[k]);
    if (c !== null) total += c;
  }
  porArticulo[po.slug] = { fichero: rel, palabras: total };
  campoPorSlug[po.slug] = { o: po, n: pn };
}

// ---------- index.ts (allPostsMeta) ----------
let palabrasIndex = 0;
{
  const rel = 'content/posts/index.ts';
  const o = base(rel);
  const n = actual(rel);
  const extraer = (s) => JSON.parse(s.slice(s.indexOf('= [', s.indexOf('export const allPostsMeta')) + 2, s.lastIndexOf('\n];') + 2));
  const ao = extraer(o);
  const an = extraer(n);
  comprobarLineas(rel, o, n, (l) => /^    "(title|summary|meta_title|meta_description|category)": /.test(l));
  if (ao.length !== an.length) fallo(rel, 'cambia el número de entradas de allPostsMeta');
  else {
    ao.forEach((eo, i) => {
      const en2 = an[i];
      const donde = `${rel} [${eo.slug}]`;
      if (eo.lang === 'en') {
        if (JSON.stringify(eo) !== JSON.stringify(en2)) fallo(donde, 'entrada en inglés modificada');
        return;
      }
      for (const k of Object.keys(eo)) {
        if (['title', 'summary', 'meta_title', 'meta_description', 'category'].includes(k)) {
          const c = compararTexto(`${donde} [${k}]`, eo[k], en2[k]);
          if (c !== null) palabrasIndex += c;
        } else if (JSON.stringify(eo[k]) !== JSON.stringify(en2[k])) fallo(donde, `cambia el campo ${k}`);
      }
      if (Object.keys(eo).length !== Object.keys(en2).length) fallo(donde, 'cambian las claves');
      // 9) coherencia con el fichero del artículo
      const p = campoPorSlug[eo.slug];
      if (!p) { fallo(donde, 'la entrada del índice no tiene fichero de artículo'); return; }
      for (const k of ['title', 'summary', 'meta_title', 'meta_description', 'category']) {
        if (p.o[k] === eo[k] && p.n[k] !== en2[k]) fallo(donde, `el índice y el artículo ya no coinciden en ${k}`);
      }
    });
  }
}

// ---------- plan de generación ----------
let palabrasPlan = 0;
{
  const rel = 'content/blog-300-plan.json';
  const o = JSON.parse(base(rel));
  const n = JSON.parse(actual(rel));
  if (o.length !== n.length) fallo(rel, 'cambia el número de entradas');
  else {
    o.forEach((eo, i) => {
      const en2 = n[i];
      const donde = `${rel} [${eo.slug}]`;
      if (eo.lang !== 'es') {
        if (JSON.stringify(eo) !== JSON.stringify(en2)) fallo(donde, 'entrada en inglés modificada');
        return;
      }
      for (const k of Object.keys(eo)) {
        if (['title', 'keyword', 'meta_description', 'content_outline'].includes(k)) {
          const c = compararTexto(`${donde} [${k}]`, eo[k], en2[k]);
          if (c !== null) palabrasPlan += c;
        } else if (JSON.stringify(eo[k]) !== JSON.stringify(en2[k])) fallo(donde, `cambia el campo ${k}`);
      }
    });
  }
}

// ---------- recuentos ----------
if (es !== 150) fallo('recuento', `se esperaban 150 artículos en español y hay ${es}`);
if (en !== 150) fallo('recuento', `se esperaban 150 artículos en inglés y hay ${en}`);

const tocados = Object.values(porArticulo).filter((a) => a.palabras > 0);
const totalPalabras = Object.values(porArticulo).reduce((s, a) => s + a.palabras, 0);

if (DETALLE) {
  for (const [slug, a] of Object.entries(porArticulo).sort()) console.log(`${String(a.palabras).padStart(5)}  ${slug}`);
}
console.log('==== Verificador de ortografía del blog en español ====');
console.log(`Base de comparación: ${BASE}`);
console.log(`Artículos en español: ${es} (tocados: ${tocados.length}, sin cambios: ${es - tocados.length}) · en inglés: ${en} (intactos: ${enIntactos})`);
console.log(`Palabras corregidas en los artículos: ${totalPalabras} · en index.ts: ${palabrasIndex} · en blog-300-plan.json: ${palabrasPlan}`);
if (tocados.length) {
  const v = tocados.map((a) => a.palabras).sort((a, b) => a - b);
  console.log(`Por artículo: mín ${v[0]} · mediana ${v[Math.floor(v.length / 2)]} · máx ${v[v.length - 1]}`);
}
for (const a of avisos) console.log('AVISO ' + a);
if (fallos.length) {
  console.log(`\nRESULTADO: FALLA (${fallos.length} problema${fallos.length === 1 ? '' : 's'})`);
  for (const f of fallos.slice(0, 60)) console.log(' - ' + f);
  if (fallos.length > 60) console.log(` ... y ${fallos.length - 60} más`);
} else {
  console.log('\nRESULTADO: OK — tras quitar diacríticos y ¿¡ original y corregido son idénticos en los 150 artículos (títulos, descripciones, encabezados y cuerpo), en index.ts y en el plan; slugs, ids, URLs y artículos en inglés intactos.');
}
if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, es, en, enIntactos, totalPalabras, palabrasIndex, palabrasPlan, porArticulo, fallos }, null, 1), 'utf8');
}
process.exit(fallos.length ? 1 : 0);
