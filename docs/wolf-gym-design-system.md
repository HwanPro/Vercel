# Wolf Gym Design System

## Colores

Los colores se manejan por rol, no por valor suelto. La fuente de verdad está en `src/app/globals.css` y `tailwind.config.ts`.

| Rol | Token | Hex | Uso |
| --- | --- | --- | --- |
| Fondo de app | `wolf-page` | `#f4f1ea` | Fondo general de pantallas administrativas |
| Superficie | `wolf-surface` | `#ffffff` | Paneles, modales, tablas y formularios |
| Superficie secundaria | `wolf-muted` | `#f7f8fa` | Agrupaciones internas y estados suaves |
| Texto principal | `wolf-ink` | `#141414` | Títulos, contenido principal y botones amarillos |
| Texto secundario | `wolf-subtle` | `#667085` | Descripciones, metadatos y labels |
| Borde | `wolf-border` | `#e5e7eb` | Divisores y contornos |
| Primario | `wolf-primary` | `#facc15` | Acción principal y marca |
| Primario fuerte | `wolf-primary-strong` | `#d9a300` | Íconos, foco y énfasis sobre blanco |
| Secundario | `wolf-secondary` | `#2563eb` | Acciones informativas como cobros |
| Éxito | `wolf-success` | `#16a34a` | Confirmaciones y estados correctos |
| Advertencia | `wolf-warning` | `#d97706` | Renovación próxima o atención requerida |
| Peligro | `wolf-danger` | `#dc2626` | Eliminación y errores |

## Tipografía

- Familia principal: Geist Sans.
- Familia mono: Geist Mono.
- Títulos: `font-black` solo para títulos de página o números principales.
- Texto de trabajo: `text-sm` o `text-base`.
- No usar texto negativo o demasiado pequeño dentro de botones.

## Escritura

- Usar sentence case: `Nuevo cliente`, `Registro de membresía`, `Guardar cliente`.
- Evitar MAYÚSCULAS sostenidas en labels y encabezados.
- Botones con verbos claros: `Guardar cambios`, `Registrar huella`, `Eliminar`.
- Estados cortos: `Registrada`, `Sin huella`, `Vence hoy`.

## Layout

- Admin: fondo `wolf-page`, paneles blancos y bordes suaves.
- Mobile: usar tarjetas operativas en lugar de tablas anchas.
- Desktop: tablas densas con encabezado sticky y scroll horizontal si hace falta.
- Modales: ancho máximo `48rem`, `96vw` en pantallas pequeñas, sin contenedores anidados que creen scroll horizontal.
