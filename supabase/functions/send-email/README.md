# Sistema de Emails - YourCVPassport

## 🚀 Configuración

### 1. Obtener API Key de Resend

1. Ir a [resend.com](https://resend.com)
2. Crear cuenta / Iniciar sesión
3. Ir a "API Keys"
4. Crear nueva API Key
5. Copiar la key

### 2. Configurar Variables de Entorno

En Supabase Dashboard:
1. Ir a **Settings** → **Edge Functions**
2. Agregar variables de entorno:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Configurar App Settings (Para URLs en emails)

Ejecutar en Supabase SQL Editor:

```sql
-- Para desarrollo
ALTER DATABASE postgres SET app.settings.app_url = 'http://localhost:3000';
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';

-- Para producción
ALTER DATABASE postgres SET app.settings.app_url = 'https://yourcvpassport.com';
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

### 4. Desplegar Edge Function

```bash
# Desde la raíz del proyecto
supabase functions deploy send-email

# Verificar que se desplegó correctamente
supabase functions list
```

### 5. Verificar Dominio en Resend

1. Ir a Resend Dashboard → **Domains**
2. Agregar dominio: `yourcvpassport.com`
3. Agregar registros DNS:
   - TXT record para verificación
   - MX records
   - DKIM records
4. Esperar verificación (puede tomar hasta 48 horas)

**Mientras tanto**, puedes usar emails con dominio `@resend.dev`:
```typescript
from: 'YourCVPassport <onboarding@resend.dev>'
```

## 📧 Templates Disponibles

### 1. `company-approved`
Enviado cuando una empresa es aprobada por admin.

**Datos requeridos:**
```typescript
{
  companyName: string;
  dashboardUrl: string;
  welcomeCredits: number;
  adminNotes?: string;
}
```

### 2. `company-rejected`
Enviado cuando una empresa es rechazada.

**Datos requeridos:**
```typescript
{
  companyName: string;
  reason: string;
}
```

### 3. `new-message`
Enviado cuando llega un nuevo mensaje.

**Datos requeridos:**
```typescript
{
  senderName: string;
  messagePreview: string;
  sentAt: string;
  conversationUrl: string;
  unsubscribeUrl: string;
}
```

### 4. `welcome-team-member`
Enviado cuando un usuario es agregado a un equipo.

**Datos requeridos:**
```typescript
{
  userName: string;
  companyName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string;
  dashboardUrl: string;
}
```

### 5. `low-credits`
Enviado cuando los créditos bajan de 10.

**Datos requeridos:**
```typescript
{
  companyName: string;
  creditsRemaining: number;
  purchaseUrl: string;
}
```

### 6. `credit-purchase`
Confirmación de compra de créditos.

**Datos requeridos:**
```typescript
{
  companyName: string;
  credits: number;
  price: number;
  packageName: string;
  newBalance: number;
  purchaseDate: string;
  transactionId: string;
  dashboardUrl: string;
}
```

## 🧪 Testing

### Test desde SQL Editor:

```sql
-- Test email de bienvenida
SELECT send_email_notification(
  'tu-email@test.com',
  'company-approved',
  jsonb_build_object(
    'companyName', 'Test Company',
    'dashboardUrl', 'http://localhost:3000/company/dashboard',
    'welcomeCredits', 10
  )
);
```

### Test desde TypeScript:

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'tu-email@test.com',
    template: 'company-approved',
    data: {
      companyName: 'Test Company',
      dashboardUrl: 'http://localhost:3000/company/dashboard',
      welcomeCredits: 10
    }
  }
});

console.log(data, error);
```

## 📊 Monitoreo

### Ver logs de Edge Function:

```bash
supabase functions logs send-email --project-ref your-project-ref
```

### En Supabase Dashboard:
1. **Edge Functions** → **send-email** → **Logs**

## ⚡ Triggers Automáticos Configurados

✅ **Company Approved** - Envía email + 10 créditos de bienvenida
✅ **Company Rejected** - Envía email con razón
✅ **New Message** - Notifica a destinatario
✅ **Team Member Added** - Email de bienvenida al equipo
✅ **Low Credits** (< 10) - Alerta para recargar
✅ **Credit Purchase** - Confirmación de compra

## 🔧 Troubleshooting

### Email no se envía

1. **Verificar API Key**:
```bash
# En Edge Function logs
supabase functions logs send-email
# Buscar errores de autenticación
```

2. **Verificar dominio**:
   - Dominio debe estar verificado en Resend
   - O usar `onboarding@resend.dev` para testing

3. **Verificar triggers**:
```sql
-- Ver todos los triggers activos
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%';

-- Deshabilitar trigger si necesario
ALTER TABLE companies DISABLE TRIGGER trigger_company_approved;

-- Rehabilitar
ALTER TABLE companies ENABLE TRIGGER trigger_company_approved;
```

### Rate Limits de Resend

**Free Tier:**
- 100 emails/día
- 3,000 emails/mes

**Paid Plans:**
- Growth: 50,000 emails/mes desde $20/mes
- Business: 100,000 emails/mes desde $80/mes

## 🎨 Personalización de Templates

Los templates están en `index.ts`. Para agregar uno nuevo:

1. Agregar tipo en `EmailRequest`:
```typescript
type: 'company-approved' | 'new-template'
```

2. Agregar template en objeto `templates`:
```typescript
'new-template': {
  subject: (data) => `Subject here`,
  html: (data) => `HTML here`
}
```

3. Crear trigger si es automático, o llamar manualmente

## 📚 Recursos

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email Best Practices](https://resend.com/docs/dashboard/emails/best-practices)
