# GoFit - Plataforma de Gestión para Gimnasios

Plataforma integral de gestión para gimnasios con arquitectura multi-tenant.

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + React 19 + CSS Modules
- **Backend**: Node.js + Route Handlers
- **Base de datos**: PostgreSQL + Prisma ORM
- **Auth**: JWT con roles (ADMIN / PROFESSIONAL / CLIENT)

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar `env.example` a `.env` y configurar:

```bash
cp env.example .env
```

Editar `.env` con tu conexión a PostgreSQL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/gofit?schema=public"
JWT_SECRET="tu-secret-seguro"
```

### 3. Crear base de datos y ejecutar migraciones

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de prueba
npm run db:seed
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@gofit.com | admin123 |
| Profesional | entrenador@gofit.com | pro123 |
| Cliente | cliente@gofit.com | cliente123 |

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:seed` | Poblar base de datos |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:reset` | Resetear base de datos |

## Estructura del Proyecto

```
src/
├── app/                    # App Router (páginas y API)
│   ├── admin/             # Vista Admin
│   ├── client/            # Vista Cliente
│   ├── professional/      # Vista Profesional
│   ├── login/             # Página de login
│   └── api/               # Route Handlers
├── components/
│   └── ui/                # Componentes UI reutilizables
├── lib/                   # Utilidades (auth, prisma)
├── styles/                # Estilos globales y tokens
└── middleware.ts          # Protección de rutas
```

## Componentes UI

- **AppShell**: Layout principal con header
- **GlassCard**: Card con efecto glassmorphism
- **StatCard**: Card para métricas/estadísticas
- **RoutineCard**: Card para rutinas con imagen
- **ChartCard**: Card para gráficos con selector temporal
- **SegmentedControl**: Control segmentado (tabs)
- **PrimaryFab**: Botón flotante principal

## Design Tokens

Los tokens de diseño están en `src/styles/tokens.css`:

- Colores: `--color-bg-*`, `--color-text-*`, `--color-primary`
- Tipografía: SF Pro Display
- Espaciado: `--spacing-*`
- Bordes: `--radius-*`
- Glass: `--glass-bg`, `--glass-border`
