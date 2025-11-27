# Configuración de la Tabla Languages

## ⚠️ IMPORTANTE - DEBES EJECUTAR ESTO

La tabla `languages` existe en tu base de datos pero le **FALTAN COLUMNAS** (`percentage` y `sort_order`). Por eso el AI Assistant y la sección de idiomas NO están guardando los datos de porcentaje correctamente.

## 🔧 Pasos para Arreglar

### Ejecutar SQL en Supabase Dashboard (RECOMENDADO)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**
4. Copia y pega todo el contenido del archivo: `scripts/update-languages-table-add-percentage.sql`
5. Haz clic en **Run** (botón verde)
6. Verifica que aparezca el mensaje: "Update completed successfully!"

## ✅ Verificar que Funcionó

Después de ejecutar el SQL, ejecuta esta query para verificar:

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'languages';
```

Deberías ver la tabla `languages` en los resultados.

## 📋 Campos de la Tabla

La tabla `languages` tiene los siguientes campos:

- `id` (UUID) - ID único
- `profile_id` (UUID) - Referencia al perfil del usuario
- `name` (TEXT) - Nombre del idioma (ej: "English", "Spanish")
- `level` (TEXT) - Nivel del idioma (A1, A2, B1, B2, C1, C2, Native)
- `percentage` (INTEGER) - Porcentaje de dominio (0-100) - **NUEVO CAMPO**
- `sort_order` (INTEGER) - Orden de visualización
- `created_at` (TIMESTAMPTZ) - Fecha de creación
- `updated_at` (TIMESTAMPTZ) - Fecha de última actualización

## 🔒 Seguridad (RLS)

La tabla tiene Row Level Security (RLS) habilitado con las siguientes políticas:

- Los usuarios solo pueden ver sus propios idiomas
- Los usuarios solo pueden insertar/actualizar/eliminar sus propios idiomas

## 🎯 Después de Ejecutar

Una vez que ejecutes el SQL:

1. ✅ El AI Assistant guardará los idiomas correctamente
2. ✅ La sección de idiomas guardará el campo `percentage`
3. ✅ Verás las barras de porcentaje en los idiomas guardados
4. ✅ La vista previa funcionará correctamente

## ❓ Problemas?

Si tienes errores al ejecutar el SQL:

1. Verifica que estás conectado a tu proyecto de Supabase
2. Verifica que tienes permisos de administrador
3. Si la tabla ya existe, descomenta la línea 5 del script para borrarla primero (⚠️ Esto borrará todos los datos de idiomas)
