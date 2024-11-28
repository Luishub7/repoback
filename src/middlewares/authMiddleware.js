// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        // Obtén el token del encabezado Authorization
        const authHeader = req.header('Authorization');
        const token = authHeader?.split(' ')[1];

        // Si no se proporciona un token, deniega el acceso
        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado: token no proporcionado' });
        }

        // Verifica y decodifica el token
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Adjunta los datos del usuario decodificados a la solicitud
        req.user = verified;

        // Continúa al siguiente middleware o controlador
        next();
    } catch (err) {
        console.error('Error en verifyToken:', err);
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};
