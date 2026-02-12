# 📋 Scripts de Verificación de Calidad de Contenido

Scripts SQL para verificar y validar la calidad del contenido de perfiles profesionales en YourCVPassport, especialmente enfocados en revisión de traducciones ES-EN.

---

## 📁 Archivos Disponibles

### 1. `verify-profile-content-quality.sql`
**Propósito:** Script completo con 12 secciones de análisis exhaustivo de perfiles.

**Secciones incluidas:**
1. Información básica de perfil
2. Experiencias profesionales
3. Educación
4. Habilidades (skills)
5. Idiomas
6. Certificaciones y portfolio
7. Stamps (verificaciones)
8. Resumen de completitud de perfiles
9. Análisis de calidad de contenido
10. Detección de problemas de contenido
11. Contenido para revisión de traducción
12. Verificación de achievements específicos

**Cuándo usar:** Para análisis completo y exhaustivo de todos los aspectos de los perfiles.

---

### 2. `content-quality-report.sql`
**Propósito:** Reporte enfocado y legible para revisión manual de contenido.

**Secciones incluidas:**
1. Perfil completo por usuario (individual)
2. Reporte general de todos los perfiles
3. Listado rápido de calidad por perfil
4. Revisión de summaries (traducción)
5. Revisión de experiencias (descriptions)
6. Revisión de achievements
7. Revisión de educación (descriptions)
8. Revisión de certificaciones (descriptions)
9. Problemas potenciales de redacción
10. Estadísticas de contenido
11. Exportar todo el contenido de un perfil

**Cuándo usar:** Para revisión rápida y enfocada de calidad de redacción.

**⚠️ IMPORTANTE:** En las secciones 1 y 11, cambiar el email del usuario objetivo:
```sql
target_email TEXT := 'usuario@iseih.edu'; -- CAMBIAR AQUÍ
```

---

### 3. `export-for-translation-review.sql`
**Propósito:** Exportar contenido en formatos limpios para revisión de traducción.

**Opciones incluidas:**
1. Exportar todo el contenido textual por perfil
2. Formato CSV para exportar a Excel/Google Sheets
3. Reporte individual por perfil (formato Markdown)
4. Verificar problemas de redacción
5. Comparar longitudes de contenido

**Cuándo usar:** Para preparar contenido para revisión externa o traducción.

**⚠️ IMPORTANTE:** En la opción 3, cambiar el email del usuario objetivo:
```sql
target_email TEXT := 'usuario@iseih.edu'; -- CAMBIAR AQUÍ
```

---

## 🚀 Cómo Usar Estos Scripts

### Opción A: Supabase Dashboard (Recomendado)

1. Ir a tu proyecto de Supabase
2. Navegar a **SQL Editor**
3. Crear nueva query
4. Copiar y pegar el contenido del script deseado
5. Ejecutar con **Run** o **Ctrl+Enter**

### Opción B: psql (Terminal)

```bash
# Conectar a la base de datos
psql -h db.xxxxxxxxxxxx.supabase.co -U postgres -d postgres

# Ejecutar script
\i /ruta/completa/verify-profile-content-quality.sql
```

### Opción C: pgAdmin

1. Conectar a tu base de datos Supabase
2. Abrir **Query Tool**
3. Cargar archivo SQL o pegar contenido
4. Ejecutar query

---

## 📊 Interpretación de Resultados

### ✅ Indicadores de Buena Calidad

**Summary:**
- Longitud: 300-800 caracteres
- Contiene 3-5 oraciones bien estructuradas
- Describe enfoque, experiencia y filosofía

**Experiencias:**
- Mínimo 4 experiencias
- Descriptions: 200-600 caracteres
- Achievements: 5-8 por experiencia, 50-200 caracteres cada uno

**Educación:**
- Mínimo 3 educaciones (incluyendo certificaciones adicionales)
- Descriptions: 150-500 caracteres

**Skills:**
- Mínimo 12-16 skills
- Variedad de niveles (EXPERT, ADVANCED, INTERMEDIATE)
- Categorías relevantes

**Certificaciones:**
- Mínimo 4-6 certificaciones
- Descriptions: 100-400 caracteres
- Verified = true

### ⚠️ Señales de Advertencia

- Summary < 200 caracteres: Muy corto
- Summary > 1200 caracteres: Muy largo
- Experiencias < 3: Perfil incompleto
- Skills < 10: Insuficiente
- Certificaciones < 3: Poco profesional
- Descriptions con "TODO", "FIXME", "XXX": Contenido pendiente

---

## 🎯 Casos de Uso Específicos

### 1. Revisar Quality Score de Todos los Perfiles

```sql
-- Ejecutar Sección 3 de content-quality-report.sql
-- Muestra scoring rápido de todos los perfiles
```

**Interpretación del Score:**
- 0-30: Perfil muy incompleto ❌
- 31-60: Perfil básico ⚠️
- 61-90: Perfil bueno ✅
- 91+: Perfil excelente 🌟

---

### 2. Revisar Contenido para Traducción

```sql
-- Ejecutar Sección 4 de content-quality-report.sql
-- Muestra todos los summaries para revisión
```

**Qué revisar:**
- ✅ Gramática correcta en inglés
- ✅ Vocabulario profesional
- ✅ Sin errores de traducción literal
- ✅ Tono apropiado para CV profesional
- ✅ Sin repeticiones innecesarias

---

### 3. Exportar Perfil Completo para Revisión Manual

```sql
-- Ejecutar Sección 11 de content-quality-report.sql
-- Cambiar email a: 'usuario@iseih.edu'
-- Copia el resultado JSON para revisar en editor
```

---

### 4. Detectar Problemas Masivos

```sql
-- Ejecutar Sección 10 de verify-profile-content-quality.sql
-- Lista todos los problemas detectados por perfil
```

**Acción recomendada:** Priorizar perfiles con más de 5 problemas detectados.

---

### 5. Verificar Achievements Específicos

```sql
-- Ejecutar Sección 12 de verify-profile-content-quality.sql
-- Revisa que cada achievement sea específico y cuantificable
```

**Buenas prácticas para achievements:**
- ✅ Cuantificables: "Served 400+ clients across 5 years"
- ✅ Específicos: "Reduced anxiety symptoms by 40% on average"
- ✅ Activos: "Developed...", "Created...", "Facilitated..."
- ❌ Evitar: "Worked on...", "Helped with...", "Participated in..."

---

## 🔍 Checklist de Calidad de Contenido

### ✅ Perfil Básico
- [ ] Foto de perfil profesional
- [ ] Headline descriptivo (< 60 caracteres)
- [ ] Summary bien redactado (300-800 caracteres)
- [ ] Ubicación completa
- [ ] LinkedIn URL (si aplica)

### ✅ Experiencias
- [ ] Mínimo 4 experiencias
- [ ] Descriptions claras y profesionales
- [ ] 5-8 achievements por experiencia
- [ ] Achievements cuantificables y específicos
- [ ] Fechas completas (start_date, end_date)

### ✅ Educación
- [ ] Mínimo 2-3 educaciones
- [ ] Descriptions detalladas
- [ ] Grades/honores incluidos
- [ ] Fechas completas

### ✅ Skills
- [ ] Mínimo 12-16 skills
- [ ] Variedad de niveles
- [ ] Años de experiencia realistas
- [ ] Categorías apropiadas

### ✅ Certificaciones
- [ ] Mínimo 4-6 certificaciones
- [ ] Descriptions profesionales
- [ ] Issuer reconocido
- [ ] Credential URL válido
- [ ] Verified = true

### ✅ Idiomas
- [ ] Mínimo 2 idiomas
- [ ] Niveles CEFR correctos (A1-C2)
- [ ] is_native correcto

### ✅ Stamps
- [ ] EMAIL verificado
- [ ] IDENTITY verificado
- [ ] EDUCATION verificado
- [ ] CERTIFICATION verificado
- [ ] EMPLOYMENT verificado

---

## 📝 Estándares de Redacción

### Para Summaries

**Estructura recomendada:**
1. **Párrafo 1:** Especialización y años de experiencia
2. **Párrafo 2:** Enfoque y metodología
3. **Párrafo 3:** Filosofía y valor que aporta

**Ejemplo:**
```
I specialize in [especialidad] with [X] years of experience working with [población].
I have [logro cuantificable] and [resultado específico].

My approach integrates [metodología 1], [metodología 2], and [metodología 3].
I believe that [filosofía/valores].

At ISEIH, I teach practitioners how to [beneficio 1], [beneficio 2], and [beneficio 3].
```

---

### Para Experience Descriptions

**Elementos clave:**
- Rol principal y responsabilidades
- Población/clientela atendida
- Metodologías utilizadas
- Colaboraciones/equipo

**Longitud:** 200-600 caracteres

---

### Para Achievements

**Formato STAR implícito:**
- **S**ituation: Contexto (implícito)
- **T**ask: Qué se hizo
- **A**ction: Cómo se hizo (implícito)
- **R**esult: Resultado cuantificable

**Ejemplos:**
- ✅ "Developed comprehensive curriculum serving 90+ students with 98% satisfaction"
- ✅ "Reduced client anxiety symptoms by 40% using evidence-based CBT protocols"
- ✅ "Trained 200+ healthcare professionals in trauma-informed care practices"

**NO hacer:**
- ❌ "Worked with clients" (muy vago)
- ❌ "Helped develop programs" (no cuantificable)
- ❌ "Participated in trainings" (pasivo)

---

## 🌍 Consideraciones para Traducción ES-EN

### Errores Comunes a Evitar

1. **Falsos amigos:**
   - "Actualmente" ≠ "Actually" → Use "Currently"
   - "Realizar" ≠ "Realize" → Use "Carry out", "Conduct"
   - "Éxito" ≠ "Exit" → Use "Success"

2. **Traducciones literales:**
   - ❌ "I have 10 years working..."
   - ✅ "I have 10 years of experience working..."

3. **Voz pasiva excesiva:**
   - ❌ "Clients were helped by me..."
   - ✅ "I helped clients..."

4. **Vocabulario profesional:**
   - Usar términos técnicos correctos en inglés
   - Verificar terminología de la industria
   - Evitar traducciones palabra por palabra

---

## 🔄 Workflow Recomendado

### Para Nuevos Perfiles

1. **Crear perfil** con SQL INSERT
2. **Ejecutar** `content-quality-report.sql` (Sección 3) para ver score inicial
3. **Revisar** problemas con `verify-profile-content-quality.sql` (Sección 10)
4. **Corregir** problemas detectados
5. **Verificar** contenido para traducción con `export-for-translation-review.sql` (Opción 4)
6. **Re-ejecutar** Sección 3 para confirmar mejora

### Para Revisión Periódica

1. **Cada semana:** Ejecutar Sección 3 de `content-quality-report.sql`
2. **Cada mes:** Ejecutar análisis completo con `verify-profile-content-quality.sql`
3. **Antes de traducciones:** Usar `export-for-translation-review.sql`

---

## 🛠️ Troubleshooting

### Problema: "Permission denied"
**Solución:** Asegúrate de tener permisos de lectura en todas las tablas.

### Problema: "No results"
**Solución:** Verifica que `role = 'professional'` esté correcto en los filtros.

### Problema: "CSV export fails"
**Solución:** En Supabase, usa el resultado de la query directamente en lugar de COPY TO.

---

## 📞 Contacto y Soporte

Si encuentras problemas con estos scripts o necesitas ayuda:
1. Revisa los comentarios dentro de cada script
2. Verifica que las tablas existan: `profiles`, `experiences`, `education`, `skills`, `languages`, `portfolio_items`, `stamps`
3. Confirma que los permisos sean correctos

---

## 📅 Última Actualización

**Fecha:** 2026-02-12
**Versión:** 1.0
**Autor:** Claude (Anthropic)
