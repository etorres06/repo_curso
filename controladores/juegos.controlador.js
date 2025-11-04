const {pool} = require('../config/BaseDatos');

const ObetenerTodosLosJuegos = async (req, res) => {
    try {
        // Asegurar que page y limit sean números válidos
        let { page = '1', limit = '10' } = req.query;
        
        // Convertir a números y validar
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        
        // Asegurar valores positivos
        page = Math.max(1, page);
        limit = Math.max(1, Math.min(50, limit));
        
        // Obtener conteo total
        const conteoConsulta = 'SELECT COUNT(*) FROM juegos';
        const conteo = await pool.query(conteoConsulta);
        const total = parseInt(conteo.rows[0].count);
        
        // Calcular offset
        const offset = (page - 1) * limit;

        // Consulta principal
        const consulta = 'SELECT * FROM juegos ORDER BY id ASC LIMIT $1 OFFSET $2';
        const resultado = await pool.query(consulta, [limit, offset]);

        // Calcular total de páginas
        const totalPages = Math.ceil(total / limit);
        
        // Asegurar que la página actual no exceda el total
        const currentPage = Math.min(page, Math.max(1, totalPages));

        res.json({
            juegos: resultado.rows,
            total: total,
            pagina_actual: currentPage,
            total_paginas: totalPages
        });
    } catch (error) {
        console.error('Error al obtener los juegos:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener los juegos',
            error: error.message 
        });
    } 
};

const ObetenerTodosLosJuegosPorId =  async (req, res) => {
    try {
        // Aceptar id tanto desde params como desde query para mayor compatibilidad con distintos frontends
        const rawId = req.params.id ?? req.query.id;
        if (!rawId) {
            return res.status(400).json({ mensaje: 'Se requiere un ID de juego' });
        }

        // Intentar parsear a entero si es posible
        const id = Number(rawId);
        if (Number.isNaN(id)) {
            // Si no es numérico, usar rawId tal cual (por si la BD usa otro tipo de identificador)
            // pero aquí asumimos que la mayoría usa integer; si falla, devolvemos 400
            return res.status(400).json({ mensaje: 'ID inválido' });
        }

        const consulta = 'SELECT * FROM juegos WHERE id = $1';
        const resultado = await pool.query(consulta, [id]);

        if (resultado.rows.length === 0) {
            // Mensaje claro para el frontend
            return res.status(404).json({
                mensaje: 'Juego no encontrado',
                detalle: 'El juego con el ID especificado no existe o fue eliminado.'
            });
        }

        // Mantener estructura previa (mensaje + juego) para no romper clientes existentes
        res.json({ mensaje: 'Juego encontrado', juego: resultado.rows[0] });

    } catch (error) {
        console.error('Error al obtener los juegos por ID:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al obtener el juego por ID', error: error.message });
    }
};

const crearJuego = async (req, res) => {
    try {
        // Aceptar fecha tanto en fecha_lanzamiento como fechaLanzamiento por compatibilidad
        const {
            nombre,
            genero,
            plataforma,
            precio,
            fecha_lanzamiento,
            fechaLanzamiento,
            desarrollador = "Sin especificar",
            descripcion
        } = req.body;

        // Normalizar nombre de campo de fecha
        const fecha = fecha_lanzamiento ?? fechaLanzamiento;

        // Validaciones (mantener reglas del controlador original)
        if (!nombre?.trim()) return res.status(400).json({ mensaje: 'El nombre es requerido' });
        if (!genero?.trim()) return res.status(400).json({ mensaje: 'El género es requerido' });
        if (!plataforma?.trim()) return res.status(400).json({ mensaje: 'La plataforma es requerida' });
        if (precio === undefined || precio === null || Number.isNaN(Number(precio)) || Number(precio) <= 0) return res.status(400).json({ mensaje: 'El precio debe ser mayor a 0' });
        if (!fecha) return res.status(400).json({ mensaje: 'La fecha de lanzamiento es requerida' });
        if (!desarrollador?.trim()) return res.status(400).json({ mensaje: 'El desarrollador es requerido' });
        if (!descripcion?.trim()) return res.status(400).json({ mensaje: 'La descripción es requerida' });

        const consulta = `
            INSERT INTO juegos (nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const valores = [
            nombre.trim(),
            genero.trim(),
            plataforma.trim(),
            parseFloat(precio),
            // Enviar fecha tal cual (se espera YYYY-MM-DD); la BD/driver convertirá a date si corresponde
            fecha,
            desarrollador.trim(),
            descripcion.trim()
        ];

        const resultado = await pool.query(consulta, valores);
        res.status(201).json({
            mensaje: 'Juego creado exitosamente',
            juego: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear un nuevo juego:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al crear un nuevo juego', error: error.message });
    }
};

const actualizarJuego = async (req, res) => {
    try {
        const { id } = req.params;
        const actualizaciones = req.body;

        // Verificar si el juego existe
        const juegoExistente = await pool.query('SELECT * FROM juegos WHERE id = $1', [id]);
        if (juegoExistente.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Juego no encontrado' });
        }

        // Construir query dinámicamente
        const campos = Object.keys(actualizaciones);
        const valores = Object.values(actualizaciones);
        
        if (campos.length === 0) {
            return res.status(400).json({ mensaje: 'No hay campos para actualizar' });
        }

        const setCampos = campos.map((campo, index) => `${campo} = $${index + 1}`).join(', ');
        const consulta = `UPDATE juegos SET ${setCampos} WHERE id = $${campos.length + 1} RETURNING *`;
        
        const resultado = await pool.query(consulta, [...valores, id]);
        
        res.json({
            mensaje: 'Juego actualizado exitosamente',
            juego: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar el juego:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al actualizar el juego', error: error.message });
    }
};

const eliminarJuego = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmacion } = req.body;

        if (!confirmacion) {
            return res.status(400).json({ 
                mensaje: 'Se requiere confirmación para eliminar el juego'
            });
        }

        // Verificar si el juego existe antes de eliminarlo
        const juegoExistente = await pool.query('SELECT nombre FROM juegos WHERE id = $1', [id]);
        if (juegoExistente.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Juego no encontrado' });
        }

        // Eliminar el juego
        await pool.query('DELETE FROM juegos WHERE id = $1', [id]);

        // Devolver respuesta exitosa
        res.json({
            mensaje: 'Juego eliminado exitosamente',
            eliminado: true,
            id: id
        });

    } catch (error) {
        console.error('Error al eliminar el juego:', error);
        res.status(500).json({ 
            mensaje: 'Error al eliminar el juego',
            error: error.message 
        });
    }
};

module.exports = {
    ObetenerTodosLosJuegos,
    ObetenerTodosLosJuegosPorId,
    crearJuego,
    actualizarJuego,
    eliminarJuego
};