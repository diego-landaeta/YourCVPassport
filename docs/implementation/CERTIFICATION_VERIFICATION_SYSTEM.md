# Sistema de Verificación de Certificaciones

## Resumen

Sistema completo para que las **certificaciones profesionales** puedan ser verificadas por administradores y mostrar un **badge de verificación** (stamp) en el CV público, similar a cómo funcionan la identidad, educación y experiencia laboral.

---

## Arquitectura del Sistema

### 1. **Tipos de Stamps Disponibles**

```sql
-- Tipos de verificación soportados:
'EMAIL'         - Verificación de email
'IDENTITY'      - Verificación de identidad
'EDUCATION'     - Verificación de educación
'EMPLOYMENT'    - Verificación de experiencia laboral
'LANGUAGE'      - Verificación de idiomas
'CERTIFICATION' - ✨ NUEVO: Verificación de certificaciones
```

### 2. **Estructura de Tablas**

#### **Tabla: `portfolio_items`**
Almacena proyectos, certificaciones y colaboraciones.

```sql
-- Campos comunes
id UUID
profile_id UUID
type TEXT -- 'PROJECT' | 'CERTIFICATION' | 'COLLABORATION'
title TEXT
description TEXT
image_url TEXT

-- Campos específicos de CERTIFICATION
issuer TEXT           -- Ej: "AWS", "Google", "Microsoft"
issue_date TEXT       -- Ej: "2024-01"
expiry_date TEXT      -- Ej: "2027-01" (nullable)
credential_id TEXT    -- Ej: "ABC-123-XYZ"
credential_url TEXT   -- URL para verificar externamente
verified BOOLEAN      -- Flag rápido (referencia a stamps table)
```

#### **Tabla: `stamps`**
Almacena las verificaciones realizadas por admins.

```sql
id BIGINT
profile_id UUID
type TEXT              -- 'CERTIFICATION' para certificados
status TEXT            -- 'PENDING' | 'VERIFIED' | 'FAILED'
entity_id TEXT         -- ✨ NUEVO: ID del portfolio_item
entity_type TEXT       -- ✨ NUEVO: 'CERTIFICATION'
evidence JSONB         -- Documentos subidos por el usuario
provider TEXT          -- Ej: "AWS Admin", "Manual Review"
verified_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Flujo de Verificación

### **Paso 1: Usuario Agrega Certificación**

1. Usuario va a **Mi Perfil → Portfolio → Certificaciones**
2. Hace clic en "Añadir Certificación"
3. Completa el formulario:
   ```
   ✓ Nombre: "AWS Solutions Architect Associate"
   ✓ Emisor: "Amazon Web Services"
   ✓ Fecha emisión: "2024-01"
   ✓ Fecha expiración: "2027-01" (opcional)
   ✓ ID Credencial: "ABC-123-XYZ"
   ✓ URL Credencial: "https://aws.amazon.com/verification/ABC123"
   ✓ Descripción: (opcional)
   ✓ Logo del certificado: (opcional)
   ```
4. Guarda → Certificación creada con `verified = FALSE`

### **Paso 2: Usuario Solicita Verificación**

El usuario puede solicitar que un admin verifique su certificación enviando evidencia:

```typescript
// Crear una solicitud de verificación
const { data, error } = await supabase
  .from('stamps')
  .insert({
    profile_id: userId,
    type: 'CERTIFICATION',
    entity_id: certificationId, // ID del portfolio_item
    entity_type: 'CERTIFICATION',
    status: 'PENDING',
    evidence: {
      certification_pdf: 'url_to_uploaded_pdf',
      credential_url: 'https://verify.example.com/ABC123',
      notes: 'Certification obtained in January 2024'
    }
  });
```

### **Paso 3: Admin Revisa y Verifica**

1. Admin va al **Panel de Administración → Gestión de Stamps**
2. Ve lista de certificaciones pendientes (`status = 'PENDING'`)
3. Revisa la evidencia:
   - PDF del certificado
   - URL de verificación externa
   - ID de credencial
4. Verifica externamente (visitando la URL del emisor)
5. Aprueba o rechaza:

```typescript
// Admin aprueba la certificación
const { error } = await supabase
  .from('stamps')
  .update({
    status: 'VERIFIED',
    verified_at: new Date().toISOString(),
    provider: 'Admin Manual Review'
  })
  .eq('id', stampId);

// Actualizar portfolio_item
await supabase
  .from('portfolio_items')
  .update({ verified: true })
  .eq('id', certificationId);
```

### **Paso 4: Badge Visible en CV**

Una vez verificada, la certificación muestra un **badge verde de verificación** ✓ en el CV público.

---

## Queries Útiles

### **Obtener Certificaciones de un Usuario**

```typescript
// Cargar certificaciones con su estado de verificación
const { data: certifications } = await supabase
  .from('portfolio_items')
  .select(`
    *,
    stamps:stamps!inner(
      id,
      status,
      verified_at,
      provider
    )
  `)
  .eq('profile_id', userId)
  .eq('type', 'CERTIFICATION');
```

### **Obtener Solo Certificaciones Verificadas**

```typescript
const { data: verifiedCerts } = await supabase
  .from('portfolio_items')
  .select('*')
  .eq('profile_id', userId)
  .eq('type', 'CERTIFICATION')
  .eq('verified', true);
```

### **Para el CV Público (con stamps)**

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    certifications:portfolio_items!inner(
      id,
      title,
      issuer,
      issue_date,
      expiry_date,
      credential_id,
      credential_url,
      description,
      image_url,
      verified
    )
  `)
  .eq('slug', userSlug)
  .eq('portfolio_items.type', 'CERTIFICATION')
  .single();
```

---

## Migraciones Necesarias

### 1. **Agregar tipo CERTIFICATION al enum**
```bash
supabase/migrations/20260122_add_certification_stamp_type.sql
```

### 2. **Actualizar tabla stamps**
```bash
supabase/migrations/20260122_enable_certification_verification.sql
```

### 3. **Actualizar tabla portfolio_items**
```bash
supabase/migrations/20260122_update_portfolio_items_for_certifications.sql
```

---

## Visualización en Templates

### **En el CV (PassportTemplate ejemplo)**

```tsx
// Filtrar certificaciones del portfolio
const certifications = portfolio?.filter(item => item.type === 'CERTIFICATION') || [];

// Renderizar sección
{certifications.length > 0 && (
  <section className="mb-8">
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
      🏆 Certificaciones Profesionales
    </h2>
    <div className="space-y-4">
      {certifications.map((cert) => (
        <div key={cert.id} className="border-l-4 border-cv-blue pl-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {cert.title}
                {/* ✅ Badge de verificación */}
                {cert.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Verificado
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                Emitido por: <span className="font-medium">{cert.issuer}</span>
              </p>
              <p className="text-xs text-gray-500">
                {cert.issue_date}
                {cert.expiry_date && ` - Expira: ${cert.expiry_date}`}
              </p>
              {cert.credential_id && (
                <p className="text-xs text-gray-500 mt-1">
                  ID: {cert.credential_id}
                </p>
              )}
            </div>
            {cert.image_url && (
              <img
                src={cert.image_url}
                alt={cert.title}
                className="w-16 h-16 object-contain ml-4"
              />
            )}
          </div>
          {cert.credential_url && (
            <a
              href={cert.credential_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cv-blue hover:underline mt-2 inline-block"
            >
              Ver credencial →
            </a>
          )}
          {cert.description && (
            <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
          )}
        </div>
      ))}
    </div>
  </section>
)}
```

---

## Permisos (RLS Policies)

### **Usuarios pueden:**
- ✅ Ver sus propias certificaciones
- ✅ Crear/editar/eliminar sus certificaciones
- ✅ Solicitar verificación (crear stamp PENDING)

### **Público puede:**
- ✅ Ver certificaciones verificadas en CVs públicos
- ✅ Ver stamps con status VERIFIED

### **Admins pueden:**
- ✅ Ver todas las certificaciones
- ✅ Ver todos los stamps (PENDING, VERIFIED, FAILED)
- ✅ Actualizar stamps (aprobar/rechazar)
- ✅ Actualizar campo `verified` en portfolio_items

---

## Índices para Performance

```sql
-- Buscar certificaciones de un usuario
CREATE INDEX idx_portfolio_items_type ON portfolio_items(type);
CREATE INDEX idx_portfolio_items_profile_type ON portfolio_items(profile_id, type);

-- Buscar stamps de certificaciones
CREATE INDEX idx_stamps_entity ON stamps(entity_id, entity_type) WHERE entity_type = 'CERTIFICATION';
CREATE INDEX idx_stamps_type_status ON stamps(type, status) WHERE type = 'CERTIFICATION';
CREATE INDEX idx_stamps_profile_type ON stamps(profile_id, type);
```

---

## Próximos Pasos

### ✅ Completado:
1. Schemas de certificaciones
2. Migraciones de BD
3. Formulario de creación/edición
4. Sistema de tabs en Portfolio

### 🔄 Pendiente:
1. **Panel de Admin**: Interfaz para revisar y verificar certificaciones
2. **Templates**: Actualizar PassportTemplate, ModernTemplate, etc.
3. **Solicitud de Verificación**: UI para que usuarios soliciten verificación
4. **Notificaciones**: Avisar al usuario cuando su certificación sea verificada
5. **Exportación ATS**: Incluir certificaciones verificadas en PDFs

---

**Implementado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-22
**Estado:** 🟡 Sistema base completado - Falta UI de admin y templates
