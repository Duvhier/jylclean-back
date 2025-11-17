const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ========================================
// CONFIGURACIÓN CORS SIMPLIFICADA
// ========================================
const allowedOrigins = [
  'https://jylcleanco-front.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS debe ir ANTES que cualquier otra cosa
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (Postman, Vercel serverless)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origen bloqueado por CORS:', origin);
      callback(null, true); // Temporalmente permitir todos para debug
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ========================================
// MIDDLEWARE BÁSICO
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// CONEXIÓN A MONGODB
// ========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida');
  process.exit(1);
}

// Conectar solo si no está conectado (importante para serverless)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
  });
}

// ========================================
// MIDDLEWARE DE LOGGING
// ========================================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ========================================
// RUTAS
// ========================================

// Ruta de salud - DEBE IR PRIMERO
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'J&L Clean Co. API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/auth',
      products: '/products',
      cart: '/cart',
      sales: '/sales'
    }
  });
});

// En tu index.js - CORREGIR LAS RUTAS
try {
  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/users', require('./routes/user.routes'));
  app.use('/api/products', require('./routes/product.routes'));
  app.use('/api/sales', require('./routes/sale.routes'));
  app.use('/api/cart', require('./routes/cart.routes')); // ¡NUEVO ARCHIVO CORREGIDO!
  console.log('✅ Rutas cargadas correctamente con prefijo /api');
} catch (error) {
  console.error('❌ Error cargando rutas:', error.message);
}
// ========================================
// MANEJO DE ERRORES
// ========================================

// Rutas no encontradas
app.use('*', (req, res) => {
  console.warn('⚠️ Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/health', '/products', '/auth', '/cart', '/sales']
  });
});

// Errores globales
app.use((error, req, res, next) => {
  console.error('🔥 Error:', error.message);
  
  res.status(error.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message
  });
});

// ========================================
// INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 5000;

// Solo iniciar servidor si no está en Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}/health`);
  });
}

// Export para Vercel serverless
module.exports = app;