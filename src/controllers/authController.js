// src/controllers/authController.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';




// Registrar un nuevo usuario
export const registerUser = async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña antes de guardarla
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar el usuario', error: err.message });
  }
};


// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Controlador de inicio de sesión
export const login = async (req, res) => {
    const { email, password } = req.body;

    // Verificar si el usuario ya está logueado
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

        // Verificar si el correo está confirmado
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

// Controlador de registro con verificación de correo
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Por favor complete todos los datos' });
    }

    try {
        const [rows] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'El correo ya esta registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO users (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, verificationToken]
        );

        // Enviar correo de verificación
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email',
            html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente por favor verifique su correo electrónico' });
    } catch (err) {
        res.status(500).json({ message: 'Error de servidor', error: err.message });
    }
};

// Controlador para verificar el correo electrónico
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Token no valido o expirado' });
        }

        const user = rows[0];
        await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?', [user.id]);
        res.json({ message: 'Correo verificado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error de servidor', error: err.message });
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
