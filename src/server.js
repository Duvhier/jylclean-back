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

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (Postman, curl, apps móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origen bloqueado por CORS:', origin);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: false, // Cambiado a false para simplificar
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ========================================
// MIDDLEWARE BÁSICO
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validar variables de entorno
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno:', missingEnvVars.join(', '));
  process.exit(1);
}

// ========================================
// CONEXIÓN A MONGODB
// ========================================
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  console.log(`📊 Base de datos: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  process.exit(1);
});

// Eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Desconectado de MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de MongoDB:', err.message);
});

// ========================================
// MIDDLEWARE DE LOGGING
// ========================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ========================================
// RUTAS
// ========================================
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/products', require('./routes/product.routes'));
app.use('/sales', require('./routes/sale.routes'));
app.use('/cart', require('./routes/cart.routes'));

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'J&L Clean Co. API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      products: '/products',
      cart: '/cart',
      sales: '/sales'
    }
  });
});

// ========================================
// MANEJO DE ERRORES
// ========================================
// Rutas no encontradas
app.use('*', (req, res) => {
  console.warn('⚠️ Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Errores globales
app.use((error, req, res, next) => {
  console.error('🔥 Error no manejado:', error.message);
  
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Origen no permitido por CORS'
    });
  }
  
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : error.message;
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// ========================================
// INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('   J&L Clean Co. API - SERVIDOR INICIADO');
  console.log('========================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log('✅ CORS habilitado para:');
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log('========================================\n');
});

// Cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ Conexión cerrada');
  process.exit(0);
});