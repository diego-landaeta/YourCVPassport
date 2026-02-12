# ⚠️ IMPORTANTE: USAR PASSPORTTEMPLATE

## Cambio de Template

**TODOS los tutores ISEIH deben usar `PassportTemplate` en lugar de `ModernProfessional`.**

---

## 📝 OPCIÓN 1: Ejecutar cambio de template ANTES de crear perfiles

Si **NO has ejecutado** los 9 scripts todavía:

### Edita cada script y cambia esta línea:

**ANTES:**
```sql
template = 'ModernProfessional',
```

**DESPUÉS:**
```sql
template = 'PassportTemplate',
```

**Archivos a editar:**
1. create-karen-white.sql (línea ~28)
2. create-paul-henderson.sql (línea ~28)
3. create-jessica-porter.sql (línea ~28)
4. create-alex-martinez.sql (línea ~28)
5. create-diana-russell.sql (línea ~28)
6. create-michelle-chang.sql (línea ~28)
7. create-robert-kim.sql (línea ~28)
8. create-catherine-adams.sql (línea ~28)
9. create-mark-davidson.sql (línea ~28)

---

## 🔧 OPCIÓN 2: Cambiar template DESPUÉS de crear perfiles

Si **YA ejecutaste** los 9 scripts:

### Ejecuta este script para cambiar todos a PassportTemplate:

**Archivo:** [cambiar-todos-a-passport-template.sql](cambiar-todos-a-passport-template.sql)

```sql
UPDATE public.profiles
SET template = 'PassportTemplate', updated_at = NOW()
WHERE email LIKE '%@iseih.edu';
```

---

## ✅ Verificación

Ejecuta esto para confirmar que todos usan PassportTemplate:

```sql
SELECT full_name, template
FROM public.profiles
WHERE email LIKE '%@iseih.edu'
ORDER BY full_name;
```

**Esperado:** Todos deben mostrar `template = 'PassportTemplate'`

---

## 📸 Perfiles sin Foto

Para ver qué perfiles necesitan foto de perfil, ejecuta:

**Archivo:** [perfiles-sin-foto.sql](perfiles-sin-foto.sql)

Esto mostrará todos los perfiles profesionales que **NO tienen** `avatar_url`, excluyendo los 12 que ya tienen foto.

---

**Template correcto:** `PassportTemplate` (mismo que usa Janet Lee)
