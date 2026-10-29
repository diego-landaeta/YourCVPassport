# nginx de producción (estático)

`yourcvpassport.com.produccion.conf` es el archivo que corre hoy en `/etc/nginx/sites-available/yourcvpassport.com`
(VPS 72.60.90.135), desplegado el 29/10/2026. Es el archivo real de antes con un parche mínimo:

- 404 real con lista blanca de rutas (`$ycp_app_route`) y `404.html` interno (auditoría SEO del 25/10, hallazgo 01).
- `index.html` y `/<ruta>/index.html` con 301 a la URL limpia.
- `/recursos` y `/resources` con 301 al blog; excepciones para `/es/empleos` y fichas de oferta por país.

Sin Brotli (el servidor no tiene el módulo). Copia anterior en el servidor: `yourcvpassport.com.bak-20261029-1717`.
Si se añade una ruta a la SPA sin copia estática, hay que añadirla a `$ycp_app_route`
(`node scripts/seo/verificar-nginx-rutas.mjs` lo comprueba contra routeConfig).
Vuelta atrás: restaurar la copia, `nginx -t` y `nginx -s reload`.

Nota: `scripts/seo/verificar-nginx-rutas.mjs` se escribió para una configuración reescrita (snippets propios, sin `add_header`
en las `location`, Brotli). Contra este archivo real avisa de esos estilos y de que `/es/resources` y `/en/resources` hacen dos
saltos (a `/resources` y luego a `/resources/blog`); la cobertura de rutas sí es correcta. Pendiente, de bajo riesgo: añadir
esas dos entradas exactas al mapa `$ycp_redirect` en la próxima recarga de nginx.
