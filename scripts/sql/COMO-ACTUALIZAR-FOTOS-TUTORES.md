# 📸 Cómo Actualizar Fotos de Perfil - Tutores ISEIH

**Fecha**: 2026-02-12
**Propósito**: Guía paso a paso para subir y actualizar fotos de perfil de tutores

---

## 🔍 Paso 1: Identificar Tutores sin Foto

Ejecuta el script de verificación:

```bash
\i scripts/sql/check-tutors-missing-photos.sql
```

**Resultado esperado:**
```
========== RESUMEN FOTOS DE PERFIL ==========
 con_foto | sin_foto | total_tutores
----------+----------+---------------
       15 |       25 |            40

========== TUTORES SIN FOTO DE PERFIL ==========
      full_name       |           email           |     slug      | avatar_status
----------------------+---------------------------+---------------+---------------
 Amanda Rodriguez     | amanda.rodriguez@iseih... | amanda-rod... | ❌ NULL
 Angela Roberts       | angela.roberts@iseih...   | angela-rob... | ❌ NULL
 ...
```

---

## 📤 Paso 2: Subir Fotos a Supabase Storage

### Opción A: Desde la Interfaz Web de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** → **avatars** (o crea el bucket si no existe)
3. Clic en **Upload file**
4. Sube la foto con nombre: `slug-del-tutor.jpg` (ej: `michelle-chang.jpg`)
5. Copia la URL pública generada

### Opción B: Desde el Código (ejemplo TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadTutorPhoto(slug: string, file: File) {
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${slug}.jpg`, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${slug}.jpg`);

  return publicUrl;
}
```

---

## 🔄 Paso 3: Actualizar Base de Datos

### Actualizar UN tutor (por email)

```sql
UPDATE public.profiles
SET
    avatar_url = 'https://tuproyecto.supabase.co/storage/v1/object/public/avatars/michelle-chang.jpg',
    updated_at = NOW()
WHERE email = 'michelle.chang@iseih.edu'
  AND role = 'professional';

-- Verificar
SELECT full_name, email, avatar_url
FROM profiles
WHERE email = 'michelle.chang@iseih.edu';
```

### Actualizar UN tutor (por UUID)

```sql
UPDATE public.profiles
SET
    avatar_url = 'https://url-de-la-foto.jpg',
    updated_at = NOW()
WHERE id = '7fe0c1a6-39ed-46ad-9388-116a3a0fb429';
```

### Actualizar MÚLTIPLES tutores a la vez

```sql
UPDATE public.profiles
SET avatar_url =
    CASE email
        WHEN 'michelle.chang@iseih.edu' THEN 'https://url1.jpg'
        WHEN 'nicole.taylor@iseih.edu' THEN 'https://url2.jpg'
        WHEN 'amanda.rodriguez@iseih.edu' THEN 'https://url3.jpg'
    END,
    updated_at = NOW()
WHERE email IN (
    'michelle.chang@iseih.edu',
    'nicole.taylor@iseih.edu',
    'amanda.rodriguez@iseih.edu'
);
```

O usar el script template:

```bash
\i scripts/sql/update-tutor-photo.sql
```

---

## ✅ Paso 4: Verificar Actualización

Vuelve a ejecutar el script de verificación:

```bash
\i scripts/sql/check-tutors-missing-photos.sql
```

Verifica que el contador de `sin_foto` haya disminuido.

---

## 📋 Formato de URLs Recomendado

### Estructura de URL:
```
https://[proyecto].supabase.co/storage/v1/object/public/avatars/[slug].jpg
```

### Ejemplos:
```
michelle-chang.jpg  → https://tuproyecto.supabase.co/storage/v1/object/public/avatars/michelle-chang.jpg
nicole-taylor.jpg   → https://tuproyecto.supabase.co/storage/v1/object/public/avatars/nicole-taylor.jpg
```

---

## 🛠️ Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `check-tutors-missing-photos.sql` | Ver tutores sin foto | `\i scripts/sql/check-tutors-missing-photos.sql` |
| `update-tutor-photo.sql` | Template para actualizar fotos | Editar y ejecutar |

---

## ⚠️ Notas Importantes

1. **Formato de imagen**: Preferible JPG o PNG (optimizado para web)
2. **Tamaño recomendado**: 400x400px o 512x512px
3. **Peso máximo**: 500KB (comprimir si es necesario)
4. **Nombre de archivo**: Usar el mismo `slug` del perfil para consistencia
5. **Bucket público**: Asegúrate de que el bucket `avatars` sea público

---

## 🔗 Políticas de Supabase Storage (RLS)

Si el bucket no es público, agrega esta política:

```sql
-- Permitir lectura pública de avatars
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

---

**Última actualización**: 2026-02-12
**Ver también**: `TUTORS-UUID-EMAIL-MAPPING.md`
