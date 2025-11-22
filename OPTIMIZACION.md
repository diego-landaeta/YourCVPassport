# 🚀 Guía de Optimización de Rendimiento

## ✅ Optimizaciones Implementadas

### 1. Lazy Loading de Imágenes
- **Archivo modificado:** [components/TemplateLibraryPage.tsx](components/TemplateLibraryPage.tsx)
- Las imágenes de templates ahora usan `IntersectionObserver` para cargar solo cuando están visibles
- Añadido `loading="lazy"` nativo del navegador
- Skeleton loaders mientras las imágenes cargan

### 2. Configuración de Vite Mejorada
- **Archivo modificado:** [vite.config.ts](vite.config.ts)
- Code splitting optimizado con chunks manuales por categoría
- Compresión mejorada con Terser
- CSS code splitting activado
- Assets inline para archivos pequeños (<4KB)
- esbuild optimizado para producción

### 3. Preload de Recursos Críticos
- **Archivo modificado:** [index.html](index.html)
- Preload de CSS crítico
- Module preload para el bundle principal

## 📊 Resultados Esperados

### Antes:
- Carga inicial: ~4-5 MB de imágenes PNG
- Tiempo de carga: 3-5 segundos (conexión lenta)
- 20 imágenes cargadas simultáneamente

### Después:
- Carga inicial: Solo imágenes visibles
- Tiempo de carga: 1-2 segundos
- Lazy loading progresivo al hacer scroll

## 🔧 Pasos Adicionales Recomendados

### 1. Optimizar Imágenes a WebP (IMPORTANTE)

Las imágenes PNG actuales pesan ~200-340 KB cada una. Convertir a WebP puede reducir el tamaño en 60-80%.

#### Opción A: Script Automático (requiere ImageMagick)

```bash
# Instalar ImageMagick
# Windows (con Chocolatey):
choco install imagemagick

# macOS (con Homebrew):
brew install imagemagick

# Linux:
sudo apt-get install imagemagick

# Ejecutar script de optimización
npm run optimize-images
```

#### Opción B: Herramienta Online
1. Visita https://squoosh.app/
2. Arrastra cada imagen PNG de `public/images/templates/`
3. Selecciona formato WebP con calidad 85
4. Descarga las imágenes optimizadas
5. Reemplaza los archivos originales

#### Opción C: Herramienta Visual (Windows)
1. Descarga XnConvert (gratis): https://www.xnview.com/en/xnconvert/
2. Añade todas las imágenes PNG
3. En "Actions" añade: Convert to WebP (quality 85)
4. Procesa todas en lote

### 2. Actualizar Referencias a Imágenes

Después de convertir a WebP, actualiza las URLs en tu código de templates.

**Ejemplo en `constants.ts` o donde defines TEMPLATES:**

```typescript
// Antes:
imageUrl: '/images/templates/passport.png'

// Después:
imageUrl: '/images/templates/passport.webp'
```

### 3. Configurar CDN (Opcional pero Recomendado)

Si usas Vercel, Netlify, o similar, las imágenes se sirven automáticamente optimizadas. Si no:

```typescript
// En vite.config.ts, añadir:
export default defineConfig({
  base: process.env.CDN_URL || '/',
})
```

### 4. Habilitar Compresión en el Servidor

Si tienes control del servidor, habilita compresión Brotli o Gzip:

**Nginx:**
```nginx
gzip on;
gzip_types text/css application/javascript image/svg+xml;
brotli on;
brotli_types text/css application/javascript;
```

**Vercel/Netlify:** Ya incluyen compresión automática.

### 5. Monitoring de Rendimiento

Verifica las mejoras con estas herramientas:

```bash
# Analizar bundle size
npm run build
npx vite-bundle-visualizer
```

O usa:
- Google PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- Chrome DevTools → Lighthouse

## 🎯 Métricas Objetivo

Después de todas las optimizaciones:

| Métrica | Antes | Objetivo |
|---------|-------|----------|
| First Contentful Paint (FCP) | ~2.5s | <1.5s |
| Largest Contentful Paint (LCP) | ~4.0s | <2.5s |
| Time to Interactive (TTI) | ~5.0s | <3.0s |
| Total Bundle Size | ~2.5MB | <1.5MB |
| Image Payload | ~5MB | <1.5MB |

## 🔍 Próximas Optimizaciones Avanzadas

1. **Service Worker con Workbox** - Para cacheo offline
2. **HTTP/2 Server Push** - Enviar recursos antes de ser solicitados
3. **Resource Hints** - `<link rel="prefetch">` para rutas futuras
4. **Dynamic Imports** - Cargar components solo cuando se necesiten
5. **Image Sprites** - Combinar iconos pequeños

## 📝 Checklist de Optimización

- [x] Lazy loading de imágenes implementado
- [x] Configuración de Vite optimizada
- [x] Preload de recursos críticos
- [x] Script de optimización de imágenes creado
- [ ] Convertir imágenes PNG a WebP (ejecutar: `npm run optimize-images`)
- [ ] Actualizar referencias de imágenes en el código
- [ ] Medir rendimiento con Lighthouse
- [ ] Verificar Core Web Vitals

## 🆘 Problemas Comunes

### "Las imágenes no cargan después de la optimización"
- Verifica que las rutas en el código apunten a `.webp` en lugar de `.png`
- Asegúrate de que los archivos WebP estén en `public/images/templates/`

### "El build es muy lento"
- Desactiva `sourcemap` en producción en `vite.config.ts`
- Usa `minify: 'esbuild'` en lugar de `terser` (más rápido pero menos optimizado)

### "Errores de módulos no encontrados"
- Ejecuta `npm install` de nuevo
- Limpia cache: `rm -rf node_modules/.vite`

## 📚 Recursos Adicionales

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [Web.dev - Optimize Images](https://web.dev/fast/#optimize-your-images)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Última actualización:** 2025-11-21
**Versión:** 1.0
