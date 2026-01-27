# Guía: Inyectar Habilidades Traducibles y Verificar Sistema

## 🎯 Objetivo

1. Inyectar 21 habilidades de ejemplo traducibles al usuario actual
2. Verificar que TODAS las habilidades existentes se traduzcan automáticamente
3. Comprobar el estado de traducción de habilidades en el sistema

---

## 📝 PASO 1: Inyectar Habilidades de Ejemplo

### Opción A: Usuario Actual (Automático) ⭐ RECOMENDADO

Este script **no requiere cambiar ningún ID**, detecta automáticamente el usuario logueado.

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: **`scripts/sql/setup/inject-translatable-skills-CURRENT-USER.sql`**
3. Copia y pega TODO el contenido
4. Haz clic en **"Run"**

**Lo que hace**:
- Detecta automáticamente el usuario más reciente
- Inyecta 21 habilidades traducibles
- Categorías: Programming, Soft Skills, Design, Marketing, Data
- Muestra resumen de inyección

**Output esperado**:
```
========================================
📧 Usuario encontrado: tu_email@ejemplo.com
🆔 User ID: 550e8400-e29b-41d4-a716-446655440000
========================================
📊 Habilidades actuales: 5
💻 Inyectando habilidades de Programming & Tech...
🤝 Inyectando Soft Skills...
🎨 Inyectando habilidades de Design & Creative...
📈 Inyectando habilidades de Marketing & Sales...
📊 Inyectando habilidades de Data & Analytics...
⚙️ Inyectando habilidad personalizada...
========================================
✅ ¡Inyección completada!
📋 Total de habilidades: 26
🔄 Cambia el idioma en la app para ver las traducciones
========================================
```

### Opción B: Usuario Específico (Manual)

Si necesitas inyectar a un usuario específico:

1. Obtén el USER_ID:
```sql
SELECT id, email FROM profiles ORDER BY created_at DESC LIMIT 5;
```

2. Abre: **`scripts/sql/setup/inject-translatable-skills-demo.sql`**

3. Reemplaza:
```sql
v_user_id uuid := 'YOUR_USER_ID'; -- 👈 Pega el ID aquí
```

4. Ejecuta el script

---

## 🔍 PASO 2: Verificar Estado de Traducción de Habilidades Existentes

### Script de Verificación Completo

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre: **`scripts/sql/verification/verify-existing-skills-translation.sql`**
3. Ejecuta el script completo

### ¿Qué Muestra Este Script?

#### 1️⃣ **Lista de Habilidades Únicas y su Traducibilidad**
```
Habilidad Original    | Veces Usada | Usuarios | Estado de Traducción
----------------------|-------------|----------|---------------------
Leadership            | 15          | 10       | ✅ Traducible EN→ES
JavaScript            | 25          | 15       | 🌐 Universal
Liderazgo             | 8           | 5        | ✅ Traducible ES→EN
Mi Framework Custom   | 2           | 1        | ⚠️ Personalizada
```

#### 2️⃣ **Resumen por Categoría**
```
Categoría              | Cantidad | Porcentaje %
-----------------------|----------|-------------
Traducible EN→ES       | 45       | 55.56%
Universal              | 20       | 24.69%
Personalizada          | 12       | 14.81%
Traducible ES→EN       | 4        | 4.94%
```

#### 3️⃣ **Habilidades por Usuario**
```
Usuario            | Nombre      | Habilidad        | Nivel  | Estado
-------------------|-------------|------------------|--------|------------------------
user@example.com   | Juan Pérez  | Leadership       | EXPERT | ✅ Se traduce a español
user@example.com   | Juan Pérez  | JavaScript       | EXPERT | 🌐 Universal
user@example.com   | Juan Pérez  | Custom Skill     | INTER  | ⚠️ Sin traducción
```

#### 4️⃣ **Usuarios sin Habilidades Traducibles**
```
Usuario            | Nombre      | Total | Traducibles | Personalizadas | Estado
-------------------|-------------|-------|-------------|----------------|------------------
user@example.com   | Juan Pérez  | 10    | 8           | 2              | ✅ Mix de ambas
otro@example.com   | Ana García  | 5     | 5           | 0              | ✅ Todas traducibles
test@example.com   | Test User   | 3     | 0           | 3              | ⚠️ Solo personalizadas
```

#### 5️⃣ **Tabla de Traducciones de Ejemplo**
```
Original (EN)        | Traducción (ES)
---------------------|-------------------------
Leadership           | Liderazgo
Team Management      | Gestión de Equipos
Web Development      | Desarrollo Web
UI/UX Design         | Diseño UI/UX
Digital Marketing    | Marketing Digital
```

---

## 🧪 PASO 3: Probar en la Aplicación

### 3.1 Ver Habilidades Inyectadas

1. Recarga la aplicación (F5)
2. Ve a **Dashboard** → **Mi Perfil** → **Habilidades**
3. Deberías ver las 21 habilidades nuevas

### 3.2 Probar Traducción Automática

1. **Con el idioma en INGLÉS (EN)**:
   - Verás: "Leadership", "Team Management", "Web Development"

2. **Cambia a ESPAÑOL (ES)**:
   - Verás: "Liderazgo", "Gestión de Equipos", "Desarrollo Web"

3. **Cambia de nuevo a INGLÉS (EN)**:
   - Verás: "Leadership", "Team Management", "Web Development"

### 3.3 Probar Habilidades Universales

Estas NO cambian al cambiar idioma:
- JavaScript
- React
- Python
- SEO
- Custom Framework XYZ (personalizada)

---

## 📋 Habilidades Inyectadas por el Script

### Programming & Tech (5)
- JavaScript ← Universal
- React ← Universal
- Python ← Universal
- **Web Development** → **Desarrollo Web** ✅
- **Backend Development** → **Desarrollo Backend** ✅

### Soft Skills (5)
- **Leadership** → **Liderazgo** ✅
- **Team Management** → **Gestión de Equipos** ✅
- **Communication** → **Comunicación** ✅
- **Problem Solving** → **Resolución de Problemas** ✅
- **Critical Thinking** → **Pensamiento Crítico** ✅

### Design & Creative (3)
- **UI/UX Design** → **Diseño UI/UX** ✅
- **Graphic Design** → **Diseño Gráfico** ✅
- **Prototyping** → **Prototipado** ✅

### Marketing & Sales (4)
- **Digital Marketing** → **Marketing Digital** ✅
- SEO ← Universal
- **Content Strategy** → **Estrategia de Contenido** ✅
- **Social Media Marketing** → **Marketing en Redes Sociales** ✅

### Data & Analytics (3)
- **Data Analysis** → **Análisis de Datos** ✅
- **Machine Learning** → **Aprendizaje Automático** ✅
- **Data Visualization** → **Visualización de Datos** ✅

### Personalizada (1)
- Custom Framework XYZ ← Sin traducción (como debe ser)

---

## ✅ Verificación Final

### Checklist de Funcionalidad

- [ ] Script de inyección ejecutado sin errores
- [ ] 21 habilidades nuevas visibles en la app
- [ ] Al cambiar a español, habilidades traducibles cambian a español
- [ ] Al cambiar a inglés, habilidades traducibles cambian a inglés
- [ ] Habilidades universales (JS, React, Python) NO cambian
- [ ] Habilidades personalizadas NO cambian
- [ ] Script de verificación muestra estadísticas correctas
- [ ] NO aparece toast en wizard al añadir skill
- [ ] SÍ aparece toast en dashboard al añadir skill

---

## 🎓 Entender el Sistema

### ¿Cómo Funciona la Traducción?

1. **Guardado en BD**: Las habilidades se guardan con su nombre original
2. **Visualización**: El frontend traduce en tiempo real usando el hook `useTranslatedSkills`
3. **Diccionario**: 286+ habilidades en `utils/skillsTranslation.ts`
4. **Bidireccional**: EN ↔ ES automáticamente

### ¿Qué Habilidades se Traducen?

- ✅ **Traducibles**: Las 286+ del diccionario predefinido
- 🌐 **Universales**: JavaScript, React, Python, Git, SEO, etc.
- ⚠️ **Personalizadas**: Cualquier habilidad no en el diccionario

### ¿Se Modifica la Base de Datos?

**NO**. Las traducciones son solo de visualización:
- BD guarda: "Leadership"
- Usuario en ES ve: "Liderazgo"
- Usuario en EN ve: "Leadership"
- BD sigue teniendo: "Leadership"

---

## 📞 Troubleshooting

### "No se encontró ningún usuario"

**Solución**: Crea un usuario primero o usa la Opción B con USER_ID específico

### "Las habilidades no se traducen"

**Verifica**:
1. Que la habilidad esté en el diccionario: `utils/skillsTranslation.ts`
2. Que hayas recargado la app después de inyectar
3. Que estés cambiando el idioma correctamente (selector EN/ES)

### "Aparece toast en wizard"

**Verifica**:
1. Que el archivo `SkillsSection.tsx` tenga los cambios aplicados
2. Que la variable `isWizardMode` se esté calculando correctamente
3. Reinicia el servidor de desarrollo

---

## 📚 Archivos Relacionados

### Scripts SQL
- [`inject-translatable-skills-CURRENT-USER.sql`](../../scripts/sql/setup/inject-translatable-skills-CURRENT-USER.sql) - Inyección automática ⭐
- [`inject-translatable-skills-demo.sql`](../../scripts/sql/setup/inject-translatable-skills-demo.sql) - Inyección manual
- [`verify-existing-skills-translation.sql`](../../scripts/sql/verification/verify-existing-skills-translation.sql) - Verificación completa

### Código Fuente
- [`components/profile-editor/SkillsSection.tsx`](../../components/profile-editor/SkillsSection.tsx) - Componente principal
- [`utils/skillsTranslation.ts`](../../utils/skillsTranslation.ts) - Diccionario de traducciones
- [`hooks/useTranslatedSkills.ts`](../../hooks/useTranslatedSkills.ts) - Hook de traducción

### Documentación
- [`FIX_WIZARD_SKILLS_TOAST_AND_TRANSLATION.md`](../changelog/FIX_WIZARD_SKILLS_TOAST_AND_TRANSLATION.md) - Changelog técnico
- [`VERIFICAR_SKILLS_WIZARD_FIX.md`](./VERIFICAR_SKILLS_WIZARD_FIX.md) - Guía de verificación

---

**Última actualización**: 2026-01-26
**Estado**: ✅ Sistema completo y funcional
