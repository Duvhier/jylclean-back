const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Reemplaza tu configuración actual de CORS con esta:

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS mejorado para producción
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://jylcleanco-front.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos en producción temporalmente
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Manejar preflight requests
app.options('*', cors());

// Validar que existan las variables de entorno requeridas
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno requeridas:', missingEnvVars.join(', '));
  console.log('💡 Asegúrate de tener un archivo .env con las siguientes variables:');
  console.log('   - MONGODB_URI');
  process.exit(1);
}

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

// Opciones mejoradas para la conexión de MongoDB
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout después de 5 segundos
  socketTimeoutMS: 45000, // Cierra sockets después de 45 segundos de inactividad
};

mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  
  // Obtener información de la conexión (sin mostrar credenciales)
  const connection = mongoose.connection;
  const dbName = connection.db.databaseName;
  const host = connection.host;
  console.log(`📊 Base de datos: ${dbName}`);
  console.log(`🌐 Host: ${host}`);
})
.catch(err => {
  console.error('❌ Error conectando a MongoDB Atlas:', err.message);
  
  // Dar información útil sin exponer detalles sensibles
  if (err.name === 'MongoNetworkError') {
    console.log('💡 Verifica tu conexión a internet y la URI de MongoDB');
  } else if (err.name === 'MongoServerSelectionError') {
    console.log('💡 Verifica que la URI de MongoDB sea correcta y el cluster esté activo');
  } else if (err.message.includes('authentication failed')) {
    console.log('💡 Error de autenticación. Verifica usuario y contraseña en MONGODB_URI');
  }
  
  process.exit(1);
});

// Manejar eventos de conexión de MongoDB
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Desconectado de MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión MongoDB:', err.message);
});

// Manejar cierre graceful de la aplicación
process.on('SIGINT', async () => {
  console.log('🛑 Recibido SIGINT. Cerrando conexión a MongoDB...');
  await mongoose.connection.close();
  console.log('✅ Conexión a MongoDB cerrada');
  process.exit(0);
});

// Middleware de logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/sales', require('./routes/sale.routes'));
app.use('/api/cart', require('./routes/cart.routes'));

// Ruta de salud para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a J&L Clean Co. API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health para verificar estado del servidor'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('🔥 Error no manejado:', error);
  
  // No exponer detalles del error en producción
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
  
  res.status(500).json({
    error: error.message,
    stack: error.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 Servidor J&L Clean Co. API iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log('──────────────────────────────────────────');
});