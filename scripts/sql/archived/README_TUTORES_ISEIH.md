# 📚 DOCUMENTACIÓN: CREAR TUTORES ISEIH

Esta carpeta contiene todos los scripts y documentación necesaria para crear perfiles de tutores ISEIH en YourCVPassport.

---

## 📖 GUÍAS Y DOCUMENTACIÓN

### 🔵 [GUIA_CREAR_TUTORES_ISEIH.md](GUIA_CREAR_TUTORES_ISEIH.md)
**LA GUÍA MAESTRA - LEE ESTO PRIMERO**

Contiene:
- ⚠️ Campos CRÍTICOS que hacen que un perfil aparezca en /companies/search
- 📋 Schema completo de todas las tablas (profiles, experiences, skills, portfolio_items)
- 🎯 Valores válidos de constraints (plan, employment_type, level, etc.)
- 📝 Proceso paso a paso detallado
- ⚠️ Errores comunes y soluciones
- 📊 Estándares de calidad de contenido
- 🔧 Scripts de utilidad
- ✅ Checklist final

**👉 Empieza leyendo este archivo antes de crear cualquier tutor.**

---

## 🔧 TEMPLATES Y SCRIPTS

### 🟢 [TEMPLATE_CREAR_TUTOR.sql](TEMPLATE_CREAR_TUTOR.sql)
**TEMPLATE SQL COMPLETO**

Script listo para copiar y modificar. Incluye:
- DELETE de datos existentes
- UPDATE del perfil base con TODOS los campos críticos
- INSERT de 4 experiencias (template)
- INSERT de 15 skills (template)
- INSERT de 4 certificaciones (template)
- Query de verificación final
- Checklist post-ejecución

**Cómo usar:**
1. Copiar todo el contenido
2. Reemplazar todos los `[PLACEHOLDERS]` con valores reales
3. Ejecutar en Supabase SQL Editor
4. Verificar resultado

---

## 🔍 SCRIPTS DE VERIFICACIÓN

### 🟡 [verificar-usuario-existe.sql](verificar-usuario-existe.sql)
Verificar que un UUID existe en `auth.users` ANTES de crear el perfil.

**Cuándo usar:** Antes de ejecutar cualquier script de creación de tutor.

**Qué verifica:**
- ✅ Usuario existe en `auth.users`
- ✅ Perfil existe en `public.profiles`
- 📧 Email del usuario
- 📅 Fecha de creación

### 🟡 [check-rebecca-role.sql](check-rebecca-role.sql)
Verificar el estado de un perfil específico.

**Qué muestra:**
- role, wizard_completed, slug, template, profile_hidden
- Longitud de headline y summary

### 🟡 [check-profiles-schema.sql](check-profiles-schema.sql)
Ver el schema completo de la tabla `profiles`.

**Cuándo usar:** Si necesitas ver todos los campos disponibles y sus tipos.

---

## ✅ EJEMPLOS COMPLETADOS

### 🟢 [clean-and-create-rebecca.sql](clean-and-create-rebecca.sql)
**EJEMPLO REAL Y FUNCIONAL**

Script completo de Rebecca Anderson (primer tutor ISEIH creado exitosamente).

**Úsalo como referencia para:**
- Ver cómo se estructuran los datos reales
- Copiar el formato de achievements arrays
- Ver ejemplos de headlines y summaries de calidad
- Entender el casting correcto de tipos (`::date`, `::uuid`)

---

## 🛠️ SCRIPTS DE CORRECCIÓN

### 🔴 [fix-wizard-slug-template.sql](fix-wizard-slug-template.sql)
**FIX CRÍTICO:** Añadir los campos que hacen aparecer un perfil en /companies/search.

**Cuándo usar:** Si creaste un perfil pero NO aparece en la página.

**Qué hace:**
- Pone `wizard_completed = true`
- Añade `slug`
- Añade `template`

### 🔴 [update-rebecca-role-only.sql](update-rebecca-role-only.sql)
Actualizar solo el campo `role`.

### 🔴 [hide-carlos-saiz-only.sql](hide-carlos-saiz-only.sql)
Ocultar un perfil sin eliminarlo (ejemplo: Carlos Saiz).

---

## 📋 WORKFLOW RECOMENDADO

### Para crear un NUEVO tutor:

```bash
1. 📖 Leer: GUIA_CREAR_TUTORES_ISEIH.md
2. 🔍 Ejecutar: verificar-usuario-existe.sql (con el UUID del usuario)
3. 📝 Copiar: TEMPLATE_CREAR_TUTOR.sql
4. ✏️  Rellenar todos los [PLACEHOLDERS] con datos reales
5. ▶️  Ejecutar el script en Supabase SQL Editor
6. ✅ Verificar que la query final retorna datos completos
7. 🌐 Refrescar https://yourcvpassport.com/companies/search con Ctrl+F5
8. 👁️  Confirmar que el perfil aparece en la lista
```

### Si un perfil NO aparece:

```bash
1. 🔍 Ejecutar: check-rebecca-role.sql (cambiar UUID)
2. ❓ Verificar: ¿wizard_completed = true? ¿slug existe? ¿template existe?
3. 🔧 Ejecutar: fix-wizard-slug-template.sql (si faltan campos)
4. 🌐 Refrescar página con Ctrl+F5
```

---

## 🎯 TUTORES ISEIH - ESTADO

### ✅ COMPLETADOS - SCRIPTS LISTOS
1. **Dr. Rebecca Anderson** (Naturopathy)
   - UUID: `54701b32-af6e-4923-846d-8a04fad249a8`
   - Script: [clean-and-create-rebecca.sql](clean-and-create-rebecca.sql)
   - Estado: ✅ Visible en /companies/search

2. **Karen White** (Holistic Nutrition)
   - UUID: `0bfd1ef4-c6b0-451c-8637-77b534e6e9a1`
   - Script: [create-karen-white.sql](create-karen-white.sql)
   - Estado: 📝 Script listo para ejecutar

3. **Paul Henderson** (Herbal Medicine)
   - UUID: `36c177f5-19f4-47c7-85c7-05507347e702`
   - Script: [create-paul-henderson.sql](create-paul-henderson.sql)
   - Estado: 📝 Script listo para ejecutar

4. **Jessica Porter** (Biofeedback)
   - UUID: `55333d11-13c8-43b8-942b-cb1e75d0b812`
   - Script: [create-jessica-porter.sql](create-jessica-porter.sql)
   - Estado: 📝 Script listo para ejecutar

5. **Alex Martinez** (AI in Health)
   - UUID: `099840cc-a99c-480d-8fd9-fba5ecd5a4a6`
   - Script: [create-alex-martinez.sql](create-alex-martinez.sql)
   - Estado: 📝 Script listo para ejecutar

6. **Diana Russell** (Massage Therapy)
   - UUID: `636e9e4d-4873-4114-8949-376a8d0f24bc`
   - Script: [create-diana-russell.sql](create-diana-russell.sql)
   - Estado: 📝 Script listo para ejecutar

7. **Michelle Chang** (Reiki)
   - UUID: `f30db5f9-0807-4d48-aa76-de4b6d7278da`
   - Script: [create-michelle-chang.sql](create-michelle-chang.sql)
   - Estado: 📝 Script listo para ejecutar

8. **Robert Kim** (Acupressure)
   - UUID: `9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da`
   - Script: [create-robert-kim.sql](create-robert-kim.sql)
   - Estado: 📝 Script listo para ejecutar

9. **Catherine Adams** (Couples Therapy)
   - UUID: `ce98b4d3-9e58-4f38-98be-8e4fd94d6b15`
   - Script: [create-catherine-adams.sql](create-catherine-adams.sql)
   - Estado: 📝 Script listo para ejecutar

10. **Mark Davidson** (Nonviolent Communication)
    - UUID: `707aa7e3-b891-485c-b4e6-618625713565`
    - Script: [create-mark-davidson.sql](create-mark-davidson.sql)
    - Estado: 📝 Script listo para ejecutar

**📖 GUÍA DE EJECUCIÓN:** Ver [README_EJECUTAR_9_TUTORES.md](README_EJECUTAR_9_TUTORES.md)

---

## 🚨 PROBLEMAS COMUNES

### "Profile doesn't appear in /companies/search"
**Causa:** Faltan campos críticos.
**Fix:** [fix-wizard-slug-template.sql](fix-wizard-slug-template.sql)

### "Column 'title' does not exist"
**Causa:** Usar `title` en lugar de `position` en experiences.
**Fix:** Cambiar a `position` en el script.

### "Invalid input syntax for type date"
**Causa:** Falta `::date` casting.
**Fix:** Usar `'2020-01-01'::date` en lugar de `'2020-01-01'`.

### "Violates foreign key constraint 'profiles_id_fkey'"
**Causa:** UUID no existe en `auth.users`.
**Fix:** Ejecutar [verificar-usuario-existe.sql](verificar-usuario-existe.sql) primero.

---

## 📞 AYUDA RÁPIDA

| Necesito... | Usar... |
|------------|---------|
| Entender cómo funciona todo | [GUIA_CREAR_TUTORES_ISEIH.md](GUIA_CREAR_TUTORES_ISEIH.md) |
| Crear un nuevo tutor | [TEMPLATE_CREAR_TUTOR.sql](TEMPLATE_CREAR_TUTOR.sql) |
| Ver un ejemplo real | [clean-and-create-rebecca.sql](clean-and-create-rebecca.sql) |
| Verificar si UUID existe | [verificar-usuario-existe.sql](verificar-usuario-existe.sql) |
| Perfil no aparece | [fix-wizard-slug-template.sql](fix-wizard-slug-template.sql) |
| Ver schema de tabla | [check-profiles-schema.sql](check-profiles-schema.sql) |

---

## 🎓 CONVENCIONES

### Naming de archivos de tutores:
```
clean-and-create-[nombre-apellido].sql
```

Ejemplos:
- `clean-and-create-rebecca-anderson.sql`
- `clean-and-create-karen-white.sql`
- `clean-and-create-paul-henderson.sql`

### Slugs de perfiles:
```
[nombre-apellido-en-minusculas]
```

Ejemplos:
- `rebecca-anderson`
- `karen-white`
- `paul-henderson`

### Templates recomendados:
- `'ModernProfessional'` ✅ Para tutores ISEIH
- `'ClassicTemplate'` ⚪ Alternativa clásica
- `'ElegantMinimalTemplate'` ⚪ Alternativa elegante

---

**📅 Última actualización:** 2026-02-12
**👤 Autor:** Claude Code Assistant
**📧 Soporte:** Ver [GUIA_CREAR_TUTORES_ISEIH.md](GUIA_CREAR_TUTORES_ISEIH.md)
