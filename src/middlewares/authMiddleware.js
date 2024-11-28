// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado: token no proporcionado' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    next();
  } catch (err) {
    console.error('Error en verifyToken:', err);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
