# nginx para la producción estática (`yourcvpassport-static.conf`)

Producción sirve `dist/` estático desde `/var/www/yourcvpassport.com/public/dist`, sin proceso Node.
Este fichero reproduce esa configuración y le añade lo que pide la auditoría SEO del 25/10/2026:

| Hallazgo | Qué hace |
|---|---|
| 01 soft 404 | `404` real (con `/404.html`, `noindex`) para lo que no es fichero, copia estática ni ruta de la SPA. `/index.html` y `/<ruta>/index.html` dan `301` a la URL limpia. `/PRECIOS` da `404`. |
| 12 `/recursos`, `/resources` | `301` a `/recursos/blog` y `/resources/blog` (también `/es/resources` y `/en/resources`). |
| 10 rendimiento | Brotli (`brotli on`, nivel 5) además de gzip; las cabeceras de caché no cambian. |

La precarga de la imagen principal es código de la app, no de nginx: no está aquí.

**Importante.** El fichero real de producción (`/etc/nginx/sites-available/yourcvpassport.com`) no se ha podido leer
desde aquí. Antes de sustituirlo, compáralo: `diff -u /etc/nginx/sites-available/yourcvpassport.com nginx/yourcvpassport-static.conf`.
Lo que seguro hay que copiar de allí si difiere: rutas del certificado (snippet `ssl`), el host y la cabecera `apikey`
(si la hay) del `proxy_pass` de `/sitemap.xml`, y cualquier `location` propia que no esté en este fichero.

## Cómo está resuelto el 404 sin romper la SPA

Para cada petición, en este orden:

1. `map $ycp_redirect`: redirecciones 301 (fusionadas, `/es/...`, `/en/...`, `/recursos`, `/resources`).
2. Fichero real (`/assets/...`, imágenes, `robots.txt`) o copia estática `$uri/index.html` (páginas públicas,
   300 artículos del blog y perfiles `/cv/<slug>` del build): `200`.
3. Ruta de la SPA sin copia estática: lista blanca `map $ycp_app_route` (de `config/routeConfig.ts` y `App.tsx`): `200` con `/index.html`.
4. Todo lo demás: `404` + `/404.html`.

`/recursos/blog/<slug>` y `/resources/blog/<slug>` NO están en la lista blanca a propósito: solo existen si el build
generó su copia. Consecuencia: un artículo que solo exista en la tabla `blog_posts` (no en `content/posts`) y se publique
después del último build dará `404` hasta el siguiente `npm run build`.

### Límite documentado: fichas dinámicas

`/cv/<slug>`, `/<cc>/ofertas/<slug>`, `/<cc>/jobs/<slug>`, `/jobs/<slug>` y `/empleos/<slug>` siguen dando `200` aunque la
ficha no exista (la SPA pinta su 404 con `noindex`). Los slugs de perfil sin copia estática (`/cv/<slug>` de un perfil
publicado después del último build) también dependen de esto. Cómo cerrarlo, con su coste:

- **`map` generado en el build**: que `scripts/generate-profile-html.mjs` (y el sitemap de ofertas) escriban un
  `ycp-slugs.map` con `/cv/<slug> 1;` y `include` en el `map $ycp_app_route`. Barato y sin dependencias; lo publicado
  después del build da 404 hasta el siguiente build.
- **Edge Function de existencia** con `auth_request` (módulo `ngx_http_auth_request_module`) que responda 200/404 según
  `profiles.slug` / `job_postings`. Siempre al día; añade un viaje a Supabase por visita (cacheable 1-5 min).

Las rutas legacy `/jobs/<slug>` y `/empleos/<slug>` se dejan en la SPA porque una oferta sin país válido sigue usando esa
URL (`jobPath()` en `lib/jobsFormat.ts`). Hoy hay 0 ofertas publicadas; si se decide que no hace falta, borra la línea
`"~^/(?:jobs|empleos)/[^/]+/?$"` y darán `404`.

## Instalar y probar sin riesgo

```bash
# 1) Copia de seguridad y estado actual
sudo cp -a /etc/nginx/sites-available/yourcvpassport.com /etc/nginx/sites-available/yourcvpassport.com.bak-$(date +%F)
sudo nginx -T > ~/nginx-antes-$(date +%F).txt 2>&1

# 2) Brotli: comprueba que el módulo está
nginx -V 2>&1 | tr ' ' '\n' | grep -i brotli ; ls /etc/nginx/modules-enabled | grep -i brotli
#    Si no está: instálalo (Debian/Ubuntu: sudo apt install libnginx-mod-http-brotli-filter)
#    o comenta las 4 líneas «brotli ...» del .conf (bloque BROTLI). Sin módulo `nginx -t` falla con
#    «unknown directive "brotli"» y no se recarga nada.

# 3) Snippets (si no están ya) y el site
sudo cp nginx/yourcvpassport-{security-headers,ssl}.conf /etc/nginx/snippets/
sudo cp nginx/yourcvpassport-static.conf /etc/nginx/sites-available/yourcvpassport.com
#    Debe haber UN solo site habilitado para yourcvpassport.com (no habilites a la vez ssr-only ni with-ssr).

# 4) Sintaxis. Solo si dice «test is successful»:
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` solo valida la sintaxis. Para ver el comportamiento antes de exponerlo, `scripts/seo/verificar-nginx-rutas.mjs`
simula las decisiones sobre el propio `.conf` (cobertura de `routeConfig.ts` y códigos esperados), y la batería de abajo
se puede lanzar contra una copia con `--resolve yourcvpassport.com:443:<IP>`. La configuración (sin la línea Brotli) se
probó además en un contenedor `nginx:1.18` local con un `dist` de mentira: los códigos de abajo coinciden.

## Batería de comprobaciones (curl)

```bash
H=https://yourcvpassport.com
chk() { c=$(curl -s -o /dev/null -w '%{http_code}' "$H$1"); [ "$c" = "$2" ] && echo "OK  $c $1" || echo "MAL $c (esperado $2) $1"; }
loc() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$H$1"; }
```

| Ruta | Esperado | Por qué |
|---|---|---|
| `/esta-pagina-no-existe-xyz` | **404** | no es fichero, copia ni ruta de la SPA |
| `/producto/inexistente`, `/product/inexistente` | **404** | solo existen las páginas de `routeConfig.ts` |
| `/recursos/blog/articulo-inexistente-xyz` | **404** | sin copia estática del artículo |
| `/resources/blog/no-such-post-xyz` | **404** | idem |
| `/PRECIOS`, `/Precios` | **404** | las rutas distinguen mayúsculas (Linux) |
| `/cv`, `/alertas`, `/talent-search`, `/profiles/abc`, `/api/x`, `/404` | **404** | no son rutas |
| `/404.html` | **404** | `internal`: solo se sirve como error, nunca con 200 |
| `/.env` | 403 | archivos ocultos |
| `/`, `/precios`, `/pricing`, `/producto/resumen`, `/product/overview`, `/empresas`, `/perfiles` | 200 | copia estática |
| `/recursos/blog`, `/resources/blog` | 200 | copia estática |
| `/recursos/blog/cv-pdf-vs-docx-cual-enviar`, `/resources/blog/cv-pdf-vs-docx-format` | 200 | artículos con copia |
| `/login`, `/signup`, `/comunidad`, `/feed`, `/empleos`, `/jobs` | 200 | copia estática |
| `/dashboard`, `/dashboard/visas`, `/admin`, `/company/dashboard`, `/feed/post/abc` | 200 | SPA (lista blanca) |
| `/es/empleos`, `/mx/empleos`, `/alertas/baja`, `/alerts/unsubscribe` | 200 | SPA (lista blanca) |
| `/cv/delsy-romero` | 200 | copia estática o SPA |
| `/cv/no-existe-perfil-xyz123`, `/jobs/123456789`, `/empleos/no-existe`, `/es/ofertas/x-1` | 200 | límite documentado (la SPA pinta el 404) |
| `/sitemap.xml`, `/robots.txt` | 200 | Edge Function (con respaldo estático) / fichero |
| `/index.html` | **301** → `/` | duplicado de la home |
| `/precios/index.html` | **301** → `/precios` | duplicado |
| `/recursos`, `/recursos/` | **301** → `/recursos/blog` | hallazgo 12 |
| `/resources`, `/resources/` | **301** → `/resources/blog` | hallazgo 12 |
| `/es/resources`, `/en/resources` | **301** → `/recursos/blog`, `/resources/blog` | sin salto doble |
| `/es/pricing`, `/nosotros/mision`, `/en/empleos` | **301** → `/precios`, `/nosotros`, `/empleos` | redirecciones previas, intactas |

```bash
for r in "/esta-pagina-no-existe-xyz 404" "/producto/inexistente 404" "/recursos/blog/articulo-inexistente-xyz 404" \
         "/resources/blog/no-such-post-xyz 404" "/PRECIOS 404" "/404.html 404" "/ 200" "/precios 200" "/recursos/blog 200" \
         "/dashboard 200" "/index.html 301" "/recursos 301" "/resources 301" "/sitemap.xml 200"; do chk $r; done
loc /recursos ; loc /resources ; loc /index.html ; loc /precios/index.html
# La página 404 lleva noindex y el código sigue siendo 404:
curl -s -D - "$H/esta-pagina-no-existe-xyz" | grep -iE '^HTTP|robots'
# Cabeceras de caché sin cambios (index/copias: no-cache; assets: 1 año immutable):
curl -sI "$H/precios" | grep -i cache-control
curl -sI "$H/assets/$(curl -s $H/ | grep -oE 'assets/[^"]+\.js' | head -1 | sed 's#assets/##')" | grep -i cache-control
# Brotli (requiere el módulo) y gzip:
J=$(curl -s $H/ | grep -oE '/assets/[^"]+\.js' | head -1)
curl -sI -H 'Accept-Encoding: br'   "$H$J" | grep -iE 'content-encoding|vary'    # content-encoding: br
curl -sI -H 'Accept-Encoding: gzip' "$H$J" | grep -iE 'content-encoding|vary'    # content-encoding: gzip
# Cabeceras de seguridad presentes también en el 404:
curl -sI "$H/esta-pagina-no-existe-xyz" | grep -iE 'strict-transport|x-content-type|x-frame'
```

Tras desplegar también: reenviar el sitemap en Search Console y pedir revalidación de las URLs que figuraban como soft 404.

## Vuelta atrás

```bash
sudo cp -a /etc/nginx/sites-available/yourcvpassport.com.bak-<FECHA> /etc/nginx/sites-available/yourcvpassport.com
sudo nginx -t && sudo systemctl reload nginx
```

El `reload` no corta conexiones en curso. Si algo estuviera mal en la sintaxis, `nginx -t` falla y la configuración
anterior sigue sirviendo. Si solo falla Brotli, comenta las 4 líneas `brotli` y recarga.

## Mantenimiento

- Ruta nueva en la SPA sin copia estática: añádela al `map $ycp_app_route` o dará 404 (`node scripts/seo/verificar-nginx-rutas.mjs` lo comprueba con las de `routeConfig.ts`).
- Redirección nueva: mismo listado en `config/routeConfig.ts` (`routeRedirects`), `server.mjs` (`getRedirectPath`) y aquí. `/recursos` y `/resources` aún no están en los dos primeros.
- Si cambias una cabecera de seguridad o de caché, no uses `add_header` en una `location` sin volver a incluir el snippet de seguridad.
