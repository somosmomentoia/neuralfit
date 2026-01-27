# 🏋️ GoFit - Implementación de Sistema de Suscripciones Múltiples

## 📋 Resumen Ejecutivo

Este documento detalla la reestructuración arquitectónica de GoFit para soportar:
- **Usuarios independientes** que pueden usar la app sin suscripción activa
- **Múltiples membresías** a diferentes gimnasios
- **Ejercicios globales** disponibles para todos los usuarios
- **Compra de acceso flexible** (día, mes, débito automático)
- **Entrenamiento libre** sin necesidad de entrenador asignado

---

## 🎯 Objetivos del Cambio

### Problema Actual
1. Un usuario solo puede pertenecer a un gimnasio
2. El `ClientProfile` está atado a un `Gym` específico
3. Sin suscripción activa, el usuario no puede usar la app
4. Los ejercicios están vinculados a gimnasios específicos

### Solución Propuesta
1. Usuarios independientes del gimnasio (pueden existir sin suscripción)
2. Sistema de suscripciones múltiples (un usuario → N gimnasios)
3. Ejercicios globales disponibles para todos
4. Entrenamiento libre basado en ejercicios globales

---

## 🗄️ Cambios en el Modelo de Datos

### Modelo Actual (Simplificado)
```
User (1) ──────> (1) ClientProfile ──────> (1) Gym
                        │
                        └──> Plan, Routines, etc.
```

### Modelo Propuesto
```
User (1) ──────> (N) Subscription ──────> (1) Gym
  │                     │
  │                     └──> Plan, AssignedProfessional, Routines
  │
  └──> WorkoutSession (entrenamiento libre con ejercicios globales)
  
Exercise
  ├── gymId: null (GLOBAL - disponible para todos)
  └── gymId: "xxx" (ESPECÍFICO - solo para ese gym)
```

### Nuevas Tablas/Modificaciones

#### 1. Tabla `Subscription` (NUEVA)
```prisma
model Subscription {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  gymId                 String
  gym                   Gym      @relation(fields: [gymId], references: [id])
  planId                String?
  plan                  Plan?    @relation(fields: [planId], references: [id])
  
  // Estado de la suscripción
  status                SubscriptionStatus @default(PENDING)
  type                  SubscriptionType   @default(MONTHLY)
  
  // Fechas
  startDate             DateTime?
  endDate               DateTime?
  
  // Pago
  paymentMethod         PaymentMethod @default(MANUAL)
  autoRenew             Boolean   @default(false)
  
  // Profesional asignado (opcional)
  assignedProfessionalId String?
  assignedProfessional   ProfessionalProfile? @relation(fields: [assignedProfessionalId], references: [id])
  
  // Rutinas asignadas
  dayRoutineAssignments  DayRoutineAssignment[]
  workoutSessions        WorkoutSession[]
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([userId, gymId])
}

enum SubscriptionStatus {
  PENDING      // Esperando pago
  ACTIVE       // Activa
  EXPIRED      // Vencida
  CANCELLED    // Cancelada
  SUSPENDED    // Suspendida por falta de pago
}

enum SubscriptionType {
  DAY_PASS     // Pase por día
  WEEKLY       // Semanal
  MONTHLY      // Mensual
  QUARTERLY    // Trimestral
  ANNUAL       // Anual
}
```

#### 2. Modificación de `User`
```prisma
model User {
  // ... campos existentes ...
  
  // Datos de tarjeta (asociados al usuario, no a la suscripción)
  cardLastFour          String?
  cardBrand             String?
  cardExpiryMonth       Int?
  cardExpiryYear        Int?
  
  // Relaciones
  subscriptions         Subscription[]
  freeWorkoutSessions   WorkoutSession[] @relation("FreeWorkouts")
}
```

#### 3. Modificación de `Exercise`
```prisma
model Exercise {
  // ... campos existentes ...
  
  gymId        String?  // NULL = ejercicio global
  gym          Gym?     @relation(fields: [gymId], references: [id])
  isGlobal     Boolean  @default(false)
}
```

#### 4. Deprecar `ClientProfile`
- Migrar datos existentes a `Subscription`
- Mantener temporalmente para compatibilidad
- Eliminar en versión futura

---

## 📱 Cambios en el Frontend

### Vista de Inicio del Cliente (`/client`)

#### Antes
- Una card de perfil con un plan

#### Después
- **Swipe horizontal** de cards tipo "tarjeta de crédito"
- Cada card representa una membresía a un gimnasio
- Información mostrada:
  - Logo/nombre del gimnasio
  - Plan actual
  - Estado (Activo/Vencido/Pendiente)
  - Días restantes
  - Próximo pago

```jsx
<MembershipCarousel>
  <MembershipCard gym="GoFit Gimnasio" plan="Premium" status="active" daysLeft={25} />
  <MembershipCard gym="CrossFit Box" plan="Básico" status="expired" />
  <MembershipCard type="add" /> {/* Card para agregar nueva membresía */}
</MembershipCarousel>
```

### Vista Mi Plan (`/client/plan`)

#### Antes
- Muestra un solo plan

#### Después
- **Lista de membresías activas** (swipe cards)
- **Sección "Explorar Gimnasios"**
  - Lista de gimnasios disponibles en la plataforma
  - Filtros por ubicación, precio, características
  - Cada gym muestra sus planes disponibles
- **Opciones de compra**:
  - Pase por día
  - Suscripción mensual
  - Débito automático

### Vista de Rutinas (`/client/routines`)

#### Antes
- Muestra rutinas del único gym

#### Después
- **Selector de gimnasio** (si tiene múltiples membresías)
- **Modo libre** (si no tiene membresías o quiere entrenar por su cuenta)
  - Acceso a ejercicios globales
  - Crear rutina personalizada
  - Tracking de entrenamientos

### Vista de Ejercicios (`/client/exercises`)

#### Antes
- Solo ejercicios del gym asignado

#### Después
- **Tabs**: "Mis Gyms" | "Globales" | "Favoritos"
- Ejercicios globales siempre disponibles
- Ejercicios específicos de cada gym (si tiene membresía activa)

---

## 🔧 Cambios en el Backend

### Nuevos Endpoints

#### Suscripciones
```
GET    /api/client/subscriptions           # Listar mis suscripciones
POST   /api/client/subscriptions           # Crear nueva suscripción
GET    /api/client/subscriptions/:id       # Detalle de suscripción
PUT    /api/client/subscriptions/:id       # Actualizar suscripción
DELETE /api/client/subscriptions/:id       # Cancelar suscripción
```

#### Gimnasios Públicos
```
GET    /api/public/gyms                    # Listar gyms disponibles
GET    /api/public/gyms/:id                # Detalle de gym
GET    /api/public/gyms/:id/plans          # Planes de un gym
```

#### Ejercicios Globales
```
GET    /api/exercises/global               # Ejercicios globales
GET    /api/exercises/all                  # Todos (globales + de mis gyms)
```

#### Entrenamiento Libre
```
POST   /api/client/free-workout            # Iniciar entrenamiento libre
PUT    /api/client/free-workout/:id        # Actualizar progreso
POST   /api/client/free-workout/:id/complete # Completar
```

### Modificaciones a Endpoints Existentes

#### `/api/client/profile`
- Devolver lista de suscripciones en lugar de un solo perfil
- Mantener compatibilidad con respuesta anterior

#### `/api/client/routines/week`
- Aceptar parámetro `subscriptionId` para filtrar por gym
- Sin parámetro: mostrar rutinas de todas las suscripciones activas

---

## 🎨 Diseño de UI - Cards de Membresía

### Card de Membresía (Estilo Tarjeta de Crédito)
```
┌─────────────────────────────────────────┐
│  ┌────┐                                 │
│  │LOGO│  GOFIT GIMNASIO                 │
│  └────┘                                 │
│                                         │
│  PLAN PREMIUM                           │
│                                         │
│  ●  Activo                              │
│                                         │
│  Vence: 15/02/2026        25 días       │
└─────────────────────────────────────────┘
```

### Estados Visuales
- **Activo**: Borde verde, badge verde
- **Por vencer** (< 7 días): Borde amarillo, badge amarillo
- **Vencido**: Borde rojo, badge rojo, opacidad reducida
- **Pendiente**: Borde gris, badge gris

---

## 📊 Ejercicios Globales - Seed Data

### Categorías
1. **Pecho** (6 ejercicios)
2. **Espalda** (6 ejercicios)
3. **Hombros** (5 ejercicios)
4. **Bíceps** (4 ejercicios)
5. **Tríceps** (4 ejercicios)
6. **Piernas** (7 ejercicios)
7. **Core/Abdominales** (4 ejercicios)

### Lista de Ejercicios (36 total)

#### Pecho
1. Press de banca con barra
2. Press de banca inclinado
3. Press de banca declinado
4. Aperturas con mancuernas
5. Fondos en paralelas
6. Pullover con mancuerna

#### Espalda
7. Dominadas
8. Remo con barra
9. Remo con mancuerna
10. Jalón al pecho
11. Remo en polea baja
12. Peso muerto

#### Hombros
13. Press militar con barra
14. Press Arnold
15. Elevaciones laterales
16. Elevaciones frontales
17. Pájaros (rear delt fly)

#### Bíceps
18. Curl con barra
19. Curl con mancuernas
20. Curl martillo
21. Curl concentrado

#### Tríceps
22. Press francés
23. Extensiones en polea
24. Fondos en banco
25. Patada de tríceps

#### Piernas
26. Sentadilla con barra
27. Prensa de piernas
28. Extensiones de cuádriceps
29. Curl de isquiotibiales
30. Peso muerto rumano
31. Zancadas
32. Elevación de gemelos

#### Core/Abdominales
33. Crunch abdominal
34. Plancha
35. Russian twist
36. Elevación de piernas

---

## 📅 Plan de Implementación

### Fase 1: Base de Datos (Día 1-2)
- [ ] Modificar schema de Prisma
- [ ] Crear migración
- [ ] Script de migración de datos existentes
- [ ] Seed de ejercicios globales

### Fase 2: Backend (Día 3-4)
- [ ] Nuevos endpoints de suscripciones
- [ ] Endpoints de gyms públicos
- [ ] Modificar endpoints existentes
- [ ] Tests de integración

### Fase 3: Frontend - Vistas Principales (Día 5-7)
- [ ] Componente MembershipCard
- [ ] Componente MembershipCarousel
- [ ] Vista de inicio con swipe de cards
- [ ] Vista Mi Plan con lista de gyms

### Fase 4: Frontend - Funcionalidades (Día 8-10)
- [ ] Flujo de compra de membresía
- [ ] Selector de gym en rutinas
- [ ] Modo de entrenamiento libre
- [ ] Vista de ejercicios globales

### Fase 5: Testing y Pulido (Día 11-12)
- [ ] Testing E2E
- [ ] Ajustes de UI/UX
- [ ] Documentación
- [ ] Deploy

---

## ⚠️ Consideraciones de Migración

### Datos Existentes
1. Cada `ClientProfile` existente se convierte en una `Subscription`
2. Los datos de tarjeta se mueven al `User`
3. Las rutinas asignadas se vinculan a la nueva `Subscription`
4. Los `WorkoutSession` existentes se vinculan a la `Subscription` correspondiente

### Compatibilidad
- Mantener endpoints antiguos funcionando durante la transición
- Agregar deprecation warnings en logs
- Documentar cambios para el equipo

---

## 🚀 Próximos Pasos Inmediatos

1. **Revisar y aprobar este documento**
2. **Modificar schema de Prisma** con las nuevas tablas
3. **Crear seed de ejercicios globales** (36 ejercicios)
4. **Implementar endpoints básicos** de suscripciones
5. **Crear componentes de UI** para las cards de membresía

---

## 📝 Notas Adicionales

### Monetización
- Los gimnasios pagan por estar en la plataforma
- Los usuarios pagan a los gimnasios por las membresías
- GoFit puede cobrar comisión por transacción

### Escalabilidad
- El modelo soporta N gimnasios por usuario
- Cada gimnasio puede tener M planes
- Los ejercicios globales se comparten entre todos

### Seguridad
- Validar que el usuario tenga membresía activa para acceder a contenido del gym
- Los ejercicios globales son públicos
- Los datos de tarjeta se almacenan de forma segura (considerar integración con Stripe/MercadoPago)

---

*Documento creado: 16/01/2026*
*Versión: 1.0*
*Autor: Cascade AI + Equipo GoFit*
