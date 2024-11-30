// src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import toolRoutes from './routes/toolRoutes.js';

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: ['https://repofront.vercel.app'], // Cambia por la URL correcta del frontend desplegado en Vercel.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Middleware para analizar JSON
app.use(express.json());

// Añadir una ruta para la raíz `/`
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente');
});

// Rutas de autenticación y herramientas
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/tools', toolRoutes); // Rutas de herramientas

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));
