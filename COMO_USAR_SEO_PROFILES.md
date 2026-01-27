# 🚀 Cómo Generar Meta Tags SEO para Perfiles

## Solución Implementada

Hemos creado un script que **genera HTML estático** con meta tags personalizados para cada perfil público. Esto permite que los bots de SEO (Google, Facebook, Twitter, LinkedIn) vean información específica del perfil.

## 🎯 Uso Rápido

### Para un solo perfil:

```bash
npm run generate-profile-seo:single emily-harper
```

### Para TODOS los perfiles públicos:

```bash
npm run generate-profile-seo
```

### Durante el build de producción:

```bash
npm run build:seo
```

Esto ejecuta el build normal + genera HTML SEO para todos los perfiles.

## 📋 Qué hace el script

1. **Busca el perfil** en Supabase por slug
2. **Obtiene datos** del perfil, skills y experiencia
3. **Genera meta tags** específicos:
   - Title: "Emily Harper - Ecopsychology Tutor | YourCVPassport"
   - Description: "Ecopsychology Tutor. Based in London, UK. Professional with expertise..."
   - Keywords: "Emily Harper, Ecopsychology Tutor, London, UK, counseling, sustainability..."
4. **Crea archivo HTML** en `dist/cv/{slug}/index.html`

## 🗂️ Estructura de Archivos Generados

```
dist/
└── cv/
    ├── emily-harper/
    │   └── index.html    ← HTML con meta tags de Emily
    ├── john-doe/
    │   └── index.html    ← HTML con meta tags de John
    └── jane-smith/
        └── index.html    ← HTML con meta tags de Jane
```

## ⚙️ Configuración del Servidor

Para que funcione en producción, tu servidor web debe estar configurado para servir estos archivos estáticos:

### Nginx:

```nginx
server {
    location ~ ^/cv/([a-zA-Z0-9-]+)$ {
        # Primero intenta servir el HTML estático pre-generado
        try_files /cv/$1/index.html /index.html;
    }
}
```

### Apache (.htaccess):

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/cv/([a-zA-Z0-9-]+)$
RewriteCond %{DOCUMENT_ROOT}/cv/%1/index.html -f
RewriteRule ^cv/([a-zA-Z0-9-]+)$ /cv/$1/index.html [L]
```

### Cloudflare Pages / Netlify:

Crear archivo `_redirects` o `netlify.toml`:

```toml
[[redirects]]
  from = "/cv/:slug"
  to = "/cv/:slug/index.html"
  status = 200
```

### Vercel (vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/cv/:slug",
      "destination": "/cv/:slug/index.html"
    }
  ]
}
```

## 🧪 Verificar que Funciona

### 1. Generar HTML para un perfil de prueba:

```bash
npm run generate-profile-seo:single emily-harper
```

### 2. Verificar que se creó el archivo:

```bash
ls dist/cv/emily-harper/index.html
```

### 3. Ver el contenido del HTML:

```bash
cat dist/cv/emily-harper/index.html | grep -i '<title>\|<meta name="description"'
```

### 4. Usar el script de verificación:

```powershell
# Si tienes el servidor local corriendo
.\scripts\verify-seo-tags.ps1 emily-harper
```

### 5. Probar con herramientas online:

Una vez desplegado en producción:
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/

## 🔄 Workflow Recomendado

### Desarrollo:

```bash
npm run dev  # Desarrollo normal, meta tags dinámicos con React
```

### Producción:

```bash
npm run build:seo  # Build + genera HTML SEO para todos los perfiles
```

### Regenerar SEO cuando hay cambios:

Si un usuario actualiza su perfil, regenera su HTML:

```bash
npm run generate-profile-seo:single emily-harper
```

O regenera todos:

```bash
npm run generate-profile-seo
```

## 📊 Ejemplo de Meta Tags Generados

Para el perfil de Emily Harper:

```html
<title>Emily Harper - Ecopsychology Tutor | YourCVPassport</title>

<meta name="description" content="Ecopsychology Tutor. Based in London, UK. Combines scientific background with nature-based therapeutic approaches.">

<meta name="keywords" content="Emily Harper, Ecopsychology Tutor, London, UK, Environmental Psychology, Counseling, Ecotherapy, Sustainability Communication, professional profile, CV, resume, YourCVPassport">

<meta property="og:title" content="Emily Harper - Ecopsychology Tutor | YourCVPassport">
<meta property="og:description" content="Ecopsychology Tutor. Based in London, UK. Combines scientific background with nature-based therapeutic approaches.">
<meta property="og:type" content="profile">
<meta property="og:url" content="https://yourcvpassport.com/cv/emily-harper">
<meta property="og:image" content="https://example.com/emily-photo.jpg">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Emily Harper - Ecopsychology Tutor | YourCVPassport">
<meta name="twitter:description" content="Ecopsychology Tutor. Based in London, UK...">

<meta name="author" content="Emily Harper">
```

## ✅ Ventajas de Esta Solución

- ✅ **No requiere servicios externos** (no necesitas Prerender.io)
- ✅ **100% control** sobre los meta tags
- ✅ **Funciona con cualquier hosting** (estático o dinámico)
- ✅ **Gratis** (sin costos mensuales)
- ✅ **Rápido** (HTML estático es más rápido que renderizado dinámico)
- ✅ **SEO perfecto** (los bots ven exactamente lo que necesitan)

## ⚠️ Consideraciones

### Actualización de Perfiles

Cuando un usuario actualiza su perfil, necesitas regenerar el HTML:

**Opción 1: Manual**
```bash
npm run generate-profile-seo:single [slug]
```

**Opción 2: Automático (Recomendado)**

Crear un webhook de Supabase que se ejecute cuando se actualiza un perfil:

```sql
-- En Supabase, crear función que llama a tu endpoint
CREATE OR REPLACE FUNCTION notify_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar a tu API para regenerar HTML
  PERFORM net.http_post(
    'https://tu-api.com/regenerate-profile-html',
    json_build_object('slug', NEW.slug)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_updated
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_profile_update();
```

**Opción 3: Cron Job**

Ejecutar el script cada X horas:

```bash
# Cron job que regenera todos los perfiles diariamente
0 3 * * * cd /ruta/proyecto && npm run generate-profile-seo
```

## 🆘 Solución de Problemas

### Error: "VITE_SUPABASE_URL no está definido"

Asegúrate de tener `.env.local` con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Error: "Profile not found"

- Verifica que el slug existe en la base de datos
- Verifica que el perfil tiene `cv_visibility = 'public'`
- Verifica que el perfil tiene `full_name` y `headline`

### Los meta tags no se muestran en las herramientas SEO

- Verifica que desplegaste los archivos HTML generados
- Verifica la configuración del servidor (nginx/apache/etc)
- Limpia la caché de las herramientas SEO
- Para Facebook: usa "Scrape Again" en el debugger

### El HTML generado no tiene los meta tags correctos

- Verifica que el perfil tiene datos completos
- Ejecuta el script con más detalle (mira la consola)
- Verifica el archivo generado manualmente

## 📖 Más Información

- **Documentación completa:** [docs/SEO_PROFILES_FIX.md](docs/SEO_PROFILES_FIX.md)
- **Resumen ejecutivo:** [SOLUCION_META_TAGS_PERFILES.md](SOLUCION_META_TAGS_PERFILES.md)

---

**Última actualización:** 2026-01-27
**Script ubicado en:** `scripts/generate-profile-html.mjs`
