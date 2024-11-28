import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso denegado token no proporcionado' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Adjunta los datos del usuario al request
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};
