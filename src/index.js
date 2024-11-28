// src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import toolRoutes from './routes/toolRoutes.js';
import pool from './config/db.js';

const app = express(); // Inicializa la aplicación

// Prueba de conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.status(200).json({ message: 'Connection successful!', result: rows[0].result });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Configuración de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Middleware para analizar JSON
app.use(express.json());

// Rutas de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);

// Punto de salud
app.get('/', (req, res) => {
  res.send('Backend activo y funcionando en producción!');
});

// Manejo global de errores
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en producción en el puerto ${PORT}`));
