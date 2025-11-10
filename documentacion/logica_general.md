# Lógica general del frontend

Este documento resume la estructura y responsabilidades del frontend presente en el proyecto.
Se concentra en los archivos HTML, CSS y JavaScript que interactúan con el usuario.

## Estructura principal

Carpeta `public/` (archivos frontend):

- `index.html`  - Página principal con listado paginado de juegos. Contiene:
  - Header y botón para crear nuevo juego.
  - Controles: selector de límite por página (`#limitSelect`) y contador total (`#totalInfo`).
  - Estados: `#loadingState`, `#errorState`, `#emptyState`.
  - `#tableView` con `#gamesTableBody` para la vista de escritorio.
  - `#cardsView` para la vista móvil (tarjetas).
  - Paginación con `#pagination` y `#paginationContainer`.
  - Modal de eliminación `#deleteModal` y contenedor de toasts `#toastContainer`.
  - Lógica JS: carga paginada, cache simple (Map), debounce, render separado (tabla/cards) y manejo de eliminación.

- `create.html` - Formulario para crear un nuevo juego.
  - Campos principales: `nombre`, `genero`, `plataforma`, `precio`, `descripcion`.
  - Autosave en `localStorage` (clave `gameForm_autosave`) y restauración automática.
  - Validación cliente (nombre obligatorio, reglas para precio), envío POST a `/api/juegos`.
  - IDs clave: `#gameForm`, `#submitBtn`, `#alertSuccess`, `#alertError`, `#autosaveIndicator`.

- `details.html` - Página con detalle de un juego.
  - Carga por ID (`?id=...`), muestra `#gameCard` con título, género, precio y descripción.
  - Renderiza campos adicionales dinámicos en `#additionalDetails` (útil para imágenes y links).
  - Maneja estados de carga y error: `#loadingSpinner`, `#errorContainer`.

- `edit.html` - Página para editar un juego existente.
  - Carga datos por ID, prellena el formulario y permite guardado (PUT), reset y eliminación (DELETE).
  - Detecta cambios y previene navegación accidental (listener `beforeunload`).
  - IDs clave: `#gameForm`, `#unsavedBadge`, `#loadingState`, `#deleteModal`.

- `public/utils/api.js` - Helpers: `apiGet`, `apiPost`, `apiPut`, `apiDelete`.
  - Centraliza la construcción de fetch y el tratamiento de errores (lanza objetos uniformes).

- `public/edit.js` - Alternativa modular para la lógica de edición (existe también script inline en `edit.html`).
  - Usa `apiGet`, `apiPut`, `apiDelete` y organiza la lógica en funciones reutilizables.

## Flujo de la interacción con el servidor

- Endpoints esperados (prefijo `/api`):
  - GET `/api/juegos?page=&limit=` -> lista paginada (respuesta con { juegos, total, pagina_actual, total_paginas }).
  - POST `/api/juegos` -> crear juego.
  - GET `/api/juegos/:id` -> obtener detalle.
  - PUT `/api/juegos/:id` -> actualizar juego.
  - DELETE `/api/juegos/:id` -> eliminar juego (algunos endpoints esperan un body con `{ confirmacion: true }`).

## Qué puede modificarse y efectos esperados

- Cambiar `API_BASE_URL` o `API_URL` en los scripts:
  - Afecta todas las llamadas a la API; si tu backend usa un prefijo distinto, actualízalo aquí.

- Renombrar IDs en HTML (p.ej. `#gamesTableBody`, `#limitSelect`):
  - Es necesario actualizar las referencias en los scripts correspondientes; las funciones de render y listeners dependen de esos IDs.

- Modificar la estructura de la tabla (columnas):
  - Afecta `renderTable` en `index.html`; si cambias columnas hay que ajustar cómo se construyen las filas.

- Agregar/Eliminar campos en formularios (`create.html`, `edit.html`):
  - Actualizar `getFormPayload` (create) y `getFormData`/validación (edit) para incluir nuevos campos.
  - Si los campos cambian de name/ID, actualizar las referencias en JS.

- Cambiar estilos globales o variables CSS (en archivos HTML que definen <style>):
  - Afecta apariencia; el diseño fue escrito con CSS inline en cada HTML. Migrar a archivo CSS separado es posible sin cambiar la lógica JS.

## Archivos más importantes para la interacción con el usuario

1. `public/index.html` - Principal punto de contacto (listado, paginación, acciones de ver/editar/eliminar).
2. `public/create.html` - Entrada de datos (crear nuevo juego) con autosave.
3. `public/details.html` - Visualización detallada (campo de referencia para UX al ver un juego).
4. `public/edit.html` y `public/edit.js` - Edición y detección de cambios (prevención de pérdida de datos).
5. `public/utils/api.js` - Abstracción de llamadas a la API; cambiarlo afecta todo el frontend.

## Buenas prácticas y recomendaciones

- Separar CSS en archivos dedicados para mejorar mantenibilidad.
- Centralizar la URL base de la API en un único archivo de configuración en lugar de repetirla.
- Añadir manejo de errores más explícito en la UI para distintos códigos HTTP (401, 422, 500).
- Añadir tests E2E para flujos críticos (crear → listar → ver → editar → eliminar).

---

Si quieres, puedo:
- Generar un README más extenso dentro de `documentacion/` con diagramas (texto) del flujo de datos.
- Extraer estilos comunes a `public/styles.css` y actualizar los HTML para importarlo.
- Añadir comentarios faltantes o más detallados en archivos concretos que prefieras.
