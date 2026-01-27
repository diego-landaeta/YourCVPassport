# Análisis del Sistema de Empresas - YourCVPassport

> ⚠️ **ADVERTENCIA**: Este análisis identifica funcionalidades NO IMPLEMENTADAS. Muchas características descritas están pendientes de desarrollo.

## 📋 Estado Actual de Componentes

### ✅ Componentes Completados (15/15)
1. ✅ **CompanyRegistrationPage.tsx** (37KB) - Registro de empresas
2. ✅ **CompanyDashboardPage.tsx** (37KB) - Dashboard principal con métricas reales
3. ✅ **CompanyMessagesPage.tsx** (20KB) - Sistema de mensajería
4. ✅ **CreditsManagementPage.tsx** (20KB) - Gestión y compra de créditos
5. ✅ **CompanyTeamPage.tsx** (22KB) - Gestión de miembros del equipo
6. ✅ **CompanySettingsPage.tsx** (19KB) - Configuración de empresa
7. ✅ **CompanyAnalyticsPage.tsx** (19KB) - Analíticas y reportes
8. ✅ **TalentSearchPage.tsx** (38KB) - Búsqueda avanzada de talento
9. ✅ **CompanyProfileViewPage.tsx** (24KB) - Vista de perfil de talento
10. ✅ **CompanyTalentCategoriesPage.tsx** (16KB) - Categorías de talento
11. ✅ **CompanyTalentCategoryPage.tsx** (21KB) - Vista por categoría
12. ✅ **SavedSearchesPage.tsx** (19KB) - Búsquedas guardadas
13. ✅ **ExportsHistoryPage.tsx** (19KB) - Historial de exportaciones
14. ✅ **CompanyProtectedRoute.tsx** (11KB) - Rutas protegidas
15. ✅ **CategoryIcon.tsx** (3.9KB) - Iconos de categorías

---

## ❌ FUNCIONALIDADES FALTANTES CRÍTICAS

### 1. 🔴 **Integración de Pagos (CRÍTICO)**
**Estado:** ⚠️ Simulada - NO funcional en producción

**Problema:**
```typescript
// CreditsManagementPage.tsx - línea 122
// In a real app, this would integrate with Stripe, PayPal, etc.
// For now, we'll simulate a purchase
```

**Lo que falta:**
- [ ] Integración con Stripe o PayPal
- [ ] Webhooks para confirmar pagos
- [ ] Manejo de fallos de pago
- [ ] Reembolsos y cancelaciones
- [ ] Facturas y recibos automáticos
- [ ] Soporte para múltiples monedas
- [ ] Cumplimiento PCI-DSS

**Solución Recomendada:**
```typescript
// Implementar Stripe Checkout
import { loadStripe } from '@stripe/stripe-js';

const handlePurchase = async (pkg: CreditPackage) => {
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

  // Crear checkout session
  const { data } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      packageId: pkg.id,
      credits: pkg.credits,
      price: pkg.price
    }
  });

  // Redirigir a Stripe Checkout
  await stripe.redirectToCheckout({ sessionId: data.sessionId });
};
```

**Edge Function Necesaria:**
```typescript
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const { packageId, credits, price } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `${credits} Credits` },
        unit_amount: price * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${req.headers.get('origin')}/company/credits?success=true`,
    cancel_url: `${req.headers.get('origin')}/company/credits?canceled=true`,
  });

  return new Response(JSON.stringify({ sessionId: session.id }));
});
```

---

### 2. 🔴 **Sistema de Notificaciones por Email (CRÍTICO)**

**Estado:** ❌ NO implementado

**Lo que falta:**
- [ ] Email cuando empresa es aprobada/rechazada
- [ ] Email cuando llega nuevo mensaje
- [ ] Email cuando perfil visto contacta empresa
- [ ] Email de bienvenida a nuevo miembro de equipo
- [ ] Resumen semanal de actividad
- [ ] Alertas de créditos bajos
- [ ] Confirmación de compra de créditos

**Solución Recomendada:**
```sql
-- Crear tabla de templates de email
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb
);

-- Tabla de cola de emails
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Edge Function:**
```typescript
// supabase/functions/send-email/index.ts
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const { to, template, variables } = await req.json();

  const { data, error } = await resend.emails.send({
    from: 'YourCVPassport <noreply@yourcvpassport.com>',
    to: to,
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.html_body, variables),
  });

  return new Response(JSON.stringify({ success: !error, data }));
});
```

---

### 3. 🟡 **Consumo Automático de Créditos (IMPORTANTE)**

**Estado:** ⚠️ Parcialmente implementado

**Problema:**
- Función RPC `consume_company_credits` existe PERO no se llama automáticamente
- No hay triggers para consumir créditos cuando:
  - Se desbloquea un perfil completo
  - Se descarga un CV
  - Se contacta un candidato
  - Se exportan perfiles

**Lo que falta:**
```typescript
// En CompanyProfileViewPage.tsx
const handleUnlockProfile = async () => {
  // FALTA: Consumir créditos antes de desbloquear
  const { data, error } = await supabase.rpc('consume_company_credits', {
    p_company_id: company.id,
    p_user_id: companyUser.user_id,
    p_action_type: 'PROFILE_UNLOCK',
    p_profile_id: profileId,
  });

  if (error) {
    toast.error('Insufficient credits');
    return;
  }

  // Luego desbloquear perfil
  await supabase.from('company_profile_views').insert({...});
};
```

---

### 4. 🟡 **Sistema de Alertas de Búsquedas Guardadas (IMPORTANTE)**

**Estado:** ⚠️ UI existe pero lógica backend falta

**Lo que falta:**
- [ ] Cron job para ejecutar búsquedas guardadas
- [ ] Comparación con perfiles nuevos
- [ ] Envío de emails con resultados
- [ ] Tracking de alertas enviadas

**Solución Recomendada:**
```sql
-- Migration
CREATE TABLE search_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID REFERENCES company_saved_searches(id),
  profiles_found INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edge Function con Cron
-- supabase/functions/run-search-alerts/index.ts
Deno.cron('run-search-alerts', '0 9 * * *', async () => {
  // Ejecutar búsquedas guardadas con alertas activas
  // Encontrar nuevos perfiles desde última ejecución
  // Enviar email con resultados
});
```

---

### 5. 🟡 **Descarga/Exportación de CVs (IMPORTANTE)**

**Estado:** ⚠️ Parcialmente implementado

**Problema:**
- ExportsHistoryPage existe pero sin lógica de descarga real
- No hay generación de PDF/DOCX desde backend
- No hay control de créditos para descargas

**Lo que falta:**
```typescript
// Edge Function para generar PDF
// supabase/functions/export-cv/index.ts
import { PDFDocument } from 'pdf-lib';

Deno.serve(async (req) => {
  const { profileId, format } = await req.json();

  // Verificar créditos
  const { data: credits } = await supabase.rpc('consume_company_credits', {
    p_action_type: 'CV_DOWNLOAD',
    ...
  });

  // Generar PDF/DOCX
  const profile = await fetchProfile(profileId);
  const pdf = await generatePDF(profile, format);

  // Registrar exportación
  await supabase.from('company_exports').insert({...});

  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  });
});
```

---

### 6. 🟢 **Sistema de Permisos y Roles (MEJORABLE)**

**Estado:** ✅ Funcional pero puede mejorarse

**Mejoras Sugeridas:**
- [ ] Permisos granulares por funcionalidad
- [ ] Roles personalizados
- [ ] Audit log de cambios de permisos
- [ ] Límites por rol (ej: VIEWER no puede descargar CVs)

**Tabla Sugerida:**
```sql
CREATE TABLE company_permissions (
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO company_permissions VALUES
  ('OWNER', 'manage_team'),
  ('OWNER', 'manage_billing'),
  ('OWNER', 'view_analytics'),
  ('ADMIN', 'manage_team'),
  ('ADMIN', 'view_analytics'),
  ('MEMBER', 'search_talent'),
  ('MEMBER', 'contact_talent'),
  ('VIEWER', 'view_analytics');
```

---

## 🔧 OPTIMIZACIONES RECOMENDADAS

### 1. **Performance y Caching**

```typescript
// Implementar React Query para caching
import { useQuery } from '@tanstack/react-query';

const useDashboardStats = (companyId: string) => {
  return useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000,
  });
};
```

### 2. **Realtime Updates**

```typescript
// Supabase Realtime para mensajes
useEffect(() => {
  const channel = supabase
    .channel('company-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'company_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [conversationId]);
```

### 3. **Optimización de Queries**

```sql
-- Índices faltantes recomendados
CREATE INDEX idx_company_messages_conversation_sender
  ON company_messages(conversation_id, sender_type, is_read);

CREATE INDEX idx_company_credits_history_company_date
  ON company_credits_history(company_id, created_at DESC);

CREATE INDEX idx_company_profile_views_company_date
  ON company_profile_views(company_id, created_at DESC);
```

### 4. **Error Boundaries y Fallbacks**

```typescript
// Agregar ErrorBoundary a páginas críticas
<ErrorBoundary fallback={<ErrorFallback />}>
  <CompanyDashboardPage />
</ErrorBoundary>
```

---

## 📊 MÉTRICAS Y ANALYTICS FALTANTES

### 1. **Dashboard Analytics**
- [ ] Tasa de conversión (vistas → contactos)
- [ ] Tiempo promedio de respuesta
- [ ] Perfiles más vistos
- [ ] ROI por crédito gastado
- [ ] Tendencias de búsqueda

### 2. **Reports Automáticos**
- [ ] Reporte mensual de actividad
- [ ] Reporte de uso de créditos
- [ ] Top perfiles contactados
- [ ] Análisis de competidores

---

## 🔐 SEGURIDAD Y COMPLIANCE

### 1. **Faltantes de Seguridad**
- [ ] Rate limiting en APIs críticas
- [ ] Validación de entrada en todos los formularios
- [ ] Sanitización de contenido user-generated
- [ ] Logs de auditoría para acciones críticas
- [ ] 2FA para cuentas de empresa
- [ ] Encriptación de datos sensibles

### 2. **GDPR/Privacy**
- [ ] Consentimiento explícito para contactar talentos
- [ ] Exportación de datos de empresa
- [ ] Eliminación completa de cuenta
- [ ] Política de retención de datos
- [ ] Logs de acceso a datos personales

---

## 🚀 PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 CRÍTICO (Semana 1-2)
1. **Integración de Pagos Stripe** - Sin esto, no hay revenue
2. **Sistema de Emails** - Esencial para comunicación
3. **Consumo Automático de Créditos** - Core del modelo de negocio

### 🟡 IMPORTANTE (Semana 3-4)
4. **Descarga Real de CVs** - Feature principal
5. **Alertas de Búsquedas** - Valor agregado para empresas
6. **Rate Limiting y Seguridad** - Prevenir abuso

### 🟢 MEJORAS (Mes 2)
7. **Analytics Avanzadas** - Mejora retención
8. **Permisos Granulares** - Para empresas grandes
9. **Reports Automáticos** - Feature premium

---

## 📋 CHECKLIST DE PRODUCCIÓN

### Base de Datos
- [x] Migraciones aplicadas
- [x] RLS policies configuradas
- [x] Índices básicos creados
- [ ] Índices de performance agregados
- [ ] Backups automáticos configurados
- [ ] Monitoring de queries lentas

### Backend
- [x] Funciones RPC básicas
- [ ] Edge Functions para pagos
- [ ] Edge Functions para emails
- [ ] Edge Functions para PDFs
- [ ] Cron jobs para alertas
- [ ] Error tracking (Sentry)

### Frontend
- [x] Todas las páginas creadas
- [x] Routing configurado
- [x] Traducciones completas
- [ ] Error boundaries
- [ ] Loading states mejorados
- [ ] Optimistic updates
- [ ] Offline support

### Integrations
- [ ] Stripe/PayPal configurado
- [ ] Resend/SendGrid para emails
- [ ] Sentry para errors
- [ ] Posthog/Mixpanel para analytics
- [ ] Storage para documentos

### Testing
- [ ] Unit tests para funciones críticas
- [ ] Integration tests para flujos de pago
- [ ] E2E tests para user journeys
- [ ] Load testing para APIs
- [ ] Security audit

### Deployment
- [ ] Variables de entorno configuradas
- [ ] SSL/HTTPS habilitado
- [ ] CDN configurado
- [ ] Monitoring y alertas
- [ ] Rollback strategy
- [ ] Documentation actualizada

---

## 💰 ESTIMACIÓN DE ESFUERZO

| Tarea | Complejidad | Tiempo Estimado | Prioridad |
|-------|-------------|-----------------|-----------|
| Stripe Integration | Alta | 3-5 días | 🔴 Crítico |
| Email System | Media | 2-3 días | 🔴 Crítico |
| Auto Credit Consumption | Baja | 1 día | 🔴 Crítico |
| CV Export/Download | Alta | 3-4 días | 🟡 Importante |
| Search Alerts | Media | 2-3 días | 🟡 Importante |
| Security Hardening | Media | 2-3 días | 🟡 Importante |
| Advanced Analytics | Baja | 1-2 días | 🟢 Mejora |
| Testing Suite | Alta | 5-7 días | 🟢 Mejora |

**Total Estimado:** 3-4 semanas para tener sistema production-ready

---

## 📝 CONCLUSIÓN

El sistema de empresas tiene una **base sólida** con todos los componentes UI implementados y la arquitectura de base de datos bien diseñada. Sin embargo, para ser **production-ready** necesita:

1. **Integración de pagos real** (no simulada)
2. **Sistema de notificaciones por email**
3. **Consumo automático de créditos en acciones**
4. **Exportación funcional de CVs**
5. **Seguridad y rate limiting**

Una vez implementadas estas 5 funcionalidades críticas, el sistema estará listo para generar revenue y escalar.
