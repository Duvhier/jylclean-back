const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://duviertavera01:3SK6o5HM3g46zXSQ@cluster0.0bbblsp.mongodb.net/jylclean';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/sales', require('./routes/sale.routes'));
app.use('/api/cart', require('./routes/cart.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});