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
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Permitir múltiples orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    credentials: true, // Permite cookies si son necesarias
  })
);

// Middleware para analizar JSON
app.use(express.json());

// Rutas de autenticación y herramientas
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/tools', toolRoutes); // Rutas de herramientas

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));
