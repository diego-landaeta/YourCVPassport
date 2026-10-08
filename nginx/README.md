# nginx y server.mjs en producción

## Archivos

| Archivo | Qué es | Dónde va |
|---|---|---|
| `yourcvpassport-with-ssr.conf` | Site: nginx sirve la SPA; solo `/api/*` y los bots en `/cv/*` pasan a Node | `/etc/nginx/sites-available/` |
| `yourcvpassport-ssr-only.conf` | Site: todo lo que no es estático pasa a Node | `/etc/nginx/sites-available/` |
| `yourcvpassport-security-headers.conf` | Snippet: HSTS, CSP (Report-Only), Permissions-Policy, Referrer-Policy... | `/etc/nginx/snippets/` |
| `yourcvpassport-ssl.conf` | Snippet: certificado y TLS | `/etc/nginx/snippets/` |
| `yourcvpassport-proxy.conf` | Snippet: cabeceras de proxy hacia Node | `/etc/nginx/snippets/` |

Habilita **solo uno** de los dos sites: ambos definen `upstream nodejs_backend` y los `map`.

```bash
sudo cp nginx/yourcvpassport-{security-headers,ssl,proxy}.conf /etc/nginx/snippets/
sudo cp nginx/yourcvpassport-with-ssr.conf /etc/nginx/sites-available/yourcvpassport
sudo ln -sf /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`listen ... ssl http2` se mantiene por compatibilidad con nginx < 1.25.1 (Ubuntu 22.04/24.04).
En nginx >= 1.25.1 avisa de que está obsoleto; ahí se puede cambiar por `listen 443 ssl;` + `http2 on;`.

## Puerto de Node (PORT)

`server.mjs` escucha por defecto en **127.0.0.1:3001**, el mismo puerto que el
`upstream nodejs_backend` de ambos sites (y que `ssr-server-example.js`).

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `3001` | Si lo cambias, cambia también `server 127.0.0.1:3001` en el upstream |
| `HOST` | `127.0.0.1` | Solo nginx debe hablar con Node. `0.0.0.0` lo expone a la red |
| `DIST_DIR` | `./dist` | Carpeta del build de Vite |
| `TRUST_PROXY` | `loopback` | Proxies de confianza para `X-Forwarded-*` (IP real del cliente, `req.secure`). Detrás de un CDN además de nginx, usa el número de saltos (p. ej. `2`) |
| `TRANSLATE_RATE_LIMIT` | `60` | Peticiones por IP y ventana a `/api/translate` (y `/health` de traducción) |
| `TRANSLATE_RATE_WINDOW_MS` | `60000` | Ventana del límite |

El rate limit vive en memoria del proceso: con varios procesos (cluster/PM2 en modo
cluster) el límite efectivo se multiplica por el número de procesos.

`/api/translate` solo acepta `es`/`en`, hasta 200 textos, 5000 caracteres por texto
y 50 000 por petición (400/413 si no). Al superar el límite responde `429` con `Retry-After`.

## Dominio canónico

El canónico es el **apex** `https://yourcvpassport.com` (sitemap, `canonical`, `og:url`).
`http://` (apex y www) y `https://www.` redirigen con **301** al apex conservando la ruta.
El certificado debe cubrir también `www.yourcvpassport.com`.

## Redirecciones 301 y título de cada página en el HTML

- `map $uri $ycp_redirect` (en ambos sites) responde **301** a:
  - rutas fusionadas: `/nosotros/mision` → `/nosotros`, `/recursos/biblioteca` → `/profesionales/plantillas` (y sus versiones en inglés);
  - enlaces antiguos con prefijo de idioma: `/es/pricing` → `/precios`, `/es/companies/plans` → `/empresas/planes`,
    `/es/companies/security` → `/empresas/seguridad`... y cualquier otro `/es/...` o `/en/...` pierde el prefijo.
  Es el mismo listado que `routeRedirects` (`config/routeConfig.ts`, la SPA) y `getRedirectPath` (`server.mjs`).
- `npm run build` ejecuta `scripts/generate-static-meta.mjs`, que escribe `dist/<ruta>/index.html` para cada
  página pública con su título, descripción, canonical y hreflang (tabla en `seo/static-meta.mjs`).
  `try_files $uri $uri/ /index.html` ya las sirve (sin redirigir a la barra final); el map de caché les pone
  `no-cache` como al `index.html` raíz. **Hay que subir `dist/` entero**, subcarpetas incluidas.
- Comprobar tras desplegar: `curl -sI https://yourcvpassport.com/es/pricing` (301 a `/precios`) y
  `curl -s https://yourcvpassport.com/precios | grep '<title>'` (título en español).

## Caché

Se decide en el `map $uri $ycp_cache_control` (un único `add_header` a nivel de server):

- `/assets/*` (nombres con hash de Vite): `public, max-age=31536000, immutable`
- `index.html` (y toda ruta de la SPA) y `sw.js`: `no-cache`
- `sitemap.xml`, `robots.txt`: 1 hora
- resto de estáticos de `public/` (favicons, imágenes, manifest): 1 día
- respuestas de Node: el `Cache-Control` que pone Node; 404/5xx: sin caché

## Cabeceras de seguridad

Van a nivel de `server` con `always`, así que llegan también a assets, `/404`, robots,
sitemap, errores y redirecciones. **Ninguna `location` debe usar `add_header`**: en nginx,
una location con su propio `add_header` deja de heredar todos los del server. Si hiciera
falta, esa location tiene que volver a `include snippets/yourcvpassport-security-headers.conf;`.

`server.mjs` envía las mismas cabeceras (por si se usa sin nginx); nginx las oculta del
upstream (`proxy_hide_header` en `yourcvpassport-proxy.conf`) para no duplicarlas.
**Si cambias la CSP o cualquier cabecera, cámbiala en el snippet y en `server.mjs`.**

HSTS va sin `includeSubDomains` ni `preload`. Añádelos solo cuando todos los subdominios
de `yourcvpassport.com` sirvan HTTPS (un subdominio solo-HTTP dejaría de funcionar).

## CSP: de Report-Only a enforcing

Ahora mismo la política va en `Content-Security-Policy-Report-Only`: el navegador
avisa en consola de lo que bloquearía, pero no bloquea nada.

1. Despliega así y navega por las páginas principales (home, precios, perfil `/cv/...`,
   editor, feed con GIFs, contacto con el mapa, exportar PDF, testimonios de Opynio)
   con la consola abierta. Cada aviso `[Report Only] Refused to ...` indica un origen
   o tipo de recurso que falta.
2. Opcional: recoger informes. Añade al final de la política `; report-to csp` y la
   cabecera `Reporting-Endpoints: csp="https://<endpoint>"` (un servicio de informes CSP
   o una Edge Function que los guarde). Déjalo así una o dos semanas.
3. Añade a la directiva correspondiente (`img-src`, `connect-src`...) los orígenes
   legítimos que hayan salido. Comprueba los orígenes que usa el código con:
   `grep -rhoE "(https|wss)://[a-zA-Z0-9.-]+" --include=*.ts --include=*.tsx components hooks services utils contexts | sort -u`
   (la mayoría son enlaces `<a href>`, que no necesitan CSP) y los de `https://web.opynio.com/widget.js`
   si Opynio actualiza su widget.
4. Cuando no queden avisos, cambia el nombre de la cabecera a `Content-Security-Policy`
   en `yourcvpassport-security-headers.conf` **y** en `server.mjs`
   (`SECURITY_HEADERS`), y ajusta el `proxy_hide_header` si hiciera falta.
5. Siguientes endurecimientos posibles: `form-action 'self'`, `upgrade-insecure-requests`
   y quitar `'unsafe-inline'` de `style-src` (requiere revisar los `style=` de React y del widget de Opynio).
