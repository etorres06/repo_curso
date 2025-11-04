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

// Configurar carpeta de archivos estáticos (servirá public/*)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API con prefijo /api
app.get('/api/juegos', ObetenerTodosLosJuegos);
app.get('/api/juegos/:id', ObetenerTodosLosJuegosPorId);
app.post('/api/juegos', crearJuego);
app.put('/api/juegos/:id', actualizarJuego);
app.delete('/api/juegos/:id', eliminarJuego);

// Manejar todas las demás rutas - MODIFICADO
app.use((req, res) => {
    // Si es una ruta API que no existe, devolver 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ mensaje: 'Endpoint no encontrado' });
    }
    // Si no, servir index.html para rutas del frontend
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