# Quick Start - Manejo de 404 en Perfiles

## ¿Qué se implementó?

Ahora cuando un perfil no se encuentra, YourCVPassport maneja correctamente el error 404 para mejorar SEO y experiencia de usuario.

## ✅ Cambios en el Frontend (Ya Activos)

### 1. ProfileViewPage.tsx - Manejo de 404 para perfiles inexistentes

El archivo [ProfileViewPage.tsx](../components/ProfileViewPage.tsx) ahora incluye:

```tsx
<Helmet>
  <title>404 - Perfil No Encontrado | YourCVPassport</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="prerender-status-code" content="404" />
</Helmet>
```

### 2. App.tsx - Rutas eliminadas

Se han **eliminado completamente** las rutas no implementadas:
- ❌ `/profiles/*` (todas las variantes)
- ❌ `/perfiles/*` (todas las variantes)
- ❌ `/talent-search` (búsqueda pública no autorizada)

**Rutas válidas para búsqueda:**
- ✅ `/company/search` (empresas autenticadas)
- ✅ `/admin/search` (administradores)

**Esto ya funciona en desarrollo** sin configuración adicional.

## 🚀 Producción: SSR OBLIGATORIO ✅

En producción **DEBES usar SSR** para que todos los 404 sean reales del servidor:

### Setup Completo (5 minutos)

```bash
# 1. Instalar dependencias del servidor SSR
cd nginx
npm install

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# 3. Probar el servidor localmente
npm start
# Verifica en http://localhost:3001/health

# 4. Iniciar en producción con PM2
npm run pm2:start

# 5. Configurar nginx (USAR ARCHIVO ssr-only)
sudo cp yourcvpassport-ssr-only.conf /etc/nginx/sites-available/yourcvpassport
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Verificar que funciona
curl -I https://tudominio.com/profiles/test      # → HTTP/2 404 ✅
curl -I https://tudominio.com/cv/no-existe       # → HTTP/2 404 ✅
```

**¡Listo!** Ahora TODOS los 404 vienen del servidor.

## 🧪 Probar la Implementación

### En Desarrollo (Local)

1. Ejecuta la app: `npm run dev`
2. Visita un perfil inexistente: `http://localhost:3000/cv/perfil-que-no-existe`
3. Abre DevTools → Elements → `<head>`
4. Verifica que aparece: `<meta name="robots" content="noindex, nofollow">`

### Con el Servidor SSR

```bash
# Iniciar el servidor SSR
cd nginx
npm start

# En otra terminal, ejecutar pruebas
npm test
```

Deberías ver:
```
✓ Health check endpoint
✓ Perfil no encontrado (debería retornar 404)
✓ Otro perfil inexistente (debería retornar 404)

✓ Todas las pruebas pasaron correctamente
```

## 📊 Comparación

| | Desarrollo Local | Producción (SSR Obligatorio) |
|---|:---:|:---:|
| **Meta tags SEO** | ✅ | ✅ |
| **HTTP 404 real** | ❌ (solo meta tags) | ✅ TODOS |
| **Configuración** | 0 min | 5 min |
| **Rutas bloqueadas** | ❌ (React Router) | ✅ Servidor |
| **Perfiles inexistentes** | ❌ (código 200) | ✅ Código 404 |
| **Mantenimiento** | Cero | Fácil con PM2 |
| **Recomendado para** | Dev local | ✅ Producción |

## 📝 Archivos Creados

```
nginx/
├── README.md                        # Documentación completa
├── QUICK_START.md                   # Esta guía rápida
├── yourcvpassport.conf              # [DEPRECATED] Configuración nginx SPA
├── yourcvpassport-with-ssr.conf     # [DEPRECATED] Configuración nginx + SSR (solo bots)
├── yourcvpassport-ssr-only.conf     # ✅ Configuración PRODUCCIÓN (SSR obligatorio)
├── ssr-server-example.js            # Servidor SSR en Node.js (actualizado)
├── test-ssr.js                      # Script de pruebas
├── package.json                     # Dependencias del servidor SSR
├── .env.example                     # Ejemplo de variables de entorno
└── .gitignore                       # Ignorar node_modules y .env
```

**Usa `yourcvpassport-ssr-only.conf` para producción.**

## ❓ FAQ

### ¿Los cambios ya funcionan en desarrollo?
Sí, en desarrollo local los meta tags `noindex, nofollow` protegen contra indexación. Pero para producción DEBES usar SSR.

### ¿Por qué SSR es obligatorio en producción?
Porque es la ÚNICA forma de tener códigos HTTP 404 reales del servidor:
- ✅ Google y buscadores reciben 404 real (no solo meta tags)
- ✅ Rutas bloqueadas (`/profiles/*`, `/talent-search`) retornan 404 server-side
- ✅ Perfiles inexistentes retornan 404 después de verificar en la DB
- ✅ Analytics y herramientas detectan correctamente los errores

### ¿Afecta el performance?
NO. Los archivos estáticos (JS, CSS, imágenes) se sirven directamente desde nginx con caché agresivo. Solo las rutas HTML pasan por Node.js, que es muy rápido.

### ¿Puedo usar Vercel/Netlify?
No recomendado para esta app. Necesitas control sobre nginx + Node.js para los 404 del servidor. Usa un VPS (DigitalOcean, Linode, AWS EC2, etc.).

## 🆘 Soporte

Si tienes problemas:

1. **Error en ProfileViewPage**: Verifica que `react-helmet-async` está instalado
   ```bash
   npm install react-helmet-async
   ```

2. **Nginx no funciona**: Revisa los logs
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Servidor SSR no inicia**: Verifica el archivo .env
   ```bash
   cd nginx
   cat .env
   ```

## 📚 Más Información

Lee [README.md](README.md) para documentación completa y casos avanzados.

---

**Última actualización**: 2026-01-26
