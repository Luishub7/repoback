// src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import toolRoutes from './routes/toolRoutes.js';

const app = express();

// Configuración básica de seguridad sin dependencias externas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configuración de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Dominio del frontend en producción
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Middleware para analizar JSON
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);

// Punto de salud
app.get('/', (req, res) => {
  res.send('Backend activo y funcionando en producción!');
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en producción en el puerto ${PORT}`));
