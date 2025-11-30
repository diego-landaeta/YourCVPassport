# YourCVPassport API Documentation

## Descripción General

La API REST de YourCVPassport permite crear flujos de trabajo personalizados e integrar nuestros datos verificados en cualquier sistema. Nuestra robusta API te permite acceder a perfiles verificados, sincronizar datos de candidatos, y automatizar procesos de reclutamiento.

**URL Base:** `https://[tu-proyecto].supabase.co/functions/v1`

## Características Principales

✅ **Accede a datos verificados** - Perfiles con información validada mediante verificación blockchain
✅ **Sincroniza perfiles de candidatos** - Integra datos de candidatos en tus sistemas ATS
✅ **Webhooks para actualizaciones en tiempo real** - Recibe notificaciones cuando los datos cambian
✅ **Rate limiting inteligente** - 100 solicitudes por minuto por IP
✅ **Caché Redis integrado** - Respuestas rápidas con caché automático

---

## Autenticación

Todos los endpoints protegidos requieren autenticación mediante JWT tokens de Supabase.

### Headers Requeridos

```http
Authorization: Bearer YOUR_JWT_TOKEN
apikey: YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Obtener un Token de Autenticación

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'tu-contraseña'
});

const token = data.session.access_token;
```

---

## Rate Limiting

Todos los endpoints públicos implementan rate limiting para garantizar disponibilidad:

- **Límite:** 100 solicitudes por minuto por IP
- **Headers de respuesta:**
  - `X-RateLimit-Limit`: Límite total de solicitudes
  - `X-RateLimit-Remaining`: Solicitudes restantes
  - `X-RateLimit-Reset`: Timestamp de reset del límite
  - `Retry-After`: Segundos hasta poder reintentar (solo en 429)

### Respuesta de Rate Limit Excedido

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "limit": 100,
  "reset": 1638360000000
}
```

**Status Code:** `429 Too Many Requests`

---

## Endpoints Públicos

### 1. Obtener Perfil Público

Obtiene el perfil completo de un candidato mediante su handle único.

**Endpoint:** `GET /get-public-profile`

**Parámetros de Query:**

| Parámetro | Tipo   | Requerido | Descripción                |
|-----------|--------|-----------|----------------------------|
| handle    | string | Sí        | Handle único del perfil    |

**Ejemplo de Solicitud:**

```bash
curl -X GET \
  'https://tu-proyecto.supabase.co/functions/v1/get-public-profile?handle=john-doe' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY'
```

```javascript
const response = await fetch(
  'https://tu-proyecto.supabase.co/functions/v1/get-public-profile?handle=john-doe',
  {
    headers: {
      'apikey': 'YOUR_SUPABASE_ANON_KEY'
    }
  }
);

const data = await response.json();
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "profile": {
    "id": "uuid-123",
    "handle": "john-doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "summary": "Experienced software engineer...",
    "avatar_url": "https://...",
    "experience": [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "start_date": "2020-01-01",
        "end_date": null,
        "is_current": true,
        "description": "Leading development team..."
      }
    ],
    "education": [],
    "skills": ["JavaScript", "React", "Node.js"],
    "languages": [
      {
        "language": "English",
        "proficiency": "Native"
      }
    ],
    "certifications": [],
    "is_public": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-11-29T00:00:00.000Z"
  },
  "cached": false
}
```

**Headers de Respuesta:**

```http
X-Cache: MISS
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2024-11-29T10:00:00.000Z
```

**Errores Posibles:**

| Status | Error                              | Descripción                           |
|--------|------------------------------------|---------------------------------------|
| 400    | Missing required parameter: handle | No se proporcionó el handle           |
| 404    | Profile not found or not public    | Perfil no existe o no es público      |
| 429    | Rate limit exceeded                | Se excedió el límite de solicitudes   |
| 500    | Internal server error              | Error interno del servidor            |

---

### 2. Directorio de Perfiles

Obtiene un listado paginado de perfiles públicos con filtros avanzados.

**Endpoint:** `GET /get-profiles-directory`

**Parámetros de Query:**

| Parámetro | Tipo   | Requerido | Descripción                           | Default |
|-----------|--------|-----------|---------------------------------------|---------|
| page      | number | No        | Número de página                      | 1       |
| pageSize  | number | No        | Perfiles por página (máx: 100)        | 20      |
| country   | string | No        | Filtrar por país                      | -       |
| city      | string | No        | Filtrar por ciudad                    | -       |
| role      | string | No        | Filtrar por rol (búsqueda parcial)    | -       |
| skills    | string | No        | Habilidades separadas por comas       | -       |
| search    | string | No        | Búsqueda de texto en nombre/resumen   | -       |

**Ejemplo de Solicitud:**

```bash
curl -X GET \
  'https://tu-proyecto.supabase.co/functions/v1/get-profiles-directory?page=1&pageSize=20&country=USA&role=developer&skills=react,nodejs' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY'
```

```javascript
const params = new URLSearchParams({
  page: '1',
  pageSize: '20',
  country: 'USA',
  role: 'developer',
  skills: 'react,nodejs',
  search: 'senior'
});

const response = await fetch(
  `https://tu-proyecto.supabase.co/functions/v1/get-profiles-directory?${params}`,
  {
    headers: {
      'apikey': 'YOUR_SUPABASE_ANON_KEY'
    }
  }
);

const data = await response.json();
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "profiles": [
    {
      "id": "uuid-1",
      "handle": "john-doe",
      "full_name": "John Doe",
      "summary": "Experienced developer...",
      "avatar_url": "https://...",
      "role": "Senior Developer",
      "location": "New York, USA",
      "skills": ["React", "Node.js", "TypeScript"],
      "country": "USA",
      "city": "New York"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "cached": false
}
```

**Errores Posibles:**

| Status | Error                                    | Descripción                        |
|--------|------------------------------------------|------------------------------------|
| 400    | Invalid pagination parameters            | Parámetros de paginación inválidos |
| 429    | Rate limit exceeded                      | Límite de solicitudes excedido     |
| 500    | Failed to fetch profiles                 | Error al obtener perfiles          |

---

## Endpoints Protegidos (Requieren Autenticación)

### 3. Exportar PDF

Genera un CV en formato PDF optimizado para ATS.

**Endpoint:** `POST /export-pdf`

**Headers Requeridos:**

```http
Authorization: Bearer YOUR_JWT_TOKEN
apikey: YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Body de la Solicitud:**

```json
{
  "profileId": "uuid-123",
  "template": "modern",
  "language": "en",
  "options": {
    "includePhoto": true,
    "includeStamps": true,
    "includeSummary": true,
    "includeSkills": true,
    "includeLanguages": true,
    "includePortfolio": true,
    "includeCertifications": true
  }
}
```

**Parámetros del Body:**

| Campo      | Tipo   | Requerido | Valores Posibles           | Default  |
|------------|--------|-----------|----------------------------|----------|
| profileId  | string | Sí        | UUID del perfil            | -        |
| template   | string | No        | classic, modern, minimal   | modern   |
| language   | string | No        | en, es                     | en       |
| options    | object | No        | Ver opciones abajo         | {}       |

**Opciones Disponibles:**

| Opción                  | Tipo    | Default | Descripción                           |
|------------------------|---------|---------|---------------------------------------|
| includePhoto           | boolean | true    | Incluir foto de perfil                |
| includeStamps          | boolean | true    | Incluir sellos de verificación        |
| includeSummary         | boolean | true    | Incluir resumen profesional           |
| includeSkills          | boolean | true    | Incluir habilidades                   |
| includeLanguages       | boolean | true    | Incluir idiomas                       |
| includePortfolio       | boolean | true    | Incluir portafolio (máx 5 proyectos)  |
| includeCertifications  | boolean | true    | Incluir certificaciones               |

**Ejemplo de Solicitud:**

```javascript
const response = await fetch(
  'https://tu-proyecto.supabase.co/functions/v1/export-pdf',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': 'YOUR_SUPABASE_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      profileId: 'uuid-123',
      template: 'modern',
      language: 'en',
      options: {
        includePhoto: true,
        includeStamps: true
      }
    })
  }
);

// Descargar el PDF
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'cv-john-doe-modern-2024-11-29.pdf';
a.click();
```

**Respuesta Exitosa (200 OK):**

El endpoint devuelve un archivo PDF binario con los siguientes headers:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="cv-john-doe-modern-2024-11-29.pdf"
Content-Length: 245678
```

**Errores Posibles:**

| Status | Error                              | Descripción                           |
|--------|------------------------------------|---------------------------------------|
| 400    | Profile ID is required             | Falta el ID del perfil                |
| 401    | Unauthorized                       | Token inválido o expirado             |
| 403    | Profile not found or access denied | No tienes acceso a este perfil        |
| 500    | Internal server error              | Error al generar el PDF               |

---

### 4. Exportar DOCX

Genera un CV en formato Microsoft Word (.docx) optimizado para ATS.

**Endpoint:** `POST /export-docx`

**Headers y Body:** Idénticos al endpoint `/export-pdf`

**Respuesta Exitosa (200 OK):**

```http
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="cv-john-doe-modern-2024-11-29.docx"
Content-Length: 187456
```

---

### 5. Optimizar Descripción con IA

Optimiza descripciones de experiencia laboral usando IA para mejorar ATS scoring.

**Endpoint:** `POST /ai-optimize-description`

**Body de la Solicitud:**

```json
{
  "description": "Trabajé como desarrollador en varios proyectos web usando React y Node",
  "role": "Senior Full Stack Developer",
  "language": "es"
}
```

**Parámetros del Body:**

| Campo       | Tipo   | Requerido | Descripción                      |
|-------------|--------|-----------|----------------------------------|
| description | string | Sí        | Descripción a optimizar          |
| role        | string | No        | Rol/título del puesto            |
| language    | string | No        | Idioma (en/es)                   |

**Ejemplo de Solicitud:**

```javascript
const response = await fetch(
  'https://tu-proyecto.supabase.co/functions/v1/ai-optimize-description',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': 'YOUR_SUPABASE_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Trabajé como desarrollador en varios proyectos web',
      role: 'Senior Full Stack Developer',
      language: 'es'
    })
  }
);

const data = await response.json();
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "optimized_description": "Lideré el desarrollo de aplicaciones web escalables utilizando React.js para el frontend y Node.js para el backend. Implementé arquitecturas de microservicios que mejoraron el rendimiento en un 40% y redujeron los tiempos de carga en un 60%. Colaboré con equipos multifuncionales para entregar soluciones de alta calidad cumpliendo con los plazos establecidos.",
  "improvements": [
    "Verbos de acción más impactantes",
    "Métricas cuantificables añadidas",
    "Tecnologías específicas mencionadas",
    "Estructura optimizada para ATS"
  ]
}
```

---

### 6. Rastrear Analíticas

Registra eventos de analíticas para tracking de perfiles.

**Endpoint:** `POST /track-analytics`

**Body de la Solicitud:**

```json
{
  "profileId": "uuid-123",
  "event": "profile_view",
  "metadata": {
    "source": "company_search",
    "company_id": "uuid-456",
    "timestamp": "2024-11-29T10:00:00.000Z"
  }
}
```

**Eventos Disponibles:**

- `profile_view` - Vista del perfil
- `cv_download` - Descarga de CV
- `contact_info_view` - Vista de información de contacto
- `profile_share` - Compartir perfil
- `stamp_verification` - Verificación de sello

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Analytics event tracked successfully"
}
```

---

## Endpoints de Verificación

### 7. Verificar Email

Envía un código de verificación al email del usuario.

**Endpoint:** `POST /send-verification-email`

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "userId": "uuid-123"
}
```

**Respuesta (200 OK):**

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

---

### 8. Verificar Código de Email

Verifica el código enviado al email.

**Endpoint:** `POST /verify-email-code`

**Body:**

```json
{
  "userId": "uuid-123",
  "code": "123456"
}
```

**Respuesta (200 OK):**

```json
{
  "success": true,
  "verified": true,
  "stamp_id": "uuid-789"
}
```

---

### 9. Verificar Teléfono (SMS)

Envía un código de verificación vía SMS.

**Endpoint:** `POST /send-verification-sms`

**Body:**

```json
{
  "phone": "+1234567890",
  "userId": "uuid-123"
}
```

---

### 10. Verificar Código de Teléfono

Verifica el código enviado por SMS.

**Endpoint:** `POST /verify-phone-code`

**Body:**

```json
{
  "userId": "uuid-123",
  "code": "123456"
}
```

---

## Webhooks

YourCVPassport puede enviar webhooks a tu sistema cuando ocurren eventos importantes.

### Configuración de Webhooks

Los webhooks se configuran a nivel de empresa en el panel de administración.

**Eventos Disponibles:**

- `profile.created` - Nuevo perfil creado
- `profile.updated` - Perfil actualizado
- `profile.verified` - Nueva verificación completada
- `lead.created` - Nuevo lead generado
- `export.completed` - Exportación completada

### Formato del Webhook

**Headers:**

```http
Content-Type: application/json
X-Webhook-Signature: sha256=...
X-Webhook-Event: profile.updated
```

**Payload de Ejemplo:**

```json
{
  "event": "profile.updated",
  "timestamp": "2024-11-29T10:00:00.000Z",
  "data": {
    "profile_id": "uuid-123",
    "handle": "john-doe",
    "changes": {
      "email": "nuevo@email.com",
      "skills": ["React", "Node.js", "TypeScript"]
    }
  }
}
```

### Verificar Firma del Webhook

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === `sha256=${hash}`;
}
```

---

## Códigos de Estado HTTP

| Código | Significado              | Descripción                                    |
|--------|--------------------------|------------------------------------------------|
| 200    | OK                       | Solicitud exitosa                              |
| 201    | Created                  | Recurso creado exitosamente                    |
| 400    | Bad Request              | Parámetros inválidos o faltantes               |
| 401    | Unauthorized             | Autenticación requerida o token inválido       |
| 403    | Forbidden                | No tienes permisos para este recurso           |
| 404    | Not Found                | Recurso no encontrado                          |
| 429    | Too Many Requests        | Límite de rate limiting excedido               |
| 500    | Internal Server Error    | Error interno del servidor                     |
| 503    | Service Unavailable      | Servicio temporalmente no disponible           |

---

## Ejemplos de Integración

### Integración con Node.js

```javascript
const axios = require('axios');

class YourCVPassportAPI {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getProfile(handle) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/get-public-profile?handle=${handle}`,
        {
          headers: {
            'apikey': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.response.data);
      throw error;
    }
  }

  async searchProfiles(filters) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${this.baseUrl}/get-profiles-directory?${params}`,
      {
        headers: {
          'apikey': this.apiKey
        }
      }
    );
    return response.data;
  }

  async exportPDF(token, profileId, options) {
    const response = await axios.post(
      `${this.baseUrl}/export-pdf`,
      {
        profileId,
        template: options.template || 'modern',
        language: options.language || 'en',
        options: options.pdfOptions || {}
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  }
}

// Uso
const api = new YourCVPassportAPI(
  'your-anon-key',
  'https://your-project.supabase.co/functions/v1'
);

// Obtener perfil
const profile = await api.getProfile('john-doe');
console.log(profile);

// Buscar perfiles
const results = await api.searchProfiles({
  country: 'USA',
  role: 'developer',
  skills: 'react,nodejs',
  page: 1,
  pageSize: 20
});
console.log(results);
```

### Integración con Python

```python
import requests
import json

class YourCVPassportAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'apikey': api_key,
            'Content-Type': 'application/json'
        }

    def get_profile(self, handle):
        """Obtener perfil público por handle"""
        url = f"{self.base_url}/get-public-profile"
        params = {'handle': handle}

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def search_profiles(self, filters):
        """Buscar perfiles con filtros"""
        url = f"{self.base_url}/get-profiles-directory"

        response = requests.get(url, headers=self.headers, params=filters)
        response.raise_for_status()
        return response.json()

    def export_pdf(self, token, profile_id, template='modern', language='en'):
        """Exportar CV a PDF"""
        url = f"{self.base_url}/export-pdf"
        headers = {
            **self.headers,
            'Authorization': f'Bearer {token}'
        }

        payload = {
            'profileId': profile_id,
            'template': template,
            'language': language
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.content

# Uso
api = YourCVPassportAPI(
    api_key='your-anon-key',
    base_url='https://your-project.supabase.co/functions/v1'
)

# Obtener perfil
profile = api.get_profile('john-doe')
print(profile)

# Buscar perfiles
results = api.search_profiles({
    'country': 'USA',
    'role': 'developer',
    'skills': 'react,nodejs',
    'page': 1,
    'pageSize': 20
})
print(f"Found {results['total']} profiles")
```

### Integración con PHP

```php
<?php

class YourCVPassportAPI {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl) {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function getProfile($handle) {
        $url = $this->baseUrl . '/get-public-profile?handle=' . urlencode($handle);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('API request failed with status ' . $httpCode);
        }

        return json_decode($response, true);
    }

    public function searchProfiles($filters) {
        $queryString = http_build_query($filters);
        $url = $this->baseUrl . '/get-profiles-directory?' . $queryString;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Uso
$api = new YourCVPassportAPI(
    'your-anon-key',
    'https://your-project.supabase.co/functions/v1'
);

// Obtener perfil
$profile = $api->getProfile('john-doe');
print_r($profile);

// Buscar perfiles
$results = $api->searchProfiles([
    'country' => 'USA',
    'role' => 'developer',
    'skills' => 'react,nodejs',
    'page' => 1,
    'pageSize' => 20
]);
echo "Found {$results['total']} profiles\n";
?>
```

---

## Mejores Prácticas

### 1. Manejo de Errores

Siempre implementa manejo de errores robusto:

```javascript
async function fetchProfile(handle) {
  try {
    const response = await fetch(`/get-public-profile?handle=${handle}`);

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        console.log(`Rate limited. Retry after ${retryAfter} seconds`);
        // Implementar retry con backoff exponencial
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
}
```

### 2. Respetar Rate Limits

```javascript
class RateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.requestsPerMinute = 100;
    this.interval = 60000; // 1 minuto
  }

  async execute(fn) {
    this.queue.push(fn);
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      await fn();
      await this.wait(this.interval / this.requestsPerMinute);
    }

    this.processing = false;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Caché Local

Implementa caché local para reducir llamadas a la API:

```javascript
class CachedAPI {
  constructor(api) {
    this.api = api;
    this.cache = new Map();
    this.ttl = 3600000; // 1 hora
  }

  async getProfile(handle) {
    const cacheKey = `profile:${handle}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await this.api.getProfile(handle);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

### 4. Retry con Backoff Exponencial

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## Soporte y Recursos

- **Documentación:** [https://yourcvpassport.com/docs](https://yourcvpassport.com/docs)
- **API Status:** [https://status.yourcvpassport.com](https://status.yourcvpassport.com)
- **Soporte:** support@yourcvpassport.com
- **GitHub:** [https://github.com/yourcvpassport](https://github.com/yourcvpassport)

---

## Changelog

### v1.0.0 (2024-11-29)
- ✨ Lanzamiento inicial de la API
- 🔒 Autenticación JWT implementada
- ⚡ Rate limiting con Redis
- 📦 Caché automático de respuestas
- 📄 Endpoints de exportación PDF/DOCX
- 🤖 Optimización de descripciones con IA
- 📊 Sistema de analíticas
- ✅ Endpoints de verificación (Email/SMS)

---

## Términos de Uso

Al usar la API de YourCVPassport, aceptas:

1. Usar la API únicamente para propósitos legítimos de reclutamiento
2. No hacer scraping masivo de datos sin autorización
3. Respetar los límites de rate limiting
4. Proteger las credenciales de la API
5. Cumplir con GDPR y regulaciones de privacidad
6. No revender o redistribuir datos de la API

---

**¿Necesitas ayuda?** Contacta a nuestro equipo en support@yourcvpassport.com
