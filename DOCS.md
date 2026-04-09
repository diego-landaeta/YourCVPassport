# YourCVPassport - Documentacion Tecnica Consolidada

> Ultima actualizacion: 2026-04-09

---

## Tabla de Contenidos

1. [Nginx y SSR](#nginx-y-ssr)
2. [Schema y Limites de Campos](#schema-y-limites-de-campos)
3. [Migraciones de Supabase](#migraciones-de-supabase)
4. [Sistema de Emails](#sistema-de-emails)
5. [SEO y Blog](#seo-y-blog)
6. [Testing](#testing)
7. [Scripts SQL](#scripts-sql)

---

## Nginx y SSR

### Problema
Las SPAs devuelven HTTP 200 incluso para perfiles inexistentes. Se necesita SSR para devolver 404 reales.

### Solucion en Produccion (SSR Obligatorio)

Archivos clave en `nginx/`:
- `yourcvpassport-ssr-only.conf` - Config nginx para produccion
- `ssr-server-example.js` - Servidor Node.js SSR
- `test-ssr.js` - Script de pruebas

**Setup:**

```bash
cd nginx && npm install
cp .env.example .env  # Editar con credenciales Supabase
npm run pm2:start
curl http://localhost:3001/health  # Verificar

sudo cp yourcvpassport-ssr-only.conf /etc/nginx/sites-available/yourcvpassport
sudo ln -s /etc/nginx/sites-available/yourcvpassport /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Verificacion:**
```bash
curl -I https://yourcvpassport.com/profiles/test     # -> 404
curl -I https://yourcvpassport.com/cv/no-existe      # -> 404
```

### Rutas Bloqueadas
- `/profiles/*`, `/perfiles/*` -> 404 (nunca implementadas)
- `/talent-search` -> 404 (solo via `/company/search` o `/admin/search`)

### Frontend (Desarrollo)
`ProfileViewPage.tsx` usa `react-helmet-async` con meta `noindex, nofollow` para perfiles no encontrados.

---

## Schema y Limites de Campos

Archivo: `schemas/profileSchemas.ts`

### Texto Corto (50-100 chars)
| Campo | Limite |
|-------|--------|
| full_name | 50 |
| experience.position | 100 |
| experience.company_name | 100 |
| education.institution_name | 100 |
| education.degree | 100 |
| education.field_of_study | 100 |
| education.grade | 50 |
| skill.name | 100 |
| skill.category | 50 |
| language.name | 50 |
| certification.issuer | 100 |
| project.category | 50 |
| collaboration.organization | 100 |
| collaboration.role | 100 |

### Texto Medio (150-200 chars)
| Campo | Limite |
|-------|--------|
| headline | 150 |
| portfolio.title | 150 |
| achievements (cada item) | 200 |

### Texto Largo (500-800 chars)
| Campo | Limite |
|-------|--------|
| summary | 800 |
| experience.description | 800 |
| education.description | 600 |
| portfolio.description | 500 |
| certification.description | 500 |

### Numericos
| Campo | Rango |
|-------|-------|
| years_of_experience | 0-50 |

---

## Migraciones de Supabase

### Idiomas (`20251127_add_language_fields.sql`)
Agrega `percentage` (INT) e `is_native` (BOOL) a tabla `languages`. Tambien agrega nivel 'Native' al check constraint.

### Display Settings (`20251219_update_display_settings.sql`)
- Elimina opcion QR Code del UI
- `show_connect_links` default `true` para todos los perfiles
- Links profesionales se muestran automaticamente cuando existen URLs

### Slug Restriction (`20251219_add_slug_change_tracking.sql`)
- Agrega `last_slug_changed_at` a profiles
- Restriccion: solo se puede cambiar slug cada **90 dias**
- Validacion en UI y backend (`utils/slugValidation.ts`)

### Stamp Rate Limit (`20251222_add_stamp_rate_limit.sql`)
- **Todos los tipos**: 1 solicitud cada 3 dias por tipo
- **EMAIL/PHONE**: maximo 4 intentos totales (permanente)
- Implementado via trigger `enforce_stamp_rate_limit`
- Vista `stamp_request_availability` para consultar disponibilidad

### Blog Lang (`20260224_add_lang_to_blog_posts.sql`)
Agrega columna `lang` (VARCHAR 2, default 'es') a `blog_posts`.

---

## Sistema de Emails

**Stack:** Supabase Edge Functions + Resend API

### Config
1. Obtener API Key en [resend.com](https://resend.com)
2. En Supabase: Settings > Edge Functions > agregar `RESEND_API_KEY`
3. Deploy: `supabase functions deploy send-email`

### Templates Disponibles

| Template | Trigger | Datos clave |
|----------|---------|-------------|
| `company-approved` | Empresa aprobada | companyName, dashboardUrl, welcomeCredits |
| `company-rejected` | Empresa rechazada | companyName, reason |
| `new-message` | Nuevo mensaje | senderName, messagePreview, conversationUrl |
| `welcome-team-member` | Agregado a equipo | userName, companyName, role, invitedBy |
| `low-credits` | Creditos < 10 | companyName, creditsRemaining, purchaseUrl |
| `credit-purchase` | Compra confirmada | credits, price, packageName, newBalance |

### Test
```typescript
await supabase.functions.invoke('send-email', {
  body: { to: 'test@test.com', template: 'company-approved', data: { companyName: 'Test', dashboardUrl: '/dashboard', welcomeCredits: 10 } }
});
```

---

## SEO y Blog

### Calendario de Publicacion (Mar-May 2026)

**30 articulos** (18 EN, 12 ES) organizados en bloques:
- A: Quick Wins (#1-4, EN, Mar)
- B: Pilares SEO (#5-10, EN+ES, Mar)
- C: Hiring (#11-15, EN, Abr)
- D: Credenciales (#16-19, EN+ES, Abr)
- E: Mercado hispano (#20-24, ES, May)
- F: Sectorial nicho (#25-28, ES, May)
- G: Comparativas (#29-30, EN, May)

### Deploy de Contenido (Orden)
1. Deploy codigo (`BlogPage.tsx` con filtro por lang)
2. SQL: `20260224_add_lang_to_blog_posts.sql`
3. SQL: `20260224_blog_posts_seed.sql` (30 articulos)
4. SQL: `20260225_fix_seed_realism.sql`
5. Google Search Console: subir `seo/disavow.txt`
6. Verificar en produccion (blog EN y ES por separado)

### Enlazado Interno
- Max 3 enlaces internos por articulo
- 6 topic clusters (ver `seo/internal-links-map.md` para detalle)
- Cross-links EN<->ES en articulos con version bilingue

### Backlinks (Partner Sites)
| Sitio | Articulo enlazado |
|-------|-------------------|
| ISEIE.com | #5 (Verified CV), #27 (Innovacion) |
| PsikoAprende.com | #25 (Psicologo) |
| ISEIH.com | #28 (Educadores) |

---

## Testing

### E2E con Playwright

```bash
npx playwright install chromium
npm test           # Todos los tests
npm run test:ui    # UI mode (recomendado)
npm run test:debug # Debug mode
```

**Estructura:** `tests/login.spec.ts` (auth flows)

**Env:** Crear `.env.test` con `TEST_USER_EMAIL` y `TEST_USER_PASSWORD`

### Edge Functions Tests

```bash
npm test tests/edge-functions/              # Todos
npm test tests/edge-functions/verification.spec.ts  # Especifico
```

**Test suites:**
- `verification.spec.ts` - Email/phone verification, rate limiting
- `authentication.spec.ts` - Login, magic link, password reset
- `export.spec.ts` - PDF/DOCX generation
- `public-profile.spec.ts` - Profile retrieval, directory
- `utilities.spec.ts` - Analytics, AI optimization, sitemap

**Requiere:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

---

## Scripts SQL

Carpeta: `scripts/sql/` (12 activos, 168 archivados)

### Scripts Principales

| Script | Uso |
|--------|-----|
| `check-tutors-missing-photos.sql` | Ver tutores sin foto |
| `validate-all-tutors-content-consistency.sql` | Validar calidad |
| `CREATE-michelle-chang-LIMPIO.sql` | Crear tutor Michelle Chang |
| `CREATE-nicole-taylor-LIMPIO.sql` | Crear tutor Nicole Taylor |
| `DELETE-michelle-chang-y-nicole-taylor.sql` | Limpiar ambos perfiles |
| `fix-headlines-cortos.sql` | Extender headlines cortos |
| `update-tutor-photo.sql` | Template para actualizar fotos |
| `delete-test-job-postings.sql` | Eliminar job postings de prueba |

### Buenas Practicas
1. Hacer backup antes de UPDATE/DELETE
2. Verificar UUIDs en `TUTORS-UUID-EMAIL-MAPPING.md`
3. Confirmar entorno (dev/staging/prod)
4. Ejecutar script de validacion despues

### UUIDs Criticos
| Nombre | Email | UUID |
|--------|-------|------|
| Michelle Chang | michelle.chang@iseih.edu | `7fe0c1a6-39ed-46ad-9388-116a3a0fb429` |
| Nicole Taylor | nicole.taylor@iseih.edu | `1b90b431-de09-4b75-af6a-c94975b68746` |
