/*
  public/edit.js

  Archivo: lógica de la página de edición (edit.html)

  Propósito y comportamiento general:
  - Carga los datos de un juego por ID (querystring ?id=...).
  - Rellena el formulario de edición, detecta cambios y permite guardar (PUT).
  - Gestiona la eliminación del registro (DELETE) mediante el helper apiDelete.

  Interacción con el DOM:
  - Busca elementos por ID que coinciden con los definidos en edit.html.
  - Escucha eventos: submit del formulario, click en botones (reset, delete), input/change para detectar cambios.

  Énfasis didáctico:
  - Mantener originalData para comparar y detectar "cambios no guardados".
  - Validación mínima del cliente (nombre obligatorio, precio >= 0 cuando exista).
  - Manejo de errores: muestra mensajes en UI y toasts.
*/

// Importar helpers reutilizables para llamadas a la API
import { apiGet, apiPut, apiDelete } from './utils/api.js';

// Cambiar la URL base de la API
const API_BASE_URL = '/api/juegos';

// ---------- Referencias DOM (coinciden con IDs definidos en edit.html) ----------
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const notFoundState = document.getElementById('notFoundState');
const editFormContainer = document.getElementById('editForm');
const gameForm = document.getElementById('gameForm');
const toast = document.getElementById('toast');
const unsavedBadge = document.getElementById('unsavedBadge');

// Campos del formulario
const inputNombre = document.getElementById('nombre');
const selectGenero = document.getElementById('genero');
const inputPrecio = document.getElementById('precio');
const textareaDescripcion = document.getElementById('descripcion');

// Botones
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const deleteBtn = document.getElementById('deleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Estado local
let gameId = null;
let originalData = null;
let hasUnsavedChanges = false;

// -------------------- Funciones de UI --------------------
/*
  showLoading()

  - Muestra un spinner o estado de carga mientras se está obteniendo información del servidor.
  - Es puramente una función de UI: no hace llamadas a la API.
  - Si quisieras cambiar el spinner por otra animación, editá el HTML/CSS relacionado.
*/
function showLoading() {
  loadingState.style.display = 'block';
  errorState.style.display = 'none';
  notFoundState.style.display = 'none';
  editFormContainer.style.display = 'none';
}
/*
  showError(message)

  - Muestra la sección de error y coloca el mensaje proporcionado.
  - Se usa cuando la petición al backend falla o los datos no pueden cargarse.
*/
function showError(message) {
  loadingState.style.display = 'none';
  errorState.style.display = 'block';
  notFoundState.style.display = 'none';
  editFormContainer.style.display = 'none';
  document.getElementById('errorMessage').textContent = message;
}
function showNotFound() {
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  notFoundState.style.display = 'block';
  editFormContainer.style.display = 'none';
}
/*
  showForm()

  - Muestra el formulario para editar una vez que los datos fueron cargados correctamente.
  - Si añadís nuevos inputs en el HTML, asegurate de que fillForm() los rellena.
*/
function showForm() {
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  notFoundState.style.display = 'none';
  editFormContainer.style.display = 'block';
}
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast visible' + (type === 'error' ? ' error' : '');
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// -------------------- Utilidades --------------------
function getIdFromUrl() {
  // Obtenemos el id de la query string (?id=123)
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function fillForm(data) {
  // Rellenamos los campos con los valores que devuelve el backend
  inputNombre.value = data.nombre || '';
  selectGenero.value = data.genero || '';
  inputPrecio.value = (data.precio !== undefined && data.precio !== null) ? data.precio : '';
  textareaDescripcion.value = data.descripcion || '';
}

function getFormData() {
  // Construimos el objeto que enviaremos al backend
  const payload = {
    nombre: inputNombre.value.trim(),
    genero: selectGenero.value || undefined,
    descripcion: textareaDescripcion.value.trim() || undefined
  };
  const precioVal = inputPrecio.value;
  if (precioVal !== '' && precioVal !== null) {
    payload.precio = parseFloat(precioVal);
  }
  return payload;
}

function markUnsaved(flag) {
  hasUnsavedChanges = flag;
  if (hasUnsavedChanges) unsavedBadge.classList.add('visible');
  else unsavedBadge.classList.remove('visible');
}

// Detectar cambios para aviso de "salir sin guardar"
function setupChangeDetection() {
  const inputs = gameForm.querySelectorAll('input, select, textarea');
  inputs.forEach(el => {
    el.addEventListener('input', () => {
      // Comparamos con originalData para saber si hay cambios
      const current = getFormData();
      const changed = Object.keys(current).some(k => {
        const cur = current[k] === '' ? null : current[k];
        const orig = (originalData && originalData[k] !== undefined) ? originalData[k] : null;
        // uso != para comparar null/undefined igual
        return cur != orig;
      });
      markUnsaved(changed);
    });
  });

  // Advertir al usuario si intenta cerrar pestaña con cambios sin guardar
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
}

// -------------------- Carga inicial --------------------
async function init() {
  // 1) Obtener id desde URL
  gameId = getIdFromUrl();

  if (!gameId) {
    // Si no hay id, mostramos mensaje claro y enlace a index.html
    showError('Juego no especificado. <a href="index.html">Volver al listado</a>');
    return;
  }

  // 2) Mostrar spinner mientras cargamos datos
  showLoading();

  try {
    // 3) Llamada GET al backend usando apiGet (devuelve objeto con posible shape { juego: {...} } )
    const res = await apiGet(`/juegos/${gameId}`);

    // El controlador puede devolver { mensaje, juego } o directamente el juego
    const data = res.juego || res.juego || res || {};
    // A veces res may include fields directly; si res.juego no existe asumimos res
    const juego = res.juego ? res.juego : (res.nombre ? res : (res.juego ?? res));

    // Si no hay datos, tratamos como no encontrado
    if (!juego || Object.keys(juego).length === 0) {
      showNotFound();
      return;
    }

    // Guardar original para detección de cambios y rellenar formulario
    originalData = { ...juego };
    fillForm(juego);

    // Mostrar formulario y activar detección de cambios
    showForm();
    setupChangeDetection();

  } catch (err) {
    // Manejo de errores: si es 404 mostramos "no encontrado", si no mostramos error genérico
    if (err && err.status === 404) {
      showNotFound();
    } else {
      const message = err && err.message ? err.message : 'Error al obtener datos del servidor';
      showError(message);
    }
  }
}

// -------------------- Envío del formulario (PUT) --------------------
gameForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Previene comportamiento por defecto

  // Validaciones cliente: nombre obligatorio y precio >= 0 si existe
  const nombre = inputNombre.value.trim();
  if (!nombre) {
    showToast('El nombre es obligatorio', 'error');
    inputNombre.focus();
    return;
  }
  const precioRaw = inputPrecio.value;
  if (precioRaw !== '') {
    const num = parseFloat(precioRaw);
    if (isNaN(num) || num < 0) {
      showToast('El precio debe ser un número positivo', 'error');
      inputPrecio.focus();
      return;
    }
  }

  // Construir objeto con datos a enviar
  const payload = getFormData();

  // Desactivar botón y mostrar estado
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Guardando...';

  try {
    // Enviar PUT usando helper reutilizable (apiPut añade /api base internamente)
    const result = await apiPut(`/juegos/${gameId}`, payload);

    // Éxito: mostrar mensaje y redirigir a details.html
    showToast('✅ Juego actualizado exitosamente');
    markUnsaved(false);

    // Redirigir a detalles
    setTimeout(() => {
        window.location.href = `details.html?id=${gameId}`;
    }, 1000);

  } catch (err) {
    // Mostrar errores devueltos por servidor sin borrar el formulario
    if (err && err.data && err.data.mensaje) {
      showToast(err.data.mensaje, 'error');
    } else if (err && err.message) {
      showToast(err.message, 'error');
    } else {
      showToast('Error al actualizar el juego', 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// -------------------- Botón restablecer --------------------
resetBtn.addEventListener('click', () => {
  if (hasUnsavedChanges) {
    if (!confirm('Descartar cambios y restaurar valores originales?')) return;
  }
  fillForm(originalData || {});
  markUnsaved(false);
});

// -------------------- Eliminar (opcional, usa apiDelete) --------------------
// El HTML ya incluía modal / botones; aquí solo conectamos la acción de eliminación simple.
deleteBtn.addEventListener('click', () => {
  // Abrir modal simple (el HTML tiene #deleteModal, #cancelDeleteBtn, #confirmDeleteBtn)
  const modal = document.getElementById('deleteModal');
  modal.classList.add('visible');
});

cancelDeleteBtn.addEventListener('click', () => {
  document.getElementById('deleteModal').classList.remove('visible');
});

confirmDeleteBtn.addEventListener('click', async () => {
  try {
    // Llamada DELETE (backend espera confirmación en algunos endpoints; aquí se envía sin body)
    await apiDelete(`/juegos/${gameId}`);
    showToast('Juego eliminado', 'success');
    // Redirigir a la lista
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch (err) {
    const msg = err && err.data && err.data.mensaje ? err.data.mensaje : (err.message || 'Error al eliminar');
    showToast(msg, 'error');
  } finally {
    document.getElementById('deleteModal').classList.remove('visible');
  }
});

// -------------------- Iniciar --------------------
init();

/*
Cómo probar manualmente:
1. Levanta el servidor: node servidor.js (o npm run dev).
2. Abre en el navegador: http://localhost:3000/edit.html?id=1 (reemplaza 1 por un id existente).
   - Verás "Cargando..." mientras se obtienen los datos.
   - Si el id no existe verás "Juego no encontrado".
3. Edita campos y presiona "Guardar cambios".
   - Se valida el nombre (obligatorio) y precio (>=0).
   - En caso de éxito verás un toast y serás redirigido a details.html?id={id}.
4. Si el id no existe recibirás mensaje de error del servidor.
5. Si editas campos y tratas de cerrar la pestaña aparecerá una advertencia de "cambios sin guardar".
   - Para desactivar la advertencia, eliminar el listener 'beforeunload' en setupChangeDetection.
*/
