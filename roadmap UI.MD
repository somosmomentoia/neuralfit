GoFit – Roadmap de Desarrollo con Especificaciones de UI (v1.1)
0. Principio rector (leer antes de desarrollar)

La UI de GoFit NO es genérica.
Debe replicar fielmente la estética de los mocks provistos:

moderna

minimalista

dark mode first

glass / neon / contrastes fuertes

No se aceptan interpretaciones libres de diseño.

1. Lineamientos globales de UI / UX (OBLIGATORIOS)
1.1 Identidad visual

Tipografía

Familia principal: SF Pro Display

Uso:

Títulos grandes y métricas: Bold / Heavy

Subtítulos: Medium

Labels, helpers, metadata: Regular / Thin

No usar otras tipografías.

1.2 Paleta de colores (tokens obligatorios)
--color-bg-0: #171717;
--color-bg-1: #1B1C19;
--color-bg-2: #2F302E;

--color-text-0: #FFFFFF;
--color-text-1: #94978F;

--color-primary: #BCFF31;   /* neon green */
--color-secondary: #2563EB;

--glass-bg: rgba(255,255,255,0.06);
--glass-border: rgba(255,255,255,0.10);


El neon green se usa SOLO para:

CTAs

indicadores activos

highlights importantes

No saturar la UI con el color primario.

1.3 Fondos y profundidad

Fondo principal:

Gradiente verde difuso (como en los mocks)

Overlay oscuro para legibilidad

Cards:

efecto glassmorphism suave

blur sutil

borde fino translúcido

sombra mínima

Radios:

cards: 16–24px

botones: full rounded o 12–16px

2. Componentes UI base (design system mínimo)

Estos componentes deben existir y reutilizarse en TODA la app:

2.1 AppShell

Top bar fija

Contenido scroll

Mobile-first

Preparado para bottom navigation (futuro)

2.2 GlassCard

Contenedor base

Fondo glass

Padding generoso

Se usa en:

dashboard

métricas

rutinas

pagos

contabilidad

2.3 StatCard

Número grande (Bold)

Label chico (Thin)

Metadata secundaria (opcional)

Ejemplo:

deuda

pasos

intensidad

sesiones

2.4 RoutineCard

Imagen de fondo (foto entrenamiento)

Overlay negro (20–35%)

Título fuerte

Badges:

tipo de rutina

nivel

deporte (si aplica)

2.5 ChartCard

Gráfico dentro de GlassCard

Selector de rango:

semana / mes

Colores:

verde = actual

azul = histórico

2.6 Primary FAB

Botón circular

Color: #BCFF31

Uso:

acción principal de la vista

3. UX por rol (cómo navega cada uno)
3.1 Vista Cliente – One Page App (core del producto)

El cliente hace TODO desde el dashboard principal.
No hay navegación compleja.

Home / Dashboard

StatCards:

estado de deuda

próxima cuota

Rutina activa (RoutineCard grande)

CTA principal: “Entrenar”

Rutinas

Lista de RoutineCards

Navegación fluida:

Dashboard
  → Rutina
    → Ejercicio

Detalle Ejercicio

Título

Nivel de dificultad

Explicación clara

Video YouTube embebido

UI limpia, sin distracciones

Métricas

Gráficos:

intensidad semanal/mensual

dificultad acumulada

Selector temporal

Visual simple, clara, sin ruido

3.2 Vista Profesional – UX funcional

Layout más sobrio

Menos glass, más foco en productividad

Cards limpias

Prioridad:

clientes

rutinas

notas

3.3 Vista Admin – UX de gestión

UI clara, no “enterprise fea”

Tables limpias + cards resumen

Uso moderado del neon

Exportaciones claras y visibles

4. Rutinas – Especificación UI + dominio
Tipos de rutinas (visual + lógica)
Categorías principales

Musculación

Aeróbica

Deportista

Deportista – subcategorías (badge visible)

Fútbol

Pádel

Básquet

Boxeo

Rugby

Tenis

Vóley

Remo

Hockey

Handball

Atletismo

Natación

Cross training

Artes marciales

Ciclismo

Triatlón

Cada rutina muestra visualmente:

categoría

deporte (si aplica)

nivel

objetivo

5. Relación UI ↔ sistema (regla clave)

La UI manda sobre la arquitectura, no al revés.

Ejemplos:

Si una métrica se muestra “simple”, el backend debe devolverla ya procesada.

Si una rutina se ve como “snapshot”, el modelo debe reflejar snapshot.

No exponer lógica cruda en frontend.

6. Roadmap técnico (resumen, ya alineado con UI)

Las etapas técnicas que ya definimos (Auth, Admin, Rutinas, Pagos, Contabilidad, etc.) se mantienen, pero:

👉 cada módulo debe entregarse con su UI final, no wireframes ni placeholders.

7. Entregables obligatorios por etapa

Para Cloud Opus, cada etapa debe incluir:

✅ funcionalidad completa

✅ UI terminada y fiel a mocks

✅ responsive

✅ roles funcionando

✅ datos reales (no mockeados)

8. Regla final (muy importante)

Si algo no se parece visualmente a los mocks:
se considera incorrecto aunque funcione técnicamente.