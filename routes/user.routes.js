const express = require('express');
const router = express.Router();
const User = require('../src/models/user.model');
const { auth, authorize } = require('../src/middleware/auth.middleware');

// Obtener todos los usuarios (solo SuperUser)
router.get('/', auth, authorize('SuperUser'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error getting users' });
    }
});

// Obtener un usuario específico (solo SuperUser)
router.get('/:id', auth, authorize('SuperUser'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user' });
    }
});

// Actualizar usuario (solo SuperUser)
router.put('/:id', auth, authorize('SuperUser'), async (req, res) => {
    try {
        const { username, email, role } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Eliminar usuario (solo SuperUser)
router.delete('/:id', auth, authorize('SuperUser'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router; 