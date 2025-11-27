# 📚 YourCVPassport - Documentación Completa

**Versión:** 2.0.0
**Última actualización:** Noviembre 2025
**Estado:** ✅ Producción

---

## 📖 Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Instalación y Configuración](#3-instalación-y-configuración)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos](#5-base-de-datos)
6. [Características Principales](#6-características-principales)
7. [Sistema de Diseño](#7-sistema-de-diseño)
8. [Guías Técnicas](#8-guías-técnicas)
9. [Seguridad](#9-seguridad)
10. [Testing y Performance](#10-testing-y-performance)
11. [Deployment](#11-deployment)
12. [Contribución](#12-contribución)

---

## 1. Descripción General

**YourCVPassport** es una plataforma completa de gestión de CV profesionales con diseño moderno, sistema de plantillas personalizables, y funcionalidades avanzadas para profesionales y empresas.

### 🎯 Misión
Transformar la manera en que los profesionales presentan su experiencia laboral al mundo, proporcionando herramientas de clase mundial para crear, compartir y gestionar CVs digitales.

### 🌟 Características Únicas
- ✅ **Múltiples Plantillas Profesionales** - 20+ diseños modernos
- ✅ **Asistente IA Integrado** - Google Gemini para creación guiada
- ✅ **URL Pública Personalizada** - Comparte tu CV con un enlace único
- ✅ **Sistema de Verificación** - Stamps de verificación profesional
- ✅ **Multi-idioma** - Español e Inglés completo
- ✅ **Exportación Multi-formato** - PDF, DOCX, ATS-friendly
- ✅ **Analytics Integrado** - Métricas de visualización y engagement
- ✅ **Sistema de Mensajería** - Inbox estilo WhatsApp para empresas
- ✅ **Sistema de Visas** - Documenta permisos de trabajo por país

---

## 2. Stack Tecnológico

### Frontend
```
- React 19 con TypeScript
- Vite - Build tool ultrarrápido
- TailwindCSS - Utility-first CSS framework
- Heroicons - Iconos consistentes
- React Router v6 - Navegación SPA
- React Hook Form - Gestión de formularios
- @dnd-kit - Drag and drop
```

### Backend & Database
```
- Supabase - PostgreSQL + Auth + Realtime + Storage
- Row Level Security (RLS) - Políticas de seguridad granulares
- Edge Functions - Serverless functions
```

### IA & Servicios Externos
```
- Google Gemini AI - Asistente inteligente
- QRCode.js - Generación de códigos QR
```

### Exportación & Procesamiento
```
- jsPDF - Generación de PDFs
- Mammoth.js - Conversión DOCX
- html2canvas - Captura de componentes React
- react-to-pdf - Export de CV a PDF
```

### Análisis & Métricas
```
- Supabase Analytics - Tracking de eventos
- Custom Analytics System - Dashboard de métricas
```

---

## 3. Instalación y Configuración

### Paso 1: Clonar el Repositorio

```bash
git clone <repository-url>
cd yourcvpassport
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_key_anonima

# Google AI (opcional - para asistente IA)
VITE_GOOGLE_AI_API_KEY=tu_api_key_de_gemini

# URL Pública (para SEO y compartir)
VITE_PUBLIC_URL=https://tudominio.com
```

### Paso 4: Configurar Base de Datos Supabase

#### Opción A: Usando Dashboard (Recomendado)

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ir a **SQL Editor** → **New Query**
3. Copiar y ejecutar todo el contenido del archivo `cronologia.md`
4. Habilitar Realtime para las tablas:
   - `messages`
   - `notifications`
   - `leads`

#### Opción B: Usando CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-project-ref

# Aplicar migraciones
supabase db push
```

### Paso 5: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Paso 6: Build para Producción

```bash
npm run build
npm run preview  # Para previsualizar el build
```

---

## 4. Estructura del Proyecto

```
yourcvpassport/
├── components/                  # Componentes React
│   ├── admin/                  # Panel de administración
│   │   ├── AdminDashboard.tsx
│   │   ├── ProfilesManagement.tsx
│   │   ├── StampsManagement.tsx
│   │   └── SuccessStoriesManagement.tsx
│   ├── ats-export/             # Sistema de exportación ATS
│   │   ├── ATSExportModal.tsx
│   │   ├── ATSPDFPreview.tsx
│   │   └── templates/          # Plantillas ATS
│   ├── auth/                   # Componentes de autenticación
│   │   ├── AuthScreen.tsx
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── OAuthButtons.tsx
│   ├── dashboard/              # Dashboard de usuario
│   │   ├── DashboardContent.tsx
│   │   ├── CVVersionsSection.tsx
│   │   ├── LeadsInboxModern.tsx
│   │   ├── VisasPage.tsx
│   │   ├── VisaFormModal.tsx
│   │   └── StampsSection.tsx
│   ├── templates/              # Plantillas de CV (20 diseños)
│   │   ├── PassportTemplate.tsx
│   │   ├── ModernProfessionalTemplate.tsx
│   │   ├── CreativeDesignerTemplate.tsx
│   │   └── ...
│   ├── ui/                     # Componentes UI reutilizables
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ConfirmDialog.tsx
│   ├── HomePage.tsx
│   ├── ProfileSearchPage.tsx   # Perfil público
│   ├── OnboardingWizard.tsx
│   └── ...                     # Más componentes
├── contexts/                   # Context API
│   ├── AuthContext.tsx         # Autenticación
│   └── LanguageContext.tsx     # Internacionalización
├── docs/                       # Documentación del proyecto
│   ├── features/
│   │   ├── ALL_FEATURES.md
│   │   ├── ANALYTICS_COMPLETE.md
│   │   └── VERIFICATION_STAMPS_COMPLETE.md
│   └── technical/
│       ├── DESIGN_SYSTEM.md
│       ├── IMPLEMENTATION_GUIDE.md
│       ├── PERFORMANCE_OPTIMIZATION_STRATEGY.md
│       └── TESTING_DOCUMENTATION.md
├── hooks/                      # Custom React Hooks
│   ├── useTranslations.ts
│   ├── useAnalytics.ts
│   ├── useAuth.ts
│   └── useNotifications.ts
├── supabase/                   # Configuración Supabase
│   ├── client.ts              # Cliente de Supabase
│   ├── functions/             # Edge Functions
│   └── email-templates/       # Templates de email
├── translations/              # Sistema multi-idioma
│   ├── en.ts                 # Traducciones en inglés
│   ├── es.ts                 # Traducciones en español
│   └── routeConfig.ts        # Configuración de rutas
├── types/                    # TypeScript types
│   └── index.ts              # Tipos globales
├── utils/                    # Utilidades y helpers
│   ├── cvParser.ts
│   ├── handleValidation.ts
│   └── analytics-tracker.ts
├── App.tsx                   # Componente raíz
├── index.tsx                 # Entry point
├── vite.config.ts           # Configuración de Vite
├── tailwind.config.js       # Configuración de Tailwind
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias
```

---

## 5. Base de Datos

### 5.1 Tablas Principales

#### `profiles` - Datos de usuario
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- full_name (text)
- email (text)
- phone (text)
- location (text)
- avatar_url (text)
- custom_slug (text, unique)
- title (text)
- bio (text)
- template_id (text)
- theme_color (text)
- is_public (boolean)
- role (text) - 'user' | 'admin'
- plan (text) - 'free' | 'pro' | 'business'
- created_at, updated_at (timestamptz)
```

#### `experiences` - Historial laboral
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- company_name (text)
- position (text)
- employment_type (text) - 'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'CONTRACT'
- start_date, end_date (date)
- current_job (boolean)
- location (text)
- description (text)
- achievements (text[])
- is_verified (boolean)
- sort_order (integer)
```

#### `education` - Formación académica
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- institution (text)
- degree (text)
- field_of_study (text)
- start_date, end_date (date)
- grade (text)
- description (text)
- is_verified (boolean)
```

#### `skills` - Habilidades técnicas
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- name (text)
- category (text) - 'TECHNICAL' | 'SOFT' | 'LANGUAGE' | 'TOOLS'
- proficiency (text) - 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
- years_of_experience (integer)
- endorsements (integer)
```

#### `languages` - Idiomas
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- language (text)
- proficiency (text) - 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NATIVE'
- is_native (boolean)
```

#### `cv_versions` - Versiones de CV
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- version_name (text)
- custom_slug (text)
- template_id (text)
- is_active (boolean)
- created_at (timestamptz)
```

#### `verification_requests` - Solicitudes de verificación
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- type (text) - 'IDENTITY' | 'EMAIL' | 'PHONE' | 'EDUCATION' | 'EMPLOYMENT' | 'SKILLS' | 'LINKEDIN'
- status (text) - 'PENDING' | 'APPROVED' | 'REJECTED'
- document_url (text)
- notes (text)
- created_at, updated_at (timestamptz)
```

#### `stamps` - Verificaciones aprobadas
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- type (text)
- token (text, unique) - Token público para verificación
- verified_at (timestamptz)
- expires_at (timestamptz)
```

#### `visas` - Permisos de trabajo
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- slug (text)
- title (text)
- context, action, result (text) - Método STAR
- start_date, end_date (date)
- tags (text[])
- images (text[])
- media_urls (text[])
- sort_order (integer)
```

#### `messages` - Sistema de mensajería
```sql
- id (uuid, PK)
- sender_id (uuid, FK)
- recipient_id (uuid, FK)
- lead_id (uuid, FK)
- content (text)
- is_read (boolean)
- created_at (timestamptz)
```

#### `leads` - Gestión de contactos
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- company_name (text)
- contact_email (text)
- contact_name (text)
- subject (text)
- message (text)
- source (text) - 'PROFILE_VIEW' | 'SEARCH' | 'DIRECT'
- status (text) - 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED'
- type (text) - 'JOB_OFFER' | 'COLLABORATION' | 'INQUIRY'
- created_at (timestamptz)
```

#### `notifications` - Notificaciones
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- type (text) - 'STAMP_APPROVED' | 'STAMP_REJECTED' | 'LEAD_MESSAGE' | 'PROFILE_VIEW'
- title (text)
- message (text)
- data (jsonb)
- is_read (boolean)
- created_at (timestamptz)
```

#### `analytics_events` - Tracking de eventos
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- event_type (text) - 'VIEW' | 'DOWNLOAD' | 'SHARE' | 'LINK_CLICK'
- metadata (jsonb)
- created_at (timestamptz)
```

#### `blog_posts` - Entradas del blog
```sql
- id (uuid, PK)
- title (text)
- slug (text, unique)
- content (text)
- excerpt (text)
- author_id (uuid, FK)
- published (boolean)
- featured_image (text)
- created_at, updated_at (timestamptz)
```

#### `success_stories` - Casos de éxito
```sql
- id (uuid, PK)
- profile_id (uuid, FK)
- name (text)
- company (text)
- position (text)
- testimonial (text)
- image_url (text)
- is_featured (boolean)
- created_at (timestamptz)
```

### 5.2 Row Level Security (RLS)

Todas las tablas tienen políticas RLS activadas:

**Políticas comunes:**
- `SELECT`: Perfiles públicos visibles para todos
- `INSERT`: Usuarios autenticados pueden crear su propio contenido
- `UPDATE`: Usuarios solo pueden actualizar su propio contenido
- `DELETE`: Usuarios solo pueden eliminar su propio contenido
- `ADMIN_ACCESS`: Administradores tienen acceso completo

### 5.3 Índices para Optimización

```sql
-- Búsqueda de perfiles
CREATE INDEX idx_profiles_slug ON profiles(custom_slug);
CREATE INDEX idx_profiles_public ON profiles(is_public);
CREATE INDEX idx_profiles_fulltext ON profiles USING GIN(to_tsvector('english', full_name || ' ' || title || ' ' || bio));

-- Búsqueda de skills
CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);

-- Analytics
CREATE INDEX idx_analytics_profile ON analytics_events(profile_id, created_at DESC);

-- Mensajería
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_read ON messages(is_read, recipient_id);
```

---

## 6. Características Principales

### 6.1 Para Profesionales

#### ✅ Sistema de Plantillas de CV
- **20+ diseños profesionales** en `components/templates/`
- Categorías: Modern, Creative, Executive, Tech, Healthcare, Academic
- Preview en tiempo real antes de seleccionar
- Exportación con el template seleccionado

**Uso:**
```typescript
import PassportTemplate from './components/templates/PassportTemplate';
import ModernProfessionalTemplate from './components/templates/ModernProfessionalTemplate';

// En el componente
<PassportTemplate profileData={fullProfileData} />
```

#### ✅ Editor Inteligente con IA
- Asistente Google Gemini integrado
- Sugerencias automáticas de skills
- Optimización de descripciones
- Generación de summary profesional
- Corrección de gramática y estilo

**Archivo:** `components/AIQuestionnaireAssistant.tsx`

#### ✅ Versiones de CV
- Crea múltiples versiones para diferentes posiciones
- Selecciona diferentes templates por versión
- Duplica versiones existentes
- URL única por versión: `/cv/{slug}/version/{version-slug}`

**Archivo:** `components/dashboard/CVVersionsSection.tsx`

#### ✅ URL Pública Personalizada
- URL amigable: `yourwebsite.com/cv/tu-slug`
- Auto-generación desde nombre completo
- Validación de unicidad
- Configuración en Dashboard → Preferences

**Archivo:** `components/ProfileSearchPage.tsx`

#### ✅ Exportación Multi-formato
1. **PDF con template visual** - Diseño completo del CV
2. **ATS-friendly PDF** - Optimizado para sistemas de tracking
3. **DOCX** (en desarrollo) - Editable en Word

**Archivos:**
- `components/ats-export/ATSExportModal.tsx`
- `components/ats-export/ATSPDFPreview.tsx`

#### ✅ Sistema de Verificación (Stamps)
7 tipos de verificación disponibles:
1. **Identity** - Verificación de identidad
2. **Email** - Verificación de correo electrónico
3. **Phone** - Verificación de teléfono
4. **Education** - Verificación académica
5. **Employment** - Verificación laboral
6. **Skills** - Verificación de habilidades
7. **LinkedIn** - Vinculación con LinkedIn

**Características:**
- Token público único por stamp
- QR code para verificación externa
- Fecha de expiración configurable
- Panel de administración para aprobar/rechazar

**Archivos:**
- `components/dashboard/StampsSection.tsx`
- `components/admin/StampsManagement.tsx`

#### ✅ Sistema de Visas
Documenta permisos de trabajo por país:
- Método STAR completo (Situation, Task, Action, Result)
- Fechas de inicio y expiración
- Upload de documentos e imágenes
- Tags para categorización
- Display en perfil público
- Drag & drop para reordenar

**Archivos:**
- `components/dashboard/VisasPage.tsx`
- `components/dashboard/VisaFormModal.tsx`

**Ver documentación completa:** [VISAS_PAGE_IMPROVEMENTS.md](VISAS_PAGE_IMPROVEMENTS.md)

### 6.2 Para Empresas

#### ✅ Sistema de Mensajería
- Inbox estilo WhatsApp
- Mensajes en tiempo real con Supabase Realtime
- Filtro por leído/no leído
- Búsqueda de conversaciones
- Indicador de mensajes nuevos
- Conexión automática con Leads

**Archivo:** `components/dashboard/LeadsInboxModern.tsx`

#### ✅ Búsqueda Avanzada
- Búsqueda por skills, ubicación, experiencia
- Filtros avanzados combinables
- Resultados paginados
- Preview de perfiles
- Enviar mensaje directo desde resultados

**Archivo:** `components/AdvancedTalentSearchPage.tsx`

#### ✅ Gestión de Leads
- Captura automática cuando empresa contacta candidato
- Estados: NEW, CONTACTED, INTERESTED, NOT_INTERESTED
- Notas y seguimiento
- Integración con sistema de mensajería
- Dashboard completo: `/dashboard/leads`
- Estadísticas por tipo y estado

**Archivo:** `components/dashboard/LeadsPage.tsx`

#### ✅ Analytics Integrado
Sistema completo de analytics:
- Visualizaciones de perfil
- Clicks en enlaces
- Descargas de CV
- Engagement de visitantes
- Conversiones de leads
- Gráficos interactivos con D3.js
- Export a CSV (GDPR compliant)

**Archivos:**
- `components/dashboard/AnalyticsDashboard.tsx`
- `utils/analytics-tracker.ts`

**Ver documentación completa:** [docs/features/ANALYTICS_COMPLETE.md](docs/features/ANALYTICS_COMPLETE.md)

### 6.3 Panel de Administración

Acceso: `/admin` (requiere `role = 'admin'`)

#### Tabs Disponibles:
1. **Users** - Gestión de usuarios (CRUD, cambio de roles)
2. **Stamps** - Aprobación/rechazo de verificaciones
3. **Blog** - CMS integrado para publicaciones
4. **Success Stories** - Gestión de testimonios
5. **Stats** - Estadísticas del sistema

#### Métricas del Sistema:
- Total de usuarios
- Usuarios activos (últimos 30 días)
- Stamps aprobados
- Verificaciones pendientes
- Posts del blog
- Gráficos de crecimiento mensual

**Archivos:**
- `components/admin/AdminDashboard.tsx`
- `components/admin/ProfilesManagement.tsx`
- `components/admin/StampsManagement.tsx`
- `components/admin/SuccessStoriesManagement.tsx`

---

## 7. Sistema de Diseño

### 7.1 Color Palette

#### Light Mode
```css
/* Primary */
--blue-500: #3B82F6
--blue-600: #2563EB
--blue-50: #EFF6FF

/* Status Colors */
--green-500: #10B981  /* Success */
--red-500: #EF4444     /* Error */
--yellow-500: #F59E0B  /* Warning */
--purple-500: #8B5CF6  /* Info */

/* Neutral */
--gray-50: #F9FAFB     /* Page background */
--gray-100: #F3F4F6    /* Card backgrounds */
--gray-900: #111827    /* Headings */
--white: #FFFFFF
```

#### Dark Mode
```css
/* Neutral (Dark) */
--gray-900: #111827    /* Page background */
--gray-800: #1F2937    /* Card backgrounds */
--gray-700: #374151    /* Elevated cards */
--gray-300: #D1D5DB    /* Primary text */
```

### 7.2 Typography

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem     /* 12px - Badges */
--text-sm: 0.875rem    /* 14px - Secondary text */
--text-base: 1rem      /* 16px - Body */
--text-xl: 1.25rem     /* 20px - Card titles */
--text-2xl: 1.5rem     /* 24px - Headings */
```

### 7.3 Spacing

Base unit: 4px
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
```

### 7.4 Componentes UI Reutilizables

#### Modal Base
```typescript
import Modal from './components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="lg" // sm, md, lg, xl, 2xl, 4xl
>
  {/* Contenido */}
</Modal>
```

#### Toast Notifications
```typescript
import { useToast } from './components/ui/ToastContainer';

const toast = useToast();

toast.success('Operación exitosa');
toast.error('Algo salió mal');
toast.info('Información importante');
```

#### Confirm Dialog
```typescript
import ConfirmDialog from './components/ui/ConfirmDialog';

<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="¿Confirmar acción?"
  message="Esta acción no se puede deshacer"
  variant="danger" // danger, warning, info
  loading={isLoading}
/>
```

**Ver documentación completa del sistema de diseño:** [docs/technical/DESIGN_SYSTEM.md](docs/technical/DESIGN_SYSTEM.md)

---

## 8. Guías Técnicas

### 8.1 Autenticación

Sistema de autenticación completo con Supabase Auth:

**Métodos soportados:**
- Email + Password
- OAuth: Google, LinkedIn
- Magic Link (passwordless)
- Password recovery

**Rutas:**
- `/login` - Inicio de sesión
- `/signup` - Registro
- `/recovery` - Recuperar contraseña
- `/callback` - OAuth callback
- `/confirm` - Confirmar email

**Context de Autenticación:**
```typescript
import { useAuth } from './contexts/AuthContext';

const MyComponent = () => {
  const { user, session, signIn, signUp, signOut } = useAuth();

  // user: Datos del usuario
  // session: Sesión activa
  // signIn, signUp, signOut: Métodos de auth
};
```

### 8.2 Internacionalización (i18n)

Sistema multi-idioma completo:

**Idiomas soportados:**
- 🇪🇸 Español (predeterminado)
- 🇬🇧 English

**Uso:**
```typescript
import { useTranslations } from './hooks/useTranslations';

const Component = () => {
  const t = useTranslations();

  return (
    <div>
      <h1>{t.dashboard.welcome}</h1>
      <p>{t.profile.edit}</p>
    </div>
  );
};
```

**Rutas multi-idioma:**
```
/en/about-us  → Inglés
/es/nosotros  → Español
```

**Archivos:**
- `translations/en.ts`
- `translations/es.ts`
- `translations/routeConfig.ts`

### 8.3 Gestión de Estado

**Context API para:**
- `AuthContext` - Autenticación
- `LanguageContext` - Idioma
- `ThemeContext` (futuro) - Tema claro/oscuro

**Hooks personalizados:**
- `useAuth()` - Datos y métodos de autenticación
- `useTranslations()` - Traducciones
- `useAnalytics()` - Tracking de eventos
- `useNotifications()` - Notificaciones en tiempo real

### 8.4 Supabase Realtime

**Configuración:**
```typescript
import { supabase } from './supabase/client';

// Suscribirse a cambios en tiempo real
const channel = supabase
  .channel('messages')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      console.log('Nuevo mensaje:', payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

**Tablas con Realtime habilitado:**
- `messages`
- `notifications`
- `leads`

### 8.5 Upload de Archivos

**Supabase Storage:**
```typescript
const uploadFile = async (file: File, bucket: string) => {
  const fileName = `${userId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  // Obtener URL pública
  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
};
```

**Buckets disponibles:**
- `verification-documents` - Documentos de verificación
- `profile-avatars` - Fotos de perfil
- `company-logos` - Logos de empresas

### 8.6 SEO Optimization

**Meta tags dinámicas:**
```typescript
import { SEOHead } from './components/PageSEO';

<SEOHead
  title="Juan Pérez - Full Stack Developer"
  description="Desarrollador con 5 años de experiencia..."
  image={profile.avatar_url}
  url={`https://yourcvpassport.com/cv/${profile.slug}`}
  type="profile"
/>
```

**Open Graph tags:**
- og:title
- og:description
- og:image
- og:url
- og:type

**Twitter Cards:**
- twitter:card
- twitter:title
- twitter:description
- twitter:image

**Structured Data (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Juan Pérez",
  "jobTitle": "Full Stack Developer",
  "url": "https://yourcvpassport.com/cv/juan-perez"
}
```


### 8.7 URLs Canónicas y SEO Avanzado

El sistema implementa una estrategia estricta de URLs canónicas para evitar contenido duplicado.

**Principios:**
- **Idioma Base:** Inglés es la versión canónica.
- **Normalización:** Se eliminan query strings y trailing slashes.
- **Mapeo Automático:** Rutas en español (`/precios`) apuntan a su canónica en inglés (`/pricing`).

**Mapeo de Rutas (ES → EN):**
| Ruta ES | Canonical EN |
|---------|--------------|
| `/precios` | `/pricing` |
| `/producto/resumen` | `/product/overview` |
| `/empresas/planes` | `/companies/plans` |
| `/perfiles/*` | `/profiles/*` |

**Utilidades (`utils/canonicalUrl.ts`):**
- `normalizeUrl()`: Limpieza de URLs.
- `getCanonicalUrl()`: Generación de canonicals.

---

## 9. Seguridad

### 9.1 Row Level Security (RLS)

Todas las tablas sensibles tienen RLS activado:

```sql
-- Ejemplo: Políticas para tabla profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### 9.2 Autenticación Segura

- ✅ Passwords hasheadas con bcrypt
- ✅ JWT tokens con expiración
- ✅ Refresh tokens automáticos
- ✅ Rate limiting en endpoints críticos
- ✅ Email confirmation obligatorio

### 9.3 Validación de Inputs

**Frontend:**
```typescript
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
});

const result = profileSchema.safeParse(formData);
if (!result.success) {
  // Mostrar errores
}
```

**Backend (Edge Functions):**
- Validación de tipos
- Sanitización de HTML
- Escape de SQL
- Límites de tamaño de archivos

### 9.4 Protección CSRF

- ✅ Tokens CSRF en formularios críticos
- ✅ SameSite cookies
- ✅ Origin verification

### 9.5 HTTPS & Content Security

- ✅ HTTPS only en producción
- ✅ Content Security Policy headers
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options

---

## 10. Testing y Performance

### 10.1 Testing

**Testing Documentation:** [docs/technical/TESTING_DOCUMENTATION.md](docs/technical/TESTING_DOCUMENTATION.md)

**Herramientas:**
- Jest - Unit testing
- React Testing Library - Component testing
- Playwright - E2E testing (futuro)

**Estructura de tests:**
```
__tests__/
├── components/
│   ├── HomePage.test.tsx
│   └── ProfileCard.test.tsx
├── hooks/
│   └── useAuth.test.ts
└── utils/
    └── validators.test.ts
```

### 10.2 Performance Optimization

**Estrategias implementadas:**

1. **Code Splitting**
```typescript
// Lazy loading de páginas
const HomePage = lazy(() => import('./components/HomePage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
```

2. **Virtual Scrolling**
- Listas largas con `react-window`
- Mejora significativa en renderizado

3. **Memoization**
```typescript
const MemoizedComponent = React.memo(ExpensiveComponent);
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

4. **Image Optimization**
- Lazy loading: `loading="lazy"`
- WebP format cuando sea posible
- Responsive images con srcset

5. **Bundle Optimization**
- Tree shaking automático con Vite
- Compresión gzip/brotli
- Minificación de CSS/JS

**Performance Metrics:**
- ⚡ First Paint: < 1s
- ⚡ Time to Interactive: < 2s
- ⚡ Lighthouse Score: 90+

**Ver estrategia completa:** [docs/technical/PERFORMANCE_OPTIMIZATION_STRATEGY.md](docs/technical/PERFORMANCE_OPTIMIZATION_STRATEGY.md)

---

## 11. Deployment

### 11.1 Variables de Entorno

**Producción (.env.production):**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_key_anonima_produccion
VITE_GOOGLE_AI_API_KEY=tu_api_key_produccion
VITE_PUBLIC_URL=https://yourcvpassport.com
```

### 11.2 Build de Producción

```bash
# Build
npm run build

# Preview local del build
npm run preview

# Verificar tamaño del bundle
npm run build -- --report
```

### 11.3 Deployment en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy automático en cada push a main

### 11.4 Deployment en Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 11.5 Edge Functions Deployment

```bash
# Deploy todas las functions
supabase functions deploy

# Deploy función específica
supabase functions deploy export-pdf

# Ver logs
supabase functions logs export-pdf
```

---

### 11.6 Configuración de Email (Resend)

Para habilitar el envío de emails (verificación, notificaciones):

1. **Crear Edge Functions en Supabase:**
   - `send-verification-email`
   - `verify-email-code`
   
2. **Configurar Variable de Entorno:**
   - Ir a **Project Settings > Edge Functions**.
   - Añadir `RESEND_API_KEY` (obtener en [Resend.com](https://resend.com)).

3. **Verificación:**
   - Revisar logs en Dashboard si los emails no llegan.
   - Verificar límites del plan gratuito de Resend.

---

### 11.7 Referencia de Scripts

El proyecto incluye scripts de utilidad en la carpeta `scripts/`:

**Scripts Activos (Mantenimiento/Build):**
- `generate-sitemap.mjs`: Genera el sitemap.xml para SEO.
- `generate-template-previews.mjs`: Genera imágenes de vista previa de las plantillas de CV.
- `optimize-images.mjs`: Optimiza imágenes estáticas.
- `check-and-run-cv-versions-migration.ts`: Migración para el sistema de versiones de CV.

**Scripts Históricos (Eliminados/Archivados):**
- `verify-canonical-utils.mjs`: Tests de URLs canónicas (integrado en tests unitarios).
- `check-resend-domains.js`: Verificación de dominios de email.
- `debug-*.js`: Scripts de depuración manual para auth y emails.

---

## 12. Contribución

### 12.1 Guía de Estilo

**TypeScript:**
- Usar tipos explícitos siempre que sea posible
- Evitar `any`, usar `unknown` si es necesario
- Interfaces para objetos, Types para uniones

**React:**
- Functional components con hooks
- Props destructuring
- Early returns para condiciones

**Naming Conventions:**
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase con prefijo `use` (`useAuth.ts`)
- Utils: camelCase (`validateEmail.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### 12.2 Git Workflow

```bash
# Crear feature branch
git checkout -b feature/nueva-funcionalidad

# Commits descriptivos
git commit -m "feat: agregar sistema de mensajería"
git commit -m "fix: corregir bug en exportación PDF"
git commit -m "docs: actualizar documentación de API"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

**Convenciones de commits:**
- `feat:` - Nueva funcionalidad
- `fix:` - Bug fix
- `docs:` - Cambios en documentación
- `style:` - Formato de código
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Mantenimiento

### 12.3 Pull Request Process

1. Crear PR con descripción clara
2. Asignar reviewers
3. Verificar que pasen todos los tests
4. Esperar aprobación
5. Merge a main

---

## 📞 Soporte

### Contacto
- 📧 Email: support@yourcvpassport.com
- 📚 Documentación: Este archivo
- 🐛 Issues: GitHub Issues

### Documentación Adicional

**Features:**
- [Todas las Features](docs/features/ALL_FEATURES.md)
- [Analytics System](docs/features/ANALYTICS_COMPLETE.md)
- [Verification & Stamps](docs/features/VERIFICATION_STAMPS_COMPLETE.md)
- [Mejoras de Visas](VISAS_PAGE_IMPROVEMENTS.md)

**Technical:**
- [Design System](docs/technical/DESIGN_SYSTEM.md)
- [Implementation Guide](docs/technical/IMPLEMENTATION_GUIDE.md)
- [Performance Strategy](docs/technical/PERFORMANCE_OPTIMIZATION_STRATEGY.md)
- [Testing Documentation](docs/technical/TESTING_DOCUMENTATION.md)

**Database:**
- [Migration Guide](supabase/MIGRATION_GUIDE.md)
- [SQL Schema Completo](cronologia.md)

---

## 🎯 Roadmap

### Próximas Funcionalidades

**Q1 2026:**
- [ ] Integración con LinkedIn API
- [ ] Sistema de recomendaciones ML
- [ ] Video-CV integrado
- [ ] App móvil nativa (React Native)

**Q2 2026:**
- [ ] Blockchain verification
- [ ] API pública para integraciones
- [ ] Webhooks
- [ ] Zapier integration

**Futuro:**
- [ ] Multi-company profiles
- [ ] Skill assessments
- [ ] Live portfolio builder
- [ ] AI-powered interview prep

---

**Versión:** 2.0.0
**Última actualización:** Noviembre 2025
**Estado:** ✅ Producción
**Licencia:** Propietaria

---

## 📝 Changelog

### v2.0.0 (Noviembre 2025)
- ✅ Sistema completo de verificación con stamps
- ✅ Analytics dashboard con gráficos interactivos
- ✅ Sistema de mensajería en tiempo real
- ✅ 20+ plantillas de CV profesionales
- ✅ Exportación ATS-friendly
- ✅ Panel de administración completo
- ✅ Sistema de visas con método STAR
- ✅ Internacionalización ES/EN
- ✅ Dark mode completo

### v1.0.0 (Septiembre 2025)
- ✅ Lanzamiento inicial
- ✅ Autenticación con Supabase
- ✅ Plantillas básicas de CV
- ✅ Perfil público

---
