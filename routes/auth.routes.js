const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../src/models/user.model');
const { auth } = require('../src/middleware/auth.middleware');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validación de contraseña fuerte
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password)) {
            return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' });
        }
        
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Obtener usuario actual
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user' });
    }
});

// Recuperar contraseña - solicitar token
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'No existe un usuario con ese correo.' });
        }
        // Generar token y expiración (1 hora)
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        // Configurar transporte de correo (ajustar con tus credenciales reales)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            to: user.email,
            subject: 'Recuperación de contraseña',
            text: `Recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta. Haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso:

${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}

Si no solicitaste esto, ignora este correo.`
        };
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Correo de recuperación enviado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error enviando correo de recuperación.' });
    }
});

// Restablecer contraseña
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password)) {
            return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' });
        }
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Contraseña restablecida correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error restableciendo la contraseña.' });
    }
});

module.exports = router; 