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

// Registrar un nuevo usuario
/* export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validación de datos
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
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar el usuario', error: err.message });
  }
}; */

// Controlador de inicio de sesión
export const login = async (req, res) => {
  const { email, password } = req.body;

  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(200).json({ message: 'Sesión iniciada' });
    } catch (err) {
      // Si el token es inválido, continúa con el flujo normal
    }
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor complete todos los Datos' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Correo o password incorrectos' });
    }

    const user = rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Por favor verifique su correo electrónico antes de iniciar sesión.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o password incorrectos' });
    }

    const newToken = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (err) {
    res.status(500).json({ message: 'Error de servidor', error: err.message });
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
      const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (user.length === 0) {
          return res.status(404).json({ message: 'El correo no está registrado' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const nowUTC = new Date(); // Hora actual en UTC
      const expiresUTC = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // UTC + 15 minutos

      // Convertir la fecha a un formato compatible con MySQL (YYYY-MM-DD HH:MM:SS)
      const expiresMySQLFormat = new Date(expiresUTC)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ');

      await pool.query(
          'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
          [token, expiresMySQLFormat, email]
      );

      console.log('Token generado:', token, 'Expira en (MySQL Format):', expiresMySQLFormat);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Restablecer contraseña',
          html: `<p>Haga clic en el siguiente enlace para restablecer su contraseña:</p>
                 <a href="${resetLink}">${resetLink}</a>`,
      });

      res.json({ message: 'Se envió un enlace de recuperación a su correo' });
  } catch (error) {
      res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};


// Restablecer contraseña
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const [user] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires >= NOW()',
      [token.trim()]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user[0].id]
    );

    res.json({ message: 'Contraseña restablecida exitosamente', redirectTo: '/login' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Controlador de registro con verificación de correo
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validación de datos
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
    const nowUTC = new Date();
    const expiresUTC = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    const expiresMySQLFormat = expiresUTC.toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'INSERT INTO users (name, email, password, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, verificationToken, expiresMySQLFormat]
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email. This link will expire in 24 hours.</p>`,
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor verifique su correo electrónico.' });
  } catch (err) {
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
};

// Controlador para verificar el correo electrónico
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token no válido o expirado' });
    }

    const user = rows[0];
    await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?', [user.id]);

    res.json({ message: 'Correo verificado exitosamente', redirectTo: '/login' });
  } catch (err) {
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
};

// Devuelve los datos del usuario logueado
export const getMe = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
