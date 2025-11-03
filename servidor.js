const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { ProbarConexion}   = require('./config/BaseDatos');
const { ObetenerTodosLosJuegos } = require('./controladores/juegos.controlador');

const app = express();
const PORT =process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Juegos funcionando correctamente' });
}); 

app.get('/api/juegos', ObetenerTodosLosJuegos);

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