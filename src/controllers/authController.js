// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar configuración de Nodemailer
transporter.verify((error) => {
  if (error) {
    console.error('Error al configurar Nodemailer:', error);
  } else {
    console.log('Servidor listo para enviar correos');
  }
});

// Registrar un nuevo usuario con token de verificación
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira en 24 horas

    await pool.query(
      'INSERT INTO users (name, email, password, is_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, false, verificationToken, expirationDate]
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    console.log(`Token de verificación generado: ${verificationToken}`);
    console.log(`Enlace de verificación: ${verificationLink}`);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verifica tu correo electrónico',
      html: `<p>Haz clic en el siguiente enlace para verificar tu correo:</p>
             <a href="${verificationLink}">Verificar Email</a>`,
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor verifica tu correo.' });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ message: 'Error al registrar el usuario', error: err.message });
  }
};

// Verificar correo electrónico
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: 'Token requerido' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token no válido o expirado' });
    }

    const user = rows[0];
    if (new Date(user.verification_token_expires) < Date.now()) {
      return res.status(400).json({ message: 'El token ha expirado. Solicita uno nuevo.' });
    }

    await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?', [user.id]);
    res.status(200).json({ message: 'Correo verificado exitosamente' });
  } catch (err) {
    console.error('Error al verificar correo:', err);
    res.status(500).json({ message: 'Error al verificar el correo.', error: err.message });
  }
};

// Inicio de sesión
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor complete todos los datos' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const user = rows[0];
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Por favor verifica tu correo antes de iniciar sesión.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
  }
};

// Obtener información del usuario logueado
export const getMe = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado. Es posible que la cuenta haya sido eliminada.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
