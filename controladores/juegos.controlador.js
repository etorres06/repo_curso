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
    // Lógica para crear un nuevo juego
    try {
        const { nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion } = req.body;
        if (!nombre || !genero || !plataforma || !precio || !fecha_lanzamiento || !desarrollador || !descripcion) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios para crear el juego' });
        }

        const consulta = `
            INSERT INTO juegos (nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const valores = [nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion];

          const resultado = await pool.query(consulta, valores);
        res.status(201).json({ mensaje: 'Juego creado exitosamente', juego: resultado.rows[0] 
    });
}
    catch (error) {
        console.error('Error al crear un nuevo juego:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al crear un nuevo juego', error: error.message });
    }
};

const actualizarJuego = async (req, res) => {
    // Lógica para actualizar un juego existente
    try { 
        const { id } = req.params;
        const { nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion } = req.body;

        const consulta = `
            UPDATE juegos
            SET nombre = $1, genero = $2, plataforma = $3, precio = $4, fecha_lanzamiento = $5, desarrollador = $6, descripcion = $7
            WHERE id = $8 RETURNING *`;
        const valores = [nombre, genero, plataforma, precio, fecha_lanzamiento, desarrollador, descripcion, id];

        const resultado = await pool.query(consulta, valores);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Juego no encontrado para actualizar' });
        }

        res.status(200).json({ mensaje: 'Juego actualizado exitosamente', juego: resultado.rows[0]
        });
    }
    catch (error) {
        console.error('Error al actualizar el juego:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al actualizar el juego', error: error.message });
    }
};

const eliminarJuego = async (req, res) => {
    // Lógica para eliminar un juego existente
    try {
        const { id } = req.params;

        const consulta = 'DELETE FROM juegos WHERE id = $1 RETURNING *';
        const resultado = await pool.query(consulta, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Juego no encontrado para eliminar' });
        }

        res.status(200).json({ mensaje: 'Juego eliminado exitosamente', juego: resultado.rows[0]
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