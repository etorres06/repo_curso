/*
    public/utils/api.js

    Helpers para llamadas HTTP desde el frontend.

    Qué hace:
    - Provee funciones reutilizables: apiGet, apiPost, apiPut, apiDelete.
    - Normaliza la URL usando la constante API_BASE_URL.
    - Devuelve la respuesta JSON en caso de éxito.
    - Lanza un objeto estructurado { status, data, message } cuando la respuesta
        no es OK para que la UI pueda manejar errores de forma consistente.

    Cómo usar:
    - import { apiGet, apiPost, apiPut, apiDelete } from './utils/api.js'
    - Pasar endpoints relativos como '/juegos' o '/juegos/1'

    Nota: estas utilidades no manejan autenticación ni refresco de tokens.
*/

const API_BASE_URL = '/api';

export async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            data: responseData,
            message: responseData.mensaje || 'Error en la solicitud'
        };
    }

    return responseData;
}

/*
  Nota para juniors sobre estas funciones:
  - Cada helper envuelve una llamada fetch y convierte la respuesta a JSON.
  - Si la respuesta HTTP no es 2xx, lanzamos (throw) un objeto con { status, data, message }.
  - En la capa de UI (por ejemplo en create.html o edit.js) podéis usar try/catch para mostrar
    mensajes adecuados al usuario dependiendo de err.status o err.data.
*/

export async function apiGet(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const data = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            data,
            message: data.mensaje || 'Error en la solicitud'
        };
    }

    return data;
}

// Nueva función: PUT reutilizable
export async function apiPut(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            data: responseData,
            message: responseData.mensaje || 'Error en la solicitud PUT'
        };
    }

    return responseData;
}

// Opcional: DELETE reutilizable
export async function apiDelete(endpoint, data = undefined) {
    const opts = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (data !== undefined) opts.body = JSON.stringify(data);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, opts);
    const responseData = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            data: responseData,
            message: responseData.mensaje || 'Error en la solicitud DELETE'
        };
    }

    return responseData;
}
