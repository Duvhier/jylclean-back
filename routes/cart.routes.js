// src/routes/cart.routes.js - ARCHIVO CORREGIDO
const express = require('express');
const router = express.Router();
const Cart = require('../src/models/cart.model');
const Product = require('../src/models/product.model');
const { auth } = require('../src/middleware/auth.middleware');

// Obtener carrito del usuario
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('products.product');
        
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
        const { productId, quantity = 1 } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            cart = new Cart({ 
                user: req.user._id, 
                products: [{ product: productId, quantity }] 
            });
        } else {
            const existingProduct = cart.products.find(
                p => p.product.toString() === productId
            );
            
            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                cart.products.push({ product: productId, quantity });
            }
        }
        
        await cart.save();
        await cart.populate('products.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// Actualizar cantidad en carrito
router.put('/update/:productId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        const productItem = cart.products.find(
            p => p.product.toString() === req.params.productId
        );
        
        if (!productItem) {
            return res.status(404).json({ message: 'Product not in cart' });
        }
        
        const product = await Product.findById(req.params.productId);
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }
        
        productItem.quantity = quantity;
        await cart.save();
        await cart.populate('products.product');
        res.json(cart);
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
        
        await cart.save();
        await cart.populate('products.product');
        res.json(cart);
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
        await cart.save();
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

module.exports = router;