# 🔧 Configuración del Sistema de Mensajería en Supabase

## 📋 Problema Identificado

Los errores en la consola indican que falta la vista `conversation_summaries` en tu base de datos de Supabase. Esta vista es necesaria para que el sistema de mensajería funcione correctamente.

```
Error loading leads:
{code: "PGRST200", details: "Searched for a foreign key rela
tionship between 'Leads' and 'messages' in the schema cache"}
```

## ✅ Solución: Ejecutar Script SQL

### Opción 1: Usar el Editor SQL de Supabase (Recomendado)

1. **Accede a tu proyecto de Supabase:**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto "YourCVPassport"

2. **Abre el Editor SQL:**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New Query"

3. **Copia y pega el contenido completo** del archivo:
   ```
   supabase/migrations/002_fix_leads_and_messaging.sql
   ```

   ⚠️ **IMPORTANTE:** Usa el archivo `002_fix_leads_and_messaging.sql` en lugar del `001_`. Este script corregido:
   - Detecta automáticamente la estructura de tu tabla `leads`
   - Añade la columna `recipient_id` si no existe
   - Maneja errores gracefully
   - Proporciona mensajes de verificación

4. **Ejecuta el script:**
   - Haz clic en "Run" (o presiona Ctrl+Enter)
   - Verifica que veas mensajes como "✅ SUCCESS: All tables and views created successfully!"

5. **Verifica la instalación:**
   Ejecuta esta query para confirmar que todo se creó:
   ```sql
   -- Verificar que la vista existe
   SELECT table_name FROM information_schema.views
   WHERE table_schema = 'public'
   AND table_name = 'conversation_summaries';

   -- Verificar que la tabla existe
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'messages';
   ```

### Opción 2: Usar Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

```bash
# Navega a tu proyecto
cd c:\Users\molin\Downloads\yourcvpassport

# Aplica las migraciones
supabase db push

# O ejecuta directamente el archivo
supabase db execute -f supabase/migrations/001_create_messaging_tables.sql
```

## 📊 ¿Qué hace este script?

El script SQL crea las siguientes estructuras:

### 1. **Tabla `messages`**
Almacena todos los mensajes de las conversaciones:
- `id`: Identificador único del mensaje
- `lead_id`: Referencia al lead/conversación
- `sender_id`: Usuario que envió el mensaje
- `content`: Contenido del mensaje
- `is_read`: Marca si el mensaje fue leído
- `created_at`: Fecha de creación

### 2. **Vista `conversation_summaries`**
Genera un resumen de conversaciones con:
- Último mensaje de cada conversación
- Contador de mensajes no leídos
- Contador total de mensajes
- Información del remitente y destinatario

### 3. **Políticas RLS (Row Level Security)**
Asegura que los usuarios solo vean sus propios mensajes:
- Los usuarios solo pueden ver mensajes de conversaciones en las que participan
- Los usuarios solo pueden enviar mensajes como ellos mismos
- Los mensajes están protegidos contra acceso no autorizado

### 4. **Realtime Subscriptions**
Habilita actualizaciones en tiempo real para nuevos mensajes

## 🔍 Verificación Post-Instalación

Después de ejecutar el script, verifica que funciona:

### 1. Revisa las tablas en Supabase:
- Ve a "Table Editor" en Supabase
- Deberías ver la tabla `messages`

### 2. Revisa las vistas:
```sql
SELECT * FROM conversation_summaries LIMIT 5;
```

### 3. Prueba en tu aplicación:
```bash
# Inicia tu app en modo desarrollo
npm run dev

# Accede al dashboard y verifica que los mensajes cargan
```

## 🐛 Resolución de Problemas

### Error: "column l.recipient_id does not exist"
**Causa:** La tabla `leads` no tiene la columna `recipient_id`.

**Solución:** El script `002_fix_leads_and_messaging.sql` ya maneja este problema automáticamente. Si aún tienes el error, ejecuta manualmente:

```sql
-- Verificar estructura de la tabla leads
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND table_schema = 'public';

-- Si no existe recipient_id, agregarla
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);

-- Si tienes profile_id en lugar de recipient_id, renombrarla
-- ALTER TABLE public.leads RENAME COLUMN profile_id TO recipient_id;
```

### Error: "relation 'leads' does not exist"
**Causa:** La tabla `leads` no existe en tu base de datos.

**Solución:** Primero necesitas crear la tabla `leads`:

```sql
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_company TEXT,
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    lead_type TEXT NOT NULL CHECK (lead_type IN ('JOB_OFFER', 'COLLABORATION', 'INQUIRY')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    company_name TEXT,
    position_offered TEXT,
    salary_range TEXT,
    location TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'ARCHIVED')),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_recipient_id ON public.leads(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_sender_id ON public.leads(sender_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads they're involved in"
ON public.leads FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can create leads"
ON public.leads FOR INSERT
WITH CHECK (sender_id = auth.uid());
```

### Error: "permission denied for schema public"
**Causa:** El usuario no tiene permisos suficientes.

**Solución:** Ejecuta como administrador o contacta al administrador del proyecto Supabase.

### Error: "could not find a relationship between 'Leads' and 'messages'"
**Causa:** La vista `conversation_summaries` no se creó correctamente.

**Solución:**
1. Elimina la vista si existe: `DROP VIEW IF EXISTS conversation_summaries;`
2. Vuelve a ejecutar el script completo

## 📝 Datos de Prueba (Opcional)

Para probar el sistema de mensajería, puedes insertar datos de prueba:

```sql
-- Insertar un lead de ejemplo (reemplaza los UUIDs con usuarios reales)
INSERT INTO public.leads (sender_id, sender_name, sender_email, recipient_id, lead_type, subject, message)
VALUES (
    'uuid-del-usuario-remitente',
    'Juan Pérez',
    'juan@empresa.com',
    'uuid-del-usuario-destinatario',
    'JOB_OFFER',
    'Oferta de trabajo - Senior Developer',
    '¡Hola! Estamos interesados en tu perfil para una posición de Senior Developer en nuestra empresa.'
);

-- Insertar mensajes de prueba
INSERT INTO public.messages (lead_id, sender_id, sender_name, content)
VALUES (
    'uuid-del-lead-creado-arriba',
    'uuid-del-usuario',
    'Nombre del Usuario',
    'Gracias por tu interés. Me gustaría saber más detalles sobre la posición.'
);
```

## 🚀 Próximos Pasos

Una vez configurada la base de datos:

1. **Reinicia tu aplicación:**
   ```bash
   npm run dev
   ```

2. **Verifica en la consola del navegador:**
   - No deberían aparecer errores de "table not found"
   - Deberías ver logs como: "✅ Conversations loaded: X"

3. **Prueba el sistema:**
   - Crea un nuevo lead desde tu aplicación
   - Envía un mensaje
   - Verifica que aparezca en tiempo real

## 📞 Soporte

Si sigues teniendo problemas:

1. Verifica que tu conexión a Supabase sea correcta en `supabase/client.ts`
2. Revisa que las credenciales (URL y ANON_KEY) sean válidas
3. Asegúrate de que Realtime esté habilitado en tu proyecto de Supabase
4. Revisa los logs de Supabase en el dashboard

---

**Última actualización:** 2025-11-21
**Versión:** 1.0
