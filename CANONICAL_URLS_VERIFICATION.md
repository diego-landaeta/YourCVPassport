# Verificación de URLs Canónicas

## ✅ Implementación Completada

Se ha implementado un sistema robusto para prevenir duplicados de URLs canónicas en tu sitio web.

## 📋 Cambios Realizados

### 1. **Nueva Utilidad: `utils/canonicalUrl.ts`**

Funciones principales:
- `normalizeUrl()`: Elimina query strings, hash fragments y trailing slashes
- `getCanonicalUrl()`: Genera URL canónica para rutas bilingües
- `getPageCanonicalUrl()`: Obtiene la URL canónica de la página actual
- `getCanonicalPath()`: Mapea rutas en español a inglés (canonical siempre en inglés)

### 2. **Actualización de Componentes**

#### `PageSEO.tsx`
- ✅ Ahora usa `getPageCanonicalUrl()` automáticamente
- ✅ Mapea rutas ES → EN (ej: `/precios` → `/pricing`)
- ✅ Normaliza URLs (elimina query strings y trailing slashes)

#### `SEOHead.tsx`
- ✅ Normaliza URLs canónicas de perfiles
- ✅ Prioriza slug sobre ID para URLs más limpias

#### `ProfileSearchPage.tsx`
- ✅ Genera canonical usando slug cuando está disponible

### 3. **Páginas con Canonical Explícito**

Las siguientes páginas ahora tienen canonical explícito:

| Página | Canonical URL |
|--------|---------------|
| HomePage | `https://yourcvpassport.com/` |
| PricingPage | `https://yourcvpassport.com/pricing` |
| ProductOverviewPage | `https://yourcvpassport.com/product/overview` |

## 🔍 Mapeo de Rutas ES → EN

El sistema automáticamente mapea rutas en español a inglés para evitar duplicados:

```
/precios                      → /pricing
/producto/resumen            → /product/overview
/empresas/planes             → /companies/plans
/profesionales/plantillas    → /professionals/templates
/recursos/blog               → /resources/blog
/perfiles/*                  → /profiles/*
```

## 🧪 Cómo Verificar

### Verificación Manual en el Navegador

1. **Abre la consola de desarrollo** (F12)
2. **Ejecuta este código** en cualquier página:

```javascript
// Verificar canonical actual
const canonical = document.querySelector('link[rel="canonical"]');
console.log('Canonical URL:', canonical ? canonical.href : 'NO CANONICAL FOUND');

// Verificar que no haya query strings
if (canonical && canonical.href.includes('?')) {
  console.error('⚠️ WARNING: Canonical contains query string!');
}

// Verificar que no haya trailing slash (excepto root)
if (canonical && canonical.href.endsWith('/') && canonical.href !== 'https://yourcvpassport.com/') {
  console.error('⚠️ WARNING: Canonical has trailing slash!');
}
```

### Verificación con Google Search Console

1. Ve a [Google Search Console](https://search.google.com/search-console)
2. **Inspeccionar URL** → Ingresa una URL de tu sitio
3. **Verifica que la URL canónica declarada coincida con la esperada**

### Verificación con Herramientas SEO

#### Opción 1: Screaming Frog SEO Spider
1. Descarga [Screaming Frog](https://www.screamingfrogseoseo.com/seo-spider/)
2. Escanea `https://yourcvpassport.com`
3. Ve a la pestaña **"URI"** → Filtra por **"Canonical"**
4. **Verifica que no haya duplicados**

#### Opción 2: Sitebulb
1. Usa [Sitebulb](https://sitebulb.com/)
2. Audita el sitio
3. Revisa el informe de **"Canonicalization"**

#### Opción 3: Online (Gratuito)
- [SEO Site Checkup](https://seositecheckup.com/)
- [Canonical Tag Checker](https://www.duplichecker.com/canonical-tag-checker.php)

## 📝 Casos de Prueba

### ✅ Casos que DEBEN funcionar correctamente:

| URL Visitada | Canonical Esperado |
|--------------|-------------------|
| `https://yourcvpassport.com/` | `https://yourcvpassport.com/` |
| `https://yourcvpassport.com/?utm_source=google` | `https://yourcvpassport.com/` |
| `https://yourcvpassport.com/pricing` | `https://yourcvpassport.com/pricing` |
| `https://yourcvpassport.com/precios` | `https://yourcvpassport.com/pricing` |
| `https://yourcvpassport.com/pricing/` | `https://yourcvpassport.com/pricing` |
| `https://yourcvpassport.com/pricing?lang=es` | `https://yourcvpassport.com/pricing` |
| `https://yourcvpassport.com/product/overview` | `https://yourcvpassport.com/product/overview` |
| `https://yourcvpassport.com/producto/resumen` | `https://yourcvpassport.com/product/overview` |
| `https://yourcvpassport.com/cv/john-doe` | `https://yourcvpassport.com/cv/john-doe` |
| `https://yourcvpassport.com/cv/john-doe?lang=es` | `https://yourcvpassport.com/cv/john-doe` |

### ❌ Problemas que ahora están RESUELTOS:

- ✅ URLs con query strings ya NO aparecen en canonical
- ✅ URLs con trailing slash ahora se normalizan
- ✅ Rutas ES y EN ahora comparten la misma canonical (EN)
- ✅ No hay canonicals basados en `window.location.href` sin normalizar

## 🚀 Próximos Pasos Recomendados

### 1. Verificar en Producción
Despliega los cambios y verifica que las URLs canónicas aparezcan correctamente.

### 2. Actualizar Sitemap
Asegúrate de que tu `sitemap.xml` solo incluya las URLs canónicas (versiones en inglés).

```xml
<!-- ✅ CORRECTO -->
<url>
  <loc>https://yourcvpassport.com/pricing</loc>
</url>

<!-- ❌ INCORRECTO (no incluir versiones ES en sitemap) -->
<url>
  <loc>https://yourcvpassport.com/precios</loc>
</url>
```

### 3. Configurar Redirects (Opcional)
Si quieres forzar redirecciones permanentes, añade esto a tu servidor:

**Nginx:**
```nginx
# Redirect Spanish routes to English canonical
rewrite ^/precios$ /pricing permanent;
rewrite ^/producto/(.*)$ /product/$1 permanent;
```

**Vercel (vercel.json):**
```json
{
  "redirects": [
    { "source": "/precios", "destination": "/pricing", "permanent": true },
    { "source": "/producto/:path*", "destination": "/product/:path*", "permanent": true }
  ]
}
```

### 4. Monitoreo Continuo
- **Google Search Console**: Revisa periódicamente el informe de cobertura
- **Revisa duplicados**: Usa el query `site:yourcvpassport.com` en Google
- **Revisa Analytics**: Asegúrate que las métricas no se dividan entre ES/EN

## 📚 Referencias

- [Google - Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Moz - Rel Canonical Guide](https://moz.com/learn/seo/canonicalization)
- [Ahrefs - Canonical Tags Guide](https://ahrefs.com/blog/canonical-tags/)

## 🆘 Troubleshooting

### Problema: "Google indexa ambas versiones (ES y EN)"
**Solución**: Espera 2-4 semanas para que Google re-crawlee. Acelera enviando sitemap actualizado.

### Problema: "Canonical no aparece en el HTML"
**Solución**: Verifica que React Helmet esté funcionando. Mira el HTML renderizado (no solo el source).

### Problema: "Canonical incluye query strings"
**Solución**: Verifica que estés usando la última versión de `utils/canonicalUrl.ts`.

---

**Fecha de implementación**: 2025-11-25
**Archivos modificados**:
- `utils/canonicalUrl.ts` (nuevo)
- `components/PageSEO.tsx`
- `components/SEOHead.tsx`
- `components/ProfileSearchPage.tsx`
- `components/HomePage.tsx`
- `components/PricingPage.tsx`
- `components/ProductOverviewPage.tsx`
