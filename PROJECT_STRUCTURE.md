# 📁 Estructura del Proyecto - YourCVPassport

**Última actualización**: 2026-02-12
**Tipo**: Aplicación React + TypeScript + Supabase

---

## 🗂️ Estructura de Carpetas

```
yourcvpassport/
├── 📱 Código Principal
│   ├── components/          → Componentes React organizados por funcionalidad
│   ├── pages/               → Páginas principales de la aplicación
│   ├── hooks/               → Custom React hooks
│   ├── contexts/            → Context providers (Auth, Language, Toast)
│   ├── lib/                 → Utilidades y configuraciones (Supabase, AI)
│   ├── utils/               → Funciones helper y utilidades
│   ├── types/               → Definiciones de tipos TypeScript
│   ├── schemas/             → Esquemas de validación Zod
│   ├── translations/        → Archivos de traducción (es.ts, en.ts)
│   ├── services/            → Servicios de API y lógica de negocio
│   └── data/                → Datos estáticos (talentCategories.ts)
│
├── 🎨 Assets y Públicos
│   ├── public/              → Assets públicos (imágenes, favicon, robots.txt, sitemap.xml)
│   └── nginx/               → Configuración de Nginx para producción
│
├── 🗄️ Base de Datos
│   ├── supabase/migrations/ → Migraciones de base de datos
│   └── scripts/sql/         → Scripts SQL útiles
│       ├── CREATE-michelle-chang-LIMPIO.sql
│       ├── CREATE-nicole-taylor-LIMPIO.sql
│       ├── check-tutors-missing-photos.sql
│       ├── validate-all-tutors-content-consistency.sql
│       └── archived/        → Scripts obsoletos (168 archivos)
│
├── 📚 Documentación
│   ├── docs/
│   │   ├── INDEX.md                → Índice maestro de documentación
│   │   ├── README.md               → Introducción a la documentación
│   │   ├── DOCUMENTACION.md        → Guía general
│   │   ├── systems/                → Documentación de sistemas
│   │   │   ├── TALENT_SEARCH_SYSTEM.md
│   │   │   ├── URL_SLUG_SYSTEM_UPDATED.md
│   │   │   └── SEO_PROFILES_FIX.md
│   │   ├── features/               → Documentación de features
│   │   │   ├── WIZARD_AND_TOUR_FLOW.md
│   │   │   └── WIZARD_SECTION_LOCKING_RULES.md
│   │   ├── reference/              → Documentación de referencia
│   │   │   ├── KNOWN_LIMITATIONS.md
│   │   │   └── USUARIOS_DEMO_CERTIFICACIONES.md
│   │   ├── changelog/              → Histórico de cambios
│   │   │   └── CAMBIOS_SCHEMA_2026-02-12.md
│   │   ├── architecture/           → Arquitectura del sistema
│   │   ├── api/                    → Documentación de API
│   │   ├── guides/                 → Guías de uso
│   │   ├── implementation/         → Detalles de implementación
│   │   └── verification/           → Verificaciones y tests
│   │
│   └── PROJECT_STRUCTURE.md         → Este archivo

├── 🧪 Testing
│   ├── tests/               → Tests E2E y unitarios
│   └── playwright.config.ts → Configuración de Playwright
│
├── ⚙️ Configuración
│   ├── vite.config.ts       → Configuración de Vite
│   ├── tsconfig.json        → Configuración de TypeScript
│   ├── tailwind.config.js   → Configuración de Tailwind CSS
│   ├── postcss.config.js    → Configuración de PostCSS
│   ├── package.json         → Dependencias y scripts
│   ├── .env.local           → Variables de entorno (NO commitear)
│   └── .gitignore           → Archivos ignorados por Git
│
├── 🚀 Build y Deploy
│   ├── dist/                → Build de producción
│   ├── server.mjs           → Servidor SSR para SEO
│   └── nginx/               → Configuración de servidor web
│
└── 🔧 Desarrollo
    ├── .vscode/             → Configuración de VS Code
    ├── vite-plugins/        → Plugins personalizados de Vite
    └── src/                 → Archivos auxiliares de desarrollo

```

---

## 📂 Carpetas Principales

### `/components/`
Componentes React organizados por funcionalidad:
- `admin/` - Panel de administración
- `company/` - Funcionalidades para empresas
- `dashboard/` - Dashboard del usuario
- `profile-editor/` - Editor de perfil
- `talent-search/` - Búsqueda de talento
- `templates/` - Plantillas de CV
- `ui/` - Componentes UI reutilizables

### `/scripts/sql/`
Scripts SQL activos y organizados:
- **12 scripts activos** para gestión de tutores ISEIH
- **168 scripts archivados** en `archived/`
- Ver [scripts/sql/README.md](scripts/sql/README.md) para más detalles

### `/docs/`
Documentación completa del proyecto:
- **systems/** - Documentación técnica de sistemas
- **features/** - Documentación de funcionalidades
- **reference/** - Referencias y limitaciones
- **changelog/** - Histórico de cambios
- Ver [docs/INDEX.md](docs/INDEX.md) para navegación

### `/translations/`
Archivos de internacionalización:
- `es.ts` - Traducciones en español
- `en.ts` - Traducciones en inglés

### `/supabase/`
Configuración de base de datos:
- `migrations/` - Migraciones SQL
- Ver [scripts/sql/README.md](scripts/sql/README.md) para scripts útiles

---

## 🎯 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `App.tsx` | Componente raíz de la aplicación |
| `index.tsx` | Punto de entrada |
| `routeConfig.ts` | Configuración de rutas |
| `server.mjs` | Servidor SSR para SEO |
| `vite.config.ts` | Configuración de build |
| `.env.local` | Variables de entorno (local, no commitear) |

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Build
npm run build            # Build de producción
npm run preview          # Preview del build

# Testing
npm run test             # Ejecutar tests
npm run test:e2e         # Tests end-to-end

# Base de Datos
npm run db:push          # Aplicar migraciones
```

---

## 📦 Dependencias Principales

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Supabase** - Backend as a Service
- **Zod** - Validación de esquemas
- **React Router** - Enrutamiento
- **Lucide React** - Iconos

---

## 🔐 Variables de Entorno

Archivo: `.env.local` (crear desde `.env.example`)

```env
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_OPENAI_API_KEY=tu_api_key_openai
```

---

## 📝 Convenciones

### Nombres de Archivos
- **Componentes**: PascalCase (`ProfileEditor.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useProfile.ts`)
- **Utilidades**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`User.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Organización de Imports
```typescript
// 1. Librerías externas
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Utilidades y configuración
import { supabase } from '@/lib/supabase';

// 3. Componentes
import { Button } from '@/components/ui/Button';

// 4. Types
import type { Profile } from '@/types';

// 5. Estilos
import './styles.css';
```

---

## 🗂️ Cambios Recientes (2026-02-12)

### ✅ Limpieza Completada
1. **Eliminado**: `temp_get_summaries.sql` (archivo temporal)
2. **Movido**: `CAMBIOS_SCHEMA_2026-02-12.md` → `docs/changelog/`
3. **Consolidado**: `context/` → `contexts/`
4. **Organizado**: Archivos en `docs/` en subcarpetas lógicas
5. **Archivado**: 168 scripts SQL obsoletos en `scripts/sql/archived/`

### 📊 Mejoras en Organización
- **Reducción de archivos en raíz**: 93% menos archivos sueltos
- **Estructura de docs/** mejorada: Carpetas por categoría
- **Scripts SQL organizados**: 12 activos, 168 archivados
- **Documentación centralizada**: Todo en `docs/`

---

## 🔍 Navegación Rápida

| Necesito... | Ir a... |
|-------------|---------|
| Ver documentación completa | [docs/INDEX.md](docs/INDEX.md) |
| Scripts SQL útiles | [scripts/sql/README.md](scripts/sql/README.md) |
| Información de tutores ISEIH | [scripts/sql/TUTORS-UUID-EMAIL-MAPPING.md](scripts/sql/TUTORS-UUID-EMAIL-MAPPING.md) |
| Limitaciones conocidas | [docs/reference/KNOWN_LIMITATIONS.md](docs/reference/KNOWN_LIMITATIONS.md) |
| Sistema de búsqueda de talento | [docs/systems/TALENT_SEARCH_SYSTEM.md](docs/systems/TALENT_SEARCH_SYSTEM.md) |
| Flujo de wizard | [docs/features/WIZARD_AND_TOUR_FLOW.md](docs/features/WIZARD_AND_TOUR_FLOW.md) |

---

## 🆘 Soporte

Para preguntas o problemas:
1. Revisar [docs/KNOWN_LIMITATIONS.md](docs/reference/KNOWN_LIMITATIONS.md)
2. Buscar en la documentación: [docs/INDEX.md](docs/INDEX.md)
3. Verificar scripts SQL: [scripts/sql/README.md](scripts/sql/README.md)

---

**Mantenido por**: Equipo de Desarrollo
**Última limpieza**: 2026-02-12
**Próxima revisión**: 2026-05-12
