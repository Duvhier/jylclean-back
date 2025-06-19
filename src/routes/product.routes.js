const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { auth, authorize } = require('../middleware/auth.middleware');

// Obtener todos los productos (público)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error getting products' });
    }
});

// Obtener un producto específico (público)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error getting product' });
    }
});

// Crear producto (solo SuperUser y Admin)
router.post('/', auth, authorize('SuperUser', 'Admin'), async (req, res) => {
    try {
        const { name, description, price, stock, image, category } = req.body;
        const product = new Product({
            name,
            description,
            price,
            stock,
            image,
            category
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product' });
    }
});

// Actualizar producto (solo SuperUser y Admin)
router.put('/:id', auth, authorize('SuperUser', 'Admin'), async (req, res) => {
    try {
        const { name, description, price, stock, image, category } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = price;
        if (stock) product.stock = stock;
        if (image) product.image = image;
        if (category) product.category = category;
        product.updatedAt = Date.now();

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Eliminar producto (solo SuperUser y Admin)
router.delete('/:id', auth, authorize('SuperUser', 'Admin'), async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

module.exports = router; 