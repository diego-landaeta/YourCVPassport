# Pruebas de la bolsa de empleo (SQL y Edge Functions)

Pruebas automáticas de las migraciones `20261028` a `20261035` y de las Edge Functions de la bolsa. Ninguna toca una base real
ni la red: las de SQL corren sobre **PGlite** (un Postgres en memoria con RLS y roles) y las de funciones usan dobles de Supabase y de `fetch`.

## Cómo ejecutarlas

```bash
npm install            # una vez: instala @electric-sql/pglite (devDependency) y el resto
npm run test:sql       # todas las pruebas SQL, una tras otra; código de salida 0 solo si todas pasan
npm run test:functions # todas las pruebas de Node de supabase/functions/**/*.test.mjs
```

> **Pendiente de hacer a mano:** `@electric-sql/pglite` está declarado en `package.json` (`^0.5.13`), pero `package-lock.json`
> aún no lo recoge porque no se ha ejecutado `npm install`. Ejecuta `npm install` y sube el `package-lock.json` resultante.

Un fichero suelto: `node supabase/tests/fase6.test.mjs`. Un filtro: `node supabase/tests/run-all.mjs integrado` (solo los que contienen «integrado»).
Necesitan Node 22.6 o superior (24 recomendado) para leer los `.ts` de las funciones.

## Qué hay

| Fichero | Qué comprueba |
|---|---|
| `fase1.test.mjs` | `20261029`: condiciones y aceptaciones, idioma de registro, países |
| `fase2.test.mjs` | `20261030`: ofertas (estados, moderación, denuncias, búsqueda, RLS) |
| `fase3.test.mjs` | `20261031`: candidaturas, preguntas, alertas, vista del candidato |
| `fase4.test.mjs` | `20261032` sobre el encadenado 29 → 32 (correcciones de la auditoría) |
| `fase5.test.mjs` | `20261033` y `20261034` sobre el encadenado 28 → 34 (aviso de 15 días, casillas opcionales, cron) |
| `fase6.test.mjs` | `20261035` (cierre final) sobre el encadenado 28 → 35 |
| `integrado*.test.mjs` | La cadena completa de migraciones sobre el estado REAL de producción (`integrado35` es la vigente; las anteriores se conservan como comparación de cada tramo) |
| `stub-base.sql`, `stub-triggers.sql`, `prod-funcs.sql` | El estado de producción del 29/10/2026 (tablas, disparadores y funciones), leído con consultas de solo lectura. Es el punto de partida de `fase5`, `fase6` e `integrado*` |
| `run-all.mjs`, `run-functions.mjs` | Lanzadores: ejecutan todo, resumen al final y código de salida |

Cada prueba aplica las migraciones dos veces (deben poder reaplicarse), prueba los casos buenos y los de ataque (otro usuario, `anon`, un
miembro sin rol) y termina con `RESULTADO: N OK, M FALLO` (o `OK/FALLO` por línea); sale con código 1 si algo falla.

## Rutas

Los tests leen las migraciones de `../migrations/` y los stubs de esta misma carpeta (rutas relativas a cada fichero, no al directorio desde el que se lanzan).

## Si cambias el esquema

1. Añade la migración nueva en `supabase/migrations/` (reaplicable, con cabecera en español).
2. Añádela a la lista `MIGS` de `integrado35.test.mjs` (copia el fichero como `integradoNN.test.mjs` y deja el anterior) y escribe un `faseN.test.mjs` con los casos nuevos.
3. Si cambia algo que ya existe en producción, regenera los stubs leyendo la base con una conexión **de solo lectura** (nunca escribas desde estos scripts).
