# 🎯 Dashboard Tour - Tutorial Interactivo

## Descripción

El **Dashboard Tour** es un tutorial paso a paso **modal bloqueante** que se muestra automáticamente la primera vez que un usuario inicia sesión en el dashboard. Explica cada sección del dashboard y obliga al usuario a completarlo o omitirlo explícitamente.

---

## ✨ Características

### 1. **Modal Bloqueante**
- ✅ El usuario **NO PUEDE** hacer clic fuera del tour
- ✅ El overlay oscuro bloquea todas las interacciones
- ✅ Solo se puede interactuar con:
  - El tooltip del tour (botones de navegación)
  - El elemento resaltado actualmente
- ✅ El usuario **DEBE** completar el tour o hacer clic en "Saltar Tutorial"

### 2. **Visual**
- Overlay oscuro con blur (60% opacidad)
- Elemento resaltado con borde azul animado (pulso)
- Tooltip posicionado dinámicamente según el elemento
- Flecha que apunta al elemento resaltado
- Barra de progreso visual
- Mensaje de advertencia en el primer paso

### 3. **Navegación**
- **Siguiente**: Avanza al siguiente paso
- **Atrás**: Retrocede al paso anterior (solo después del primero)
- **Saltar Tutorial**: Omite el tour y guarda que fue completado
- **Cerrar (X)**: Mismo comportamiento que "Saltar Tutorial"
- **Finalizar**: Aparece en el último paso

### 4. **Persistencia**
- El tour se muestra **SOLO UNA VEZ** por usuario
- Se guarda en `localStorage` con la clave: `dashboardTourCompleted_{userId}`
- Si el usuario lo completa o lo omite, no volverá a aparecer

---

## 📋 Pasos del Tour

| Paso | Elemento Target | Título | Descripción |
|------|----------------|--------|-------------|
| 1 | `data-tour="welcome"` | Bienvenido a tu Dashboard | Presentación del panel principal |
| 2 | `data-tour="quick-actions"` | Acciones Rápidas | Botones de acceso rápido |
| 3 | `data-tour="profile-completion"` | Completitud del Perfil | Indicador circular de progreso |
| 4 | `data-tour="stats"` | Estadísticas en Tiempo Real | Tarjetas con métricas |
| 5 | `data-tour="chart"` | Gráfico de Visitas Semanales | Visualización de visitas |
| 6 | `data-tour="next-steps"` | Próximos Pasos | Lista de tareas |
| 7 | `data-tour="quality-score"` | Puntuación de Calidad | Análisis con IA |
| 8 | `data-tour="sidebar"` | Menú de Navegación Completo | Resumen de todos los apartados disponibles |

---

## 🧪 Cómo Probar el Tour

### Método 1: Borrar localStorage (Recomendado)
1. Abrir DevTools (F12)
2. Ir a la pestaña **Application** > **Local Storage**
3. Buscar la clave `dashboardTourCompleted_{userId}` y eliminarla
4. Recargar la página

### Método 2: Desde la Consola del Navegador
```javascript
// Borrar el tour completado para el usuario actual
localStorage.removeItem('dashboardTourCompleted_tu-user-id-aqui');
// O borrar todos los tours
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('dashboardTourCompleted_')) {
    localStorage.removeItem(key);
  }
});
// Recargar la página
location.reload();
```

### Método 3: Usar el Hook Programáticamente
```typescript
// En el componente, puedes agregar un botón para resetear el tour
import { useDashboardTour } from '../../hooks/useDashboardTour';

const { resetTour } = useDashboardTour(profile?.id);

// En un botón:
<button onClick={resetTour}>Reiniciar Tour</button>
```

---

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos
1. **`components/dashboard/DashboardTour.tsx`**
   - Componente principal del tour
   - Maneja la lógica de navegación y posicionamiento
   - Estilos CSS globales para el bloqueo modal

2. **`hooks/useDashboardTour.ts`**
   - Hook personalizado para gestionar el estado del tour
   - Funciones: `showTour`, `completeTour`, `skipTour`, `resetTour`
   - Persistencia en localStorage

### Archivos Modificados
1. **`components/dashboard/ModernDashboardView.tsx`**
   - Importa `DashboardTour` y `useDashboardTour`
   - Agrega atributos `data-tour` a 8 secciones clave (incluyendo el menú lateral)
   - Renderiza el tour condicionalmente con `{showTour && <DashboardTour />}`

---

## 🎨 Personalización

### Cambiar los Pasos del Tour
Edita el objeto `tourSteps` en `DashboardTour.tsx`:

```typescript
const tourSteps: Record<string, TourStep[]> = {
  es: [
    {
      target: '[data-tour="mi-elemento"]',
      title: 'Título del Paso',
      content: 'Descripción detallada del paso',
      placement: 'bottom', // 'top' | 'bottom' | 'left' | 'right'
    },
    // ... más pasos
  ],
  en: [
    // ... versión en inglés
  ],
};
```

### Agregar Nuevos Elementos al Tour
1. Agrega el atributo `data-tour="nombre-unico"` al elemento HTML:
```tsx
<div data-tour="mi-nueva-seccion">
  {/* contenido */}
</div>
```

2. Agrega el paso correspondiente en `tourSteps`

---

## 🔒 Cómo Funciona el Bloqueo Modal

El tour utiliza CSS para bloquear todas las interacciones excepto con el tooltip y el elemento resaltado:

```css
/* Bloquear todas las interacciones */
body:has(.tour-highlight) * {
  pointer-events: none !important;
}

/* Permitir interacción solo con el tooltip y el elemento resaltado */
body:has(.tour-highlight) .tour-highlight,
body:has(.tour-highlight) [class*="fixed"][class*="z-[9999]"] {
  pointer-events: auto !important;
}
```

**Niveles de z-index:**
- Overlay: `z-[9998]`
- Elemento resaltado: `z-9997`
- Tooltip: `z-[9999]`

---

## 🌐 Traducciones

El tour soporta **español** e **inglés** automáticamente según el idioma del usuario (`useLanguage()`).

Para agregar más idiomas, edita el objeto `tourSteps` en `DashboardTour.tsx`.

---

## ⚙️ Configuración

### Retraso antes de mostrar el tour
Actualmente: **1 segundo** (para asegurar que el DOM esté listo)

Para cambiar, edita `useDashboardTour.ts`:
```typescript
setTimeout(() => {
  setShowTour(true);
  setIsLoading(false);
}, 1000); // <-- Cambia este valor (en milisegundos)
```

### Deshabilitar el tour temporalmente
En `ModernDashboardView.tsx`, comenta la línea:
```typescript
// {showTour && <DashboardTour onComplete={completeTour} onSkip={skipTour} />}
```

---

## 🐛 Troubleshooting

### El tour no aparece
1. Verifica que el usuario tenga un `profile.id` válido
2. Verifica que no exista la clave en localStorage
3. Revisa la consola del navegador por errores

### El elemento no se resalta correctamente
1. Verifica que el atributo `data-tour` esté correctamente escrito
2. Asegúrate de que el elemento esté visible en el DOM (no oculto por CSS)
3. Revisa que el selector en `tourSteps` coincida con el atributo

### Los clics aún funcionan fuera del tour
1. Verifica que el CSS se esté aplicando correctamente
2. Revisa que no haya otros elementos con `z-index` mayor que 9999
3. Asegúrate de que el navegador soporte `:has()` (la mayoría de navegadores modernos lo soportan)

---

## 📝 Notas Adicionales

- El tour se adapta automáticamente al modo oscuro
- El posicionamiento del tooltip se ajusta si sale de pantalla
- La animación de pulso del elemento resaltado mejora la visibilidad
- El mensaje de advertencia en el primer paso informa al usuario que el dashboard está bloqueado

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Agregar sonidos de navegación
- [ ] Permitir que el tour se pueda pausar y reanudar
- [ ] Agregar mini-tour opcionales para nuevas funciones
- [ ] Dashboard de admin para ver estadísticas de cuántos usuarios completan el tour
- [ ] Agregar tips contextuales después del tour
- [ ] Permitir que el usuario pueda volver a ver el tour desde configuración

---

¡El tour está listo para usar! 🎉
