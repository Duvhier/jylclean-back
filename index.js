// index.js - Punto de entrada para Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ========================================
// CONFIGURACIÓN CORS
// ========================================
const allowedOrigins = [
  'https://jylcleanco-front.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir temporalmente para debug
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// CONEXIÓN A MONGODB
// ========================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB ya conectado');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    throw error;
  }
};

// En index.js, después de conectar DB en cada ruta:
app.use('/products', async (req, res, next) => {
    await connectDB();
    console.log('📥 Products route hit:', req.method, req.url);
    next();
  }, require('./routes/product.routes'));
  
  app.use('/cart', async (req, res, next) => {
    await connectDB();
    console.log('📥 Cart route hit:', req.method, req.url);
    next();
  }, require('./routes/cart.routes'));
  
  // En product.routes.js, agrega logs:
  router.get('/', async (req, res) => {
      try {
          console.log('🛍️ Fetching all products');
          const products = await Product.find();
          console.log(`✅ Found ${products.length} products`);
          res.json(products);
      } catch (error) {
          console.error('❌ Error getting products:', error);
          res.status(500).json({ message: 'Error getting products' });
      }
  });

// ========================================
// RUTAS
// ========================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'J&L Clean Co. API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      products: '/products',
      auth: '/auth',
      cart: '/cart'
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'OK',
      message: 'Servidor funcionando',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
      mongodb: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host || 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Cargar rutas de la API
app.use('/products', async (req, res, next) => {
  await connectDB();
  next();
}, require('./routes/product.routes'));

app.use('/auth', async (req, res, next) => {
  await connectDB();
  next();
}, require('./routes/auth.routes'));

app.use('/cart', async (req, res, next) => {
  await connectDB();
  next();
}, require('./routes/cart.routes'));

app.use('/sales', async (req, res, next) => {
  await connectDB();
  next();
}, require('./routes/sale.routes'));

app.use('/users', async (req, res, next) => {
  await connectDB();
  next();
}, require('./routes/user.routes'));

// ========================================
// MANEJO DE ERRORES
// ========================================

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Export para Vercel
module.exports = app;