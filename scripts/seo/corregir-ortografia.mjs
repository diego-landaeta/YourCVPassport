#!/usr/bin/env node
/**
 * Corrige tildes, eñes y diéresis del blog en español (hallazgo 07 de la auditoría SEO del 25/10/2026).
 *
 * Qué toca (solo artículos con lang "es"):
 *   - content/posts/<slug>.ts      -> title, summary, content, meta_title, meta_description, category
 *   - content/posts/index.ts       -> los mismos campos dentro de `allPostsMeta` (de ahí salen el sitemap,
 *                                     las copias estáticas y el listado del blog)
 *   - content/blog-300-plan.json   -> title, keyword, meta_description, content_outline (la fuente que lee
 *                                     scripts/generate-blog-pages.mjs; si no se corrige, al regenerar los
 *                                     artículos se perdería la ortografía)
 *
 * Qué NO toca: slugs, ids, URLs (ni las de imágenes ni los enlaces), image_url, author_name, published_at,
 * lang, cluster, internal_links ni ningún artículo en inglés. Tampoco reescribe frases: solo cambia letras
 * por su versión con diacrítico (a -> á, n -> ñ, u -> ü ...). No hay signos ? ni ! en el corpus, así que no
 * se añaden ¿ ni ¡ (añadirlos obligaría a añadir también un cierre, que ya no sería «solo diacríticos»).
 *
 * Diccionario: scripts/seo/palabras-es.json. Idempotente: se puede ejecutar varias veces.
 * Comprobación independiente: node scripts/seo/verificar-ortografia.mjs
 *
 * Uso:
 *   node scripts/seo/corregir-ortografia.mjs            # escribe los cambios
 *   node scripts/seo/corregir-ortografia.mjs --dry      # solo cuenta, no escribe
 *   node scripts/seo/corregir-ortografia.mjs --stats ruta.json   # vuelca el detalle de cambios
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dirPosts = join(raiz, 'content', 'posts');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const statsRuta = args.includes('--stats') ? args[args.indexOf('--stats') + 1] : null;

const dic = JSON.parse(readFileSync(join(raiz, 'scripts', 'seo', 'palabras-es.json'), 'utf8'));
const quitarDiacriticos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const RE_PALABRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const RE_URL = /https?:\/\/[^\s)}"'`<>]+/g;

function aplicarMayusculas(original, nueva) {
  if (original.length > 1 && original === original.toUpperCase()) return nueva.toUpperCase();
  if (original[0] !== original[0].toLowerCase()) return nueva[0].toUpperCase() + nueva.slice(1);
  return nueva;
}

function esInicioDeSegmento(antes) {
  // «antes» es el texto previo dentro del mismo valor. Inicio de segmento: principio del valor, línea nueva,
  // tras un marcador de lista/encabezado/negrita/comilla, tras «N.» (ítem numerado) o tras un punto.
  let s = antes.replace(/[ \t*"#>_-]+$/, '');
  if (s === '' || s.endsWith('\n')) return true;
  return /\.$/.test(s);
}

const resumen = new Map(); // "de -> a" -> nº
const contextuales = []; // decisiones por contexto, para revisión
function registrar(de, a, contexto, esContextual) {
  const k = `${de} -> ${a}`;
  resumen.set(k, (resumen.get(k) || 0) + 1);
  if (esContextual && contextuales.length < 4000) contextuales.push({ de, a, contexto });
}

/** Corrige un texto. Devuelve {texto, n}: el texto nuevo y el nº de palabras cambiadas. */
export function corregirTexto(texto) {
  // 1) trocear en fragmentos protegidos (URLs) y editables
  const partes = [];
  let ultimo = 0;
  for (const m of texto.matchAll(RE_URL)) {
    partes.push({ t: texto.slice(ultimo, m.index), edit: true });
    partes.push({ t: m[0], edit: false });
    ultimo = m.index + m[0].length;
  }
  partes.push({ t: texto.slice(ultimo), edit: true });

  // 2) lista de palabras de los fragmentos editables, con su posición global
  const palabras = [];
  let desplazamiento = 0;
  for (const p of partes) {
    if (p.edit) {
      for (const m of p.t.matchAll(RE_PALABRA)) palabras.push({ w: m[0], ini: desplazamiento + m.index });
    }
    desplazamiento += p.t.length;
  }

  let out = '';
  let cursor = 0;
  let n = 0;
  palabras.forEach((pw, i) => {
    const w = pw.w;
    if (w !== quitarDiacriticos(w)) return; // ya tiene diacrítico
    const clave = w.toLowerCase();
    const ant = i > 0 ? quitarDiacriticos(palabras[i - 1].w).toLowerCase() : null;
    const sig = i + 1 < palabras.length ? quitarDiacriticos(palabras[i + 1].w).toLowerCase() : null;
    // el vecino solo cuenta si está pegado (sin URL ni salto de párrafo entre medias)
    let nueva = null;
    let ctxual = false;
    const c = Object.hasOwn(dic.contextuales, clave) ? dic.contextuales[clave] : null;
    if (c) {
      ctxual = true;
      nueva = c.defecto;
      for (const r of c.reglas) {
        const cumple =
          (!r.anterior || r.anterior.includes(ant)) &&
          (!r.siguiente || r.siguiente.includes(sig)) &&
          (!r.inicio_segmento || esInicioDeSegmento(texto.slice(0, pw.ini)));
        if (cumple) { nueva = r.usar; break; }
      }
    } else if (Object.hasOwn(dic.correcciones, clave)) {
      nueva = dic.correcciones[clave];
    } else if (!Object.hasOwn(dic.conservar, clave)) {
      for (const s of dic.sufijos) {
        if (clave.length > s.termina.length + 1 && clave.endsWith(s.termina)) {
          nueva = clave.slice(0, -s.termina.length) + s.sustituye;
          break;
        }
      }
    }
    if (!nueva) return;
    const final = aplicarMayusculas(w, nueva);
    out += texto.slice(cursor, pw.ini) + final;
    cursor = pw.ini + w.length;
    n++;
    registrar(w, final, texto.slice(Math.max(0, pw.ini - 25), pw.ini + w.length + 25).replace(/\s+/g, ' '), ctxual);
  });
  out += texto.slice(cursor);
  return { texto: out, n };
}

const detalle = {}; // archivo -> nº de palabras corregidas
let totalPalabras = 0;
let ficherosTocados = 0;

function guardar(ruta, original, nuevo, nombre, cuenta) {
  detalle[nombre] = cuenta;
  totalPalabras += cuenta;
  if (nuevo !== original) {
    ficherosTocados++;
    if (!DRY) writeFileSync(ruta, nuevo, 'utf8');
  }
}

// ---------- 1) un fichero por artículo ----------
const CAMPOS_LINEA = /^(  (?:title|summary|meta_title|meta_description|category): ")((?:[^"\\\r\n]|\\.)*)(",\r?)$/gm;
const ficheros = readdirSync(dirPosts).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts');
let articulosEs = 0;
for (const f of ficheros) {
  const ruta = join(dirPosts, f);
  const original = readFileSync(ruta, 'utf8');
  if (!/^  lang: "es",\r?$/m.test(original)) continue;
  articulosEs++;
  let cuenta = 0;
  let nuevo = original.replace(CAMPOS_LINEA, (_, a, valor, c) => {
    const r = corregirTexto(valor);
    cuenta += r.n;
    return a + r.texto + c;
  });
  const ini = nuevo.indexOf('\n  content: `') + '\n  content: `'.length;
  const finMatch = /`,\r?\n  image_url:/.exec(nuevo.slice(ini));
  if (ini < 20 || !finMatch) throw new Error(`No encuentro el campo content en ${f}`);
  const fin = ini + finMatch.index;
  const r = corregirTexto(nuevo.slice(ini, fin));
  cuenta += r.n;
  nuevo = nuevo.slice(0, ini) + r.texto + nuevo.slice(fin);
  guardar(ruta, original, nuevo, `content/posts/${f}`, cuenta);
}

// ---------- 2) index.ts (allPostsMeta) ----------
{
  const ruta = join(dirPosts, 'index.ts');
  const original = readFileSync(ruta, 'utf8');
  let cuenta = 0;
  const nuevo = original.replace(/\n  \{\r?\n([\s\S]*?)\r?\n  \}/g, (bloque, cuerpo) => {
    if (!/"lang": "es"/.test(cuerpo)) return bloque;
    return bloque.replace(
      /^(    "(?:title|summary|meta_title|meta_description|category)": ")((?:[^"\\\r\n]|\\.)*)(")/gm,
      (_, a, valor, c) => {
        const r = corregirTexto(valor);
        cuenta += r.n;
        return a + r.texto + c;
      },
    );
  });
  guardar(ruta, original, nuevo, 'content/posts/index.ts', cuenta);
}

// ---------- 3) plan de generación ----------
{
  const ruta = join(raiz, 'content', 'blog-300-plan.json');
  const original = readFileSync(ruta, 'utf8');
  let cuenta = 0;
  const nuevo = original.replace(/^(  )(\{.*\})(,?\r?)$/gm, (linea, sangria, json, resto) => {
    const obj = JSON.parse(json);
    if (JSON.stringify(obj) !== json) throw new Error('El plan no se puede reserializar sin cambios: ' + json.slice(0, 60));
    if (obj.lang !== 'es') return linea;
    for (const k of ['title', 'keyword', 'meta_description', 'content_outline']) {
      if (typeof obj[k] === 'string') {
        const r = corregirTexto(obj[k]);
        cuenta += r.n;
        obj[k] = r.texto;
      }
    }
    return sangria + JSON.stringify(obj) + resto;
  });
  guardar(ruta, original, nuevo, 'content/blog-300-plan.json', cuenta);
}

console.log(`${DRY ? '[simulacro] ' : ''}Artículos en español procesados: ${articulosEs}`);
console.log(`Ficheros con cambios: ${ficherosTocados} · palabras corregidas (suma de los tres orígenes): ${totalPalabras}`);
if (statsRuta) {
  const orden = [...resumen].sort((a, b) => b[1] - a[1]);
  writeFileSync(
    statsRuta,
    JSON.stringify({ articulosEs, ficherosTocados, totalPalabras, detalle, cambios: Object.fromEntries(orden), contextuales }, null, 1),
    'utf8',
  );
}
