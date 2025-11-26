# 📝 Ejemplo de HTML Generado - Canonical y Hreflang

Este documento muestra exactamente qué HTML se genera cuando un usuario visita páginas en español vs inglés.

---

## Escenario 1: Usuario visita `/precios` (Español)

### URL en el navegador:
```
https://yourcvpassport.com/precios
```

### Idioma mostrado al usuario:
🇪🇸 **Español** - Todo el contenido se muestra en español

### HTML generado en el `<head>`:

```html
<head>
  <!-- Idioma de la página -->
  <html lang="es" />

  <!-- Título y descripción en español -->
  <title>Precios y Planes - YourCVPassport</title>
  <meta name="description" content="Elige el plan perfecto para impulsar tu carrera profesional..." />

  <!-- ⭐ CANONICAL - Siempre apunta a la versión EN INGLÉS -->
  <link rel="canonical" href="https://yourcvpassport.com/pricing" />
                                                         ^^^^^^^ INGLÉS

  <!-- ⭐ HREFLANG - Le dice a Google qué versión mostrar por idioma -->
  <link rel="alternate" hrefLang="en" href="https://yourcvpassport.com/pricing" />
  <link rel="alternate" hrefLang="es" href="https://yourcvpassport.com/precios" />
  <link rel="alternate" hrefLang="x-default" href="https://yourcvpassport.com/pricing" />

  <!-- Open Graph - Usa la URL actual para compartir en redes sociales -->
  <meta property="og:url" content="https://yourcvpassport.com/pricing" />
  <meta property="og:title" content="Precios y Planes - YourCVPassport" />
  <meta property="og:description" content="Elige el plan perfecto..." />
  <meta property="og:locale" content="es_ES" />

  <!-- Twitter Card -->
  <meta name="twitter:title" content="Precios y Planes - YourCVPassport" />
  <meta name="twitter:description" content="Elige el plan perfecto..." />
</head>
```

### 🔍 ¿Qué significa esto?

| Tag | Propósito | Valor |
|-----|-----------|-------|
| `<html lang="es">` | Le dice al navegador que el contenido está en español | `es` |
| `<link rel="canonical">` | Le dice a Google cuál es la URL "oficial" para indexar | `/pricing` (EN) |
| `<link rel="alternate" hreflang="en">` | URL para usuarios que hablan inglés | `/pricing` |
| `<link rel="alternate" hreflang="es">` | URL para usuarios que hablan español | `/precios` |
| `<link rel="alternate" hreflang="x-default">` | URL por defecto si no hay coincidencia de idioma | `/pricing` (EN) |
| `<meta property="og:url">` | URL que se muestra al compartir en redes sociales | `/pricing` (canonical) |

---

## Escenario 2: Usuario visita `/pricing` (Inglés)

### URL en el navegador:
```
https://yourcvpassport.com/pricing
```

### Idioma mostrado al usuario:
🇬🇧 **Inglés** - Todo el contenido se muestra en inglés

### HTML generado en el `<head>`:

```html
<head>
  <!-- Idioma de la página -->
  <html lang="en" />

  <!-- Título y descripción en inglés -->
  <title>Pricing and Plans - YourCVPassport</title>
  <meta name="description" content="Choose the perfect plan to boost your professional career..." />

  <!-- ⭐ CANONICAL - También apunta a /pricing (ya está en inglés) -->
  <link rel="canonical" href="https://yourcvpassport.com/pricing" />

  <!-- ⭐ HREFLANG - Las mismas alternativas -->
  <link rel="alternate" hrefLang="en" href="https://yourcvpassport.com/pricing" />
  <link rel="alternate" hrefLang="es" href="https://yourcvpassport.com/precios" />
  <link rel="alternate" hrefLang="x-default" href="https://yourcvpassport.com/pricing" />

  <!-- Open Graph -->
  <meta property="og:url" content="https://yourcvpassport.com/pricing" />
  <meta property="og:title" content="Pricing and Plans - YourCVPassport" />
  <meta property="og:description" content="Choose the perfect plan..." />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:title" content="Pricing and Plans - YourCVPassport" />
  <meta name="twitter:description" content="Choose the perfect plan..." />
</head>
```

---

## Escenario 3: Usuario visita `/producto/resumen` (Español)

### URL en el navegador:
```
https://yourcvpassport.com/producto/resumen
```

### Idioma mostrado al usuario:
🇪🇸 **Español**

### HTML generado en el `<head>`:

```html
<head>
  <html lang="es" />

  <title>Plataforma Profesional de CV Verificado - YourCVPassport</title>
  <meta name="description" content="Crea, verifica y comparte tu CV profesional..." />

  <!-- ⭐ CANONICAL - Mapea a la versión EN INGLÉS -->
  <link rel="canonical" href="https://yourcvpassport.com/product/overview" />
                                                         ^^^^^^^^^^^^^^^^ INGLÉS

  <!-- ⭐ HREFLANG -->
  <link rel="alternate" hrefLang="en" href="https://yourcvpassport.com/product/overview" />
  <link rel="alternate" hrefLang="es" href="https://yourcvpassport.com/producto/resumen" />
  <link rel="alternate" hrefLang="x-default" href="https://yourcvpassport.com/product/overview" />

  <meta property="og:url" content="https://yourcvpassport.com/product/overview" />
  <meta property="og:locale" content="es_ES" />
</head>
```

---

## Escenario 4: Usuario visita `/precios?utm_source=google&lang=es` (con query strings)

### URL en el navegador:
```
https://yourcvpassport.com/precios?utm_source=google&lang=es
```

### HTML generado en el `<head>`:

```html
<head>
  <html lang="es" />

  <title>Precios y Planes - YourCVPassport</title>

  <!-- ⭐ CANONICAL - Query strings ELIMINADOS -->
  <link rel="canonical" href="https://yourcvpassport.com/pricing" />
                                                         ^^^^^^^ Sin ?utm_source ni ?lang

  <link rel="alternate" hrefLang="en" href="https://yourcvpassport.com/pricing" />
  <link rel="alternate" hrefLang="es" href="https://yourcvpassport.com/precios" />
  <link rel="alternate" hrefLang="x-default" href="https://yourcvpassport.com/pricing" />

  <!-- Open Graph también limpio -->
  <meta property="og:url" content="https://yourcvpassport.com/pricing" />
</head>
```

### ✅ Beneficio:
Los parámetros de tracking (`utm_source`) no crean URLs duplicadas en Google.

---

## 📊 Tabla Comparativa: Todas las Páginas

| Usuario visita (ES) | Canonical (siempre EN) | Hreflang ES | Hreflang EN |
|---------------------|------------------------|-------------|-------------|
| `/precios` | `/pricing` | `/precios` | `/pricing` |
| `/producto/resumen` | `/product/overview` | `/producto/resumen` | `/product/overview` |
| `/producto/sellos` | `/product/stamps` | `/producto/sellos` | `/product/stamps` |
| `/empresas/planes` | `/companies/plans` | `/empresas/planes` | `/companies/plans` |
| `/profesionales/plantillas` | `/professionals/templates` | `/profesionales/plantillas` | `/professionals/templates` |
| `/recursos/blog` | `/resources/blog` | `/recursos/blog` | `/resources/blog` |
| `/nosotros` | `/about` | `/nosotros` | `/about` |
| `/perfiles/spain/madrid` | `/profiles/spain/madrid` | `/perfiles/spain/madrid` | `/profiles/spain/madrid` |

---

## 🎯 ¿Cómo interpreta Google esto?

### Cuando un usuario español busca en Google:

1. Google ve el **hreflang="es"** → Muestra `/precios` en resultados
2. Usuario hace clic → Ve contenido en español
3. Google indexa usando **canonical** → `/pricing` (para consolidar SEO)

### Cuando un usuario inglés busca en Google:

1. Google ve el **hreflang="en"** → Muestra `/pricing` en resultados
2. Usuario hace clic → Ve contenido en inglés
3. Google indexa usando **canonical** → `/pricing` (misma URL)

### Resultado final:
- ✅ Usuarios españoles ven URLs en español (`/precios`)
- ✅ Usuarios ingleses ven URLs en inglés (`/pricing`)
- ✅ Google indexa UNA sola versión (`/pricing`) para ranking
- ✅ No hay duplicados ni competencia entre versiones
- ✅ El SEO se consolida en una única URL

---

## 🔧 Cómo Verificar en el Navegador

### Paso 1: Visita cualquier página en español
```
https://yourcvpassport.com/precios
```

### Paso 2: Abre DevTools (F12) y pega en la consola:
```javascript
// Verificar canonical
const canonical = document.querySelector('link[rel="canonical"]');
console.log('Canonical:', canonical?.href);

// Verificar hreflang
const hreflangs = document.querySelectorAll('link[rel="alternate"][hrefLang]');
hreflangs.forEach(tag => {
  console.log(`Hreflang ${tag.hrefLang}:`, tag.href);
});

// Verificar idioma de la página
console.log('Page language:', document.documentElement.lang);
```

### Resultado esperado:
```
Canonical: https://yourcvpassport.com/pricing
Hreflang en: https://yourcvpassport.com/pricing
Hreflang es: https://yourcvpassport.com/precios
Hreflang x-default: https://yourcvpassport.com/pricing
Page language: es
```

---

## ✅ Resumen

**Cuando visitas una página en ESPAÑOL:**
- 👁️ **Ves**: Contenido en español, URL puede ser `/precios`
- 🔗 **Canonical**: Apunta a `/pricing` (inglés)
- 🌐 **Hreflang ES**: Apunta a `/precios` (español)
- 🌐 **Hreflang EN**: Apunta a `/pricing` (inglés)
- 📊 **Google indexa**: `/pricing` como versión principal
- 🇪🇸 **Google muestra a usuarios ES**: `/precios`
- 🇬🇧 **Google muestra a usuarios EN**: `/pricing`

**Ventajas:**
- ✅ No hay duplicados
- ✅ SEO consolidado
- ✅ Experiencia localizada para usuarios
- ✅ Rankings no se dividen entre idiomas

---

*Generado: 2025-11-25*
