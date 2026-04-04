require('dotenv').config();

const env = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '0.0.0.0',
  frontendCors: process.env.FRONTEND_CORS || 'http://localhost:5173',
};

module.exports = env;
