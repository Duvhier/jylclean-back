const express = require('express');
const router = express.Router();
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const { auth, authorize } = require('../middleware/auth.middleware');

// Obtener todas las ventas (solo SuperUser y Admin)
router.get('/', auth, authorize('SuperUser', 'Admin'), async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('user', 'username email')
            .populate('products.product');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error getting sales' });
    }
});

// Obtener ventas de un usuario específico
router.get('/my-sales', auth, async (req, res) => {
    try {
        const sales = await Sale.find({ user: req.user._id })
            .populate('products.product');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error getting sales' });
    }
});

// Obtener una venta específica
router.get('/:id', auth, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('user', 'username email')
            .populate('products.product');
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Verificar si el usuario tiene permiso para ver esta venta
        if (req.user.role !== 'SuperUser' && req.user.role !== 'Admin' && 
            sale.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error getting sale' });
    }
});

// Crear una nueva venta
router.post('/', auth, async (req, res) => {
    try {
        const { products } = req.body;
        
        // Validar y calcular el total
        let total = 0;
        const saleProducts = [];

        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }

            // Actualizar stock
            product.stock -= item.quantity;
            await product.save();

            saleProducts.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price
            });

            total += product.price * item.quantity;
        }

        const sale = new Sale({
            user: req.user._id,
            products: saleProducts,
            total
        });

        await sale.save();
        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error creating sale' });
    }
});

// Actualizar estado de venta (solo SuperUser y Admin)
router.put('/:id/status', auth, authorize('SuperUser', 'Admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const sale = await Sale.findById(req.params.id);
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        sale.status = status;
        await sale.save();
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error updating sale status' });
    }
});

module.exports = router; 