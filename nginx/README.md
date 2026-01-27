# Configuración de Nginx para YourCVPassport

## Problema a Resolver

Cuando un perfil no existe en YourCVPassport, la aplicación muestra "Perfil No Encontrado" pero el servidor devuelve un código HTTP 200 en lugar de 404. Adicionalmente, se detectaron rutas no implementadas (`/profiles/*` y `/perfiles/*`) que tampoco deberían estar accesibles. Esto es problemático para:

- **SEO**: Los buscadores indexan páginas de error como si fueran contenido válido
- **Usuarios**: Los navegadores no detectan el error correctamente
- **Analítica**: No se pueden rastrear correctamente los errores 404
- **Seguridad**: Rutas no implementadas expuestas públicamente

## Soluciones Implementadas

### 1. Solución Frontend (Inmediata) ✅

**Archivos modificados:**
- `components/ProfileViewPage.tsx`

**Cambios realizados:**
1. Se importó `Helmet` de `react-helmet-async`
2. Se agregaron meta tags cuando un perfil no se encuentra:
   ```tsx
   <Helmet>
     <title>404 - Perfil No Encontrado | YourCVPassport</title>
     <meta name="robots" content="noindex, nofollow" />
     <meta name="prerender-status-code" content="404" />
   </Helmet>
   ```

**Beneficios:**
- ✅ Los bots de búsqueda ven `noindex, nofollow` y no indexan la página
- ✅ Servicios de prerendering (como prerender.io) detectan el código 404
- ✅ Solución lista para usar sin cambios en el servidor
- ⚠️ El código HTTP sigue siendo 200 (limitación de SPAs)

### 2. Solución con Nginx (SPA Estático)

**Archivo:** `nginx/yourcvpassport.conf`

Esta configuración es para cuando despliegas la aplicación como una SPA estática (solo archivos HTML/JS/CSS).

**Características:**
- Redirige HTTP a HTTPS
- Cachea archivos estáticos agresivamente
- Comprime archivos para mejor performance
- Headers de seguridad
- Manejo de rutas de React Router
- **Bloquea rutas no implementadas**: `/profiles/*` y `/perfiles/*` retornan 404 directo

**Limitación:**
- Como es una SPA, todas las rutas retornan 200 OK
- React Router maneja los errores en el cliente
- Los meta tags de Helmet ayudan con SEO

**Uso:**
```bash
# Copiar la configuración
sudo cp nginx/yourcvpassport.conf /etc/nginx/sites-available/yourcvpassport

# Crear symlink
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### 3. Solución con SSR (Server-Side Rendering) - Avanzada

**Archivos:**
- `nginx/yourcvpassport-with-ssr.conf`
- `nginx/ssr-server-example.js`

Esta solución implementa SSR para retornar códigos HTTP 404 reales cuando un perfil no existe.

**Cómo funciona:**

1. **Nginx** detecta si el visitante es un bot o crawler
2. Si es un bot → envía la petición al servidor Node.js
3. El servidor Node.js:
   - Consulta Supabase para verificar si el perfil existe
   - Si existe → retorna HTML con código 200 y meta tags SEO
   - Si NO existe → retorna HTML con código 404 y meta tags noindex
4. Si es un usuario normal → sirve la SPA directamente

**Ventajas:**
- ✅ Códigos HTTP 404 reales para bots y crawlers
- ✅ Mejor SEO e indexación correcta
- ✅ Los usuarios normales siguen teniendo la experiencia SPA rápida
- ✅ Los analytics detectan correctamente los 404

**Instalación del servidor SSR:**

```bash
# 1. Instalar dependencias
cd nginx
npm init -y
npm install express @supabase/supabase-js dotenv

# 2. Crear archivo .env
cat > .env << EOF
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
PORT=3001
EOF

# 3. Ejecutar servidor (desarrollo)
node ssr-server-example.js

# 4. Para producción con PM2
npm install -g pm2
pm2 start ssr-server-example.js --name yourcvpassport-ssr
pm2 save
pm2 startup
```

**Configurar Nginx con SSR:**

```bash
# Copiar la configuración con SSR
sudo cp nginx/yourcvpassport-with-ssr.conf /etc/nginx/sites-available/yourcvpassport

# Crear symlink
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

## Rutas Bloqueadas

Las siguientes rutas han sido **eliminadas del router** y **bloqueadas en nginx**:

- `/profiles/*` (todas las variantes)
- `/perfiles/*` (todas las variantes)
- `/talent-search` (búsqueda pública no autorizada)

**Razón:**
- `/profiles/*` y `/perfiles/*`: Sistema de categorización nunca implementado completamente
- `/talent-search`: Búsqueda de talento debe ser exclusiva para empresas autenticadas

**Únicas rutas válidas para búsqueda de perfiles:**
- ✅ `/company/search` (para empresas autenticadas)
- ✅ `/admin/search` (para administradores)

**Implementación:**
1. **React Router**: Rutas eliminadas de `App.tsx`
2. **Nginx**: Retorna `404` directamente sin procesar la petición
3. **SEO**: Los buscadores no indexarán estas páginas
4. **Seguridad**: No se exponen datos de perfiles sin autenticación

## Comparación de Soluciones

| Característica | Frontend Only | Nginx SPA | Nginx + SSR (Recomendado) |
|---------------|---------------|-----------|---------------------------|
| Complejidad | Baja | Media | Media |
| Códigos 404 reales | ❌ | Parcial | ✅ TODOS |
| Meta tags SEO | ✅ | ✅ | ✅ |
| Rutas bloqueadas | ❌ | ✅ | ✅ |
| Performance | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |
| Mantenimiento | Fácil | Fácil | Fácil con PM2 |
| Recomendado para | Desarrollo local | ❌ No recomendado | ✅ Producción |

## Recomendación

### Para Desarrollo Local:
Usa la **Solución Frontend** (ya implementada). Es suficiente para desarrollo.

### Para Producción: ✅ **SSR OBLIGATORIO**
Usa **Nginx + SSR** (archivo `yourcvpassport-ssr-only.conf`). Esta es la configuración CORRECTA que garantiza:
- ✅ Códigos HTTP 404 reales desde el servidor
- ✅ Todas las rutas bloqueadas retornan 404 server-side
- ✅ Perfiles inexistentes retornan 404 server-side (verifica en DB)
- ✅ SEO optimizado
- ✅ Sin overhead (solo archivos estáticos se sirven directamente)

**Setup Producción:**

```bash
# 1. Instalar dependencias del servidor SSR
cd nginx
npm install

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con credenciales de Supabase

# 3. Iniciar servidor SSR con PM2
npm run pm2:start

# 4. Verificar que el servidor está corriendo
curl http://localhost:3001/health
# Deberías ver: {"status":"ok","timestamp":"..."}

# 5. Configurar Nginx
sudo cp yourcvpassport-ssr-only.conf /etc/nginx/sites-available/yourcvpassport
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/

# 6. Verificar configuración
sudo nginx -t

# 7. Recargar nginx
sudo systemctl reload nginx

# 8. Verificar que TODO funciona
curl -I https://yourcvpassport.com/profiles/test     # → HTTP/2 404 ✅
curl -I https://yourcvpassport.com/cv/no-existe      # → HTTP/2 404 ✅
curl -I https://yourcvpassport.com/ruta-invalida     # → HTTP/2 404 ✅
```

### Para Producción:
Usa **Nginx SPA** si:
- No necesitas códigos HTTP 404 estrictos
- Los meta tags de noindex/nofollow son suficientes
- Quieres mantener la arquitectura simple

Usa **Nginx + SSR** si:
- El SEO es crítico para tu negocio
- Necesitas códigos HTTP 404 reales
- Tienes recursos para mantener un servidor Node.js adicional

## Verificación de la Implementación

### 1. Verificar meta tags (Solución Frontend)

```bash
# Abre DevTools en Chrome
# Ve a un perfil que NO existe
# En Elements, busca <head>
# Deberías ver:
# <meta name="robots" content="noindex, nofollow">
# <meta name="prerender-status-code" content="404">
```

### 2. Verificar código HTTP (Solución SSR)

```bash
# Simular un bot
curl -I -A "Googlebot" https://yourcvpassport.com/cv/perfil-inexistente

# Deberías ver:
# HTTP/2 404
```

### 3. Verificar rutas bloqueadas

```bash
# Verificar que /profiles/ retorna 404
curl -I https://yourcvpassport.com/profiles/spain/ux-designer

# Debería retornar:
# HTTP/2 404

# También probar /perfiles/
curl -I https://yourcvpassport.com/perfiles/españa/barcelona/desarrollador

# Debería retornar:
# HTTP/2 404
```

### 4. Verificar comportamiento normal

```bash
# Como usuario normal
curl -I https://yourcvpassport.com/cv/perfil-inexistente

# SPA: Retorna HTTP/2 200 (esperado)
# SSR: Retorna HTTP/2 404 (mejor para SEO)
```

## Migración a Next.js (Futuro)

Si en el futuro decides migrar a Next.js, obtendrás SSR nativo con códigos HTTP correctos automáticamente:

```tsx
// pages/cv/[slug].tsx en Next.js
export async function getServerSideProps({ params, res }) {
  const { slug } = params;
  const profile = await getProfile(slug);

  if (!profile) {
    res.statusCode = 404;
    return {
      props: { notFound: true }
    };
  }

  return {
    props: { profile }
  };
}
```

Next.js manejará automáticamente los códigos 404 y SSR sin necesidad de configuración adicional.

## Soporte y Troubleshooting

### Error: "Cannot read Helmet"
Asegúrate de que `react-helmet-async` está instalado:
```bash
npm install react-helmet-async
```

### Nginx no recarga la configuración
```bash
# Verificar sintaxis
sudo nginx -t

# Si hay errores, revisa los logs
sudo tail -f /var/log/nginx/error.log

# Reiniciar nginx (última opción)
sudo systemctl restart nginx
```

### El servidor SSR no inicia
```bash
# Verificar que el puerto 3001 está libre
lsof -i :3001

# Verificar variables de entorno
cat .env

# Ver logs de PM2
pm2 logs yourcvpassport-ssr
```

## Recursos Adicionales

- [Nginx Docs](https://nginx.org/en/docs/)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
- [Express.js](https://expressjs.com/)
- [PM2](https://pm2.keymetrics.io/)
- [Supabase Docs](https://supabase.com/docs)

---

**Creado:** 2026-01-26
**Última actualización:** 2026-01-26
**Autor:** Sistema YourCVPassport
