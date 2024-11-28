// src/config/db.js
import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Espera conexiones en lugar de lanzar errores si el límite se alcanza
  connectionLimit: 5, // Límite máximo de conexiones simultáneas
  queueLimit: 0, // Sin límite en la cola de espera de conexiones
});

export default pool;
