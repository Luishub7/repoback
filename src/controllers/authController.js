// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Registro de usuario con verificación de correo
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, false] // Usuario no verificado inicialmente
    );

    // Generar un token de verificación
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Simulación de envío de correo (reemplaza con lógica de envío real)
    console.log(`Verifica tu email usando el siguiente enlace: ${process.env.FRONTEND_URL}/verify-email/${token}`);

    res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor verifica tu correo.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

// Inicio de sesión con verificación de estado
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const user = rows[0];

    // Verificar si el usuario está verificado
    if (!user.is_verified) {
      return res.status(400).json({ message: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// Obtener información del usuario actual
export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Verificación de email
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [decoded.email]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await pool.query('UPDATE users SET is_verified = ? WHERE email = ?', [true, decoded.email]);
    res.status(200).json({ message: 'Email verificado exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Token inválido o expirado' });
  }
};
