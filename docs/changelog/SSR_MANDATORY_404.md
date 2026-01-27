# SSR Obligatorio: TODOS los 404 desde el Servidor

**Fecha:** 2026-01-26
**Tipo:** Mejora crítica / SEO / Arquitectura
**Impacto:** TODOS los 404 ahora son códigos HTTP reales del servidor

## 🎯 Problema

La configuración anterior tenía 404 "mixtos":
- ✅ Rutas bloqueadas (`/profiles/*`, `/talent-search`) → 404 desde nginx
- ❌ Perfiles inexistentes (`/cv/no-existe`) → 200 OK con meta tags
- ❌ Rutas inválidas → 200 OK + redirect a `/404` en React

**Consecuencias:**
- Google ve código 200 para páginas que no existen
- Los meta tags `noindex` ayudan pero NO son ideales
- Analytics no detecta correctamente los 404
- No es la práctica correcta según estándares web

## ✅ Solución: SSR Obligatorio

Ahora **TODAS** las peticiones HTML pasan por el servidor Node.js que:

1. **Verifica rutas bloqueadas** → 404 inmediato
2. **Verifica perfiles en DB** → 404 si no existe
3. **Detecta rutas inválidas** → 404 si no está en whitelist
4. **Sirve contenido válido** → 200 OK con SEO tags

### Archivos Creados/Modificados

**Nuevos:**
- `nginx/yourcvpassport-ssr-only.conf` - Configuración nginx que redirecciona TODO a Node.js

**Modificados:**
- `nginx/ssr-server-example.js` - Actualizado para manejar TODAS las rutas
- `nginx/README.md` - Actualizado con recomendación de SSR obligatorio
- `nginx/QUICK_START.md` - Simplificado para SSR obligatorio

## 🔧 Cambios Técnicos

### 1. Servidor SSR Actualizado

**Nuevo comportamiento:**

```javascript
// Rutas bloqueadas → 404 inmediato
if (isBlockedRoute(req.path)) {
  return res.status(404).send(html404);
}

// Rutas de perfiles → Verifica en DB
if (req.path.startsWith('/cv/')) {
  const profile = await checkProfileExists(slug);
  if (!profile) {
    return res.status(404).send(html404);
  }
  return res.status(200).send(htmlWithSEO);
}

// Rutas inválidas → 404
if (!isValidRoute(req.path)) {
  return res.status(404).send(html404);
}

// Ruta válida → 200 OK
res.status(200).send(html);
```

### 2. Nginx Simplificado

**Nueva configuración (`yourcvpassport-ssr-only.conf`):**

```nginx
# Archivos estáticos → Directo desde nginx (performance)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    try_files $uri =404;
}

# TODAS las demás rutas → Proxy a Node.js
location / {
    proxy_pass http://nodejs_backend;
    proxy_intercept_errors on;  # CRÍTICO: Preserva códigos 404
}
```

## 📊 Resultados

### Antes (SPA + meta tags)

| Ruta | Código HTTP | Problema |
|------|-------------|----------|
| `/profiles/spain/dev` | 200 OK | ❌ Debería ser 404 |
| `/cv/no-existe` | 200 OK | ❌ Debería ser 404 |
| `/ruta-invalida` | 200 OK | ❌ Debería ser 404 |

### Ahora (SSR Obligatorio)

| Ruta | Código HTTP | Correcto |
|------|-------------|----------|
| `/profiles/spain/dev` | **404 NOT FOUND** | ✅ Bloqueado en server |
| `/cv/no-existe` | **404 NOT FOUND** | ✅ Verificado en DB |
| `/ruta-invalida` | **404 NOT FOUND** | ✅ No en whitelist |

## 🚀 Setup en Producción

```bash
# 1. Instalar servidor SSR
cd nginx
npm install

# 2. Configurar .env
cp .env.example .env
nano .env  # Editar credenciales

# 3. Iniciar con PM2
npm run pm2:start

# 4. Configurar nginx
sudo cp yourcvpassport-ssr-only.conf /etc/nginx/sites-available/yourcvpassport
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Verificar
curl -I https://tudominio.com/cv/no-existe
# Resultado esperado: HTTP/2 404 ✅
```

## ✅ Verificación

```bash
# Ejecutar pruebas
cd nginx
npm test

# Resultado esperado:
# ✓ Perfil no encontrado (debería retornar 404)
# ✓ Ruta bloqueada /profiles/* (debería retornar 404)
# ✓ Ruta bloqueada /talent-search (debería retornar 404)
# ✓ Todas las pruebas pasaron correctamente
```

## 🎯 Beneficios

### SEO
- ✅ Google ve códigos HTTP 404 reales
- ✅ No indexa páginas de error (sin depender de meta tags)
- ✅ Comportamiento estándar web

### Analytics
- ✅ Google Analytics detecta 404s correctamente
- ✅ Monitoreo de errores más preciso
- ✅ Métricas de salud del sitio correctas

### Performance
- ✅ Archivos estáticos siguen en caché nginx (sin overhead)
- ✅ Solo HTML pasa por Node.js (muy rápido)
- ✅ PM2 maneja clustering y reinicio automático

### Mantenimiento
- ✅ Un solo lugar para manejar rutas (servidor Node.js)
- ✅ Fácil agregar nuevas rutas bloqueadas
- ✅ Logs centralizados en PM2

## 🔄 Migración desde SPA

Si ya tienes la configuración SPA en producción:

```bash
# 1. Instalar servidor SSR (sin detener nginx)
cd nginx
npm install
npm run pm2:start

# 2. Verificar que funciona
curl http://localhost:3001/health

# 3. Cambiar configuración nginx
sudo rm /etc/nginx/sites-enabled/yourcvpassport
sudo ln -s /etc/nginx/sites-available/yourcvpassport-ssr-only /etc/nginx/sites-enabled/yourcvpassport

# 4. Recargar nginx (sin downtime)
sudo nginx -t && sudo systemctl reload nginx

# 5. Verificar que funciona
curl -I https://tudominio.com/cv/no-existe
# Debería ver: HTTP/2 404
```

## 📚 Documentación

- [nginx/README.md](../../nginx/README.md) - Documentación completa
- [nginx/QUICK_START.md](../../nginx/QUICK_START.md) - Guía rápida
- [nginx/yourcvpassport-ssr-only.conf](../../nginx/yourcvpassport-ssr-only.conf) - Configuración nginx
- [nginx/ssr-server-example.js](../../nginx/ssr-server-example.js) - Servidor SSR

## ⚠️ Importante

**No uses las configuraciones antiguas en producción:**
- ❌ `yourcvpassport.conf` (SPA simple)
- ❌ `yourcvpassport-with-ssr.conf` (SSR solo para bots)

**Usa SIEMPRE:**
- ✅ `yourcvpassport-ssr-only.conf` (SSR obligatorio)

## 🧪 Testing

```bash
# Pruebas locales
npm test

# Pruebas en producción
curl -I https://tudominio.com/profiles/test     # → 404 ✅
curl -I https://tudominio.com/cv/no-existe      # → 404 ✅
curl -I https://tudominio.com/ruta-random       # → 404 ✅
curl -I https://tudominio.com/                  # → 200 ✅
```

---

**Estado:** ✅ Implementado y documentado
**Recomendación:** Usar en producción INMEDIATAMENTE
**Backward compatibility:** Los cambios en frontend son compatibles con ambas configuraciones
