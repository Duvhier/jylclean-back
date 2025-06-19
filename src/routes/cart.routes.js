const express = require('express');
const router = express.Router();
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { auth } = require('../middleware/auth.middleware');

// Obtener carrito del usuario
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('products.product');
        
        if (!cart) {
            cart = new Cart({ user: req.user._id, products: [] });
            await cart.save();
        }
        
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error getting cart' });
    }
});

// Agregar producto al carrito
router.post('/add', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Validar producto
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            cart = new Cart({ user: req.user._id, products: [] });
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = cart.products.find(
            p => p.product.toString() === productId
        );

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        
        cart = await cart.populate('products.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// Actualizar cantidad de producto en el carrito
router.put('/update/:productId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const product = cart.products.find(
            p => p.product.toString() === req.params.productId
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not in cart' });
        }

        // Validar stock
        const productDoc = await Product.findById(req.params.productId);
        if (productDoc.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        product.quantity = quantity;
        cart.updatedAt = Date.now();
        await cart.save();
        
        const updatedCart = await cart.populate('products.product');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// Eliminar producto del carrito
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = cart.products.filter(
            p => p.product.toString() !== req.params.productId
        );

        cart.updatedAt = Date.now();
        await cart.save();
        
        const updatedCart = await cart.populate('products.product');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error removing from cart' });
    }
});

// Vaciar carrito
router.delete('/clear', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = [];
        cart.updatedAt = Date.now();
        await cart.save();
        
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

module.exports = router; 