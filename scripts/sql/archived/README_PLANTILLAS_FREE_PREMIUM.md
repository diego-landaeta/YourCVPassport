# 📋 Actualización de Plantillas Free vs Premium

## 🎯 Objetivo
Configurar correctamente qué plantillas están disponibles para usuarios gratuitos y usuarios premium en YourCVPassport.

## ✅ Cambios Realizados

### Frontend (Ya aplicado)
- Archivo: `components/templates/templateData.ts`
- Solo 3 plantillas tienen `isPro: false`
- 18 plantillas tienen `isPro: true`

### Base de Datos (Requiere ejecutar script)
- Archivo: `scripts/sql/update-template-configs-free-premium.sql`
- Actualiza la tabla `template_configs` en Supabase

## 🚀 Cómo Ejecutar

### Paso 1: Acceder a Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Click en **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script
1. Abre el archivo `scripts/sql/update-template-configs-free-premium.sql`
2. Copia TODO el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Click en el botón **Run** o presiona `Ctrl+Enter`

### Paso 3: Verificar los Resultados
El script automáticamente mostrará:
- ✅ Lista de todas las plantillas con su estado
- 📊 Resumen de plantillas gratuitas vs premium
- Deberías ver:
  - **3 Plantillas Gratuitas**
  - **18 Plantillas Premium**

## 📊 Resultado Esperado

### Plantillas GRATUITAS (isPro: false)
| ID | Nombre | Estado |
|---|---|---|
| `passport` | Pasaporte (Nuevo) | ✅ Gratuita |
| `classic` | Clásico | ✅ Gratuita |
| `modern-professional` | Profesional Moderno | ✅ Gratuita |

### Plantillas PREMIUM (isPro: true)
| ID | Nombre | Estado |
|---|---|---|
| `corporate-classic` | Corporativo Clásico | 🔒 Premium |
| `creative-minimalist` | Creativo Minimalista | 🔒 Premium |
| `academic-standard` | Estándar Académico | 🔒 Premium |
| `modern-minimalist` | Moderno Minimalista | 🔒 Premium |
| `creative-bold` | Creativo Audaz | 🔒 Premium |
| `professional-classic` | Profesional Clásico | 🔒 Premium |
| `healthcare-professional` | Profesional de la Salud | 🔒 Premium |
| `minimalist-yellow` | Minimalista Amarillo | 🔒 Premium |
| `gradient-blue` | Gradiente Azul | 🔒 Premium |
| `coral-pink` | Rosa Coral | 🔒 Premium |
| `green-minimal` | Verde Minimalista | 🔒 Premium |
| `creative-orange` | Naranja Creativo | 🔒 Premium |
| `classic-sidebar` | Barra Lateral Oscura | 🔒 Premium |
| `modern-clean` | Encabezado Gradiente | 🔒 Premium |
| `elegant-minimal` | Línea de Tiempo Elegante | 🔒 Premium |
| `professional-blue` | Azul Profesional | 🔒 Premium |
| `creative-modern` | Banner Creativo | 🔒 Premium |
| `urban` | Urbano | 🔒 Premium |

## 🔍 Verificación en el Admin Panel

1. Inicia sesión como admin en tu aplicación
2. Ve a `localhost:3000/admin` (o tu URL de admin)
3. Navega a **Gestión de Plantillas**
4. Deberías ver:
   - **3 plantillas** con badge verde "✓ Free"
   - **18 plantillas** con badge morado "✓ Premium"
   - El contador superior debe mostrar:
     - Total de Plantillas: **21**
     - Plantillas Gratuitas: **3**
     - Plantillas Premium: **18**

## 🎨 Comportamiento Esperado para Usuarios

### Usuario FREE (sin plan premium)
- ✅ Puede ver y usar solo 3 plantillas:
  - Pasaporte (Nuevo)
  - Clásico
  - Profesional Moderno
- 🔒 Las otras 18 plantillas aparecen con un candado y mensaje "PRO"
- 💡 Se muestra un banner invitando a upgrade para acceder a más plantillas

### Usuario PREMIUM
- ✅ Puede ver y usar todas las 21 plantillas
- 🎨 No ve ningún candado ni restricción
- ⭐ Badge "PRO" visible en las plantillas premium

## 🐛 Solución de Problemas

### Problema: Las plantillas siguen mostrando "Sin configurar"
**Solución:**
1. Verifica que ejecutaste el script SQL completo
2. Refresca el Admin Panel (`F5`)
3. Limpia la caché del navegador

### Problema: Usuarios FREE aún pueden ver plantillas premium
**Solución:**
1. Verifica el plan del usuario en la tabla `profiles`
2. Asegúrate de que el campo `plan` sea `'free'` (no `null` o vacío)
3. Reinicia el servidor frontend

### Problema: Error al ejecutar el script SQL
**Solución:**
1. Verifica que la tabla `template_configs` existe:
   ```sql
   SELECT * FROM public.template_configs LIMIT 1;
   ```
2. Si no existe, ejecuta primero la migración:
   `supabase/migrations/20260116_create_template_configs.sql`

## 📝 Archivos Modificados

1. ✅ `components/templates/templateData.ts` - Configuración de plantillas (frontend)
2. ✅ `scripts/sql/update-template-configs-free-premium.sql` - Script de actualización (base de datos)
3. ✅ Este README con instrucciones

## ✨ Próximos Pasos

1. [ ] Ejecutar el script SQL en Supabase
2. [ ] Verificar en el Admin Panel
3. [ ] Probar con un usuario FREE
4. [ ] Probar con un usuario PREMIUM
5. [ ] Confirmar que el upgrade prompt funciona correctamente

---

**Última actualización:** 2026-01-26
**Responsable:** Sistema de gestión de plantillas YourCVPassport
