// src/middlewares/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      message: err.message || 'Error de servidor',
    });
  };
  
  export default errorHandler