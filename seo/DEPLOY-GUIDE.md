# Guía de Deploy — Estrategia de Contenidos YourCVPassport
**Fecha:** 2026-02-23 | **Entorno:** Producción

> **Sí, todo esto va a producción.** Los SQLs se ejecutan directamente en el Supabase de producción. El código ya está modificado en el repo y necesita hacer deploy.

---

## Orden de ejecución

```
PASO 1  →  Deploy del código (BlogPage.tsx)
PASO 2  →  SQL: add lang column
PASO 3  →  SQL: seed 30 artículos blog
PASO 4  →  SQL: fix feed realism (ya en repo)
PASO 5  →  Google Search Console: disavow
PASO 6  →  Verificar en producción
```

---

## PASO 1 — Deploy del código

**Archivo modificado:** `components/pages/BlogPage.tsx`

**Qué cambió:** El blog ahora filtra artículos por idioma (`.eq('lang', lang)`), evitando que artículos EN aparezcan en `/recursos/blog` y viceversa.

```bash
git add components/pages/BlogPage.tsx
git commit -m "feat: filter blog posts by language"
git push
```

Hacer deploy en Vercel/tu plataforma de hosting normalmente. **El código debe estar en producción ANTES de ejecutar el seed SQL**, porque si no, todos los artículos aparecerían mezclados.

---

## PASO 2 — SQL: Añadir columna `lang`

**Archivo:** `supabase/migrations/20260224_add_lang_to_blog_posts.sql`

Ejecutar en **Supabase Dashboard → SQL Editor** (producción):

```sql
-- Add lang column to blog_posts for bilingual content support
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS lang VARCHAR(2) DEFAULT 'es';

-- Add index for fast lang filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_lang ON blog_posts(lang);

-- Backfill any existing posts without a lang
UPDATE blog_posts SET lang = 'es' WHERE lang IS NULL;
```

**Verificar:**
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'blog_posts' AND column_name = 'lang';
-- Debe devolver 1 fila
```

---

## PASO 3 — SQL: Seed 30 artículos del blog

**Archivo:** `supabase/migrations/20260224_blog_posts_seed.sql`

> Este archivo pesa ~269 KB. Copiar y pegar el contenido completo en **Supabase Dashboard → SQL Editor**.

**Resumen del seed:**
| Bloque | Artículos | Idioma | Fechas |
|--------|-----------|--------|--------|
| A — Quick Wins | #1–4 | EN | 01–08 Mar 2026 |
| B — Pilares SEO | #5–10 | EN + ES | 10–22 Mar 2026 |
| C — Hiring | #11–15 | EN | 01–10 Abr 2026 |
| D — Credenciales | #16–19 | EN + ES | 13–20 Abr 2026 |
| E — Mercado hispano | #20–24 | ES | 01–11 May 2026 |
| F — Sectorial nicho | #25–28 | ES | 13–20 May 2026 |
| G — Comparativas | #29–30 | EN | 22–25 May 2026 |

**Verificar después:**
```sql
-- Contar por idioma
SELECT lang, COUNT(*) as total
FROM blog_posts
GROUP BY lang;
-- Esperado: en=18, es=12

-- Verificar el artículo destacado
SELECT id, title, is_featured, published_at
FROM blog_posts
WHERE is_featured = TRUE;
-- Debe devolver 1 fila: "What Is a Verified CV?"

-- Ver todos los slugs (para confirmar que no hay duplicados)
SELECT slug, lang, published_at
FROM blog_posts
ORDER BY published_at;
```

---

## PASO 4 — SQL: Fix feed realism

**Archivo:** `supabase/migrations/20260225_fix_seed_realism.sql`

Ejecutar en **Supabase Dashboard → SQL Editor**:

```sql
-- (Pegar contenido de 20260225_fix_seed_realism.sql)
-- Arregla: polls sin expires_at, views_count < likes_count,
--          inserta feed_likes reales, sincroniza likes_count
```

Este script es idempotente (usa `ON CONFLICT DO NOTHING`), se puede ejecutar varias veces sin problema.

**Verificar:**
```sql
-- Verificar polls corregidos
SELECT COUNT(*) FROM feed_posts
WHERE content_type = 'POLL'
  AND (metadata->'poll'->>'expires_at' IS NULL
    OR metadata->'poll'->>'expires_at' = 'NaN');
-- Debe devolver 0

-- Verificar views_count realistas
SELECT COUNT(*) FROM feed_posts
WHERE likes_count > 5 AND views_count < likes_count;
-- Debe devolver 0
```

---

## PASO 5 — Google Search Console: Disavow

**Archivo:** `seo/disavow.txt`

1. Ir a: https://search.google.com/search-console/disavow-links
2. Seleccionar propiedad: `yourcvpassport.com`
3. Subir el archivo `seo/disavow.txt`

**Contenido del archivo:**
```
domain:seoagency.sale
domain:quero.party
domain:screenshots.wiki
domain:sites.jake.eu
domain:bye.fyi
```

> Google puede tardar varias semanas en procesar el disavow. No hay efecto inmediato visible.

---

## PASO 6 — Verificación en producción

### Blog EN
1. Ir a `https://yourcvpassport.com/resources/blog`
2. Debe mostrar artículos EN (Quick Wins primero por fecha, luego #5 featured)
3. Hacer clic en un artículo y verificar que el contenido renderiza bien

### Blog ES
1. Cambiar idioma a español
2. Ir a `https://yourcvpassport.com/recursos/blog`
3. Debe mostrar artículos ES únicamente (no mezcla con EN)

### Artículo destacado
- El artículo #5 "What Is a Verified CV?" debe aparecer en la sección featured del blog EN

### Verificar formato de contenido
En un artículo, verificar que renderizan correctamente:
- Cajas `:::tip`, `:::info`, `:::warning`, `:::example`
- Encabezados `##`
- Listas con `-`
- **Negrita** e *itálica*
- CTAs con enlace a `https://yourcvpassport.com`

---

## Artículos para sitios propios (acción manual)

Entregar estos artículos a los responsables de cada sitio:

| Sitio | Cuándo publicar | Artículo (en `content/partner-articles/partner-articles-final.md`) |
|-------|----------------|---------------------------------------------------------------------|
| ISEIE.com | Con Art. #5 (10 Mar) | "Tendencias de empleabilidad 2026..." |
| PsikoAprende.com | Con Art. #25 (13 May) | "Cómo encontrar empleo como psicólogo..." |
| ISEIH.com | Con Art. #28 (20 May) | "Nuestros profesores: perfiles verificados..." |
| ISEIE.com | Con Art. #27 (18 May) | "Cómo mejorar tu empleabilidad después de ISEIE" |

**Regla para cada sitio:** Un enlace `dofollow` en párrafo 2-3 del artículo, con el anchor text especificado en el YAML del archivo.

---

## Resumen de archivos involucrados

```
CÓDIGO (git push + deploy):
  components/pages/BlogPage.tsx

SUPABASE SQL (ejecutar en orden):
  supabase/migrations/20260224_add_lang_to_blog_posts.sql  ← primero
  supabase/migrations/20260224_blog_posts_seed.sql          ← segundo
  supabase/migrations/20260225_fix_seed_realism.sql         ← tercero

GOOGLE SEARCH CONSOLE (upload manual):
  seo/disavow.txt

REFERENCIA (no requieren acción técnica):
  seo/calendar.md                                           ← calendario publicación
  seo/internal-links-map.md                                 ← mapa enlaces internos
  content/partner-articles/partner-articles-final.md        ← artículos para socios
```
