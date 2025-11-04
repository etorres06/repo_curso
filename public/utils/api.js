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
