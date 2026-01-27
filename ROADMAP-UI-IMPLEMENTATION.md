# GoFit - Roadmap de Implementación UI Detallada

## Análisis de Mocks - Especificaciones Exactas

---

## 1. VISTA CLIENTE (Mobile-First App)

### 1.1 Layout Principal

#### Header Fijo
```
┌─────────────────────────────────────────┐
│  ≡     TuGimnasio          🔔(badge)   │
└─────────────────────────────────────────┘
```
- **Posición**: Fixed top
- **Altura**: ~56px
- **Fondo**: Transparente o blur sutil
- **Elementos**:
  - Izquierda: Botón hamburguesa (≡) - 40x40px, fondo glass
  - Centro: Logo/Nombre del gimnasio (dinámico por tenant)
  - Derecha: Campana de notificaciones con badge rojo

#### Bottom Navigation Bar (WidgetBar Flotante)
```
┌─────────────────────────────────────────┐
│                                         │
│  🏠    💳    [QR]    🏋️    👤         │
│ Inicio Mi plan Ingreso Rutinas Perfil   │
│                                         │
└─────────────────────────────────────────┘
```
- **Posición**: Fixed bottom con `margin: 16px`
- **Estilo**: Card con `border-radius: 24px`, glassmorphism
- **Altura**: ~70px
- **Botón central QR**:
  - Sobresale hacia arriba (~20px)
  - Fondo verde neón (#BCFF31)
  - Icono QR en negro
  - Border-radius circular o pill
  - Tamaño: ~56px
- **Items normales**: 
  - Icono + label debajo
  - Color inactivo: gris (#94978F)
  - Color activo: blanco + indicador verde

#### Sidebar Menu (Card Colapsable con Morph)
```
┌──────────────────────┬──────────────────┐
│ ≡              <     │                  │
│                      │   (contenido     │
│ 👤 Ignacio Prado     │    página        │
│    PLAN PREMIUM      │    visible       │
│                      │    detrás        │
│ 🏠 Inicio            │    con blur)     │
│ 💳 Tu plan           │                  │
│ ➕ Apto médico       │                  │
│ 🎯 Tus rutinas       │                  │
│ 🏋️ Ejercicios        │                  │
│ ℹ️ Sobre GoFit       │                  │
│                      │                  │
│                      │                  │
│ 📄 Legales           │                  │
│ 🚪 Cerrar sesión     │                  │
└──────────────────────┴──────────────────┘
```
- **Ancho**: ~280px (80% del viewport)
- **Estilo**: Card con bordes redondeados, fondo oscuro sólido
- **Animación**: 
  - Efecto **morph/slide** desde la izquierda
  - Duración: 300ms ease-out
  - El contenido de atrás se desplaza y se ve con blur
- **Comportamiento**: Desaparece COMPLETAMENTE al cerrar (no quedan iconos)
- **Overlay**: Fondo semi-transparente clickeable para cerrar

---

### 1.2 Páginas del Cliente

#### 1.2.1 Inicio (`/client`)
```
┌─────────────────────────────────────────┐
│  ≡          Inicio           🔔        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Ignacio Prado                │   │
│  │    PLAN PREMIUM                 │   │
│  │    Activo ✓                     │   │
│  │─────────────────────────────────│   │
│  │ Vencimiento:  │  Apto médico:   │   │
│  │ 27/01/2026    │  Vigente        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Beneficios exclusivos                  │
│  ┌─────────┐ ┌─────────┐               │
│  │ Golden  │ │Farmalife│  →            │
│  │ 25% OFF │ │ 25% OFF │               │
│  └─────────┘ └─────────┘               │
│                                         │
│  Sedes en tu ciudad                     │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 Sucursal Junin    VER MAPA > │   │
│  │    Peatonal Junin 1336          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 Sucursal Centro   VER MAPA > │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠   💳   [QR]   🏋️   👤            │
└─────────────────────────────────────────┘
```

**Componentes**:
- `ProfileCard`: Avatar, nombre, plan, estado con badge verde
- `InfoDivider`: Vencimiento | Apto médico (con separador vertical)
- `BenefitsCarousel`: Cards horizontales con scroll, badge "25% OFF"
- `LocationCard`: Icono sede, nombre, dirección, botón "VER EN MAPA"

---

#### 1.2.2 Tu Plan (`/client/plan`)
```
┌─────────────────────────────────────────┐
│  ≡          Tu Plan          🔔        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Ignacio Prado                │   │
│  │                                 │   │
│  │    P L A N  P R E M I U M      │   │
│  │    Activo ✓                     │   │
│  │                                 │   │
│  │ Subscripción con Débito auto.   │   │
│  │ Vencimiento: 27/01/2026         │   │
│  │                                 │   │
│  │ ┌─────────────────────────┐    │   │
│  │ │     CAMBIAR PLAN        │    │   │
│  │ └─────────────────────────┘    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💳 Métodos de pago  CONFIGURAR >│   │
│  └─────────────────────────────────┘   │
│                                         │
│  Que incluye tu plan   [PREMIUM]        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏋️ SALA DE      │ 💃 CLASES DE │   │
│  │   MUSCULACIÓN   │    ZUMBA     │   │
│  │─────────────────┼──────────────│   │
│  │ 🏃 PATIO DE     │ 🧘 CLASES DE │   │
│  │   AERÓBICOS     │    YOGA      │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠   💳   [QR]   🏋️   👤            │
└─────────────────────────────────────────┘
```

**Componentes**:
- `PlanCard`: Info extendida del plan con botón "CAMBIAR PLAN"
- `PaymentMethodsCard`: Acceso a configurar métodos de pago
- `PlanBadge`: Badge verde "PREMIUM"
- `ServicesGrid`: Grid 2x2 con iconos y nombres de servicios incluidos

---

#### 1.2.3 Rutinas (`/client/routines`)
```
┌─────────────────────────────────────────┐
│  ≡          Rutinas          🔔        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Buscar                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────┬─────────────────┐   │
│  │      3        │       78        │   │
│  │   Rutinas     │    sesiones     │   │
│  │   activas     │  este mes       │   │
│  └───────────────┴─────────────────┘   │
│                                         │
│  Rutinas asignadas                      │
│  ┌─────────┐ ┌─────────┐               │
│  │    1    │ │    2    │               │
│  │Musculac.│ │Aeróbica │               │
│  └─────────┘ └─────────┘               │
│                                         │
│  Últimos entrenamientos                 │
│  ┌─────────────────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠   💳   [QR]   🏋️   👤            │
└─────────────────────────────────────────┘
```

**Componentes**:
- `SearchBar`: Input con icono de búsqueda
- `StatsRow`: Dos cards con números grandes y labels
- `CategoryCards`: Cards pequeñas con número y categoría
- `WorkoutHistory`: Lista de entrenamientos recientes (progress bars o cards)

---

#### 1.2.4 Ingreso QR (`/client/checkin`)
```
┌─────────────────────────────────────────┐
│  ≡          Ingreso          🔔        │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │   [QR CODE]     │             │
│         │                 │             │
│         │   Ignacio P.    │             │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│         Mostrá este código              │
│         al ingresar al gym              │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠   💳   [QR]   🏋️   👤            │
└─────────────────────────────────────────┘
```

**Componentes**:
- `QRCodeDisplay`: Código QR generado con ID del cliente
- Instrucciones de uso

---

#### 1.2.5 Perfil (`/client/profile`)
- Datos personales editables
- Foto de perfil
- Cambiar contraseña
- Preferencias de notificaciones

#### 1.2.6 Apto Médico (`/client/medical`)
- Subir certificado médico (imagen/PDF)
- Ver estado actual
- Fecha de vencimiento

#### 1.2.7 Ejercicios (`/client/exercises`)
- Biblioteca de ejercicios disponibles
- Filtros por categoría/músculo
- Videos tutoriales

#### 1.2.8 Sobre GoFit (`/client/about`)
- Info de la app
- Versión
- Contacto

---

## 2. VISTA PROFESIONAL

### 2.1 Layout Principal

#### Diferencias con Cliente:
- **NO tiene Bottom Navigation Bar**
- **Sidebar colapsable** que al minimizar **MUESTRA ICONOS** (no desaparece)
- Sidebar más amplia para desktop/tablet

```
Estado Expandido:                    Estado Colapsado:
┌────────────────┬───────────────┐   ┌────┬──────────────────────┐
│ ≡ GoFit       │               │   │ ≡  │                      │
│               │               │   │    │                      │
│ 👤 Nombre     │   Contenido   │   │ 🏠 │     Contenido        │
│    Coach      │   Principal   │   │ 👥 │     Principal        │
│               │               │   │ 🏋️ │                      │
│ 🏠 Dashboard  │               │   │ 📋 │                      │
│ 👥 Clientes   │               │   │    │                      │
│ 🏋️ Ejercicios │               │   │    │                      │
│ 📋 Rutinas    │               │   │    │                      │
│               │               │   │    │                      │
│ 🚪 Salir      │               │   │ 🚪 │                      │
└────────────────┴───────────────┘   └────┴──────────────────────┘
```

### 2.2 Páginas del Profesional

- `/professional` - Dashboard con stats
- `/professional/clients` - Lista de clientes asignados
- `/professional/clients/[id]` - Detalle de cliente
- `/professional/exercises` - Gestión de ejercicios
- `/professional/routines` - Gestión de rutinas
- `/professional/routines/[id]` - Editor de rutina

---

## 3. VISTA ADMINISTRADOR

### 3.1 Layout Principal

Mismo formato que Profesional:
- Sidebar colapsable con iconos visibles al minimizar
- Sin Bottom Navigation Bar

### 3.2 Páginas del Admin

- `/admin` - Dashboard con métricas
- `/admin/leads` - CRM de leads
- `/admin/clients` - Gestión de clientes
- `/admin/professionals` - Gestión de profesionales
- `/admin/exercises` - Biblioteca de ejercicios
- `/admin/routines` - Templates de rutinas
- `/admin/plans` - Gestión de planes
- `/admin/billing` - Facturación
- `/admin/settings` - Configuración del gym

---

## 4. ESPECIFICACIONES TÉCNICAS

### 4.1 Tokens CSS Actualizados

```css
:root {
  /* Colores base */
  --color-bg-0: #0A0A0A;        /* Fondo principal más oscuro */
  --color-bg-1: #111111;        /* Cards */
  --color-bg-2: #1A1A1A;        /* Elementos elevados */
  
  /* Gradiente de fondo */
  --gradient-bg: linear-gradient(
    180deg, 
    rgba(34, 197, 94, 0.15) 0%, 
    rgba(10, 10, 10, 1) 40%
  );
  
  /* Colores de texto */
  --color-text-0: #FFFFFF;
  --color-text-1: #94978F;
  --color-text-2: #6B6B6B;
  
  /* Acentos */
  --color-primary: #BCFF31;     /* Verde neón */
  --color-primary-dark: #9AE600;
  --color-secondary: #2563EB;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Glass */
  --glass-bg: rgba(17, 17, 17, 0.8);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(20px);
  
  /* Bordes */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Espaciado */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  
  /* Tipografía */
  --font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  
  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
  
  /* Sombras */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(188, 255, 49, 0.3);
  
  /* Z-index */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

### 4.2 Componentes Base Requeridos

```
/src/components/
├── layout/
│   ├── ClientLayout.tsx          # Layout completo cliente
│   ├── ClientHeader.tsx          # Header con hamburguesa y notif
│   ├── ClientBottomNav.tsx       # WidgetBar flotante con QR
│   ├── ClientSidebar.tsx         # Sidebar morph colapsable
│   ├── ProfessionalLayout.tsx    # Layout profesional
│   ├── AdminLayout.tsx           # Layout admin
│   └── CollapsibleSidebar.tsx    # Sidebar con iconos al colapsar
│
├── ui/
│   ├── GlassCard.tsx             # Card con glassmorphism
│   ├── ProfileCard.tsx           # Card de perfil usuario
│   ├── PlanCard.tsx              # Card de plan con detalles
│   ├── StatCard.tsx              # Card de estadística
│   ├── BenefitCard.tsx           # Card de beneficio/descuento
│   ├── LocationCard.tsx          # Card de sede/sucursal
│   ├── ServiceItem.tsx           # Item de servicio incluido
│   ├── Badge.tsx                 # Badge (PREMIUM, 25% OFF, etc)
│   ├── SearchBar.tsx             # Barra de búsqueda
│   ├── QRCode.tsx                # Generador de QR
│   └── NotificationBell.tsx      # Campana con badge
│
├── navigation/
│   ├── NavItem.tsx               # Item de navegación
│   ├── BottomNavItem.tsx         # Item del bottom nav
│   └── QRButton.tsx              # Botón QR central especial
│
└── common/
    ├── Avatar.tsx                # Avatar de usuario
    ├── Button.tsx                # Botones
    ├── IconButton.tsx            # Botón solo icono
    ├── Divider.tsx               # Separador
    └── Carousel.tsx              # Carrusel horizontal
```

---

## 5. PLAN DE IMPLEMENTACIÓN

### Fase 1: Sistema de Layout (2-3 días) ✅ COMPLETADO
1. ✅ Actualizar tokens CSS globales
2. ✅ Crear `ClientLayout` con header y bottom nav
3. ✅ Implementar `ClientSidebar` con efecto morph (card flotante)
4. ✅ Crear `CollapsibleSidebar` para admin/profesional
5. ✅ Implementar animaciones y transiciones
6. ✅ Botones isla flotante en header (menú y notificación)
7. ✅ Bottom nav como card flotante con sombra

### Fase 2: Componentes UI Base (2 días) ✅ COMPLETADO
1. ✅ `GlassCard` mejorado
2. ✅ `ProfileCard` con avatar y estado
3. ✅ `Badge` con variantes
4. ✅ `SearchBar`
5. ✅ `NotificationBell` con badge
6. ✅ `BottomNavItem` y `QRButton` central destacado

### Fase 3: Páginas Cliente (3-4 días) ✅ COMPLETADO
1. ✅ `/client` - Inicio con ProfileCard, Beneficios, Sedes
2. ✅ `/client/plan` - Tu Plan con servicios incluidos
3. ✅ `/client/routines` - Rutinas con stats y categorías
4. ✅ `/client/checkin` - QR de ingreso
5. ✅ `/client/profile` - Perfil editable
6. ✅ `/client/medical` - Apto médico con upload
7. ✅ `/client/exercises` - Biblioteca de ejercicios
8. ✅ `/client/about` - Sobre GoFit

### Fase 4: Páginas Profesional (2 días) ✅ COMPLETADO
1. ✅ Layout con sidebar colapsable (iconos visibles)
2. ✅ Dashboard con stats reales
3. ✅ Lista de clientes asignados
4. ✅ Gestión de ejercicios con modal
5. ✅ Gestión de rutinas con modal

### Fase 5: Páginas Admin (2 días) ✅ COMPLETADO
1. ✅ Layout con sidebar colapsable
2. ✅ Dashboard con métricas
3. ✅ CRM de Leads
4. ✅ Gestión de Clientes con detalle
5. ✅ Gestión de Profesionales
6. ✅ Gestión de Ejercicios
7. ✅ Gestión de Rutinas

### Fase 6: Pulido y Animaciones (1 día) ✅ EN PROGRESO
1. ✅ Efecto morph del sidebar cliente (card flotante)
2. ✅ Transiciones suaves cubic-bezier
3. ✅ Micro-interacciones hover/active
4. 🔄 Testing responsive
5. 🔄 Ajustes finales según feedback

---

## 6. DETALLES DE ANIMACIÓN

### Sidebar Cliente (Morph Effect)
```css
/* Estado cerrado */
.sidebar {
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 200ms ease;
}

/* Estado abierto */
.sidebar.open {
  transform: translateX(0);
  opacity: 1;
}

/* Overlay */
.overlay {
  background: rgba(0, 0, 0, 0);
  transition: background 300ms ease;
}

.overlay.visible {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Contenido principal se desplaza */
.mainContent {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}

.mainContent.shifted {
  transform: translateX(40px);
}
```

### Bottom Nav Hover
```css
.navItem {
  transition: transform 150ms ease, color 150ms ease;
}

.navItem:active {
  transform: scale(0.95);
}

.qrButton {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.qrButton:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(188, 255, 49, 0.4);
}
```

---

## 7. RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
@media (min-width: 375px) { /* iPhone SE */ }
@media (min-width: 428px) { /* iPhone Pro Max */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

---

## 8. CHECKLIST FINAL

### Por cada página:
- [ ] UI fiel al mock
- [ ] Responsive (mobile-first)
- [ ] Datos reales (no mockeados)
- [ ] Animaciones implementadas
- [ ] Estados de loading
- [ ] Estados vacíos
- [ ] Manejo de errores
- [ ] Roles funcionando

### Entregables:
- [ ] Funcionalidad completa
- [ ] UI terminada y fiel a mocks
- [ ] Responsive
- [ ] Roles funcionando
- [ ] Datos reales

---

*Este roadmap debe seguirse al pie de la letra. Cada componente y página debe coincidir visualmente con los mocks proporcionados.*
