---

# 📌 GoFit – Roadmap de Desarrollo (v1.0)

## 1. Visión general del producto

**GoFit** es una plataforma de gestión integral para gimnasios con tres vistas principales:

* **Admin (Gym Management / Backoffice)**
* **Profesional (Entrenador / Coach)**
* **Cliente (App tipo one-page moderna de gimnasio)**

El sistema debe ser:

* **Multi-tenant por gimnasio** (base obligatoria aunque haya un solo gym en MVP)
* Escalable a múltiples sedes, planes, profesionales y miles de usuarios
* UI moderna, minimalista, oscura, fiel a los mocks provistos
* Arquitectura preparada para crecer (pagos reales, tracking avanzado, mobile app futura)

---

## 2. Stack tecnológico obligatorio

### Frontend

* **Next.js (App Router)**
* **React**
* **CSS Modules** (❌ no Tailwind)
* Tipografía: **SF Pro Display / SF Pro Text**
* Charts: Recharts o Chart.js (encapsulados)

### Backend

* **Node.js**
* API integrada en Next (Route Handlers) o servicio separado (criterio técnico)
* **PostgreSQL**
* ORM: **Prisma**

### Auth & Seguridad

* Autenticación con roles (**ADMIN / PROFESSIONAL / CLIENT**)
* Middleware de protección por rol
* Arquitectura **RBAC simple pero extensible**

### Pagos

* Simulación MercadoPago (MVP)
* Registro manual de pagos en local
* Estructura preparada para MP real

---

## 3. Arquitectura base (obligatoria)

### Multi-tenant

Todo el sistema debe colgar de `gym_id`.

Ejemplo:

* usuarios
* ejercicios
* rutinas
* pagos
* contabilidad

Nada debe quedar “hardcodeado” a un solo gimnasio.

---

## 4. Roles y responsabilidades

### ADMIN

* Gestión de leads
* Conversión lead → cliente
* Gestión de clientes
* Gestión de profesionales
* Control de ejercicios (crear / aprobar / editar)
* Control de rutinas base
* Pagos y suscripciones
* Contabilidad y balance
* Reportes exportables

### PROFESSIONAL

* Crear ejercicios
* Crear rutinas (desde base de ejercicios)
* Asignar rutinas a clientes asignados
* Notas privadas por cliente
* Ver progreso de sus clientes

### CLIENT

* Dashboard principal (one-page app)
* Ver rutinas asignadas
* Ver detalle de ejercicios (explicación + video)
* Ver métricas de intensidad/dificultad
* Ver estado de deuda
* Pagar cuotas

---

## 5. Tipos de rutinas (core del sistema)

### Categorías principales

* **Musculación**
* **Aeróbica**
* **Deportista**

### Subcategorías – Deportista

Debe existir un enum/extensible table para deportes:

* Fútbol
* Pádel
* Básquet
* Boxeo
* Rugby
* Tenis
* Vóley
* Remo
* Hockey
* Handball
* Cross Training
* Atletismo
* Natación
* Artes marciales
* Ciclismo
* Triatlón

> El sistema debe permitir agregar nuevos deportes sin tocar código core (tabla + admin UI).

---

## 6. Módulos del sistema (por etapas)

---

## ETAPA 1 – Fundaciones técnicas

### 1.1 Setup

* Repositorio
* Configuración Next + Prisma + Postgres
* Variables de entorno
* Estructura modular (components / modules / services)

### 1.2 Auth + Roles

* Login
* Middleware por rol
* Protección de rutas

### 1.3 Diseño base

* Tokens CSS globales
* Componentes UI base:

  * GlassCard
  * StatCard
  * RoutineCard
  * ChartCard
  * PrimaryFab
  * SegmentedControl

---

## ETAPA 2 – Admin (Gestión interna)

### 2.1 Leads (CRM)

* Alta de lead
* Estados:

  * nuevo
  * contactado
  * visitó
  * convertido
  * perdido
* Historial de acciones
* Conversión a cliente:

  * crea usuario
  * crea perfil cliente
  * asigna profesional
  * asigna plan

### 2.2 Clientes

* Ficha completa
* Estado de suscripción
* Estado de deuda
* Generación de link de acceso al portal cliente
* Historial de rutinas y pagos

### 2.3 Profesionales

* Alta / baja / edición
* Asignación de clientes
* Métricas de actividad

---

## ETAPA 3 – Ejercicios y rutinas

### 3.1 Ejercicios (Base global)

Cada ejercicio debe incluir:

* Nombre
* Grupo muscular
* Tipo (musculación / aeróbico / deporte)
* Deporte (si aplica)
* Nivel de dificultad (1–5)
* Explicación textual
* Video YouTube embed
* Estado (pendiente / aprobado)

### 3.2 Rutinas (Templates)

* Rutinas base (predefinidas)
* Rutinas personalizadas
* Asociación por:

  * tipo
  * objetivo
  * nivel
  * deporte (si aplica)

Cada rutina:

* Cover image
* Lista ordenada de ejercicios
* Sets / reps / descanso
* Intensidad

### 3.3 Asignación a clientes

* Snapshot de rutina al asignar
* Fechas de inicio/fin
* Estado (activa / finalizada)

---

## ETAPA 4 – Vista Profesional

* Lista de clientes asignados
* Creación de ejercicios
* Creación de rutinas
* Asignación de rutinas
* Notas privadas por cliente
* Vista de progreso general

---

## ETAPA 5 – Vista Cliente (One Page App)

### 5.1 Dashboard principal

* Estado de deuda
* Próximo vencimiento
* Rutina activa
* CTA principal a entrenar

### 5.2 Rutinas

* Cards con imagen + overlay oscuro
* Navegación:

  * rutina → ejercicios → detalle ejercicio

### 5.3 Detalle ejercicio

* Explicación
* Video embed YouTube
* Indicadores de dificultad

### 5.4 Métricas

* Gráficos de:

  * intensidad
  * dificultad acumulada
* Filtros:

  * semana
  * mes
* Datos calculados desde snapshots (MVP)

---

## ETAPA 6 – Pagos y suscripciones

### 6.1 Planes

* Mensual
* Trimestral
* Anual
* Configurables por admin

### 6.2 Facturación

* Generación de invoice mensual
* Estados:

  * pendiente
  * pagado
  * vencido

### 6.3 Pagos

* Simulación MercadoPago (cliente)
* Registro manual en local (admin)
* Historial completo

---

## ETAPA 7 – Contabilidad

### 7.1 Gastos

* Categoría
* Fecha
* Monto
* Nota

### 7.2 Ledger

* Ingresos (pagos)
* Egresos (gastos)
* Balance general

### 7.3 Reportes

* Export CSV / PDF
* Filtrado por fechas

---

## ETAPA 8 – Escalabilidad futura (dejado preparado)

* Pagos reales MercadoPago
* Tracking real de entrenamientos
* App mobile (React Native)
* Multi-sucursal por gimnasio
* Notificaciones push
* IA de recomendaciones (rutinas / cargas)

---

## 8. Principios no negociables

* ❌ No romper diseño (seguir mocks)
* ❌ No lógica hardcodeada
* ✅ Todo escalable
* ✅ Multi-tenant desde el inicio
* ✅ Código modular y documentado
* ✅ Base sólida antes de features “lindas”

---

Si querés, próximo paso puedo:

* convertir esto en **PDF formal para enviar**
* o bajarlo a **tickets técnicos (Jira / Linear style)** por sprint
* o armar el **modelo Prisma exacto** para que arranquen sin fricción
