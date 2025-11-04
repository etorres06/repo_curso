const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { ProbarConexion } = require('./config/BaseDatos');
const { ObetenerTodosLosJuegos, ObetenerTodosLosJuegosPorId, crearJuego, actualizarJuego, eliminarJuego } = require('./controladores/juegos.controlador');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API (las mantenemos con el prefijo /api)
app.get('/api/juegos', ObetenerTodosLosJuegos);
app.get('/api/juegos/:id', ObetenerTodosLosJuegosPorId);
app.post('/api/juegos', crearJuego);
app.put('/api/juegos/:id', actualizarJuego);
app.delete('/api/juegos/:id', eliminarJuego);

// Ruta para servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const iniciarServidor = async () => {
    try {
        await ProbarConexion();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
} );
    }
     catch (error){
            console.error('Error de conexión a la base de datos:', error);
        }

};
iniciarServidor();