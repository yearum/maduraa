import { env } from '../config/env.js';

const errorHandler = (error, _req, res, _next) => {
  console.error('❌ Unhandled Error:', error.stack || error.message);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Terjadi kesalahan pada server';

  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(env.nodeEnv === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;
