/**
 * SEO de los perfiles públicos /cv/<slug> para los generadores estáticos
 * (scripts/generate-profile-html.mjs, scripts/generate-sitemap.mjs):
 *   - lista de perfiles excluidos (seo/excluded-profiles.json + marcas is_test / is_internal),
 *   - título de 50-60 caracteres y descripción de 120-155 sin «...»,
 *   - JSON-LD Person, canonical y og:url autorreferentes (sin barra final),
 *   - contenido inicial propio (nombre, titular y resumen del perfil público; nada privado),
 *   - lectura de los perfiles públicos desde Supabase con la clave pública y paginada.
 * Puro salvo `fetchPublicProfiles`, que recibe el cliente de Supabase.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  BASE_URL, BRAND, cleanText, cutAtWord, escapeHtml, fitDescription, jsonLdScript, pickTitle, splitSentences,
} from './seo-text.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_AVATAR = `${BASE_URL}/default-avatar.png`;

/** Columnas públicas que ya lee la anon key (select('*') da 42501: hay columnas privadas). */
export const PUBLIC_PROFILE_COLUMNS = 'id, slug, full_name, headline, summary, location, avatar_url, meta_title, meta_description, updated_at';
const FLAG_COLUMNS = ', is_test, is_internal';

/** Slugs excluidos de seo/excluded-profiles.json (vacío si el fichero no existe o no se lee). */
export function loadExcludedSlugs() {
  try {
    const raw = JSON.parse(readFileSync(join(__dirname, 'excluded-profiles.json'), 'utf-8'));
    return new Set((raw.slugs || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

/** Un perfil de prueba o interno: en la lista de exclusión o con is_test / is_internal a true. */
export function isExcludedProfile(profile, excluded = loadExcludedSlugs()) {
  const slug = String(profile?.slug ?? '').trim().toLowerCase();
  return excluded.has(slug) || profile?.is_test === true || profile?.is_internal === true;
}

/**
 * Perfiles públicos y completos desde Supabase, de 1000 en 1000. Pide también is_test e
 * is_internal; si la columna no existe (o la anon key no puede leerla) repite sin ellas.
 * Devuelve { profiles, error }: con `error` la lista no es fiable y el generador no debe escribir.
 */
export async function fetchPublicProfiles(supabase) {
  const run = async (columns) => {
    const out = [];
    const PAGE = 1000;
    for (let from = 0; from < 100000; from += PAGE) {
      const { data, error } = await supabase
        .from('profiles')
        .select(columns)
        .eq('is_active', true)
        .eq('profile_hidden', false)
        .not('slug', 'is', null)
        .not('full_name', 'is', null)
        .not('headline', 'is', null)
        .order('slug', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) return { error };
      out.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
    return { data: out };
  };
  let res = await run(PUBLIC_PROFILE_COLUMNS + FLAG_COLUMNS);
  if (res.error) res = await run(PUBLIC_PROFILE_COLUMNS);
  if (res.error) return { profiles: [], error: res.error };
  return { profiles: res.data, error: null };
}

const ES_WORDS = new Set(['de', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'para', 'por', 'un', 'una', 'del', 'al', 'que', 'su', 'como', 'más', 'experiencia', 'años', 'profesional', 'desarrollo', 'gestión', 'ingeniero', 'ingeniera', 'director', 'directora']);
const EN_WORDS = new Set(['the', 'and', 'of', 'in', 'with', 'for', 'to', 'a', 'an', 'at', 'is', 'years', 'experience', 'professional', 'manager', 'engineer', 'senior', 'development', 'based', 'working']);

/** Idioma del perfil ('es' | 'en') por palabras vacías del titular y el resumen; 'es' por defecto. */
export function detectLang(profile) {
  const text = `${profile.headline ?? ''} ${profile.summary ?? ''}`.toLowerCase().split(/[^\p{L}]+/u);
  let es = 0;
  let en = 0;
  for (const w of text) {
    if (ES_WORDS.has(w)) es++;
    if (EN_WORDS.has(w)) en++;
  }
  return en > es ? 'en' : 'es';
}

const COPY = {
  es: { based: 'Ubicación:', pads: ['| YourCVPassport', '| CV', '| Perfil de CV', '| CV en YourCVPassport'], long: 'Consulta el perfil profesional verificado de {name} en YourCVPassport, con su experiencia y habilidades.', filler: ['Perfil profesional verificado en YourCVPassport.', 'Consulta su CV profesional completo.'], home: 'Inicio', cta: 'Crea tu propio CV profesional verificado', about: 'Perfil profesional' },
  en: { based: 'Based in', pads: ['| YourCVPassport', '| CV', '| CV Profile', '| CV on YourCVPassport'], long: 'View the verified professional profile of {name} on YourCVPassport, with their experience and skills.', filler: ['Verified professional profile on YourCVPassport.', 'View their full professional CV.'], home: 'Home', cta: 'Create your own verified professional CV', about: 'Professional profile' },
};

/** Resumen en texto plano de hasta `max` caracteres, cortado en frase o palabra, sin puntos suspensivos. */
export function summarize(text, max = 600) {
  const t = cleanText(text);
  if (t.length <= max) return t;
  let acc = '';
  for (const s of splitSentences(t)) {
    const next = acc ? `${acc} ${s}` : s;
    if (next.length > max) break;
    acc = next;
  }
  if (acc.length >= 120) return acc;
  return `${cutAtWord(t, max - 1)}.`;
}

/** Variantes del titular de más a menos completas: «Rol | Empresa», «Rol», primera palabra(s)... */
function headlineVariants(headline) {
  const h = cleanText(headline);
  const parts = h.split(/\s*(?:\||·|•|–|—| - |, | at | en | @ )\s*/).filter(Boolean);
  const out = [h];
  for (let n = parts.length - 1; n >= 1; n--) {
    const v = parts.slice(0, n).join(' | ');
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

/** Título de la copia estática: el manual del perfil si ya está en rango, o uno ajustado de 50 a 60. */
export function profileTitle(profile, lang) {
  const name = cleanText(profile.full_name);
  const manual = cleanText(profile.meta_title);
  if (manual) {
    const ok = pickTitle([manual]);
    if (ok.ok) return ok.title;
  }
  const candidates = [];
  for (const v of headlineVariants(profile.headline)) {
    for (const pad of COPY[lang].pads) candidates.push(`${name} - ${v} ${pad}`);
    candidates.push(`${name} - ${v}`);
  }
  // Último recurso: titular recortado por palabra (sin «...») para que quepa junto al nombre
  const room = 55 - name.length - 3;
  if (room >= 12) {
    const cut = cutAtWord(cleanText(profile.headline), room);
    if (cut) for (const pad of COPY[lang].pads) candidates.push(`${name} - ${cut} ${pad}`);
  }
  candidates.push(`${name} | ${COPY[lang].about} - ${BRAND}`);
  candidates.push(`${name} - ${COPY[lang].about} | ${BRAND}`);
  return pickTitle(candidates).title;
}

/** Descripción de la copia estática: la manual ajustada, o titular + ubicación + resumen. */
export function profileDescription(profile, lang) {
  const t = COPY[lang];
  const manual = cleanText(profile.meta_description);
  const parts = [];
  if (profile.headline) parts.push(cleanText(profile.headline));
  if (profile.location) parts.push(`${t.based} ${cleanText(profile.location)}`);
  const lead = parts.map((p) => p.replace(/[.!?]+$/, '')).join('. ');
  let desc = fitDescription(manual || lead, manual ? [] : splitSentences(profile.summary ?? ''));
  if (!manual && desc.length < 120 && cleanText(profile.summary)) {
    // Titular + ubicación + resumen: se corta en la última frase (o coma) que cabe
    const combined = fitDescription(`${lead}. ${cleanText(profile.summary)}`, [], { wordCut: false });
    if (combined.length >= 120) desc = combined;
  }
  if (desc.length < 120) {
    // Perfil escaso: frases neutras con el nombre, la primera que deje la descripción en 120-155
    const name = cleanText(profile.full_name);
    const fillers = [t.long.replace('{name}', name), ...t.filler];
    const tries = [...fillers.map((f) => [f]), ...fillers.flatMap((f, k) => fillers.slice(k + 1).map((g) => [f, g]))];
    for (const combo of tries) {
      const next = [desc, ...combo].join(' ').trim();
      if (next.length >= 120 && next.length <= 155) { desc = next; break; }
    }
  }
  return desc;
}

const STYLE = "max-width:720px;margin:48px auto;padding:0 16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1F2937;line-height:1.6";

/**
 * Todo lo que el HTML estático de un perfil necesita. `profile` son columnas públicas
 * (las que ya lee la anon key); nada de correo, teléfono ni datos de contacto.
 */
export function buildProfileSeo(profile, skills = [], experiences = [], exclusions) {
  const lang = detectLang(profile);
  const t = COPY[lang];
  const name = cleanText(profile.full_name);
  const headline = cleanText(profile.headline);
  const url = `${BASE_URL}/cv/${profile.slug}`;
  const title = profileTitle(profile, lang);
  const description = profileDescription(profile, lang);
  const image = profile.avatar_url || DEFAULT_AVATAR;
  const excluded = isExcludedProfile(profile, exclusions);
  const summary = summarize(profile.summary ?? '', 600);

  const keywordParts = [name, headline, cleanText(profile.location)];
  for (const s of skills) if (s?.name) keywordParts.push(s.name);
  for (const e of experiences) if (e?.title) keywordParts.push(e.title);
  keywordParts.push('professional profile', 'CV', 'resume', BRAND);
  const keywords = [...new Set(keywordParts.filter(Boolean))].join(', ');

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: headline,
    url,
    mainEntityOfPage: url,
    ...(summary ? { description: summary.slice(0, 300) } : {}),
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: cleanText(profile.location) } } : {}),
  };

  const bodyHtml = `<main id="static-home" data-static-page="profile" style="${STYLE}">
        <nav aria-label="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(t.about)}</nav>
        <h1>${escapeHtml(name)}</h1>
        <p><strong>${escapeHtml(headline)}</strong></p>${profile.location ? `\n        <p>${escapeHtml(cleanText(profile.location))}</p>` : ''}${summary ? `\n        <p>${escapeHtml(summary)}</p>` : ''}
        <p><a href="/signup">${escapeHtml(t.cta)}</a> · <a href="/">${escapeHtml(BRAND)}</a></p>
      </main>`;

  return {
    title, description, keywords, image, url, authorName: name, lang,
    canonical: url,
    robots: excluded ? 'noindex, nofollow' : null,
    excluded,
    jsonLd: [jsonLdScript(person)],
    bodyHtml,
  };
}
