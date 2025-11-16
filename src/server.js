const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Configuración mejorada de CORS
const corsOptions = {
  origin: [
    'https://jylcleanco-front.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
  });
}

// ... el resto de tu código (conexión a MongoDB, rutas, etc.)

// Ruta de salud mejorada
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a J&L Clean Co. API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: corsOptions.origin,
      status: 'Configurado correctamente'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 Servidor J&L Clean Co. API iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: https://jylclean-back.vercel.app/api/health`);
  console.log('✅ CORS configurado para:', corsOptions.origin);
  console.log('──────────────────────────────────────────');
});