// index.js - Versión simple para debug
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: '*', // Permitir todos temporalmente
  credentials: false
}));

app.use(express.json());

// ========================================
// RUTAS DE DEBUG
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: 'J&L Clean Co. API',
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Ruta de debug para ver qué archivos existen
app.get('/debug', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Buscar en src/ o en raíz
    const routesPath = fs.existsSync(path.join(__dirname, 'src', 'routes')) 
      ? path.join(__dirname, 'src', 'routes')
      : path.join(__dirname, 'routes');
    
    const modelsPath = fs.existsSync(path.join(__dirname, 'src', 'models'))
      ? path.join(__dirname, 'src', 'models')
      : path.join(__dirname, 'models');
    
    const middlewarePath = fs.existsSync(path.join(__dirname, 'src', 'middleware'))
      ? path.join(__dirname, 'src', 'middleware')
      : path.join(__dirname, 'middleware');
    
    const routesExist = fs.existsSync(routesPath);
    const modelsExist = fs.existsSync(modelsPath);
    const middlewareExist = fs.existsSync(middlewarePath);
    
    const routeFiles = routesExist ? fs.readdirSync(routesPath) : [];
    const modelFiles = modelsExist ? fs.readdirSync(modelsPath) : [];
    const middlewareFiles = middlewareExist ? fs.readdirSync(middlewarePath) : [];
    
    res.json({
      message: 'Debug Info',
      directories: {
        routes: {
          exists: routesExist,
          path: routesPath,
          files: routeFiles
        },
        models: {
          exists: modelsExist,
          path: modelsPath,
          files: modelFiles
        },
        middleware: {
          exists: middlewareExist,
          path: middlewarePath,
          files: middlewareFiles
        }
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_MONGODB_URI: !!process.env.MONGODB_URI,
        HAS_JWT_SECRET: !!process.env.JWT_SECRET
      },
      __dirname: __dirname,
      cwd: process.cwd()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// ========================================
// CARGAR RUTAS (con protección)
// ========================================

const fs = require('fs');
const path = require('path');

// Buscar en src/routes si existe, sino en routes
const routesPath = fs.existsSync(path.join(__dirname, 'src', 'routes')) 
  ? path.join(__dirname, 'src', 'routes')
  : path.join(__dirname, 'routes');

if (fs.existsSync(routesPath)) {
  console.log('✅ Routes directory found at:', routesPath);
  
  // Determinar el prefijo correcto
  const routePrefix = routesPath.includes('src') ? './src/routes/' : './routes/';
  
  // Intentar cargar cada ruta individualmente
  const routeFiles = [
    { path: `${routePrefix}product.routes`, mount: '/products' },
    { path: `${routePrefix}auth.routes`, mount: '/auth' },
    { path: `${routePrefix}cart.routes`, mount: '/cart' },
    { path: `${routePrefix}sale.routes`, mount: '/sales' },
    { path: `${routePrefix}user.routes`, mount: '/users' }
  ];
  
  routeFiles.forEach(({ path: routePath, mount }) => {
    try {
      const route = require(routePath);
      app.use(mount, route);
      console.log(`✅ Loaded route: ${mount}`);
    } catch (error) {
      console.error(`❌ Failed to load ${mount}:`, error.message);
    }
  });
} else {
  console.error('❌ Routes directory not found at:', routesPath);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: ['/', '/health', '/debug']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno',
    message: error.message
  });
});

module.exports = app;