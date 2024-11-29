// src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import toolRoutes from './routes/toolRoutes.js';
import pool from './config/db.js';

const app = express();
console.log('Entorno actual:', process.env.NODE_ENV);
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.status(200).json({ message: 'Connection successful!', result: rows[0].result });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);

app.get('/', (req, res) => {
  res.send('Backend activo y funcionando en producción!');
});
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
});
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en producción en el puerto ${PORT}`));
