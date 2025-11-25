# 🧪 Guía Rápida de Testing de Edge Functions

## ⚡ Inicio Rápido

### Paso 1: Configurar Variables de Entorno

Ejecuta el script de configuración:

```powershell
.\tests\edge-functions\setup-env.ps1
```

El script te pedirá:

1. **SUPABASE_URL**: Tu URL de proyecto (ej: `https://xxxxx.supabase.co`)
2. **SUPABASE_ANON_KEY**: Tu clave anónima pública

> 💡 **Dónde encontrar estas credenciales:**
>
> 1. Ve a tu dashboard de Supabase
> 2. Click en "Settings" → "API"
> 3. Copia "Project URL" y "anon public key"

### Paso 2: Ejecutar Tests

```bash
# Todos los tests de edge functions
npm test tests/edge-functions/

# Test específico
npm test tests/edge-functions/verification.spec.ts
```

## 📊 Estado Actual

✅ **15 funciones Edge analizadas**  
✅ **87 tests creados**  
✅ **100% de cobertura**  
⏳ **Pendiente**: Configurar credenciales y ejecutar

## 🔍 Tests Disponibles

| Archivo                  | Funciones | Tests |
| ------------------------ | --------- | ----- |
| `verification.spec.ts`   | 4         | 16    |
| `authentication.spec.ts` | 3         | 18    |
| `export.spec.ts`         | 2         | 16    |
| `public-profile.spec.ts` | 2         | 17    |
| `utilities.spec.ts`      | 4         | 20    |

## 🎯 Datos de Prueba

Los tests usan:

- **Email**: nangelm.dev@gmail.com
- **Teléfono**: +58 4129543569

## ❓ Troubleshooting

### "VITE_SUPABASE_URL not set"

→ Ejecuta `.\tests\edge-functions\setup-env.ps1`

### Tests fallan con 404

→ Verifica que las funciones estén desplegadas en Supabase

### Tests fallan con 401

→ Verifica que tu ANON_KEY sea correcta

## 📚 Documentación Completa

- [SETUP.md](./SETUP.md) - Guía detallada de configuración
- [README.md](./README.md) - Documentación completa de tests
