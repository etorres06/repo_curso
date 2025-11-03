const {pool} = require('../config/BaseDatos');

const ObetenerTodosLosJuegos =  async (req, res) => {
    try {
        const consulta = 'SELECT * FROM juegos ORDER BY id ASC';
        const resultado = await pool.query(consulta);
        res.json(resultado.rows);
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


    } catch (error) {console.error('Error al obtener los juegos por ID:', error.stack || error);
        res.status(500).json({ mensaje: 'Error al obtener los juegos por ID', error: error.message });

    }


};

module.exports = {
    ObetenerTodosLosJuegos
};