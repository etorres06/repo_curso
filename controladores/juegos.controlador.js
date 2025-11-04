const {pool} = require('../config/BaseDatos');

const ObetenerTodosLosJuegos =  async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const consulta = 'SELECT * FROM juegos ORDER BY id ASC LIMIT $1 OFFSET $2';
        const conteoConsulta = 'SELECT COUNT(*) FROM juegos';
        
        const [resultado, conteo] = await Promise.all([
            pool.query(consulta, [limit, offset]),
            pool.query(conteoConsulta)
        ]);

        res.json({
            juegos: resultado.rows,
            total: parseInt(conteo.rows[0].count),
            pagina_actual: parseInt(page),
            total_paginas: Math.ceil(parseInt(conteo.rows[0].count) / limit)
        });
    } catch (error) {
        console.error('Error al obtener los juegos:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al obtener los juegos', error: error.message });
    } 
};

const ObetenerTodosLosJuegosPorId =  async (req, res) => {

    try {
        const {id} = req.params;
        const consulta = 'SELECT * FROM juegos WHERE id = $1';
        const resultado = await pool.query(consulta, [id]);

        if (resultado.rows.length === 0) {
            return  res.status(404).json({ mensaje: 'Juego no encontrado' });
        }

        res.json({
            mensaje: 'Juego encontrado', juego:
            resultado.rows[0]});


    } catch (error) {console.error('Error al obtener los juegos por ID:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al obtener los juegos por ID', error: error.message });

    }


};

const crearJuego = async (req, res) => {
    try {
        const { nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador = "Sin especificar", descripcion } = req.body;
        
        // Validaciones
        if (!nombre?.trim()) return res.status(400).json({ mensaje: 'El nombre es requerido' });
        if (!genero?.trim()) return res.status(400).json({ mensaje: 'El género es requerido' });
        if (!plataforma?.trim()) return res.status(400).json({ mensaje: 'La plataforma es requerida' });
        if (!precio || precio <= 0) return res.status(400).json({ mensaje: 'El precio debe ser mayor a 0' });
        if (!descripcion?.trim()) return res.status(400).json({ mensaje: 'La descripción es requerida' });

        // No validamos fecha_lanzamiento ya que siempre vendrá del frontend

        const consulta = `
            INSERT INTO juegos (nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const valores = [
            nombre.trim(),
            genero.trim(),
            plataforma.trim(),
            parseFloat(precio),
            fecha_lanzamiento, // Ya viene en formato YYYY-MM-DD
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
                mensaje: 'Se requiere confirmación para eliminar el juego',
                instrucciones: 'Envíe { "confirmacion": true } en el body para confirmar'
            });
        }

        // Verificar si el juego existe antes de eliminarlo
        const juegoExistente = await pool.query('SELECT nombre FROM juegos WHERE id = $1', [id]);
        if (juegoExistente.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Juego no encontrado' });
        }

        const consulta = 'DELETE FROM juegos WHERE id = $1 RETURNING *';
        const resultado = await pool.query(consulta, [id]);

        res.json({
            mensaje: 'Juego eliminado exitosamente',
            juego: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar el juego:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al eliminar el juego', error: error.message });
    }
};
module.exports = {
    ObetenerTodosLosJuegos,
    ObetenerTodosLosJuegosPorId,
    crearJuego,
    actualizarJuego,
    eliminarJuego
};